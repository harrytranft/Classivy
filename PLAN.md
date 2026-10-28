# PLAN.md - Classivy (cải tổ toàn bộ)

> Thay thế hoàn toàn PLAN.md cũ của Imperial School 3.0 (bản cũ lưu ở `docs/archive/imperial-school-3.0-plan.md` và trong lịch sử git).
> Cập nhật file này sau mỗi Phase. Quy trình báo cáo ở cuối file.

**Cập nhật lần cuối:** 2026-10-28 | **Phase hiện tại:** Phase 10 (10A giao diện + 10B Shop học sinh xong trên nhánh, chưa commit; migration `20261102100000_phase10_student_shop.sql` CHƯA chạy trên Supabase thật, chờ Harry duyệt)

## Mục tiêu

1. Đổi thương hiệu Imperial School thành **Classivy** (logo, màu, tên, ngôn ngữ).
2. Tách `App.tsx` (~7.900 dòng) thành nhiều file, màn hình, tính năng.
3. Giáo viên tạo, quản lý, sửa, xoá, khoá tài khoản học sinh.
4. Học sinh đăng nhập xem tài khoản của mình.
5. Học sinh kết bạn trong lớp, tương tác (tặng quà, tặng điểm).

## Quyết định đã chốt

| # | Quyết định | Ngày |
|---|---|---|
| D1 | Học sinh đăng nhập bằng tên đăng nhập + mật khẩu do giáo viên cấp (email ảo nội bộ, tạo qua Edge Function) | 2026-10-26 |
| D2 | Tặng điểm dùng ví "điểm tặng" riêng, hạn mức theo tuần, không trừ điểm xếp hạng của người tặng | 2026-10-26 |
| D3 | Tách App.tsx trước, làm dữ liệu/tài khoản sau | 2026-10-26 |
| D4 | Bỏ chủ đề cung đình, giữ Pokémon/Boss theo nhận diện Classivy | 2026-10-26 |
| D6 | North Star thiết kế "Lá non trong tấm khiên"; thư mục `.claude/` được commit | 2026-10-26 |
| D7 | Bỏ hẳn hệ cấp bậc cung đình (Imperial School) và hộp "Thánh chỉ"/Gemini. Bảng Ban thưởng/Phạt hiển thị Trainer Level thay cho cấp bậc. Làm ở đầu Phase 2 | 2026-10-27 |
| D8 | Mỗi lớp một trang `/class/<lớp>`; `/class` là trang chọn lớp; Cá Ngựa, Vòng quay, Tặng Pokémon là trang con của lớp; Vòng quay tick chọn học sinh trên trang; Random giữ dạng hộp thoại | 2026-10-27 |
| D9 | Thuật ngữ: giữ "Hào Quang" (điểm); "Học sĩ" đổi thành "Trainer" | 2026-10-27 |
| D10 | Bỏ hẳn trang Plaza và phần thời tiết (Weather Plaza trong Cài đặt). Thanh điều hướng màu xanh như nền logo, bo hai góc phải; nút Tặng quà màu trắng; dock phóng to kiểu macOS | 2026-10-27 |
| D11 | Màn đăng nhập chỉ còn email + mật khẩu cho tài khoản đã có; bỏ nút "Tạo tài khoản" và "Đăng nhập Google" trên giao diện (code nền giữ lại cho Phase 4). Harry xác nhận 2026-10-27 | 2026-10-27 |
| D12 | Phase 3 theo ADR 0001: mô hình lai (bảng `classes`, `students`, `point_ledger`; dữ liệu game JSON trong `students.game_state`), một học sinh một lớp, **xoá học sinh là xoá hẳn** (kể cả sổ điểm), sổ điểm giữ toàn bộ lịch sử, ảnh đại diện tạm lưu DB (nén <= ~200 KB), chuyển dữ liệu trong app do giáo viên bấm, có dự án Supabase dev riêng | 2026-10-27 |
| D13 | Không thêm vai trò phụ huynh. Đổi tên các hồ sơ giáo viên còn mang tên mặc định cũ "Học sĩ triều đình" thành "Trainer" | 2026-10-28 |
| D14 | Phase 4: tên đăng nhập học sinh = tên + số ngẫu nhiên (vd `minhanh472`), giáo viên sửa tay được; hệ thống đổi thành email ảo nội bộ | 2026-10-28 |
| D15 | Phase 4: mật khẩu ban đầu ngẫu nhiên (in trên thẻ), học sinh bắt buộc đổi ở lần đăng nhập đầu | 2026-10-28 |
| D16 | Phase 4: tách "Thu hồi tài khoản" (xoá đăng nhập, giữ học sinh + điểm) và "Xoá học sinh" (xoá hẳn như D12, kèm tài khoản); khoá/mở khoá là tạm thời; không có xoá mềm | 2026-10-28 |
| D17 | Phase 4: thêm bảng nhật ký thao tác của giáo viên (chỉ thêm, không ghi mật khẩu) | 2026-10-28 |
| D18 | Phase 5: học sinh đọc hồ sơ qua một hàm DB chọn lọc `get_my_student_profile()`, không mở quyền đọc bảng cho học sinh | 2026-10-28 |
| D19 | Phase 5: "hạng" trên hồ sơ học sinh = Trainer Level + danh hiệu + huy hiệu; không hiển thị vị trí trong lớp | 2026-10-28 |
| D20 | Phase 5: học sinh chỉ xem; mọi thay đổi vẫn do giáo viên (tương tác để Phase 6) | 2026-10-28 |
| D21 | Ảnh đại diện giữ trong DB (đã nén); dời chuyển sang Supabase Storage tới Phase 7 (sửa Q5 ADR 0001) | 2026-10-28 |
| D23 | Phase 6: điểm tặng cộng vào Hào Quang người nhận qua "hàng chờ" trong DB, app giáo viên tự gom (khi mở, khi quay lại tab, mỗi 3 phút) kèm dòng lịch sử; không ghi đè, không cộng trùng | 2026-10-28 |
| D24 | Phase 6: ví điểm tặng mặc định 5 điểm/tuần, tối đa 2 điểm/tuần cho cùng một bạn, 0-2 điểm/lần; giáo viên chỉnh theo lớp | 2026-10-28 |
| D25 | Phase 6: quà = sticker + lời nhắn định sẵn (không vật phẩm game, không chữ tự do) | 2026-10-28 |
| D26 | Phase 6: kết bạn bằng lời mời + chấp nhận; tính năng mặc định TẮT, giáo viên bật theo lớp; chỉ tặng cho bạn bè; tặng tự động, giáo viên xem nhật ký và thu hồi | 2026-10-28 |
| D27 | Ô đăng nhập nhận cả email (giáo viên) lẫn tên đăng nhập (học sinh), chỉnh D11; Supabase đã tắt đăng ký công khai, giáo viên mới do Harry tạo trong Authentication (Harry xác nhận) | 2026-10-28 |
| D28 | Phase 7: chốt "chỉ giáo viên" (`profiles.role = 'teacher'`) trong mọi policy dữ liệu giáo viên | 2026-10-28 |
| D29 | Phase 7: xoá dữ liệu cũ sau khi sao lưu (`user_settings.students`, `boss_states_by_class`, bảng `students_imperial_old`, `app_state`, `users`) | 2026-10-28 |
| D30 | Phase 7: ảnh đại diện giữ trong DB, ảnh mới nén về ~100 KB (thay D21 về Storage) | 2026-10-28 |
| D31 | Phase 7: hai máy cùng sửa một học sinh thì DB từ chối gói lỗi thời (số phiên bản), app không ghi đè, báo và tải lại | 2026-10-28 |
| D22 | Giao diện học sinh responsive cả điện thoại, máy tính bảng và desktop (điện thoại trước rồi mở rộng). Áp dụng cho mọi màn học sinh ở Phase 5 và các Phase sau; mỗi màn có smoke test ở 390 / 820 / 1440px | 2026-10-28 |
| D5 | Bạn bè chỉ trong cùng lớp; không chat tự do (chỉ lời nhắn/emoji định sẵn) | 2026-10-26 (đề xuất, mặc định) |
| D32 | Shop học sinh chỉ dùng ngoài giờ học; mỗi lần mua là một hàm DB kiểm tra số dư và ghi sổ điểm; app giáo viên tự gom (như D23) và dùng số phiên bản (D31) để không ghi đè. Có nút bật/tắt Shop theo lớp, mặc định TẮT | 2026-10-28 |
| D33 | Học sinh được mua trứng, nở trứng, mua skill, đổi Pokémon đồng hành và support; đổi Pokémon không giới hạn; bấm skill để đọc công dụng | 2026-10-28 |
| D34 | Nút Hồi sinh hiện trên thẻ học sinh khi điểm <= -20: điểm về 20, mất toàn bộ Pokémon KÈM skills (skills gắn trên Pokémon; Harry chốt lại 2026-10-28), GIỮ trứng; có hộp xác nhận riêng; ghi sổ điểm | 2026-10-28 |
| D35 | Skill dùng ở tài khoản giáo viên, ngay sau Random hoặc khi cộng/trừ điểm (xem bảng dưới); giữ luật mỗi skill tối đa 2 lượt rồi mất; mọi lần dùng ghi lịch sử | 2026-10-28 |
| D36 | Skill nhóm C (Nhân Đôi, Lá Chắn, Miễn Tử) chỉ hỏi khi học sinh thực sự có skill phù hợp, còn lại im lặng | 2026-10-28 |
| D37 | Đồng Tâm Hiệp Lực: giáo viên bấm tay, không tự động, không cần dữ liệu "bạn cùng bàn" | 2026-10-28 |
| D38 | Phím tắt phím đơn: A điểm danh, H homework, W vòng quay, R random, T hẹn giờ, / tìm kiếm, ? xem danh sách; Cài đặt có bảng liệt kê và cho đổi phím | 2026-10-28 |
| D39 | Thứ tự giữ nguyên: Phase 8, 9, 10, 11 | 2026-10-28 |
| D40 | Đăng xuất không cần xác nhận | 2026-10-28 |
| D41 | Phase 12 (cổng học sinh v3): nav Hồ sơ / Pokémon / Bạn bè / Cửa hàng; lời mời kết bạn hiện ở Hồ sơ và Bạn bè (chấm đỏ trên nav) | 2026-10-28 |
| D42 | "Đổi Pokémon" = đổi đồng hành/hỗ trợ trong bộ sưu tập (chuyển từ Cửa hàng sang trang Pokémon); học sinh được tự Hợp nhất, dùng đúng luật hợp nhất của giáo viên, qua hàm DB mới (12C, cần migration + Harry duyệt) | 2026-10-28 |
| D43 | Cửa hàng: skill thành danh sách một cột, bấm thì chi tiết + nút Mua bung ngay bên dưới skill đó | 2026-10-28 |
| D44 | Bấm avatar học sinh mở modal có nút Đăng xuất và Huỷ (thay D40 cho cổng học sinh; giáo viên giữ nguyên) | 2026-10-28 |
| D45 | Hồ sơ Trainer của giáo viên làm theo cấu trúc học sinh: hai tab Hồ sơ / Pokémon, Hợp nhất nằm trong tab Pokémon, dùng chung component (12D) | 2026-10-28 |
| D46 | 12C: Hợp nhất của học sinh dùng cùng công tắc Cửa hàng của lớp (như Đổi Pokémon), miễn phí (không trừ điểm, không ghi sổ), không hợp nhất khi đang ấp trứng; luật đúng như app giáo viên. Mặc định của Claude, chờ Harry xác nhận | 2026-10-28 |
| D47 | 12C: loài của Pokémon mới chọn ngẫu nhiên ở phía server trong kho 1025 loài của Cửa hàng (`shop_egg_pool`, cả loài thường và đặc biệt như app giáo viên); tên "Hợp Thể <loài>" hiển thị từ cờ `isFusion` trong dữ liệu Pokémon, DB không lưu tên loài | 2026-10-28 |

## Tổng quan Phase

| Phase | Nội dung | Trạng thái | Chạm vào Supabase thật? |
|---|---|---|---|
| 0 | Nền móng: tài liệu, đổi tên, logo | Hoàn thành | Không |
| 1 | Tách App.tsx, thêm router, giữ nguyên hành vi | Hoàn thành (2026-10-27) | Không |
| 2 | Hệ thiết kế Classivy, reskin, thuật ngữ trung tính, đổi khoá localStorage | Hoàn thành (2026-10-27) | Không |
| 3 | Mô hình dữ liệu mới + RLS + chuyển dữ liệu cũ | Hoàn thành (2026-10-28) | **Có (migration)** |
| 4 | Giáo viên quản lý tài khoản học sinh | Hoàn thành (2026-10-28, PR #5) | **Có (migration + Edge Function)** |
| 5 | Cổng học sinh: đăng nhập, xem hồ sơ | Hoàn thành (2026-10-28, PR #6); bổ sung responsive desktop (5.7) | **Có (migration)** |
| 6 | Bạn bè, quà tặng, tặng điểm | Hoàn thành (2026-10-28, PR #8) | **Có (migration)** |
| 7 | Hardening, kiểm thử bảo mật, ra mắt | Hoàn thành (2026-10-28, PR #9, đã gộp `main`) | **Có (migration)** |
| 8 | Dọn giao diện giáo viên, sửa lỗi chớp loading, trang loading, Hồi sinh, phím tắt | Hoàn thành (2026-10-28), chờ Harry xem thử | Không |
| 9 | Các trang "wow": Tặng quà, Vòng quay may mắn, Cá Ngựa | Kế hoạch | Không |
| 10 | Cổng học sinh v2: nav, Profile, Shop học sinh | Kế hoạch | **Có (migration, cần Harry duyệt)** |
| 11 | Skills tự động sau Random và khi cộng/trừ điểm | Kế hoạch | Không |
| 12 | Cổng học sinh v3: nav 4 mục, modal đăng xuất, trang Pokémon, Hợp nhất, dọn Hồ sơ Trainer | Hoàn thành 12A-12D (2026-10-28); 12C chờ chạy migration | Chỉ 12C (migration, cần Harry duyệt) |

Ghi chú: so với lộ trình đã trao đổi, Phase 2 (reskin + thuật ngữ) được tách riêng để các Phase tài khoản/xã hội dùng ngay hệ thiết kế mới; các Phase sau dời xuống một số.

---

## Phase 0 - Nền móng và thương hiệu (HOÀN THÀNH 2026-10-26)

**Mục tiêu:** có bộ tài liệu nền, đổi tên và logo; không đụng logic game hay dữ liệu.

- [x] 0.1 Khảo sát toàn bộ chuỗi thương hiệu cũ (Imperial, cung đình, học sĩ...) trong repo
- [x] 0.2 Trích bảng màu từ 4 file logo gốc
- [x] 0.3 Đưa logo vào `public/brand/` (bản tối ưu), `brand-source/` (bản gốc), tạo favicon, apple-touch-icon, icon 192/512
- [x] 0.4 Đổi tên hiển thị: `index.html` (tiêu đề, favicon, theme-color), `metadata.json`, `package.json`, `package-lock.json`, tên file sao lưu JSON
- [x] 0.5 Viết `DESIGN.md` (bản nháp seed từ logo)
- [x] 0.6 Viết `CLAUDE.md`, `AGENT.md`, `CLASSIVY-BRIEF.md`; viết lại `README.md`
- [x] 0.7 Viết lại `PLAN.md` (file này); lưu tài liệu cũ vào `docs/archive/`
- [x] 0.8 Kiểm chứng: `npm test`, `npm run build` (xem kết quả ở "Nhật ký kiểm chứng")

**Cố ý chưa làm trong Phase 0 (đã dời sang Phase 2):** đổi khoá localStorage `imperial_*`, thuật ngữ cung đình trong UI/rank/prompt Gemini, giá trị mặc định "Học sĩ triều đình" trong `AuthContext.tsx` và `supabase-schema.sql`, giao diện/màu trong app. Lý do: đổi khoá localStorage làm mất dữ liệu khách nếu không có đoạn chuyển; đổi schema default cần chạy SQL trên Supabase.

**Bàn giao cho Harry:** xem báo cáo cuối Phase 0. Không có migration.

**Nhật ký kiểm chứng:** ghi ở cuối file.

---

## Phase 1 - Tách App.tsx (giữ nguyên hành vi) (HOÀN THÀNH 2026-10-27)

**Mục tiêu:** `App.tsx` còn là lớp khung mỏng (< ~300 dòng); mỗi tính năng có thư mục riêng; có router; hành vi người dùng không đổi.

**Nguyên tắc:** tách dần theo kiểu "bóc từng lớp" (không viết lại một lần). Sau mỗi bước phải `npm test` + `npm run build` xanh. Không đổi luật game. Không đổi giao diện.

**Cấu trúc mục tiêu (đề xuất, chốt ở task 1.1):**

```
src/
  app/            (App.tsx khung, router, providers)
  features/
    auth/  class/  students/  random/ (solo, battle, boss)
    attendance/  homework/  shop/  pokemon/  ludo/  wheel/
    tools/ (group, timer)  plaza/  settings/  profile/
  components/ui/  (dùng chung)
  lib/            (supabase, storage, utils)
  state/          (store/hook dùng chung)
  types/  constants/
```

**Tasks:**

- [x] 1.1 Lập kế hoạch tách chi tiết: xem `docs/phase-1-split-plan.md` (2026-10-26). Quyết định A-D lấy theo mặc định đề xuất khi Harry yêu cầu "hoàn thành toàn bộ Phase 1": Context + hook, `react-router-dom` + `vercel.json`, Playwright (devDependency), nhánh `refactor/phase-1-split`
- [x] 1.2 (S0) Lưới an toàn (2026-10-26): `fixtures/sample-class.json` (2 lớp, 12 học sinh), `tests/smoke/app.spec.ts` (`npm run smoke`): DOM 4 màn hình + 11 hộp thoại + dữ liệu đồng bộ sau 9 luồng thao tác. Ảnh gốc tạo từ code TRƯỚC khi tách
- [x] 1.3 (S1) Chuyển vào `src/` theo cấu trúc `app/ features/ domain/ data/ lib/ types/ components/` (2026-10-26)
- [x] 1.4 (S2) Rút phần thuần (types, hằng số, hàm trứng/ngày, AuthLoginForm, SettingsSection) ra khỏi App (2026-10-26)
- [x] 1.5 (S3) `GameDataProvider` + `providers/gameData/` (state, đồng bộ Supabase, localStorage, sao lưu/khôi phục), giữ nguyên khoá và điều kiện lưu (2026-10-26)
- [x] 1.6 (S4) `UiEventsProvider` (toast, level-up, nở trứng, hàng đợi Pokémon rời đi, thánh chỉ) (2026-10-26)
- [x] 1.7 (S5) Hành động theo tính năng (`features/*/*Actions.ts`, gọi nhau qua `app.*`); `handleUpdatePoints` -> `domain/points.ts`; tiến trình -> `domain/progression.ts`, `pokemonCollection.ts`; test đặc trưng (2026-10-26)
- [x] 1.8 (S6) Router: `/class` (mặc định), `/plaza`, `/settings`, `/student/:id`; `vercel.json` (2026-10-26)
- [x] 1.9 (S7-S9) Tools/Group/Timer/Thời tiết/User modal; Settings; Plaza + Class + Skill modal (2026-10-26)
- [x] 1.10 (S10) Profile tách theo tab: info / pet (trứng, Pokémon) / fusion + 3 panel (2026-10-26)
- [x] 1.11 (S11-S12) Điểm danh, bài tập (`domain/attendance.ts`, `domain/homework.ts`); Shop, Hatch, Gift, Release (2026-10-26)
- [x] 1.12 (S13-S14) Random/Battle/Boss (`domain/battle.ts`); Lucky Wheel + Cá Ngựa (`domain/ludo.ts`) (2026-10-26)
- [x] 1.13 (S15) Dọn dẹp: lazy-load Plaza/Hồ sơ/Cài đặt và Gemini, tách chunk thư viện (chunk chính 1,40 MB -> 0,50 MB, hết cảnh báo), xoá state/hàm chết, bỏ `importmap` cũ của AI Studio; nợ kỹ thuật ghi ở `docs/architecture.md` mục 7 (2026-10-26)
- [x] 1.13b Theo góp ý nghiệm thu của Harry (D8, 2026-10-27): trang riêng cho từng lớp và cho Cá Ngựa / Vòng quay / Tặng Pokémon (`useClassRoute`, `ClassPickerScreen`, `ClassPageGuard`); dữ liệu đồng bộ sau mọi luồng thử giữ nguyên
- [x] 1.14 (S16) Nghiệm thu (2026-10-27): Harry đã chạy checklist trên bản preview và đồng ý gộp; nhánh `refactor/phase-1-split` gộp vào `main`. Nghiệm thu: Harry chạy checklist hồi quy (`docs/phase-1-split-plan.md` mục 7) trên bản preview Vercel của nhánh; xác nhận để gộp vào `main`

**Khác so với kế hoạch ban đầu (đã cân nhắc, không đổi hành vi):**
- Không tạo `ModalHost` riêng: Random, Cá Ngựa, Vòng quay gọi nhau qua `app.*`; mọi hộp thoại render trong `AppLayout`.
- State giao diện của từng tính năng nằm trong hook của tính năng nhưng vẫn "sống" ở cấp `AppProvider` (không chuyển vào bên trong component) để giữ nguyên hành vi đóng/mở hộp thoại như cũ.
- Code được di chuyển bằng script đọc cây cú pháp TypeScript (không chép tay), sau đó tách thêm logic thuần có test.
- Hai chỉnh sửa nhỏ không đổi kết quả hiển thị: `normalizeClassBossState` không tạo ID Boss bỏ đi mỗi lần render; Boss của lớp hiện tại được `useMemo`.

**Tiêu chí hoàn thành:** `npm test` và `npm run build` xanh; không file nào > ~500 dòng (ngoại lệ có ghi chú, ví dụ dữ liệu `pokemonData`); checklist hồi quy đạt. Hiện trạng: test, build, smoke xanh; `App.tsx` 21 dòng; file lớn nhất (ngoài `pokemonData.ts`) là `domain/gameEvents.ts` 504 dòng (có từ trước, chưa đụng); checklist hồi quy chờ Harry.

**Bàn giao cho Harry (dự kiến):** không migration; chạy checklist hồi quy trên bản dev/preview.

**Kỹ năng dùng:** `engineering:tech-debt`, `engineering:testing-strategy`, `engineering:code-review`.

---

## Phase 2 - Hệ thiết kế Classivy, reskin, thuật ngữ (HOÀN THÀNH 2026-10-27)

**Mục tiêu:** giao diện đúng nhận diện Classivy; bỏ thuật ngữ cung đình; không mất dữ liệu người dùng cũ.

- [x] 2.0 **Bỏ hệ cấp bậc** (quyết định D7, làm đầu tiên) - xong 2026-10-27, kết quả ở "Nhật ký kiểm chứng":
  - Bảng Ban thưởng/Phạt: thay 3 ô "Level Hiện Tại / Điểm lên Level / Điểm xuống Level" bằng Trainer Level (cấp + danh hiệu + tiến độ XP, như trên thẻ học sinh)
  - Bỏ hộp "Thánh chỉ" và toàn bộ Gemini (`lib/geminiService.ts`, gói `@google/genai`, biến `GEMINI_API_KEY` trong `.env.example`, README, `vite.config.ts`)
  - Bỏ `getRank`, state/lưu trữ `ranksMale`/`ranksFemale`, `DEFAULT_RANKS_*`, khoá localStorage cấp bậc, `handleAvatarUpload` (không dùng), `rankChanges` trong `domain/points.ts`
  - Dữ liệu: app thôi đọc/ghi `ranks_male`/`ranks_female`; KHÔNG đổi Supabase ở Phase 2 (xoá cột gộp vào migration Phase 3). File sao lưu cũ có phần cấp bậc vẫn nhập được (bỏ qua phần đó) - viết test cho việc này
  - Lỗi "danh sách cấp bậc rỗng làm trắng trang" tự hết theo
  - Kiểm chứng: `npm test`, `npm run typecheck`, `npm run build`, cập nhật ảnh gốc smoke test có chủ đích (`npm run smoke -- --update-snapshots`) và xem lại diff
- [x] 2.1 Chốt `DESIGN.md` chính thức (2026-10-27): theo skill `impeccable`, viết `PRODUCT.md` (Harry xác nhận người dùng: giáo viên trên laptop/màn chiếu; học sinh chưa đăng nhập tới Phase 5), Harry chọn "gộp" bản nháp với những gì đã dựng; hướng thiết kế do Harry ghim nên không bốc thăm hướng mới. Hợp đồng hướng thiết kế trang lớp: `.impeccable/surfaces/`
- [x] 2.2 Chuyển Tailwind từ CDN sang build local, đưa token màu/chữ/bo góc vào cấu hình - xong 2026-10-27: Tailwind 3.4 (cùng dòng v3 với CDN cũ) + PostCSS, `tailwind.config.js` có token `brand-*` từ DESIGN.md (chưa dùng ở màn nào, dành cho 2.3-2.4)
- [x] 2.3 Dựng thư viện `components/ui/` - có Button, Card, Chip, ProgressBar (có "chồi lá"), ShieldScore, EmptyState, Modal và toast Pokémon không chặn thao tác. Avatar tiếp tục dùng `StudentAvatar` hiện hữu.
- [x] 2.4 Reskin các màn hình đã tách; rà token tương phản, focus và thao tác modal
  - [x] Bản mẫu (Harry chọn "làm mẫu trước", 2026-10-27): khung app (thanh điều hướng trái luôn hiện, gộp nút đồng bộ), trang chọn lớp, trang lớp (thanh công cụ, thẻ học sinh, dock công cụ có chữ), màn chờ đăng nhập. **Harry duyệt hướng 2026-10-27**, kèm chỉnh sửa D10 (đã làm: màu thanh điều hướng, bo góc, nút Tặng quà, dock macOS, bỏ Plaza/thời tiết)
  - [x] Các màn còn lại đã chuyển token/lớp phủ Classivy theo từng đợt; Plaza và weather bị bỏ theo D10. Playfair và `font-royal` đã bỏ hẳn.
  - [x] Rà soát lại sau Codex (2026-10-27): thống nhất phông chữ toàn app, bỏ lớp CSS ép màu `!important`, thẻ học sinh vào được bằng phím Tab, Modal giữ focus và Esc chỉ đóng hộp trên cùng. Chi tiết ở "Nhật ký kiểm chứng".
- [x] 2.5 **Quyết định với Harry:** bộ thuật ngữ (D9, 2026-10-27): giữ "Hào Quang", "Học sĩ" -> "Trainer". Đã đổi 3 mô tả vật phẩm/kỹ năng trong `pokemonData.ts`. Lưu ý: danh sách kỹ năng Pokémon được lưu riêng theo giáo viên (sửa được ở Cài đặt), nên tài khoản đã có dữ liệu vẫn thấy chữ cũ ở 2 kỹ năng "Ý Chỉ Đồng Hành", "Truyền Cảm Hứng" cho tới khi tự sửa. Còn mở: tên kỹ năng "Ý Chỉ Đồng Hành" và vài chữ "hoàng" trong dữ liệu Pokémon/Boss
  - Bổ sung theo Harry duyệt: `Ý Chỉ Đồng Hành` -> `Đồng Đội Hỗ Trợ`; `Áo Choàng Hoàng Gia` -> `Áo Choàng Huyền Ảo`; `Vương Miện Hoàng Đế` -> `Vương Miện Nhà Vô Địch`; mô tả "hào quang hoàng tộc" -> "hào quang rực rỡ". Tài khoản đã lưu `petSkills` riêng vẫn giữ tên cũ cho tới khi giáo viên khôi phục/sửa danh sách trong Cài đặt.
- [x] ~~2.6 Đổi prompt Gemini~~ - không cần nữa: Gemini bị bỏ ở 2.0 (D7)
- [x] 2.7 Đổi khoá localStorage `imperial_*` thành `classivy_*` **kèm đoạn chuyển dữ liệu một lần** (đọc khoá cũ, ghi khoá mới, giữ bản cũ để hoàn tác) và test - xong 2026-10-27. Cách hoàn tác: xoá các khoá `classivy_*` và `classivy_storage_migrated_v1` trong trình duyệt rồi tải lại trang
- [x] 2.8 Đổi giá trị mặc định "Học sĩ triều đình" thành "Trainer" trong `AuthContext.tsx`; SQL đổi default (và xoá cột cấp bậc) soạn sẵn ở `docs/phase-3-pending-sql.md` để gộp vào migration Phase 3, không chạy riêng (2026-10-27)
- [x] 2.9 Cập nhật `DESIGN.md`, PLAN, BRIEF; báo cáo (2026-10-27)

**Bàn giao cho Harry (dự kiến):** duyệt bộ thuật ngữ mới; thử bản preview; không migration (SQL đổi default gộp vào Phase 3).

**Kỹ năng dùng:** `impeccable`, `ui-ux-pro-max`, `design-system`, `brand`, `design:accessibility-review`, `design:ux-copy`.

---

## Phase 3 - Mô hình dữ liệu mới + RLS (HOÀN THÀNH 2026-10-28)

**Mục tiêu:** học sinh, lớp, điểm là dữ liệu bảng thật, có RLS chặt, dữ liệu cũ được chuyển sang mà không mất.

**Nhánh:** `claude/phase3-data-model`. **Thiết kế:** `docs/adr/0001-phase-3-data-model.md` (mô hình lai: bảng `classes`, `students`, `point_ledger`; dữ liệu game giữ JSON trong `students.game_state`).

- [x] 3.1 ADR data model - `docs/adr/0001-phase-3-data-model.md`; Harry duyệt 2026-10-27 (đồng ý mọi đề xuất, Q3 = xoá hẳn) -> D12
- [x] 3.2 Migration `supabase/migrations/20261027120000_phase3_data_model.sql` (chạy lại được) + hoàn tác `supabase/rollback/..._down.sql`: bảng `classes`, `students`, `point_ledger` (chỉ thêm, trigger chặn sửa/xoá), view `student_recent_history`, hàm `save_teacher_changes` (security invoker, một transaction), `profiles.role` (client không ghi được), `user_settings.data_model_version`; đã gộp `docs/phase-3-pending-sql.md` (2026-10-27)
- [x] 3.2b Test RLS trên PostgreSQL 16 cục bộ với `auth` giả: `npm run test:db` (`scripts/test-db.sh`, `supabase/tests/`), 60 kiểm tra: giáo viên A/B tách biệt, ẩn danh bị chặn, sổ điểm bất biến (kể cả quyền quản trị), không ghi được `auth_user_id`/`status`/`role`, khoá ngoại chặn gắn lớp/sổ sang giáo viên khác, xoá học sinh/giáo viên kéo theo dữ liệu; migration chạy 2 lần + hoàn tác + chạy lại; dữ liệu cũ không đổi (2026-10-27)
- [x] 3.3 Chuyển dữ liệu trong app: `src/domain/legacyImport.ts` (chạy thử, kiểm tra lỗi chặn/lưu ý, số dư đầu kỳ, đối chiếu từng học sinh, chạy lại được sau khi chuyển dở) + hộp thoại `src/features/dataUpgrade/DataUpgradeModal.tsx` (tải sao lưu JSON trước; lỗi thì giữ cách lưu cũ) (2026-10-27)
- [x] 3.4 Lớp truy cập dữ liệu: `src/app/providers/gameData/cloudStore.ts` chọn cách lưu cũ/mới theo `data_model_version`; bảng mới chỉ gửi phần thay đổi (`src/domain/cloudModel.ts`, có test), lưu lần lượt không chồng nhau; sao lưu/khôi phục/nhập JSON đi cùng đường; nén ảnh đại diện quá lớn (`src/lib/imageCompression.ts`). App không có chế độ khách nên không cần giữ (2026-10-27)
- [x] 3.5 Harry chạy trên **dự án Supabase dev** (`classivy-dev`) theo `docs/phase-3-runbook.md` bước 1: Harry xác nhận "chạy ổn" 2026-10-28 (sau khi sửa lỗi cấp quyền ở dự án mới, xem Nhật ký)
- [x] 3.6 Checklist triển khai + sao lưu + hoàn tác: `docs/phase-3-runbook.md` bước 2 và "Nếu có sự cố". Harry chạy migration trên production (sau bản sửa bảng `students` cũ), nâng cấp dữ liệu, xác nhận "mọi thứ đã ổn" 2026-10-28

**Bàn giao cho Harry:** sao lưu dữ liệu, chạy migration trên dev rồi production theo hướng dẫn; xác nhận từng bước trước khi coi là đã áp dụng.

---

## Phase 4 - Giáo viên quản lý tài khoản học sinh (HOÀN THÀNH 2026-10-28)

**Nhánh:** `claude/phase4-student-accounts`. **Thiết kế:** `docs/adr/0002-phase-4-student-accounts.md` (quyết định D14-D17).

- [x] 4.0 ADR 0002 + quyết định D14-D17 (Harry chốt 2026-10-28)
- [x] 4.1 (đã viết và test với kho giả, **chưa triển khai/chạy trên Supabase thật**) Edge Function `student-accounts`: `create` (một em hoặc cả lớp, tối đa 60/lần), `reset_password`, `lock`/`unlock`, `revoke` (thu hồi tài khoản, giữ học sinh). Xoá học sinh dùng luồng sẵn có + trigger DB xoá luôn tài khoản (D16)
- [x] 4.2 (đã viết; test bằng vitest + smoke với Supabase giả) Quy ước tên đăng nhập, mật khẩu ngẫu nhiên, ép đổi mật khẩu lần đầu (ô đăng nhập nhận tên đăng nhập; màn đổi mật khẩu cho tài khoản học sinh; tài khoản học sinh không tải dữ liệu giáo viên)
- [x] 4.3 (smoke với Supabase giả đạt; chưa thử tay) Màn hình quản lý tài khoản theo lớp `/class/<lớp>/tai-khoan` (tìm, lọc, tạo, đặt lại mật khẩu, khoá, thu hồi, in thẻ đăng nhập). Sửa thông tin học sinh dùng luồng sẵn có
- [x] 4.4 (migration + test DB đạt; chưa chạy trên Supabase thật) Nhật ký thao tác (bảng `teacher_audit_log`) + hộp xác nhận trước thao tác phá huỷ
- [x] 4.5 (test SQL 2 kiểu dự án + test hàm với kho giả có phân quyền) Kiểm thử phân quyền: giáo viên chỉ tác động học sinh lớp mình (test SQL + test Edge Function với Supabase giả)

**Bàn giao cho Harry:** đã chạy migration `20261029100000_phase4_student_accounts.sql` và triển khai hàm `student-accounts` trên dev và production theo `docs/phase-4-runbook.md`. **Harry xác nhận Phase 4 "ok hết" (2026-10-28)**, gồm thử trên production (bước 2.5) và 3 mục "ghi lại" ở bước 1.5. Gộp `main` qua PR #5.

---

## Phase 5 - Cổng học sinh (HOÀN THÀNH 2026-10-28)

**Nhánh:** `claude/focused-lamport-rk8qji`. **Thiết kế:** `docs/adr/0003-phase-5-student-portal.md` (D18-D21). **Runbook:** `docs/phase-5-runbook.md`.

- [x] 5.0 ADR 0003 + quyết định D18-D21 (Harry chốt 2026-10-28: hàm DB chọn lọc, chỉ Trainer Level, chỉ xem, ảnh giữ DB)
- [x] 5.1 (smoke với Supabase giả, khổ 390px; chưa thử trên điện thoại thật) Đăng nhập học sinh: dùng chung màn đăng nhập (ô nhận tên đăng nhập từ Phase 4), sau đổi mật khẩu vào thẳng hồ sơ; giao diện một cột, điện thoại trước, chữ 16px/nhãn 13px, nút ≥ 44px, không cuộn ngang
- [x] 5.2 (unit + smoke; chưa chạy trên Supabase thật) Hồ sơ chỉ của mình: Hào Quang, Trainer Level + danh hiệu (D19), Pokémon đồng hành + HP, trứng đang ấp (không lộ Pokémon sắp nở), bộ sưu tập, huy hiệu, 30 dòng lịch sử gần nhất; nút "Cập nhật" (không hỏi liên tục)
- [x] 5.3 (test DB + smoke) Tài khoản bị khoá: đăng nhập bị Supabase từ chối với thông báo chung (Phase 4); phiên đang mở mà bị khoá thì hàm trả `locked`, màn hình chỉ còn "Tài khoản đang tạm khoá" + Đăng xuất. Thêm màn cho "chưa gắn học sinh", "không phải tài khoản học sinh", lỗi mạng (thử lại được)
- [x] 5.4 (test SQL 2 kiểu dự án) RLS: học sinh vẫn đọc 0 dòng ở `students`/`point_ledger`/`classes`/`student_recent_history`; hàm chỉ trả dữ liệu của người gọi, chỉ khoá danh sách cho phép, không có `teacher_id`/tên đăng nhập/dữ liệu bạn khác; khoá → chỉ trạng thái; ẩn danh bị chặn; tài khoản giáo viên gắn nhầm → `not_student`
- [x] 5.4b (test SQL 2 kiểu dự án; chưa chạy trên Supabase thật) **Sửa lỗi Harry báo 2026-10-28:** tài khoản học sinh tạo từ app hiện `role = teacher` trong `profiles`. Nguyên nhân: Supabase tạo người dùng trước rồi mới gắn `app_metadata.role = 'student'`, trigger tạo hồ sơ chỉ chạy lúc tạo. Sửa: migration `20261030110000_sync_profile_role.sql` (trigger đồng bộ `profiles.role` theo `app_metadata.role` + sửa các tài khoản đã tạo). Quy tắc Harry chốt: tạo trong Supabase Authentication = giáo viên, giáo viên tạo trong app = học sinh. Hệ quả nếu không sửa: hồ sơ Phase 5 báo "không phải tài khoản học sinh"; học sinh lọt qua chốt "chỉ giáo viên" của Edge Function (RLS vẫn chặn tác động học sinh người khác)
- [x] 5.5 Harry chạy `docs/phase-5-runbook.md` (migration Phase 5 + sửa vai trò) và thử: Harry xác nhận "tất cả Phase 5 đều đã ổn" (2026-10-28). Nhánh đã gộp `main` qua PR #6
- [x] 5.6 Nghiệm thu Phase 5 (2026-10-28). Mục 1.6 của runbook (thông báo đăng nhập tài khoản khoá, mật khẩu sai/đúng): Harry xác nhận đúng như mong đợi
- [x] 5.7 (smoke 3 khổ với Supabase giả; chưa thử tay trên máy tính thật) **Bổ sung theo yêu cầu Harry (D22):** hồ sơ học sinh responsive: máy tính bảng hai cột, desktop cột trái cố định + cột phải rộng, bộ sưu tập 3-6 cột theo khổ; DESIGN.md ghi quy tắc bố cục học sinh cho các Phase sau

**Bàn giao cho Harry:** đã chạy `20261030100000_phase5_student_portal.sql` và `20261030110000_sync_profile_role.sql`, Harry xác nhận ổn (2026-10-28). Bản responsive (5.7) chỉ đổi giao diện, không có migration: xem preview Vercel trên máy tính rồi gộp.

---

## Phase 6 - Bạn bè, quà tặng, tặng điểm (HOÀN THÀNH 2026-10-28)

**Nhánh:** `claude/focused-lamport-rk8qji` (khởi động lại từ `main` sau PR #7). **Thiết kế:** `docs/adr/0004-phase-6-social.md` (D23-D26). **Runbook:** `docs/phase-6-runbook.md`.

- [x] 6.0 ADR 0004 + quyết định D23-D26 (Harry chốt 2026-10-28, cả 4 theo đề xuất)
- [x] 6.1 (test SQL + smoke với Supabase giả; chưa chạy trên Supabase thật) Kết bạn trong cùng lớp: lời mời, chấp nhận/từ chối, mời chéo tự thành bạn, huỷ lời mời, thôi làm bạn; chỉ bạn cùng lớp có tài khoản đang hoạt động; tối đa 10 lời mời chờ. Giáo viên bật/tắt theo lớp (mặc định tắt) trên trang `/class/<lớp>/ban-be`, gỡ quan hệ được
- [x] 6.2 (test SQL + unit + smoke) Ví điểm tặng: 5 điểm/tuần, 2 điểm/tuần/bạn, 0-2 điểm/lần (giáo viên chỉnh 0-50); hàm DB khoá dòng người gửi (atomic); sổ cái `student_gifts` bất biến; điểm vào Hào Quang qua hàng chờ `teacher_pending_gift_adjustments()` + `useGiftCollector` (dòng sổ điểm `gift-<id>`, không cộng trùng, không kích hoạt hiệu ứng game)
- [x] 6.3 (test SQL + smoke) Quà: 8 sticker + 6 lời khen định sẵn, không ô gõ chữ; danh mục đối chiếu DB bằng unit test
- [x] 6.4 (test SQL + smoke) Chống lạm dụng: 10 quà/ngày, hạn mức mỗi bạn chặn đổi điểm qua lại, quà thu hồi không trả ví; học sinh "Báo thầy cô"; giáo viên xem nhật ký 100 quà, tab Báo cáo, thu hồi (tự trừ lại nếu đã cộng) kèm lý do riêng; tài khoản khoá không dùng được gì
- [x] 6.5 Tương tác lành mạnh: không bảng xếp hạng quà/bạn bè; học sinh chỉ thấy tên + Pokémon đồng hành của bạn (không điểm, không ảnh); quà nhận được chỉ người nhận xem; thông báo lỗi thân thiện
- [x] 6.6 (smoke 390/820/1440px) Khu bạn bè & quà ở cột phải trên máy tính bảng/desktop, không cuộn ngang
- [x] 6.7 Harry chạy `docs/phase-6-runbook.md` bước 1 trên `classivy-dev` (2026-10-28): 1.6 điểm tặng không bị cộng trùng; 1.7 thu hồi quà thì điểm tự trừ lại
- [x] 6.8 Gộp `main` qua PR #8; Harry yêu cầu ghi Phase 6 hoàn thành (2026-10-28)

**Bàn giao cho Harry:** đã chạy migration trên dev và thử 1.6/1.7 ổn; Harry xác nhận hoàn thành Phase 6 (2026-10-28).

---

## Phase 7 - Hardening và ra mắt (HOÀN THÀNH 2026-10-28, PR #9)

**Nhánh:** `claude/focused-lamport-rk8qji` (khởi động lại từ `main` sau PR #8). **Thiết kế:** `docs/adr/0005-phase-7-hardening.md` (D28-D31). **Runbook:** `docs/phase-7-runbook.md`.

- [x] 7.1 (test SQL 2 kiểu dự án + smoke) Rà soát bảo mật: `docs/security-review-phase7.md`. Sửa S1 (học sinh dùng được API dữ liệu giáo viên -> chốt `is_teacher()`), S2 (thu quyền bảng thừa của ẩn danh ở dự án cũ), S3 (thu quyền gọi hàm trigger), S4 (hai máy ghi đè -> `students.revision` + `save_teacher_changes_v2` + banner tải lại). Thêm chốt chặn tổng quát chạy mãi về sau: mọi bảng bật RLS, mọi hàm security definer khoá `search_path`, ẩn danh không có quyền bảng/hàm quyền cao, không hàm trigger nào gọi được qua API
- [x] 7.2 (cục bộ) Kiểm thử tải nhẹ `npm run test:load`: 350 học sinh, 70.000 dòng sổ điểm, ~5.000 quà; mọi truy vấn chính < 35 ms; DB ~30 MB / 500 MB. Theo dõi gói miễn phí: `docs/phase-7-rollout.md`
- [x] 7.3 Hướng dẫn: `docs/huong-dan/giao-vien.md`, `docs/huong-dan/hoc-sinh.md`, thư mẫu `docs/huong-dan/thu-gui-phu-huynh.md` (Harry chỉnh trước khi gửi)
- [x] 7.4 Kế hoạch triển khai từng lớp (pilot 1 lớp, bật xã hội sau 1 tuần, mở rộng 2-3 lớp/tuần), theo dõi hằng tuần, dừng khẩn cấp: `docs/phase-7-rollout.md`
- [x] 7.5 Dọn dữ liệu cũ (D29): migration riêng `20261101110000_drop_legacy_data.sql`, có chốt dừng khi còn giáo viên chưa nâng cấp; ảnh mới nén ~100 KB (D30)
- [x] 7.6 Harry chạy `docs/phase-7-runbook.md` bước 1 trên dev (2026-10-28): tất cả mục pass, không lỗi (gồm 1.3 thử hai máy, 1.5, 1.7 dọn dữ liệu cũ, 1.8 Advisors)
- [x] 7.7 (Harry xác nhận xong, đã gộp vào `main`) Harry chạy bước 2 trên production (sao lưu, migration hardening, gộp nhánh - Harry yêu cầu gộp 2026-10-28, rồi migration dọn dữ liệu cũ), bắt đầu pilot theo `docs/phase-7-rollout.md`

**Bàn giao cho Harry:** migration `20261101100000_phase7_hardening.sql` (dev rồi production), gộp nhánh, rồi `20261101110000_drop_legacy_data.sql` **sau khi sao lưu**. **Chưa có gì được áp dụng trên Supabase thật.**

---

## Phase 8 - Dọn giao diện giáo viên và sửa lỗi (HOÀN THÀNH 2026-10-28, chờ Harry xem thử; không đụng Supabase)

- [x] 8.1 Sửa chớp loading: `AuthContext.tsx` hiện bật `loading=true` mỗi lần `onAuthStateChange` (quay lại tab, làm mới token). Chỉ hiện loading ở lần mở app đầu và lúc vừa đăng nhập; cùng một người dùng thì cập nhật âm thầm. Có test.
- [x] 8.2 Trang loading giống DictaLearn (đọc code DictaLearn trước); hiện sau đăng nhập (giáo viên và học sinh) và khi bấm vào từng lớp
- [x] 8.3 Đăng xuất không confirm (D40)
- [x] 8.4 Nav bar chỉ icon, hover hiện label; bấm "Class" khi đang trong lớp thì về `/class`
- [x] 8.5 Trang Class: các nút điểm danh, homework, tài khoản học sinh, bạn bè, thêm trainer chỉ icon, cùng một dòng
- [x] 8.6 Check đi học và Check homework cùng kích thước, 4 cột; đổi "Thiếu" thành "Chưa làm"
- [x] 8.7 Nút Vòng quay mặc định chọn hết học sinh có đi học của lớp hiện tại
- [x] 8.8 Modal hẹn giờ to hơn; logo Classivy to hơn
- [x] 8.9 Hiệu ứng cộng/trừ điểm bay ngay trên thẻ học sinh
- [x] 8.10 Nút Hồi sinh (D34): logic thuần trong `src/domain/` + test
- [x] 8.11 Phím tắt (D38) + bảng trong Cài đặt
- [x] 8.12 Kiểm chứng: `npm test`, `typecheck`, `smoke`, `build`; ảnh chụp giao diện

**Kết quả (2026-10-28, nhánh `claude/phase8-teacher-ui`, chưa commit):**
- 8.1 Nguyên nhân chớp loading: `AuthContext` bật `loading` mỗi lần Supabase phát lại tín hiệu (quay lại tab, làm mới token). Nay chỉ hiện loading khi đăng nhập/đổi người dùng (`src/domain/authLoading.ts`, có test); `user` giữ nguyên tham chiếu nếu không đổi.
- 8.2 Trang loading: `src/app/SplashScreen.tsx` + CSS `.cl-splash` trong `src/index.css` + bản tĩnh trong `index.html`. Hiện sau đăng nhập (giáo viên và học sinh), tối thiểu 0,9 giây; với học sinh, trang loading giữ tới khi hồ sơ tải xong (`StudentPortalApp` báo `onReadyChange` cho `app/App.tsx`), không còn màn "Đang tải..." riêng; vào từng lớp hiện 0,7 giây kèm tên lớp (các trang con cùng lớp không hiện lại). Tham chiếu: `docs/reference/dictalearn-splash.md`.
- 8.4 "Lớp Học" trên nav luôn về `/class`. 8.7 Vòng quay mặc định chọn hết học sinh có đi học của lớp.
- 8.9 Hiệu ứng điểm ở `src/components/PointsFx.tsx`: tự nhận mọi thay đổi điểm (Ban thưởng, Random, Vòng quay...), bỏ qua thay đổi > 200 điểm hoặc 1,2 giây đầu sau khi thẻ hiện.
- 8.10 Hồi sinh: `src/domain/revive.ts`. Mất toàn bộ Pokémon kèm skills (skills gắn trên Pokémon), giữ trứng; ghi một dòng lịch sử cho sổ điểm. Không cần migration.
- 8.11 Phím tắt: `src/domain/shortcuts.ts`, bảng ở Cài đặt, phím `?` mở bảng nhắc. Phím lưu trên máy (localStorage `classivy_shortcuts_v1`), không đồng bộ đám mây.
- Kiểm chứng tự động: typecheck 0 lỗi; vitest 209/209 (thêm 16 test: authLoading, revive, shortcuts); build đạt; smoke 23/23 sau khi cập nhật ảnh gốc có chủ đích (DOM đổi do nav/nút/modal mới; các file `*-cloud.json` chỉ đổi `upsertCount` +1 do nay chờ trang loading nên lần lưu khởi tạo Boss tách riêng). Thêm smoke test "Phase 8" (toolbar một dòng, hiệu ứng điểm, phím tắt, hồi sinh, nút Lớp Học, đăng xuất không confirm); sửa 2 test cũ cho đúng hành vi mới.
- **Chưa kiểm chứng:** lỗi chớp loading trên trình duyệt thật (chỉ có unit test logic; Harry thử đổi tab qua lại); hiệu ứng chuyển động và trang loading bằng mắt trên màn chiếu lớp; phím tắt khi dùng bộ gõ tiếng Việt (Telex) - phím tắt bỏ qua khi đang gõ trong ô nhập.

---

## Phase 9 - Các trang "wow" (không đụng Supabase)

Dùng skill `impeccable`, `ui-ux-pro-max`; mỗi trang là một trang đầy đủ, không giống modal.

- [x] 9.1 Trang Tặng quà/Tặng Pokémon: cảm giác Pokémon sống cùng học sinh (nở, xuất hiện, phản ứng, hiệu ứng ánh sáng và hạt), muốn nuôi và chăm sóc
- [x] 9.2 Vòng quay may mặc: dựng lại như một màn hình cuối giờ (vòng quay mượt, hồi hộp, hiệu ứng trúng thưởng, âm thanh)
- [x] 9.3 Cá Ngựa: phóng to bàn cờ, quân và chữ; bố cục chiếm đủ màn hình lớp
- [x] 9.4 Tôn trọng `prefers-reduced-motion`; smoke test ở nhiều kích thước

**Kết quả Phase 9 (2026-10-28, chưa commit):** Cá Ngựa là trang toàn màn hình (bàn cờ 10x5 chiếm gần hết chiều cao, ô/quân/chữ to hơn, nhật ký rút gọn bên phải); Vòng quay là trang tối toàn màn hình (vòng quay lớn, viền đèn nhấp nháy, kim rung khi quay, nhãn xếp theo bán kính khi có nhiều ô, màn hình trúng thưởng có pháo giấy và âm "ting" sinh bằng mã khi không có file âm thanh); Tặng Pokémon là cảnh đêm có đom đóm + đồi cỏ (trứng bập bềnh, rung và nứt khi nở, Pokémon "thở", bấm vào để vuốt ve có trái tim bay). Không đổi luật game hay dữ liệu. `prefers-reduced-motion` tắt các chuyển động lặp. Kiểm chứng tự động: typecheck 0 lỗi, vitest 209/209, build OK, smoke 26/26 (thêm test Phase 9 ở 390/820/1440px, kiểm tra không tràn ngang). Chưa kiểm chứng: cảm giác chuyển động và âm thanh trên trình duyệt thật; ảnh Pokémon thật (sandbox không tải được ảnh từ mạng).

## Phase 10 - Cổng học sinh v2 (CÓ migration, cần Harry duyệt trước khi chạy)

- [x] 10.1 Nav bar học sinh: Profile, Shop, Friends; avatar ở dưới cùng, bấm để đăng xuất; học sinh không đổi được avatar
- [x] 10.2 Thiết kế lại Profile (bớt phân mảnh) kèm phần skills đang có (bấm để đọc công dụng)
- [x] 10.3 Shop học sinh: mua trứng, nở trứng, đổi Pokémon đồng hành/support, mua skill (D32, D33)
- [x] 10.4 Migration: hàm DB cho từng thao tác mua (kiểm số dư, ghi `point_ledger`, tăng số phiên bản), cờ bật/tắt Shop theo lớp, test RLS/migration (`npm run test:db`)
- [x] 10.5 App giáo viên: gom thay đổi của học sinh khi mở/quay lại tab, tải lại khi gặp phiên bản lỗi thời; test tình huống dữ liệu cũ
- [x] 10.6 Responsive 390 / 820 / 1440px (D22)

**Phase 10A (2026-10-29, chưa commit, không đụng Supabase):** cổng học sinh có thanh điều hướng Hồ sơ / Cửa hàng / Bạn bè (thanh dọc bên trái giống hệt NavDock của giáo viên ở mọi khổ màn hình, kể cả điện thoại), avatar ở dưới cùng bấm để đăng xuất, học sinh không đổi được avatar. Hồ sơ gộp bớt khối: danh tính + Trainer Level một thẻ, Pokémon đồng hành kèm skills (bấm để đọc công dụng, số lượt còn lại trên 2), bộ sưu tập, và một thẻ hai tab Lịch sử/Huy hiệu. Bạn bè và quà chuyển sang trang Bạn bè. Trang Cửa hàng hiện "sắp mở" (chờ 10B). Skills lấy mô tả từ danh sách skill mặc định (skill giáo viên tự sửa chưa hiện ở học sinh). Kiểm chứng tự động: typecheck 0 lỗi, vitest 209/209, build OK, smoke tài khoản 12/12 (390/820/1440px). Chưa kiểm chứng trên trình duyệt thật.

**Chốt cho 10B (Harry, 2026-10-29):** hàm DB sửa thẳng dữ liệu học sinh (mua là có ngay, atomic, ghi sổ điểm, tăng số phiên bản); Shop chỉ có công tắc bật/tắt theo lớp do giáo viên đặt, mặc định TẮT (không khai báo giờ học). Cần viết migration, test trên Postgres cục bộ, chờ Harry duyệt rồi mới chạy.

**Phase 10B (2026-10-28, chưa commit; migration CHƯA chạy trên Supabase thật):** migration `supabase/migrations/20261102100000_phase10_student_shop.sql` (hoàn tác: `supabase/rollback/20261102100000_phase10_student_shop_down.sql`; chạy lại được). Gồm: cột `classes.student_shop_enabled` (mặc định TẮT); ràng buộc `point_ledger.source` thêm `'student_shop'`; bảng tham chiếu `shop_egg_pool` (1025 dex, 98 đặc biệt) và `shop_default_skills` (22 skill) chỉ hàm DB đọc được; hàm cho học sinh (security definer, chỉ học sinh đang hoạt động, khoá dòng, atomic): `student_shop_overview` (xem được cả khi đóng), `student_shop_buy_egg(normal|special)` (10/20 Hào Quang), `student_shop_hatch_egg` (nở nhanh: trả phần tiến độ còn thiếu), `student_shop_buy_skill`, `student_set_companion`, `student_set_support`. Mỗi lần mua sửa thẳng `students.game_state` + `points`, ghi `point_ledger` (không sửa được), tăng `revision`. Giá skill lấy từ `user_settings.pet_skills` của giáo viên nếu có, không thì bộ mặc định.
Luật đã áp dụng (theo D32-D40 và chốt của Harry): mọi thao tác Shop (mua, nở nhanh, đổi đồng hành/hỗ trợ) chỉ khi giáo viên bật công tắc của lớp; mua trứng cất Pokémon đồng hành vào bộ sưu tập cho tới khi trứng nở (hộp xác nhận nói rõ); không mua trứng thứ hai khi đang ấp; không đổi đồng hành khi đang ấp; chọn đồng hành trùng hỗ trợ thì bỏ hỗ trợ; không mua skill khi chưa có đồng hành hoặc đã có skill đó. Quyền: anon và giáo viên không gọi được hàm học sinh; hàm phụ không cấp cho API.
Giao diện: tab Cửa hàng học sinh (đóng: một thông báo; mở: trứng, skill bấm đọc công dụng rồi mua, đổi Pokémon; hộp xác nhận trước khi trừ điểm; lỗi hiện tiếng Việt). Giáo viên: công tắc "Cho phép học sinh dùng Cửa hàng" ở trang Bạn bè & quà của lớp, lưu ngay; ẩn công tắc nếu Supabase chưa chạy migration (không làm hỏng trang). 10.5: app giáo viên tự tải lại khi quay lại tab sau ít nhất 60 giây ẩn, chỉ khi máy này không còn thay đổi chưa lưu; cơ chế `stale_data` của Phase 7 vẫn là chốt chặn cuối. `toPet` của cổng học sinh chấp nhận thú do DB tạo (thiếu tên/loại, bổ sung theo dexId) và không bịa `instanceId`.
Kiểm chứng tự động: `npm run test:db` OK (cả chế độ Supabase cũ/mới, chạy migration 2 lần, hoàn tác và chạy lại; test 70 gồm đóng/mở, mua trứng/nở nhanh/skill/đổi Pokémon, không đủ điểm, sổ cái, revision, giáo viên khác, tài khoản bị khoá, anon); vitest, typecheck, build, smoke: xem báo cáo cuối Phase. Chưa kiểm chứng: chạy trên Supabase thật, trình duyệt thật, ảnh Pokémon thật.

## Phase 11 - Skills tự động (không đổi schema)

Mọi skill giữ 2 lượt, dùng xong ghi lịch sử, hết lượt tự mất. Thẻ học sinh sau Random hiện skill đang có và số lượt còn lại.

| Nhóm | Skill | Hành vi |
|---|---|---|
| A. Tự chạy khi Random | Vòng Quay Tự Tin | Được gọi trúng thì tự +2 điểm, hiệu ứng, trừ 1 lượt |
| B. Hộp hỏi sau Random (Dùng / Không) | Né Trực Diện | Random lại, loại em này |
| | Đổi Đề Thần Tốc | Thẻ nhắc đổi câu hỏi dễ hơn |
| | Mắt Thần Trí Tuệ | Thẻ nhắc cho 1 gợi ý |
| | Trợ Thủ Tra Cứu | Tự bật đồng hồ 30 giây |
| | Đồng Đội Hỗ Trợ | Chọn một bạn trong lớp từ danh sách |
| C. Khi cộng/trừ điểm (chỉ hỏi nếu em có skill, D36) | Nhân Đôi | Hỏi, nếu Dùng thì nhân đôi điểm cộng |
| | Lá Chắn Hộ Vệ | Lần trừ điểm đầu trong ngày: hỏi, nếu Dùng thì giảm 50% |
| | Kim Bài Miễn Tử | Hỏi, nếu Dùng thì bỏ qua lần trừ điểm |
| D. Dùng ngoài Random | Hộ Tống Đồng Đội | Nút "Cứu viện" trên thẻ em bị phạt, tối đa 3 điểm |
| | Cướp Quyền Tranh Đoạt | Nút "Ưu tiên phát biểu": hiện tên em lên màn hình lớp, trừ 1 lượt |
| | Đồng Tâm Hiệp Lực | Giáo viên bấm tay (D37): chọn hai em, cộng ké 1 điểm |

- [x] 11.1 Logic thuần `src/domain/skills` + test cho từng skill (điều kiện, lượt dùng, hết lượt)
- [x] 11.2 Hộp hỏi sau Random và khi cộng/trừ điểm
- [x] 11.3 Nút skill ngoài Random (nhóm D)
- [x] 11.4 Lịch sử dùng skill; kiểm chứng đầy đủ

**Phase 11 xong 2026-10-28 (nhánh `claude/phase8-teacher-ui`, chưa commit, không cần migration).** Quyết định Harry: Nhân Đôi hỏi ở MỌI lần cộng điểm dương; 10 skill ngoài bảng (Tàng Hình, Khiên Phản Đòn, Song Kiếm, Sám Hối, Phúc Lành, Truyền Cảm Hứng, Bạch Ngọc Chữa Lành, Ủy Thác, Bẻ Cong Thời Gian, Thiên Tử) giữ luồng "Sử Dụng" thủ công cũ; giáo viên bấm Dùng/Không thay học sinh. Chi tiết: logic `src/domain/skills.ts`; Lá Chắn làm tròn xuống (-floor(|a|/2)); Kim Bài ưu tiên hơn Lá Chắn; nhóm C chỉ áp cho điểm cộng/trừ thủ công/cá nhân; nút Cứu viện hiện cho em có lần trừ điểm hôm nay khi lớp có em còn Hộ Tống; hộp hỏi sau Random ở `RandomSkillsPanel`; nút nhóm D ở `SkillActions`. Mỗi lần dùng ghi lịch sử `[Skill] <tên>: ... (n/2)`. Sửa lỗi phát hiện khi test: bước tự +2 của Vòng Quay Tự Tin từng ghi đè lượt Né Trực Diện vừa dùng. Kiểm chứng tự động: typecheck 0 lỗi, 221 test, build OK, smoke 32/32. Chưa kiểm chứng: trình duyệt thật (sandbox không có ảnh Pokémon).

Loading DictaLearn: xem `docs/reference/dictalearn-splash.md` (logo + zoom/fade, thanh chạy, boot splash tĩnh trong `index.html` để không nháy; dùng chung cho đăng nhập và khi vào lớp).

---

## Phase 12 - Cổng học sinh v3 và dọn Hồ sơ Trainer (chỉ 12C có migration)

Nhánh: `claude/phase12-student-portal`. Quyết định: D41-D45. Không mở rộng phạm vi ngoài các bước dưới.

- [x] 12A Nav học sinh 4 mục (Hồ sơ, Pokémon, Bạn bè, Cửa hàng); avatar mở modal Đăng xuất/Huỷ; chấm đỏ lời mời trên Bạn bè + thẻ "Có N lời mời" (Chấp nhận/Từ chối) ở đầu Hồ sơ (nâng state bạn bè lên cổng học sinh). Không đổi DB
- [x] 12B Trang Pokémon của học sinh (đồng hành + skill, bộ sưu tập, Đổi đồng hành/hỗ trợ, trứng đang ấp); Hồ sơ bớt khối tương ứng; Cửa hàng: skill dạng danh sách một cột, bấm bung chi tiết + nút Mua ngay dưới skill (D43). Không đổi DB
- [x] 12C Học sinh tự Hợp nhất Pokémon: hàm DB mới dùng đúng luật hợp nhất của giáo viên (tái dùng logic `src/domain/`), có migration + rollback + test `npm run test:db`. **Chờ Harry duyệt trước khi chạy trên Supabase thật**
- [x] 12D Hồ sơ Trainer (giáo viên): hai tab Hồ sơ / Pokémon, dùng chung component với 12B, bỏ ba panel bị lặp (Kho trứng, Thám hiểm, Rương tuần), dọn từ vựng cũ ("công trạng", "Biên Niên Sử", "Adventure Journal"). Không đổi DB

**12A xong 2026-10-28 (nhánh `claude/phase12-student-portal`, chưa commit, không đụng Supabase).** Nav học sinh: Hồ sơ / Pokémon / Bạn bè / Cửa hàng; avatar mở hộp "Đăng xuất?" (Ở lại / Đăng xuất); chấm đỏ có số lời mời trên Bạn bè và thẻ lời mời (Đồng ý / Từ chối) ở đầu Hồ sơ, dùng chung state bạn bè do cổng học sinh giữ (`useStudentSocial` nâng lên `StudentProfileScreen`). Tạm thời trang Pokémon chứa Pokémon đồng hành + bộ sưu tập (đã chuyển khỏi Hồ sơ); Đổi đồng hành/hỗ trợ và trứng chuyển sang trang này ở 12B. Avatar nay có tên truy cập "Tài khoản của em". Kiểm chứng (bản sao tạm, kho thật không bị chạm): typecheck 0 lỗi, vitest 221/221, smoke 35/35 (thêm 3 test: lời mời ở Hồ sơ + chấm đỏ, không có lời mời, hộp Đăng xuất), build OK. Chưa kiểm chứng trên trình duyệt thật hay Supabase thật.

**12B xong 2026-10-28 (cùng nhánh, chưa commit, không đụng Supabase).** Trang Pokémon của học sinh (`StudentPokemon.tsx`): Pokémon đồng hành + skill (bấm đọc công dụng) và một thẻ "Bộ sưu tập" gộp luôn Đổi đồng hành/hỗ trợ (bỏ thẻ "Đổi Pokémon" riêng và `CollectionGrid` để khỏi lặp). Đổi vẫn miễn phí và chỉ khi lớp bật Cửa hàng (luật 10B): đóng thì hiện một dòng giải thích và ẩn nút; đang ấp trứng thì khoá "Làm đồng hành". Cửa hàng: Đổi Pokémon đã bỏ; skill thành danh sách một cột, bấm thì chi tiết + nút Mua + hộp xác nhận bung ngay dưới đúng skill đó, bấm skill khác thì skill cũ thu lại (D43). Hồ sơ giữ danh tính + Trainer Level + lịch sử/huy hiệu + thẻ lời mời. Kiểm chứng (bản sao tạm): typecheck 0 lỗi, vitest 221/221, smoke 36/36 (thêm 1 test trang Pokémon khi Cửa hàng đóng; test Cửa hàng kiểm vị trí chi tiết skill dưới dòng; test Gỡ bạn bè của giáo viên đổi sang `expect.poll` vì lần chạy đầy đủ có một lần chớp lỗi do kiểm ngay sau khi bấm; không liên quan 12B), build OK. Chưa kiểm chứng trên trình duyệt thật hay Supabase thật.

**12C xong 2026-10-28 (cùng nhánh, migration CHƯA chạy trên Supabase thật, chờ Harry duyệt).** Migration `supabase/migrations/20261103100000_phase12_student_fusion.sql` (hoàn tác: `supabase/rollback/20261103100000_phase12_student_fusion_down.sql`; chạy lại được): hàm `student_fuse_pets(text[])` (security definer, chỉ học sinh đang hoạt động, khoá dòng, tăng revision) + hai hàm phụ nội bộ `shop_pet_level`, `shop_total_xp_for_level` (khớp công thức cấp/XP của app). Luật như app giáo viên: đúng 2 Pokémon khác nhau (kể cả đồng hành) -> 1 Pokémon loài ngẫu nhiên làm đồng hành; cấp = trung bình làm tròn xuống (1..30); XP/bond/charge/mastery về 0; shiny chỉ khi cả hai shiny; skill còn hiệu lực (đã dùng < 2 lượt) được giữ, trùng thì lấy số lượt ít hơn; Pokémon hỗ trợ bị gỡ nếu bị hợp nhất; Pokémon đồng hành cũ không tham gia thì về bộ sưu tập. Khác app giáo viên: loại (types) không gộp vì app luôn tính lại theo loài. Giao diện: thẻ "Hợp nhất Pokémon" ở trang Pokémon (chọn đúng 2, hộp xác nhận nói rõ không quay lại được; khoá có giải thích khi Cửa hàng đóng, đang ấp trứng hoặc dưới 2 Pokémon); thú hợp nhất hiển thị "Hợp Thể <loài>" qua cờ `isFusion` (thêm vào kiểu `PokemonPet` và `getPokemonDisplayName`; biệt danh vẫn được ưu tiên). Kiểm chứng (bản sao tạm + PostgreSQL 16 cục bộ, không chạm Supabase thật): `npm run test:db` OK cả hai chế độ Supabase (cũ/mới), gồm chạy migration 2 lần, test 80 (quyền, lớp đóng, đầu vào sai, đang ấp, cấp/XP, skill, shiny, hỗ trợ, đồng hành cũ, giáo viên/anon bị chặn, sổ cái không phát sinh, revision), hoàn tác và chạy lại; typecheck 0 lỗi; vitest 225/225; smoke 38/38 (thêm 2 test Hợp nhất); build OK. Chưa kiểm chứng: Supabase thật, trình duyệt thật. **Việc Harry cần làm:** duyệt, rồi chạy migration này trên Supabase thật (SQL Editor), sau đó mới bật dùng.

**12D xong 2026-10-28 (cùng nhánh, chưa commit, không đụng Supabase).** Hồ sơ Trainer (giáo viên) còn hai tab Hồ sơ / Pokémon (`role="tablist"`). Tab Pokémon: đồng hành hoặc trứng đang ấp, rồi Kho trứng, Thám hiểm, Rương tuần (mỗi panel hiện đúng một lần, trước đây lặp ở cả màn "ấp trứng" và màn "có Pokémon"), rồi khu Hợp nhất (`ProfileFusionSection`, đổi tên từ `ProfileFusionTab`; vào tab thì xoá lựa chọn cũ). Dọn từ vựng: "Tiểu sử & công trạng" -> "Hồ sơ"; "Linh thú hộ mệnh"/"Ấp trứng Pokémon" -> "Pokémon"; "Unlocked Titles" -> "Danh hiệu đã mở"; "Gym Badges" -> "Huy hiệu"; "Adventure Journal" -> "Nhật ký phiêu lưu"; "Biên Niên Sử" -> "Lịch sử điểm"; "Egg Inventory/Pokémon Expedition/Weekly Chest" -> "Kho trứng/Thám hiểm Pokémon/Rương tuần"; "Tài chính của bạn" -> "Hào Quang hiện có"; thông báo "Đã lưu ý chỉ!" -> "Đã lưu thông tin học sinh."; bỏ chữ "cấp bậc". Chưa đổi: tên "Weekly Chest" và "Normal/Special Fragment" trong thông báo logic (`src/domain/progression.ts`, có test), để dành khi dọn thuật ngữ. **Khác kế hoạch:** chưa dùng chung component với cổng học sinh (hai bên dùng kiểu dữ liệu khác nhau: `Student` đầy đủ so với hồ sơ chỉ xem của học sinh); hai bên giống nhau về cấu trúc/tên tab, việc gộp component để dành nếu cần. Ảnh gốc smoke đổi có chủ đích: `14-profile-info` và `15-profile-pet` (đã đối chiếu diff: chỉ đổi thanh tab, chữ tiêu đề, vị trí panel); `16-profile-fusion` đã xoá vì màn Hợp nhất không còn là tab riêng. Kiểm chứng (bản sao tạm): typecheck 0 lỗi, vitest 225/225, smoke 38/38, build OK. Chưa kiểm chứng trên trình duyệt thật.

**Phase 12 tổng kết:** 12A, 12B đã commit; 12C, 12D chưa commit. Việc Harry cần làm: xem thử preview, commit 12C/12D, duyệt rồi chạy migration `20261103100000_phase12_student_fusion.sql` trên Supabase thật. Sau đó: Phase 11 đã xong; ý tưởng tính năng dùng trên lớp để brainstorm riêng.

Thứ tự: 12A, 12B, 12C, 12D (12B trước 12D để dùng chung component; 12C tách riêng vì là bước duy nhất đụng schema). Mọi màn học sinh responsive 390/820/1440px (D22). Phase 11 đã xong; ý tưởng tính năng dùng trên lớp (giáo viên) để brainstorm riêng, chưa vào kế hoạch.

## Đề xuất phát sinh (chờ Harry duyệt)

- ~~Có cần vai trò phụ huynh (xem điểm con) không?~~ → Harry: **không** (D13, 2026-10-28).
- ~~Đổi tên hồ sơ còn mang tên mặc định cũ "Học sĩ triều đình" thành "Trainer"~~ → Harry duyệt (D13); **đã viết** `supabase/migrations/20261028130000_rename_legacy_display_names.sql` (chỉ đổi tên mặc định cũ, tên tự đặt giữ nguyên; có test) + app coi tên cũ trong thông tin đăng ký là chưa đặt tên (`src/domain/displayName.ts`, có test) để đăng nhập lại không ghi tên cũ trở lại. **Chờ Harry chạy trên production.**
- ~~**[Lỗi game]** Cá Ngựa: bị Quái vật giữ, lắc 6 vẫn bị kẹt~~ → Harry duyệt sửa, **đã sửa 2026-10-26** (`checkMonsterEscape` trong `src/domain/ludo.ts`, có test).
- ~~**[Lỗi có sẵn]** Danh sách cấp bậc rỗng làm trắng trang~~ → giải quyết bằng việc bỏ hệ cấp bậc (D7, task 2.0).
- ~~**[Chất lượng mã]** Cài `@types/react`~~ → Harry duyệt, **đã làm 2026-10-26**: cài `@types/react`, `@types/react-dom`, thêm `src/vite-env.d.ts`, sửa lỗi kiểu còn lại; `npm run typecheck` = 0 lỗi.
- ~~**[Lỗi có sẵn, dữ liệu]** Trước khi đăng nhập xong, app ghi `[]` đè bản lưu học sinh trên máy~~ → Harry duyệt, **đã sửa 2026-10-27** (`useLocalPersistence.ts` chỉ ghi khi `!authLoading`; smoke test nhóm 6 kiểm tra học sinh trên máy được đẩy lên đám mây ở lần đăng nhập đầu; bỏ bản sửa thì test đỏ).
- ~~**[Giao diện, gộp vào 2.4]** Thông báo "Pokémon phản ứng" phủ một lớp trong suốt lên toàn màn hình: bấm vào bất kỳ đâu (kể cả nút "Lắc xí ngầu" ở Cá Ngựa) chỉ để tắt thông báo, phải bấm lần nữa. Phát hiện khi smoke test chạy với CSS thật. Đề xuất khi reskin: thông báo không chặn thao tác bên dưới.~~ → **đã sửa** (toast nổi ở đầu trang, không phủ lớp chặn).
- ~~**[Giao diện, nhỏ]** Hiệu ứng làm mờ khi rê chuột trên thẻ học sinh có thể bị "kẹt"~~ → **đã bỏ hiệu ứng làm mờ** khi reskin thẻ học sinh (2026-10-27).
- ~~**[Truy cập, gộp vào 2.4]** Thẻ học sinh bấm được bằng chuột nhưng chưa vào được bằng phím Tab (là `div` có `onClick`). Đề xuất đổi sang nút/đường dẫn thật khi rà `accessibility-review`.~~ → **đã sửa 2026-10-27**: thẻ có `role="button"`, `tabIndex=0`, Enter/Space để mở.

- ~~**[Bảo mật]** Dự án Supabase gốc còn hai bảng cũ thời Imperial School: `app_state`, `users` (0 dòng, app không dùng), có thể chưa bật RLS.~~ → Harry duyệt 2026-10-28; **đã viết** `supabase/migrations/20261028120000_lock_legacy_tables.sql` (bật RLS không policy + thu quyền API, không xoá; có test và file hoàn tác). **Harry đã chạy trên production, kiểm tra `relrowsecurity = true` cho cả hai bảng (2026-10-28).** Xoá hẳn hai bảng (và `students_imperial_old`) để Phase 7 nếu Harry muốn.

## Quy trình sau mỗi Phase

1. Chạy kiểm thử trong phạm vi có thể (`npm test`, `npm run build`, kiểm tra thủ công nếu cần).
2. Cập nhật `PLAN.md` (tick task, ghi ngày, kết quả kiểm chứng) và `CLASSIVY-BRIEF.md`.
3. Báo cáo cho Harry, gồm: đã làm gì; chưa kiểm chứng gì; **migration nào cần chạy** (tên file, thứ tự, chạy ở dev hay production); Harry cần làm gì; quyết định còn mở; Phase tiếp theo làm gì.
4. Không coi thay đổi là đã áp dụng trên Supabase/Vercel thật cho đến khi Harry xác nhận.

## Nhật ký kiểm chứng

**Phase 0 - 2026-10-26** (kiểm thử tự động, trên bản sao tạm, chưa chạy trên Vercel/Supabase thật):
- `npm ci`: thành công.
- `npm test`: 3 file test, 28 test đạt.
- `npm run build`: thành công (507 module); chỉ còn cảnh báo chunk lớn đã biết (~1,34 MB).
- Chưa kiểm tra bằng mắt trên trình duyệt: tiêu đề tab "Classivy" và favicon mới (cần Harry xem khi chạy `npm run dev`).
- Không có thay đổi nào trên Supabase hay Vercel.

**Phase 1 / S2 - 2026-10-26** (kiểm thử tự động trên máy ảo; chưa thử tay, chưa chạy trên Vercel/Supabase thật):
- `npm test`: 7 file test, 48 test đạt (thêm 20 test cho ngày/tuần, trứng, thời tiết, số ngẫu nhiên, `isBossEncounterFrequency`).
- `npm run build`: thành công (513 module); vẫn chỉ cảnh báo chunk lớn đã biết.
- `tsc --noEmit`: không thêm lỗi mới (các lỗi kiểu cũ trong `App.tsx`, `gameEvents.ts`, `supabaseClient.ts` có từ trước, không thuộc S2).
- Smoke test tạm bằng Playwright (script nằm ngoài repo, chưa phải S0): phiên đăng nhập giả, chặn mạng Supabase. So văn bản hiển thị trước/sau của màn đăng nhập, đăng ký, Plaza, Lớp học, Cài đặt, bật/tắt một khối cài đặt: giống hệt; ảnh chụp chỉ khác ở đồng hồ. 0 lỗi console. Chưa phủ: các modal, dữ liệu học sinh thật, Tailwind CDN (bị chặn mạng nên ảnh không có style).

**Phase 1 - 2026-10-26** (kiểm thử tự động trên máy ảo; chưa thử tay; chưa chạy trên Vercel/Supabase thật):
- `npm test`: 13 file, 94 test đạt (thêm test cho điểm, điểm danh, bài tập, battle, Cá Ngựa, tiến trình, bộ sưu tập Pokémon, Vòng quay, Boss, định tuyến).
- `npm run build`: thành công, không còn cảnh báo chunk lớn (chunk chính ~499 kB).
- `tsc --noEmit`: đúng bộ lỗi cũ có từ trước (so từng thông báo), không thêm lỗi mới.
- `npm run smoke`: 5 nhóm test đạt. 4 nhóm so với ảnh gốc tạo từ code TRƯỚC khi tách (cùng dữ liệu mẫu, giờ cố định, số ngẫu nhiên có seed): DOM giống hệt ở đăng nhập, đăng ký, Lớp, Plaza, Cài đặt (mở hết các khối), Hồ sơ 3 tab, Random, Cá Ngựa, Vòng quay, Shop, Chia nhóm, Hẹn giờ, Điểm danh, Bài tập, Tặng Pokémon, Tài khoản, bảng điểm; dữ liệu đồng bộ lên "đám mây" giống hệt sau: cộng điểm, điểm danh, bài tập, Random solo -> Cá Ngựa -> lắc, Battle, Shop, Tặng Pokémon, Vòng quay, đổi tần suất Boss. Nhóm 5 kiểm tra URL: tải lại ở từng đường dẫn, Back/Forward, đường dẫn lạ.
- Smoke test không phủ: Boss Raid đủ 5 người, Pokémon về 0 HP và màn rời đi, hợp nhất, dùng skill, nhập/xuất JSON, sao lưu/khôi phục, đăng ký/đăng nhập thật, Google login, đồng bộ giữa 2 trình duyệt, Tailwind CDN (bị chặn trong máy ảo nên không so được màu/bố cục). Các mục này nằm trong checklist S16 của Harry.
- Không có thay đổi nào trên Supabase hay Vercel. Không có migration.

**Sau Phase 1 - 2026-10-26** (theo duyệt của Harry; kiểm thử tự động, chưa thử tay, chưa chạy trên Vercel/Supabase thật):
- Sửa lỗi Cá Ngựa lắc 6 vẫn bị Quái vật giữ; cài `@types/react`/`@types/react-dom`, sửa lỗi kiểu (`npm run typecheck`: 0 lỗi, trước đó ~20 lỗi); xoá `.sync-out.tgz`.
- `npm test`: 13 file, 97 test đạt. `npm run build`: thành công. `npm run smoke`: 5/5 đạt (ảnh gốc không đổi vì luồng thử không đi vào ô Quái vật).
- Thử nhập file sao lưu cũ (2026-10-27, kiểm thử tự động, Supabase giả): xuất JSON từ code trước nhánh (`253253c`) rồi nhập vào code mới: thành công, 12/12 học sinh đúng điểm/Pokémon/trứng, không lỗi; dùng bảng điểm và hồ sơ sau khi nhập vẫn bình thường. Chưa thử với file sao lưu thật của Harry.
- Trang riêng theo lớp (D8, 2026-10-27, kiểm thử tự động): `npm run typecheck` 0 lỗi; `npm test` 100 test đạt; `npm run build` thành công, không cảnh báo; `npm run smoke` 5/5 đạt hai lần liên tiếp, test định tuyến 6/6 lần lặp. Ảnh chụp dữ liệu đám mây sau mọi luồng không đổi. Ảnh giao diện cập nhật có chủ đích: trang chọn lớp mới, chữ "← Danh sách lớp" trong ô chọn lớp, trang con không còn vẽ lưới học sinh phía sau, danh sách tick ở Vòng quay (đã đối chiếu: ngoài các chỗ này không có dòng mới). Chưa thử tay.
- Nghiệm thu S16 (2026-10-27): Harry thử thủ công trên bản preview Vercel của nhánh và đồng ý; gộp vào `main`. Không có migration, không thay đổi Supabase.

**Phase 2 / task 2.0 - 2026-10-27** (kiểm thử tự động trên máy ảo; chưa thử tay; chưa chạy trên Vercel/Supabase thật):
- Đã bỏ: `RankInfo`, `getRank`, `DEFAULT_RANKS_*`, khoá `imperial_ranks_*`, state `ranksMale`/`ranksFemale`, `handleAvatarUpload`, `rankChanges`, hộp "Thánh chỉ" (`EdictModal`, state `edict`), `lib/geminiService.ts`, gói `@google/genai`, `GEMINI_API_KEY` (README, `vite.config.ts`, cấu hình Playwright).
- Bảng Ban thưởng/Phạt: thay 3 ô cấp bậc bằng khung Trainer Level (cấp, danh hiệu, thanh XP, "Trainer XP a/b") giống thẻ học sinh.
- App thôi đọc/ghi `ranks_male`/`ranks_female` (giá trị cũ trên Supabase để nguyên; xoá cột ở Phase 3). Nhập file sao lưu đi qua `domain/backup.ts` (`pickBackupFields`) chỉ lấy trường còn dùng; test với `fixtures/sample-class.json` (có phần cấp bậc): nhập được, bỏ đúng phần cấp bậc.
- `npm run typecheck`: 0 lỗi. `npm test`: 14 file, 103 test đạt (bỏ 1 test cấp bậc, thêm 4 test sao lưu). `npm run build`: thành công, không cảnh báo (chunk chính ~470 kB).
- `npm run smoke`: lần đầu 2 nhóm đỏ đúng chỗ dự kiến; cập nhật ảnh gốc có chủ đích. Đã đối chiếu diff: `30-skill-modal.html` chỉ đổi khung bên trái (Trainer Level thay 3 ô cấp bậc); 10 file dữ liệu đám mây chỉ MẤT hai trường `ranks_male`/`ranks_female`, không thêm/đổi dòng nào khác. Chạy lại: 5/5 đạt.

**Phase 2 / task 2.7 - 2026-10-27** (kiểm thử tự động trên máy ảo; chưa thử tay; chưa chạy trên Vercel/Supabase thật):
- 11 khoá `imperial_*` đổi thành `classivy_*` (danh sách ở `LEGACY_STORAGE_KEYS`, `src/data/constants.ts`). Ba khoá âm thanh trước đây viết thẳng chuỗi nay dùng hằng số. Khoá không có tiền tố `imperial_` (`custom_ludo_tiles`, `trainer_weather_*`) giữ nguyên.
- `domain/storageMigration.ts` chạy một lần trong `src/main.tsx` trước khi render: chỉ chép khi khoá mới trống, không xoá khoá cũ, ghi cờ `classivy_storage_migrated_v1`, không làm sập app nếu trình duyệt chặn localStorage. 6 unit test.
- Smoke test mới (nhóm 6): máy có khoá cũ, đám mây trống -> lần đăng nhập đầu đẩy đúng tần suất Boss và phần thưởng Vòng quay đọc từ khoá cũ; khoá cũ còn nguyên. Đã thử tắt đoạn chuyển: test đỏ đúng chỗ (nhận `occasional` thay vì `rare`).
- `npm run typecheck` 0 lỗi; `npm test` 15 file, 109 test đạt; `npm run build` thành công; `npm run smoke` 6/6 đạt, ảnh gốc 5 nhóm cũ không đổi.

**Phase 2 / sửa lỗi bản lưu máy + task 2.5, 2.8 - 2026-10-27** (kiểm thử tự động; chưa thử tay; chưa chạy trên Vercel/Supabase thật):
- `useLocalPersistence.ts`: chỉ ghi học sinh/kỹ năng/Boss vào máy khi đã biết trạng thái đăng nhập. Smoke nhóm 6 mở rộng: học sinh và kỹ năng ở khoá cũ được đẩy lên đám mây ở lần đăng nhập đầu; dùng lại code cũ thì test đỏ.
- "Học sĩ" -> "Trainer" (D9). `npm run smoke -- --update-snapshots`: 14 file ảnh gốc đổi, đã đối chiếu: mọi dòng đổi chỉ là 2 mô tả kỹ năng chứa chữ "Học sĩ".
- `npm run typecheck` 0 lỗi; `npm test` 109 test đạt; `npm run build` thành công; `npm run smoke` 6/6 đạt.

**Phase 2 / task 2.2 - 2026-10-27** (kiểm thử tự động; chưa thử tay; chưa chạy trên Vercel thật):
- Bỏ `<script src="https://cdn.tailwindcss.com">`; Tailwind 3.4.19 build cùng Vite (`tailwind.config.js`, `postcss.config.js`, `@tailwind` ở cuối `src/index.css` để giữ thứ tự ưu tiên như khi CDN chèn style vào cuối `<head>`). File CSS ~119 kB (gzip ~17 kB).
- Không so được pixel với bản CDN vì CDN bị chặn trong máy ảo; trước đây smoke test cũng chạy không có CSS. Nay smoke test chạy với CSS thật: DOM và dữ liệu đồng bộ của cả 6 nhóm khớp ảnh gốc, KHÔNG phải cập nhật ảnh gốc. Hai chỗ test phải thao tác giống người dùng hơn: rê chuột vào thanh điều hướng bên trái trước khi bấm (thanh này ẩn ngoài mép màn hình), và nút "Lắc xí ngầu" bị thông báo Pokémon che (ghi ở "Đề xuất phát sinh").
- Thêm `SMOKE_SCREENSHOTS=1 npm run smoke` để lưu ảnh chụp từng màn vào `test-results/screens/` (không so sánh, không commit). Đã xem ảnh trang lớp, Ban thưởng/Phạt, Cá Ngựa: đủ màu, bố cục đúng.
- `npm run typecheck` 0 lỗi; `npm test` 109 đạt; `npm run build` thành công; `npm run smoke` 6/6 đạt hai lần liên tiếp.
- Cần Harry: mở bản preview Vercel của nhánh, so nhanh với bản đang chạy (màu, bố cục, hộp thoại) vì máy ảo không so được với CDN.

**Phase 2 / task 2.1, 2.3, bản mẫu 2.4 - 2026-10-27** (kiểm thử tự động + xem ảnh chụp trên máy ảo; chưa thử tay; chưa chạy trên Vercel thật):
- Thêm `PRODUCT.md`, cập nhật `DESIGN.md` (chính thức), `src/components/ui/`, `src/components/ClassDock.tsx` (thay `LiquidDock`), gói `lucide-react` (icon, MIT, miễn phí). Bỏ CSS "liquid glass".
- Tương phản đo bằng công thức WCAG cho 20 cặp chữ/nền đã dùng: tất cả đạt AA sau khi sửa 3 cặp (chữ trứng, nhãn "Hào Quang", chữ gợi ý ô tìm kiếm).
- `npm run typecheck` 0 lỗi; `npm test` 109 đạt; `npm run build` thành công; `npm run smoke` 6/6 đạt hai lần. Ảnh gốc DOM cập nhật có chủ đích (32 file .html: thay đổi giao diện); **12 file dữ liệu đám mây không đổi** = mọi luồng thao tác giữ nguyên kết quả. Test đổi 2 bộ chọn: dock theo `role="toolbar"`, nút cộng điểm theo tên "Cộng điểm ...".
- Đã xem ảnh chụp: trang chọn lớp, trang lớp, trạng thái rê chuột (nút vắng/cộng/trừ), chế độ chọn nhiều (dock đủ nút Phản hồi/Xóa sau khi sửa lỗi bị cắt). Trong máy ảo không tải được Google Fonts và ảnh đại diện (bị chặn mạng) nên chữ trong ảnh chụp là phông dự phòng.

**Phase 2 / reskin đợt 1 - 2026-10-27** (kiểm thử tự động cục bộ; chưa thử tay/preview Vercel):
- Theo Harry duyệt: khung Cài đặt, Hồ sơ, đăng nhập/đăng ký, Tài khoản giáo viên, Chia nhóm và Hẹn giờ đổi sang token Classivy; tái sử dụng `Modal`, `Button`, `Card`, `Chip`. Không thay đổi state, luồng đăng nhập, chia nhóm, hẹn giờ hay cấu trúc Supabase/localStorage.
- Dọn thuật ngữ dữ liệu mặc định theo quyết định đã chốt: `Ý Chỉ Đồng Hành` -> `Đồng Đội Hỗ Trợ`, hai phụ kiện hoàng gia thành `Áo Choàng Huyền Ảo` và `Vương Miện Nhà Vô Địch`, mô tả "hào quang hoàng tộc" thành "hào quang rực rỡ". `petSkills` từng giáo viên đã lưu không bị ghi đè.
- `npm run typecheck`: đạt. `npm test`: 106/106 đạt ở lần chạy lại; lần đầu có 1 test nở trứng flaky do Pokémon shiny ngẫu nhiên, không liên quan thay đổi này. `npm run build`: đạt.
- Snapshot smoke đã cập nhật có chủ đích cho đăng nhập/đăng ký, Cài đặt, ba tab Hồ sơ, Chia nhóm, Hẹn giờ, Tài khoản và các snapshot dữ liệu cloud có thay đổi `sk_decree`. Nhóm "các màn hình chính" đã chạy xanh riêng sau khi đổi bộ chọn từ `Trainer Settings` sang `Cài đặt lớp học`; nhóm modal kết thúc không có `error-context`. Nên chạy lại đủ 6/6 smoke trên preview/CI trước khi gộp. Không migration, không deploy.

**Phase 2 / làm sạch Imperial ở đăng nhập, Cài đặt, Hồ sơ - 2026-10-27:**
- Theo Harry duyệt: form đăng nhập chỉ còn email + mật khẩu. Bỏ UI tạo tài khoản và nút Google; code đăng ký/Google trong `AuthContext` giữ lại cho Phase 4, chỉ không còn lối vào trên giao diện giáo viên hiện tại.
- Đổi primary đỏ còn lồng sâu trong Cài đặt/Hồ sơ thành `brand-forest`; phần xoá/cảnh báo vẫn đỏ vì là trạng thái nguy hiểm có nghĩa. Các heading `font-royal` trong bề mặt Hồ sơ được thay bằng Plus Jakarta Sans/Be Vietnam Pro theo `DESIGN.md`.
- Cập nhật smoke test: bỏ snapshot `02-register.html` và không còn thao tác tạo tài khoản; cập nhật snapshot đăng nhập, Cài đặt và ba tab Hồ sơ. `npm run typecheck`, `npm test` (106/106) và `npm run build` đạt.

**Phase 2 / Điểm danh và Bài tập - 2026-10-27:**
- Reskin `AttendanceCheckModal` và `HomeworkCheckModal` bằng Modal/Button/Chip dùng chung. Đổi copy tiếng Anh còn sót sang tiếng Việt, giữ nguyên cách chọn trạng thái, số đã chốt và hành động ghi điểm.
- Cập nhật snapshot `26-attendance.html` và `27-homework.html`. `npm run typecheck` đạt; cần chạy lại toàn bộ test/build/smoke ở cuối cụm.

**Phase 2 / modal game còn lại - 2026-10-27:**
- Đồng bộ lớp phủ của Random/Battle/Boss, Cá Ngựa, Vòng quay, Shop, Tặng Pokémon, Ấp trứng, Pokémon rời đội hình và Skill Points sang nền `forest-deep`; thay serif `font-royal` trong các modal game bằng font Classivy; các primary đỏ cũ chuyển thành `forest`, giữ đỏ cho trạng thái nguy hiểm.
- `LevelUpModal` và `BossDefeatedModal` đã được chuyển sang Modal/Card/Button dùng chung. `npm run typecheck`, `npm test` (106/106) và `npm run build` đạt. Chạy `npm run smoke -- --update-snapshots` đã bắt đầu cập nhật snapshot (`20-random`); cần chạy/đối chiếu lại đầy đủ 6 nhóm trước khi chốt Phase 2.

**Phase 2 / vòng tương phản, Random và Tặng Pokémon - 2026-10-27:**
- Thiết kế lại `GiftPokemonModal`: tách rõ danh sách học sinh và vùng quà, nền kem/trắng, chữ `brand-ink` dễ đọc, CTA xanh rừng; lúc trứng nở và nhận quà vẫn sinh động nhưng chỉ dùng các màu Classivy. Không thay đổi thao tác chọn học sinh, nở trứng hay dữ liệu Pokémon.
- `RandomModal` (Solo/Battle/Boss) đổi các CTA đỏ không mang nghĩa nguy hiểm thành xanh rừng hoặc vàng; heading và nội dung phụ dùng token có độ tương phản cao. Nút trừ điểm Battle vẫn đỏ để giữ nghĩa trừ điểm. Các CTA đỏ còn lại trong Settings/Hồ sơ (tải CSV, mua trứng thường, kích hoạt skill) cũng đã đổi sang `brand-forest`; đỏ còn lại là trạng thái cảnh báo/sự kiện bị đá.
- Typography: chỉ nạp **Plus Jakarta Sans** (chính) và **Be Vietnam Pro** (fallback). `font-royal` là lớp tương thích, hiện cũng ánh xạ về font Classivy; đã bỏ cả ba chỗ `font-[Inter]` không được nạp trong Profile. `Arial` chỉ nằm trong SVG xuất ảnh tiến trình, không phải UI.
- Kiểm chứng sau đợt này: `npm run typecheck`, `npm test` (106/106), `npm run build` đều đạt. Snapshot có chủ đích cho `13-settings-expanded`, `15-profile-pet`, `20-random`, `28-gift-pokemon` đã cập nhật. Lần chạy full smoke trong môi trường agent bị `net::ERR_CONNECTION_REFUSED` ở preview server 5179 sau test đầu tiên, nên **chưa được coi là 6/6 pass**; chạy lại ở terminal/CI sạch và đối chiếu preview trước khi đánh dấu phát hành Phase 2. Không migration, không deploy.

**Phase 2 / rà soát sau Codex - 2026-10-27** (kiểm thử tự động trên máy ảo, có tải Google Fonts thật để chụp ảnh; chưa thử tay, chưa chạy trên Vercel/Supabase thật):
- Phát hiện: (1) smoke test **đỏ** - ảnh gốc `30-skill-modal` chưa cập nhật, và nhóm "luồng thao tác" vẫn tìm nút `Confirm Attendance`/`Confirm Homework` đã đổi tên thành "Chốt điểm danh"/"Chốt bài tập" nên toàn bộ luồng điểm, điểm danh, bài tập, Random, Cá Ngựa, Battle, Shop, Tặng Pokémon, Vòng quay chưa được kiểm lại sau khi Codex sửa; (2) lớp CSS `.classivy-reskin`/`.classivy-game-modal` ép mọi nút có `bg-red-*` thành xanh bằng `!important`, làm nút **-1 (trừ điểm) trong Battle** thành xanh và nút xoá ô Cá Ngựa chuyển xanh khi rê chuột; (3) class `font-sans` (25 chỗ: đăng nhập, Tài khoản, Hồ sơ, Cài đặt, Shop) rơi về phông hệ thống vì Tailwind chưa trỏ `sans` về phông Classivy; (4) `bg-white/88` không tồn tại trong Tailwind nên bảng Cá Ngựa mất nền trắng, tiêu đề "Battle Race Board" gần như vô hình; (5) các tiêu đề từng dùng `font-royal` bị mảnh hơn tiêu đề khác.
- Đã sửa: `fontFamily.sans` = Plus Jakarta Sans/Be Vietnam Pro (một nguồn duy nhất), bỏ CSS inline trong `index.html` (đưa vào `@layer base`), `lang="vi"`; bỏ hết `font-royal`, `font-sans` thừa, kiểu VIẾT HOA + giãn chữ (trừ chữ viết hoa sẵn trong nội dung), nâng cỡ chữ 7-11px lên 10-12px theo DESIGN.md; tiêu đề cũ thêm `font-extrabold`; gỡ lớp CSS ép màu; `bg-white/90`; tab Hồ sơ viết thường. Thêm: thẻ học sinh dùng được bằng bàn phím; `Modal` đưa focus vào hộp thoại, trả focus khi đóng, Esc chỉ đóng hộp trên cùng.
- `npm run typecheck` 0 lỗi; `npm test` 106/106; `npm run build` thành công; `npm run smoke` 6/6 đạt. Ảnh gốc DOM cập nhật có chủ đích; 8 file dữ liệu đám mây chỉ đổi đúng tên/mô tả kỹ năng `sk_decree` (Đồng Đội Hỗ Trợ, đã duyệt ở 2.5), ngoài ra giống hệt = hành vi giữ nguyên. Đã so ảnh chụp trước/sau ở đăng nhập, Hồ sơ, Cài đặt, Cá Ngựa, Random.
- Nợ kỹ thuật ghi nhận (không chặn Phase 2): vài file Codex viết JSX dồn một dòng rất dài (`GroupModal`, `TimerModal`, footer của `AttendanceCheckModal`/`HomeworkCheckModal`) - khó đọc, nên định dạng lại khi có dịp; còn nhiều màu Tailwind mặc định (amber, purple...) trong nội dung game sâu, chưa chuyển hết sang token.
- Nghiệm thu (2026-10-27): Harry thử thủ công bản preview Vercel của nhánh `claude/phase2-rebranding` và đồng ý; mở PR gộp vào `main`. Không có migration, không thay đổi Supabase.

**Phase 3 - 2026-10-27** (kiểm thử tự động trên máy của phiên Claude; CHƯA chạy trên Supabase dev/production, chưa thử tay trên preview):
- `npm run typecheck`: 0 lỗi.
- `npm test`: 16 file, 127 test đạt (thêm `cloudModel.test.ts`, `legacyImport.test.ts`: 21 test).
- `npm run build`: thành công.
- `npm run test:db` (PostgreSQL 16 cục bộ, `auth` giả lập): 60 kiểm tra đạt; migration chạy 2 lần, hoàn tác, chạy lại đều đạt. Thử làm hỏng policy đọc `students` -> test đỏ đúng chỗ.
- `npm run smoke`: 8/8 đạt. 6 test cũ (Supabase chưa chạy migration) giữ nguyên ảnh gốc DOM và dữ liệu đồng bộ -> hành vi cũ không đổi. 2 test mới: nâng cấp (chạy thử, tải sao lưu, đối chiếu, tổng sổ = điểm), sau đó cộng điểm chỉ gửi 1 học sinh + 1 dòng sổ, không ghi cột cũ, mở lại đọc từ bảng; giáo viên mới dùng bảng mới ngay. Thử bỏ phần "chỉ gửi thay đổi" -> test đỏ đúng chỗ.

**Phase 3 - 2026-10-28** (Harry chạy runbook bước 1 trên `classivy-dev`): bước 1.4c lỗi `permission denied for table profiles/user_settings` (42501). Nguyên nhân: dự án Supabase mới tạo không tự cấp quyền bảng cho vai trò `authenticated` như dự án cũ; `supabase-schema.sql` dựa vào việc tự cấp đó. Sửa: thêm `grant` rõ ràng vào `supabase-schema.sql` và migration Phase 3; `npm run test:db` giờ chạy cả hai kiểu dự án (cũ/mới), bỏ phần grant thì kiểu "mới" báo đúng lỗi này. Dữ liệu thật không bị ảnh hưởng (dự án gốc không đụng tới).
- 2026-10-28: Harry xác nhận runbook bước 1 trên `classivy-dev` chạy ổn (migration, nâng cấp, dùng thử). Đây là kiểm chứng thủ công trên dev; production chưa chạy.
- 2026-10-28: chạy migration trên production lỗi `42703: column "class_id" does not exist`, migration tự huỷ, không thay đổi gì (Harry kiểm tra: `data_model_version` chưa có). Nguyên nhân: dự án gốc còn bảng `public.students` cũ của Imperial School (0 dòng, cột `class_name`, `pet`...); `create table if not exists` bỏ qua nên bước tạo chỉ mục `class_id` lỗi. Sửa: migration thêm bước 0 đổi tên bảng cũ thành `students_imperial_old` (giữ dữ liệu, đổi tên chỉ mục, bật RLS, thu quyền API), dừng với thông báo rõ nếu `classes`/`point_ledger` có sẵn mà sai cấu trúc; file hoàn tác trả lại tên cũ. `npm run test:db` giờ mô phỏng bảng cũ này; bỏ bước 0 thì test báo đúng lỗi của Harry.
- 2026-10-28: Harry chạy migration Phase 3 (bản có bước 0) trên production, nâng cấp dữ liệu, xác nhận ổn -> **nghiệm thu Phase 3** (kiểm chứng thủ công trên production do Harry thực hiện). PR #3 đã gộp trước bản sửa bước 0 nên bản sửa + migration khoá `app_state`/`users` đi qua PR tiếp theo (nhánh `claude/phase3-followup`). `npm run test:db` (2 kiểu dự án, có mô phỏng bảng cũ của dự án gốc) đạt; bỏ phần khoá thì test đỏ đúng chỗ.
- 2026-10-28: Harry chạy `20261028120000_lock_legacy_tables.sql` trên production, câu kiểm tra trả `true` cho `app_state` và `users`. Thêm migration đổi tên hồ sơ mặc định cũ + `resolveDisplayName`: `npm test` 130/130, `npm run test:db` đạt (2 kiểu dự án), build đạt, `npm run smoke` 8/8.

**Phase 4 - 2026-10-28** (kiểm thử tự động trên máy của phiên Claude; CHƯA chạy trên Supabase dev/production, chưa thử tay trên preview, Edge Function chưa chạy trên Deno/Supabase thật):
- `npm run typecheck`: 0 lỗi. `npm test`: 20 file, 172 test đạt (thêm `studentAccount.test.ts` 17, `studentAccountsHandler.test.ts` 17, `accountView.test.ts` 8: tên đăng nhập/mật khẩu, kiểm tra yêu cầu, phân quyền giữa giáo viên, không ghi mật khẩu vào nhật ký, hoàn tác khi lỗi giữa chừng, che chi tiết lỗi). `npm run build`: thành công.
- `npm run test:db` (PostgreSQL 16, `auth` giả lập, cả kiểu dự án Supabase cũ và mới): đạt, gồm test Phase 4: client không ghi được `username`/`must_change_password`/`status`/`auth_user_id`; định dạng và duy nhất của `username`; nhật ký chỉ `service_role` ghi, giáo viên chỉ đọc của mình, bất biến kể cả quyền quản trị; hàm lần đăng nhập đầu; xoá học sinh xoá luôn người dùng Auth (và hồ sơ), ghi nhật ký, không bao giờ xoá tài khoản giáo viên; xoá tài khoản giáo viên xoá dây chuyền không lỗi; migration chạy 2 lần, hoàn tác, chạy lại. Test đã bắt một lỗi thật trong lúc viết (ghi nhật ký khi xoá dây chuyền vi phạm khoá ngoại): đã sửa bằng kiểm tra giáo viên còn tồn tại.
- `npm run smoke`: 11/11 đạt (3 test mới trong `tests/smoke/accounts.spec.ts`: trang tài khoản - lọc, xác nhận, tạo, thẻ đăng nhập, khoá, nhật ký; lỗi từ hàm; cổng học sinh - đổi mật khẩu lần đầu và không chạm dữ liệu giáo viên; thử gỡ chốt chặn học sinh trong `App.tsx` -> test đỏ). 19 ảnh gốc DOM cập nhật có chủ đích, đã đối chiếu từng dòng: chỉ khác nút mới "Tài khoản học sinh" (18 trang lớp) và ô đăng nhập "Email hoặc tên đăng nhập" (đăng nhập).
- **Chưa kiểm chứng (cần dev):** Supabase có chấp nhận email `@students.classivy.invalid`; `ban_duration` với phiên đang mở; trigger xoá `auth.users` từ `public` đúng quyền; bản in thẻ trên máy in thật; giao diện trên điện thoại; triển khai CLI (`supabase/config.toml` tối thiểu mới được thêm, chưa chạy `functions deploy`).
- Thay đổi nhỏ ngoài task: tin nhắn xác nhận xoá học sinh nói rõ xoá cả tài khoản và sổ điểm; `tsconfig.json` loại `supabase/functions/**/index.ts` (mã Deno) khỏi typecheck.
- 2026-10-28: Harry báo đã làm runbook Phase 4 tới bước 2.4 (migration + triển khai hàm trên production; trước đó gặp và sửa lỗi thiếu quyền `service_role` đọc `profiles`, đã đưa vào migration). Harry yêu cầu gộp nhánh. **Chưa có xác nhận kết quả thử ở 2.5** (tạo/đăng nhập/thu hồi một học sinh thử trên production) và 3 mục "ghi lại" ở bước 1.5, nên Phase 4 chưa được ghi là nghiệm thu.

**Phase 5 - 2026-10-28** (kiểm thử tự động trên máy của phiên Claude; CHƯA chạy trên Supabase dev/production, chưa thử tay trên điện thoại thật):
- `npm run typecheck`: 0 lỗi. `npm test`: 21 file, 182 test đạt (thêm `studentPortal.test.ts` 10: đọc gói dữ liệu, bỏ huy hiệu/Pokémon hỏng, lịch sử mới nhất trước, trạng thái khoá/chưa gắn, dữ liệu sai dạng). `npm run build`: thành công.
- `npm run test:db` (PostgreSQL 16, `auth` giả, cả kiểu dự án cũ và mới): đạt, thêm `supabase/tests/30_phase5_portal.test.sql` (dữ liệu của mình, danh sách khoá cho phép, trứng không lộ `assignedDexId`, không có `teacher_id`/tên đăng nhập, lịch sử tối đa 30 và bỏ số dư đầu kỳ, không thấy lịch sử bạn khác, học sinh vẫn đọc 0 dòng ở bảng, khoá chỉ trả trạng thái, chưa gắn/không phải học sinh, ẩn danh bị chặn); migration chạy 2 lần, hoàn tác, chạy lại. Thử bỏ kiểm tra khoá trong hàm -> test đỏ đúng chỗ.
- `npm run smoke`: 13/13 đạt (2 test mới: hồ sơ ở khổ 390px - nội dung, thứ tự lịch sử, dấu +/−, không có hạng trong lớp, chỉ có nút Cập nhật/Đăng xuất, không cuộn ngang, bị khoá giữa chừng thì dữ liệu biến mất, không chạm bảng giáo viên; lỗi tải hồ sơ -> thử lại). Không ảnh gốc DOM nào đổi (giao diện giáo viên giữ nguyên). Đã xem ảnh chụp hồ sơ và màn khoá.
- **Chưa kiểm chứng (cần dev):** hàm trên Supabase thật; hiển thị trên điện thoại thật và ảnh Pokémon thật (smoke chặn mạng ngoài nên chỉ thấy hình thay thế); thông báo đăng nhập tài khoản khoá khi mật khẩu sai/đúng (runbook 1.6).
- 2026-10-28: Harry báo tài khoản học sinh hiện `role = teacher` trên Supabase. Đã tái hiện trong `npm run test:db` (tạo người dùng rồi mới gắn role, như Supabase làm) và sửa bằng `20261030110000_sync_profile_role.sql`; test mới `supabase/tests/40_sync_profile_role.test.sql` (tài khoản cũ được sửa, học sinh mới thành `student`, tài khoản tạo trong Authentication vẫn `teacher`, người dùng không tự đổi được vai trò); migration chạy 2 lần, hoàn tác, chạy lại; cả 2 kiểu dự án đạt.
- 2026-10-28: Harry xác nhận Phase 5 ổn -> **nghiệm thu Phase 5**; PR #6 đã gộp `main`. Harry yêu cầu giao diện học sinh responsive cả desktop (D22). Task 5.7: `npm run typecheck` 0 lỗi; smoke thêm 2 test (820px và 1440px: hai cột nằm cạnh nhau, cột phải rộng hơn trên desktop, không cuộn ngang) cùng test 390px sẵn có; đã xem ảnh chụp 3 khổ. Không migration.
- 2026-10-28: Harry xác nhận **Phase 4 ok hết** (runbook bước 2.5 trên production và 3 mục "ghi lại" ở bước 1.5: email ảo được chấp nhận, khoá/phiên đang mở, trigger xoá tài khoản khi xoá học sinh) -> **nghiệm thu Phase 4** (kiểm chứng thủ công do Harry thực hiện). Harry xác nhận mục 1.6 runbook Phase 5 đúng như mong đợi.
- 2026-10-28: Harry xác nhận đã tắt đăng ký công khai của Supabase và đăng nhập được bằng cả email lẫn tên đăng nhập (D27).

**Phase 6 - 2026-10-28** (kiểm thử tự động trên máy của phiên Claude; CHƯA chạy trên Supabase dev/production, chưa thử tay):
- `npm run typecheck`: 0 lỗi. `npm test`: 22 file, 193 test đạt (thêm `social.test.ts` 11: danh mục khớp migration, đọc tổng quan, ví còn lại cho từng bạn, mã lỗi -> tiếng Việt, cộng hàng chờ không trùng/không chạm dữ liệu game, bảng quà giáo viên). `npm run build`: thành công.
- `npm run test:db` (PostgreSQL 16, cả kiểu dự án cũ và mới): đạt, thêm `supabase/tests/50_phase6_social.test.sql` (mặc định tắt; chỉ giáo viên của lớp bật được; danh sách bạn cùng lớp; không mời được lớp khác/giáo viên khác/chưa có tài khoản/chính mình; lời mời, chấp nhận, mời chéo; bạn bè không lộ điểm; hạn mức mỗi bạn, tuần, mỗi lần, ngày; sticker/lời nhắn lạ bị từ chối; học sinh không đọc/ghi thẳng bảng; hàng chờ đúng, hết chờ sau khi cộng; báo cáo; thu hồi trước/sau khi cộng; giáo viên khác không thu hồi được; sổ cái bất biến kể cả quản trị; tài khoản khoá; thôi làm bạn; tắt tính năng; ẩn danh; xoá học sinh kéo theo quà). Migration chạy 2 lần, hoàn tác, chạy lại. Thử bỏ hạn mức mỗi bạn và bỏ dấu "đã cộng" -> test đỏ đúng chỗ.
- `npm run smoke`: 21/21 đạt. Mới: học sinh bạn bè & quà ở 3 khổ (đồng ý lời mời, kết bạn, tặng quà với nút +2 bị khoá đúng hạn mức, lỗi ví hết hiện trong hộp thoại, báo thầy cô, tab đã tặng, không chạm bảng giáo viên); lớp chưa bật; trang giáo viên (bật, hạn mức, thu hồi kèm lý do, gỡ bạn bè); app giáo viên cộng hàng chờ đúng một lần kể cả sau khi mở lại. 18 ảnh gốc DOM cập nhật có chủ đích: chỉ thêm nút "Bạn bè & quà" trên trang lớp, không dòng nào bị xoá; dữ liệu đồng bộ không đổi. Đã xem ảnh chụp các màn mới.
- **Chưa kiểm chứng:** Supabase thật; hai lần tặng đồng thời thật (khoá dòng chỉ đọc mã); thử tay trên điện thoại.
- 2026-10-28: Harry chạy runbook Phase 6 bước 1 trên `classivy-dev`: điểm tặng không bị cộng trùng khi tải lại (1.6), thu hồi quà thì điểm tự trừ lại (1.7) (kiểm chứng thủ công trên dev). Harry yêu cầu gộp vào `main`. Production chưa được xác nhận.
- 2026-10-28: Harry yêu cầu ghi Phase 6 hoàn thành.

**Phase 7 - 2026-10-28** (kiểm thử tự động trên máy của phiên Claude; CHƯA chạy trên Supabase dev/production, chưa thử tay):
- Rà soát trên PostgreSQL cục bộ (đủ migration Phase 3-6): xác nhận được lỗ hổng S1 bằng cách đăng nhập học sinh và gọi `save_teacher_changes` (tạo được 1 dòng học sinh). Sau migration Phase 7: bị chặn (42501).
- `npm run test:db` (2 kiểu dự án): đạt, thêm `60_phase7_hardening.test.sql` (chốt chặn tổng quát; học sinh không dùng được API giáo viên; giáo viên lưu được; máy B lưu trước thì máy A bị từ chối, không ghi gì, một em lỗi thời làm hỏng cả gói, em đã bị xoá ở máy khác thì bị từ chối; ghi y nguyên không tăng phiên bản; đổi tài khoản không tăng phiên bản; giáo viên không tự đặt phiên bản; hàm trigger không gọi được) + dọn dữ liệu cũ (chốt dừng khi còn giáo viên chưa nâng cấp, xoá, chạy 2 lần, "hoàn tác" tạo lại cột rỗng). Test tổng quát bắt được S2 ở kiểu dự án cũ (đã sửa).
- `npm run test:load`: đạt (số liệu ở 7.2).
- `npm run typecheck` 0 lỗi; `npm test` 22 file, 197 test (thêm 4 test số phiên bản trong `cloudModel.test.ts`); `npm run build` đạt; `npm run smoke` 22/22 (mới: máy khác vừa sửa -> không ghi gì, hiện banner, tải lại, thao tác sau lưu được), không ảnh gốc DOM nào đổi.
- **Chưa kiểm chứng:** Supabase thật (migration, Advisors), thử hai máy thật, ảnh nén ~100 KB trên ảnh thật.
- 2026-10-28: Harry chạy runbook Phase 7 bước 1 trên `classivy-dev`: tất cả mục pass, không lỗi (kiểm chứng thủ công trên dev). Harry yêu cầu gộp vào `main`. Production chưa xác nhận.
