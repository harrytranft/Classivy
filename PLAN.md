# PLAN.md - Classivy (cải tổ toàn bộ)

> Thay thế hoàn toàn PLAN.md cũ của Imperial School 3.0 (bản cũ lưu ở `docs/archive/imperial-school-3.0-plan.md` và trong lịch sử git).
> Cập nhật file này sau mỗi Phase. Quy trình báo cáo ở cuối file.

**Cập nhật lần cuối:** 2026-10-26 | **Phase hiện tại:** Phase 0 hoàn thành, chờ Harry duyệt để sang Phase 1

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
| D5 | Bạn bè chỉ trong cùng lớp; không chat tự do (chỉ lời nhắn/emoji định sẵn) | 2026-10-26 (đề xuất, mặc định) |

## Tổng quan Phase

| Phase | Nội dung | Trạng thái | Chạm vào Supabase thật? |
|---|---|---|---|
| 0 | Nền móng: tài liệu, đổi tên, logo | Hoàn thành | Không |
| 1 | Tách App.tsx, thêm router, giữ nguyên hành vi | Chưa bắt đầu | Không |
| 2 | Hệ thiết kế Classivy, reskin, thuật ngữ trung tính, đổi khoá localStorage | Chưa bắt đầu | Không |
| 3 | Mô hình dữ liệu mới + RLS + chuyển dữ liệu cũ | Chưa bắt đầu | **Có (migration)** |
| 4 | Giáo viên quản lý tài khoản học sinh | Chưa bắt đầu | **Có (migration + Edge Function)** |
| 5 | Cổng học sinh: đăng nhập, xem hồ sơ | Chưa bắt đầu | Có |
| 6 | Bạn bè, quà tặng, tặng điểm | Chưa bắt đầu | **Có (migration)** |
| 7 | Hardening, kiểm thử bảo mật, ra mắt | Chưa bắt đầu | Có |

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

## Phase 1 - Tách App.tsx (giữ nguyên hành vi)

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

- [ ] 1.1 Lập kế hoạch tách chi tiết: bản đồ ~200 state theo tính năng, thứ tự tách, rủi ro, checklist hồi quy thủ công. **Harry duyệt trước khi sửa code**
- [ ] 1.2 Dựng khung `src/`, alias đường dẫn, chuyển file gốc vào đúng chỗ (không đổi nội dung), cấu hình vitest
- [ ] 1.3 Thêm router (màn hình thay cho biến `currentScreen`), giữ URL ổn định
- [ ] 1.4 Tách types, constants, lib (supabase, storage) ra khỏi App
- [ ] 1.5 Tách tầng dữ liệu/lưu trữ: hook đọc/ghi localStorage + đồng bộ cloud (hiện nằm trong App)
- [ ] 1.6 Tách từng màn hình/tính năng (mỗi mục một lần, test sau mỗi lần): Auth form, Plaza, Class + StudentCard grid, Settings, Student profile (info/pet/fusion), Random (solo/battle/boss), Attendance + Homework, Shop + Egg/Hatch, Lucky Wheel, Cá Ngựa (Ludo), Group maker + Timer, Pokedex, Release/Level-up modals
- [ ] 1.7 Dọn dẹp: xoá state/hàm chết, rà `tech-debt`, giảm cảnh báo chunk bằng lazy-load theo màn hình
- [ ] 1.8 Bổ sung test cho phần logic vừa lộ ra khi tách (nếu có)
- [ ] 1.9 Checklist hồi quy thủ công toàn bộ luồng chính (Harry chạy trên dev)
- [ ] 1.10 Cập nhật PLAN.md, CLASSIVY-BRIEF.md, báo cáo

**Tiêu chí hoàn thành:** `npm test` và `npm run build` xanh; không file nào > ~500 dòng (ngoại lệ có ghi chú, ví dụ dữ liệu `pokemonData`); checklist hồi quy đạt.

**Bàn giao cho Harry (dự kiến):** không migration; chạy checklist hồi quy trên bản dev/preview.

**Kỹ năng dùng:** `engineering:tech-debt`, `engineering:testing-strategy`, `engineering:code-review`.

---

## Phase 2 - Hệ thiết kế Classivy, reskin, thuật ngữ

**Mục tiêu:** giao diện đúng nhận diện Classivy; bỏ thuật ngữ cung đình; không mất dữ liệu người dùng cũ.

- [ ] 2.1 Chạy lại `impeccable document` (chế độ scan) và chốt `DESIGN.md` chính thức (North Star đã chốt: "Lá non trong tấm khiên")
- [ ] 2.2 Chuyển Tailwind từ CDN sang build local, đưa token màu/chữ/bo góc vào cấu hình
- [ ] 2.3 Dựng thư viện `components/ui/` (Button, Card, Chip, Avatar, Modal, Toast, ProgressBar, Badge, EmptyState)
- [ ] 2.4 Reskin lần lượt các màn hình đã tách; kiểm tra tương phản và cảm ứng (`accessibility-review`)
- [ ] 2.5 **Quyết định với Harry:** bộ thuật ngữ thay cho hệ cấp bậc cung đình (Vua/Hoàng hậu/Nô tài...), "Thánh chỉ", "Học sĩ"; tên cấp bậc mặc định
- [ ] 2.6 Đổi prompt Gemini (`geminiService.ts`) sang giọng trung tính, thân thiện
- [ ] 2.7 Đổi khoá localStorage `imperial_*` thành `classivy_*` **kèm đoạn chuyển dữ liệu một lần** (đọc khoá cũ, ghi khoá mới, giữ bản cũ để hoàn tác) và test
- [ ] 2.8 Đổi giá trị mặc định "Học sĩ triều đình" trong `AuthContext.tsx`; chuẩn bị SQL đổi default trong schema (đưa vào migration ở Phase 3, không chạy riêng)
- [ ] 2.9 Cập nhật `DESIGN.md`, PLAN, BRIEF; báo cáo

**Bàn giao cho Harry (dự kiến):** duyệt bộ thuật ngữ mới; thử bản preview; không migration (SQL đổi default gộp vào Phase 3).

**Kỹ năng dùng:** `impeccable`, `ui-ux-pro-max`, `design-system`, `brand`, `design:accessibility-review`, `design:ux-copy`.

---

## Phase 3 - Mô hình dữ liệu mới + RLS (roadmap, sẽ phân tích sâu khi tới)

**Mục tiêu:** học sinh, lớp, điểm là dữ liệu bảng thật, có RLS chặt, dữ liệu cũ được chuyển sang mà không mất.

- [ ] 3.1 ADR về data model (`engineering:architecture`): bảng lớp, học sinh, thành viên lớp, sổ cái điểm, trạng thái tài khoản; cách giữ dữ liệu game (Pokémon, Boss, Ludo) dạng JSON hay bảng
- [ ] 3.2 Viết migration trong `supabase/migrations/` (có phần hoàn tác), kèm RLS và test RLS
- [ ] 3.3 Script chuyển dữ liệu từ `user_settings.students` sang bảng mới, có chế độ chạy thử (dry-run) và đối chiếu số lượng
- [ ] 3.4 Lớp truy cập dữ liệu mới trong app; giữ chế độ khách (guest) nếu còn dùng
- [ ] 3.5 Kiểm tra trên **dự án Supabase dev/branch** trước; kiểm tra giới hạn gói miễn phí
- [ ] 3.6 `deploy-checklist`, sao lưu trước khi chạy trên production

**Bàn giao cho Harry:** sao lưu dữ liệu, chạy migration trên dev rồi production theo hướng dẫn; xác nhận từng bước trước khi coi là đã áp dụng.

---

## Phase 4 - Giáo viên quản lý tài khoản học sinh (roadmap)

- [ ] 4.1 Edge Function: tạo tài khoản (đơn lẻ và hàng loạt từ danh sách lớp), đặt lại mật khẩu, khoá/mở khoá, xoá mềm
- [ ] 4.2 Quy ước tên đăng nhập, mật khẩu ban đầu, ép đổi mật khẩu lần đầu
- [ ] 4.3 Màn hình quản lý học sinh (tìm, lọc, sửa, khoá, xoá, in thẻ đăng nhập)
- [ ] 4.4 Nhật ký thao tác của giáo viên; xác nhận trước khi xoá
- [ ] 4.5 Kiểm thử phân quyền: giáo viên chỉ thấy học sinh lớp mình

---

## Phase 5 - Cổng học sinh (roadmap)

- [ ] 5.1 Trang đăng nhập học sinh, giao diện điện thoại trước
- [ ] 5.2 Xem hồ sơ: điểm, rank, Pokémon, huy hiệu, lịch sử điểm (chỉ của mình)
- [ ] 5.3 Tài khoản bị khoá hiển thị thông báo rõ ràng, không lộ thông tin
- [ ] 5.4 Kiểm thử RLS: học sinh không đọc được dữ liệu người khác

---

## Phase 6 - Bạn bè, quà tặng, tặng điểm (roadmap)

- [ ] 6.1 Kết bạn trong cùng lớp (gửi lời mời, chấp nhận, huỷ); giáo viên bật/tắt tính năng theo lớp
- [ ] 6.2 Ví "điểm tặng" có hạn mức tuần do giáo viên đặt; hàm DB atomic + sổ cái bất biến
- [ ] 6.3 Quà tặng (vật phẩm/emoji/lời nhắn định sẵn), không chat tự do
- [ ] 6.4 Chống lạm dụng: giới hạn tần suất, chặn gian lận qua lại giữa hai tài khoản, báo cáo, giáo viên xem và thu hồi giao dịch
- [ ] 6.5 Thiết kế tương tác lành mạnh (không bêu xấu, không xếp hạng cuối lớp công khai)

---

## Phase 7 - Hardening và ra mắt (roadmap)

- [ ] 7.1 Rà soát bảo mật (RLS, Edge Function, giới hạn tốc độ, lộ khoá)
- [ ] 7.2 Kiểm thử tải nhẹ theo quy mô lớp thật; theo dõi giới hạn free tier
- [ ] 7.3 Hướng dẫn sử dụng cho giáo viên và học sinh; thông báo phụ huynh nếu cần
- [ ] 7.4 Kế hoạch triển khai từng lớp (pilot một lớp trước)

---

## Đề xuất phát sinh (chờ Harry duyệt)

- Có cần vai trò phụ huynh (xem điểm con) không? Hiện ngoài phạm vi.

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
