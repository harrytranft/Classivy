# ADR 0001 - Mô hình dữ liệu Phase 3: lớp, học sinh, sổ điểm

- **Trạng thái:** Đã chấp nhận (Harry duyệt 2026-10-27: đồng ý mọi đề xuất, riêng Q3 chọn **xoá hẳn**)
- **Ngày:** 2026-10-27
- **Phạm vi:** PLAN task 3.1; là nền cho task 3.2-3.6 và Phase 4-6

## 1. Bối cảnh (nói dễ hiểu)

Hiện mỗi giáo viên có **một ô dữ liệu khổng lồ** trên Supabase (`user_settings.students`): toàn bộ học sinh, điểm, Pokémon, lịch sử... nằm chung một cục JSON. Mỗi lần có thay đổi, app gửi lại **cả cục** (sau 1,5 giây).

Cách này chạy được khi chỉ giáo viên dùng, nhưng chặn các Phase sau:

| Phase sau cần | Vì sao cục JSON không làm được |
|---|---|
| 4: giáo viên tạo/khoá tài khoản học sinh | Không có "dòng học sinh" để gắn tài khoản đăng nhập và trạng thái khoá |
| 5: học sinh xem hồ sơ của mình | Không thể cho học sinh đọc *một phần* cục JSON; cho đọc là lộ cả lớp |
| 6: kết bạn, tặng điểm | Cần sổ cái bất biến, giao dịch atomic giữa hai học sinh |

Ngoài ra: lịch sử điểm chỉ giữ 50 dòng gần nhất mỗi học sinh (dòng cũ mất hẳn), và hai máy cùng mở có thể ghi đè nhau cả cục.

Ràng buộc: giữ nguyên luật game (không đổi điểm, HP, Pokémon, Boss); gói miễn phí Supabase (500 MB DB, không polling dày); không dùng `service_role` ở client; mọi bảng bật RLS.

## 2. Quyết định đề xuất (tóm tắt)

**Mô hình lai:** những thứ cần phân quyền và đối chiếu thành **bảng thật**; phần trạng thái game phức tạp (Pokémon, trứng, tiến trình, Cá Ngựa) giữ **dạng JSON trong từng dòng học sinh**.

```
auth.users ──1:1── profiles (thêm role: teacher | student)
     │
     └── user_settings (cài đặt giáo viên: kỹ năng, âm thanh, Vòng quay, ô Cá Ngựa)
     │
     └── classes ──1:n── students ──1:n── point_ledger (sổ điểm, chỉ thêm, không sửa/xoá)
           │                 │
           boss_state (JSON)  game_state (JSON: Pokémon, trứng, huy hiệu, Cá Ngựa...)
```

## 3. Các bảng

### 3.1 `classes` (mới)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `teacher_id` | uuid → auth.users | chủ lớp |
| `name` | text | duy nhất theo giáo viên (`unique(teacher_id, name)`) - khớp với `className` hiện tại |
| `boss_state` | jsonb | chuyển từ `user_settings.boss_states_by_class[name]` |
| `created_at`, `updated_at`, `archived_at` | timestamptz | `archived_at` để ẩn lớp cũ thay vì xoá |

Hiện app không có "lớp" riêng, lớp suy ra từ `student.className`. Bảng này là chỗ treo cài đặt theo lớp ở Phase 6 (bật/tắt tính năng xã hội).

### 3.2 `students` (mới)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid PK | id trong DB |
| `client_id` | text | id học sinh hiện tại trong app (vd `1729...0.123`); `unique(teacher_id, client_id)`. Giữ để Boss, hàng đợi, lịch sử vẫn trỏ đúng |
| `teacher_id` | uuid | trùng lặp có chủ đích để RLS nhanh, không cần join |
| `class_id` | uuid → classes | một học sinh thuộc một lớp (như hiện nay) |
| `name`, `gender` | text | `gender` ∈ ('Nam','Nữ') |
| `points` | integer | Hào Quang hiện tại (giá trị giáo viên/game đặt, như hiện nay) |
| `avatar` | text null | ảnh base64 hiện tại; giới hạn ~200 KB/ảnh; Phase 5 chuyển sang Storage |
| `game_state` | jsonb | mọi trường còn lại của `Student` (pet, pets, egg, eggInventory, pokemonProgress, trainerProgress, earnedBadges, expedition, eggFragments, weeklyChest, adventureJournal, supportPetInstanceId, ludo*, attendanceStatus, isAbsent) |
| `auth_user_id` | uuid null unique | **để trống ở Phase 3**; Phase 4 gắn tài khoản đăng nhập |
| `status` | text | 'active' \| 'locked'; Phase 4 dùng |
| `created_at`, `updated_at` | timestamptz | |

### 3.3 `point_ledger` (mới) - sổ điểm

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | bigint identity PK | |
| `teacher_id`, `student_id` | uuid | khoá ngoại ghép `(student_id, teacher_id)`: dòng sổ luôn cùng giáo viên với học sinh |
| `amount` | integer | + hoặc - |
| `reason` | text | như `HistoryItem.reason` |
| `client_event_id` | text | = `HistoryItem.id`; `unique(student_id, client_event_id)` để gửi lại không bị trùng |
| `source` | text | 'app' (giáo viên/game), 'migration' (dòng chuyển từ dữ liệu cũ), 'opening_balance'; Phase 6 thêm 'gift' |
| `occurred_at` | timestamptz | = `HistoryItem.timestamp` |
| `created_at`, `created_by` | | `created_by default auth.uid()` |

- RLS chỉ cho **SELECT và INSERT**; không có policy UPDATE/DELETE, thêm trigger chặn sửa/xoá → sổ bất biến. Ngoại lệ duy nhất: xoá học sinh (Q3) hoặc xoá tài khoản giáo viên thì sổ của em đó bị xoá theo (khoá ngoại `on delete cascade`).
- App vẫn hiển thị 50 dòng gần nhất, nhưng DB giữ **toàn bộ** (không còn mất lịch sử). Ước tính: 100 học sinh × 20 dòng/tuần × 52 tuần ≈ 100.000 dòng/năm ≈ 15-20 MB, trong hạn 500 MB.
- Lúc chuyển dữ liệu, thêm một dòng `opening_balance` = `points - tổng(50 dòng lịch sử)` để tổng sổ = điểm hiện tại, đối chiếu được. Dòng này không hiện trong lịch sử trên app (view bỏ qua), nên lịch sử hiển thị giữ y như cũ.
- **Phase 3 không đổi cách tính điểm:** `students.points` vẫn là con số game đặt ra; sổ là nhật ký. Tặng điểm giữa học sinh (Phase 6) dùng ví riêng (D2) qua hàm DB atomic, không đụng `points`.

### 3.4 Bảng có sẵn

- `profiles`: thêm cột `role` ('teacher' mặc định, 'student' cho Phase 4); đổi mặc định "Học sĩ triều đình" → "Trainer" (gộp `docs/phase-3-pending-sql.md` mục 2).
- `user_settings`: thêm `data_model_version` (1 = dữ liệu cũ, 2 = bảng mới; app chỉ đặt 2 sau khi chuyển và đối chiếu khớp). Giữ cài đặt giáo viên (skills, pet_skills, âm thanh, custom_ludo_tiles, lucky_wheel_rewards, boss_encounter_frequency). Xoá `ranks_male`, `ranks_female` (D7). Cột `students` và `boss_states_by_class` **giữ nguyên, ngừng ghi**, làm bản lưu để hoàn tác; xoá ở Phase 7 khi Harry xác nhận.

## 4. Phân quyền (RLS)

Hàm trợ giúp `security definer`, `stable`: `is_class_teacher(class_id)`.

| Bảng | Giáo viên (Phase 3) | Học sinh (Phase 5, chưa bật) |
|---|---|---|
| `classes` | đọc/ghi lớp có `teacher_id = auth.uid()` | đọc tên lớp của mình |
| `students` | đọc/ghi học sinh có `teacher_id = auth.uid()`; chỉ được gắn vào lớp của chính mình | đọc dòng có `auth_user_id = auth.uid()` |
| `point_ledger` | đọc + thêm cho học sinh của mình; không sửa/xoá | đọc dòng của mình |

Cột `auth_user_id`, `status` sẽ khoá không cho client ghi ở Phase 4 (chỉ Edge Function), nên Phase 3 cũng không cho client đặt `auth_user_id`.

**Kiểm thử RLS:** chạy migration trên PostgreSQL 16 cục bộ với schema `auth` giả (hàm `auth.uid()` đọc từ biến phiên), rồi thử: giáo viên A không đọc/ghi được lớp, học sinh, sổ điểm của giáo viên B; không sửa/xoá được dòng sổ điểm; không gán học sinh vào lớp người khác. Lưu thành script lặp lại được trong `supabase/tests/`.

## 5. Cách app ghi dữ liệu (task 3.4)

Giữ nguyên cách app làm việc trong bộ nhớ (`Student[]`), **chỉ thay phần đồng bộ** trong `src/app/providers/gameData/`:

1. **Tải:** đọc `classes`, `students`, 50 dòng sổ gần nhất mỗi học sinh (view `student_recent_history`) → dựng lại `Student[]` y như hiện nay.
2. **Lưu:** sau 1,5 giây, so với lần lưu trước, chỉ gửi **phần thay đổi**: lớp mới, học sinh đổi, học sinh bị xoá, dòng lịch sử mới. Gửi qua **một hàm DB** `save_teacher_changes(...)` (`security invoker`, nên RLS vẫn áp dụng) để cả gói ghi trong một transaction: hoặc ghi hết, hoặc không ghi gì.
3. Logic chuyển đổi `Student` ↔ dòng bảng và tính "phần thay đổi" là hàm thuần trong `src/domain/` có unit test.

Lợi ích: ít dữ liệu gửi đi hơn nhiều (đổi điểm 1 học sinh = gửi 1 dòng thay vì cả lớp), hai máy sửa hai học sinh khác nhau không còn ghi đè nhau.

## 6. Chuyển dữ liệu cũ (task 3.3)

Đề xuất chuyển **ngay trong app, do giáo viên bấm**, không dùng script với khoá `service_role`:

1. Đăng nhập xong, nếu `user_settings.students` có dữ liệu mà bảng `students` chưa có học sinh nào → hiện hộp thoại "Nâng cấp dữ liệu".
2. **Chạy thử (dry-run):** hiển thị sẽ tạo bao nhiêu lớp, học sinh, dòng lịch sử, tổng điểm; chưa ghi gì.
3. Giáo viên bấm "Nâng cấp" → tải file sao lưu JSON về máy trước (dùng chức năng xuất sẵn có) → ghi bằng một hàm DB trong một transaction.
4. **Đối chiếu:** đọc lại từ bảng, so số lớp, số học sinh, tổng điểm, tổng sổ điểm với bản cũ; lệch thì báo và không chuyển app sang dữ liệu mới.
5. Cột cũ giữ nguyên → hoàn tác được bằng cách tắt cờ và dùng lại cột cũ.

Ưu điểm: không cần khoá bí mật, RLS áp dụng cả lúc chuyển, logic chuyển đổi test được bằng vitest, mỗi giáo viên tự chuyển khi sẵn sàng.

## 7. Câu hỏi cần Harry chốt

| # | Câu hỏi | Đề xuất mặc định |
|---|---|---|
| Q1 | Mô hình lai (bảng cho lớp/học sinh/sổ điểm, JSON cho dữ liệu game) hay tách hết Pokémon, trứng... thành bảng? | **Lai.** Tách hết tốn gấp nhiều lần công, rủi ro đổi hành vi game, chưa Phase nào cần |
| Q2 | Một học sinh chỉ thuộc một lớp? | **Có**, như hiện nay. Nếu cần học nhiều lớp thì thêm bảng thành viên sau |
| Q3 | Xoá học sinh là xoá mềm (ẩn, giữ sổ điểm) hay xoá hẳn? | Đề xuất xoá mềm; **Harry chọn xoá hẳn** (học sinh và sổ điểm của em đó bị xoá) |
| Q4 | Sổ điểm giữ toàn bộ lịch sử (không giới hạn 50 dòng)? | **Có** (~15-20 MB/năm) |
| Q5 | Ảnh đại diện base64 tạm để trong DB (giới hạn kích thước) hay chuyển Supabase Storage ngay? | **Tạm để DB**, giới hạn ~200 KB; chuyển Storage ở Phase 5 |
| Q6 | Chuyển dữ liệu trong app do giáo viên bấm (mục 6) hay script chạy bằng khoá quản trị? | **Trong app** |
| Q7 | Có dự án Supabase dev riêng (hoặc branch) để chạy thử trước production không? | Tạo **một dự án Supabase miễn phí thứ hai** làm dev (gói Free cho 2 dự án) |

## 8. Phương án đã cân nhắc

- **Giữ cục JSON, thêm bảng phụ cho tài khoản:** ít việc nhất nhưng Phase 5 không thể cho học sinh đọc riêng dữ liệu của mình → loại.
- **Chuẩn hoá toàn bộ (pets, eggs, badges... thành bảng):** sạch nhất về lý thuyết, nhưng phải viết lại hầu hết logic game trong `src/domain/` → vi phạm "giữ nguyên hành vi", tốn nhiều Phase → để sau nếu thật cần.
- **Mỗi thao tác gọi một API riêng (không diff):** phải sửa ~10 nơi đang đổi điểm trong `features/*` → rủi ro cao; cách diff ở mục 5 đạt cùng kết quả mà không đụng logic game.

## 9. Hệ quả

- Tốt: mở đường cho Phase 4-6; lịch sử điểm không còn mất; đồng bộ nhẹ hơn; ghi atomic.
- Phải chấp nhận: `points` chưa phải "tổng sổ" bắt buộc (vì game đặt điểm trực tiếp); dữ liệu game vẫn là JSON nên học sinh (Phase 5) đọc được toàn bộ `game_state` của chính mình - chấp nhận được vì đều là dữ liệu của em đó.
- Rủi ro: sai sót khi chuyển dữ liệu → giảm bằng dry-run, sao lưu JSON, đối chiếu, giữ cột cũ.

## 10. Đã triển khai (2026-10-27, nhánh `claude/phase3-data-model`)

| Phần | File |
|---|---|
| Migration (chạy lại được, có file hoàn tác) | `supabase/migrations/20261027120000_phase3_data_model.sql`, `supabase/rollback/20261027120000_phase3_data_model_down.sql` |
| Test RLS trên PostgreSQL cục bộ (60 kiểm tra) | `supabase/tests/`, `scripts/test-db.sh` (`npm run test:db`) |
| Chuyển đổi Student <-> dòng bảng, tính phần thay đổi | `src/domain/cloudModel.ts` (+ test) |
| Chạy thử, chuyển, đối chiếu dữ liệu cũ | `src/domain/legacyImport.ts` (+ test), `src/features/dataUpgrade/DataUpgradeModal.tsx` |
| Đọc/ghi Supabase, chọn đường cũ/mới | `src/lib/supabaseData.ts`, `src/app/providers/gameData/cloudStore.ts` |

Thay đổi so với bản đề xuất: bỏ cột `class_id` khỏi `point_ledger` (học sinh có thể đổi lớp, không cần); bỏ `deleted_at` (Q3); khoá ngoại ghép `(class_id, teacher_id)` và `(student_id, teacher_id)` để DB tự chặn gắn dữ liệu sang giáo viên khác, không chỉ dựa vào RLS; profile mới nhận `role = 'student'` chỉ khi `app_metadata.role = 'student'` (chỉ khoá quản trị đặt được, dùng ở Phase 4).

App tương thích cả trước và sau khi chạy migration: chưa chạy => dùng cách lưu cũ y như trước; đã chạy => mời giáo viên nâng cấp; giáo viên mới dùng bảng mới ngay.
