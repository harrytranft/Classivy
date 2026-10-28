# CLASSIVY-BRIEF.md

Tóm tắt trạng thái dự án để chuyển sang chat/phiên sau. Cập nhật cuối mỗi Phase. Chi tiết tasks ở `PLAN.md`.

**Cập nhật lần cuối:** 2026-10-28 (Phase 3 hoàn thành; Phase 4 đã viết xong trên nhánh `claude/phase4-student-accounts`, chờ Harry chạy runbook trên dev)

## 1. Sản phẩm

Classivy (tên cũ: Imperial School / Cung Đình Học Đường) là web app lớp học gamification của Harry, giáo viên tiếng Anh cấp 2 tại hai trung tâm Sun Santa và Smartie. Giáo viên cộng/trừ điểm, điểm danh, kiểm tra bài tập, chọn ngẫu nhiên học sinh, nuôi Pokémon, đánh Boss, quay Lucky Wheel, chơi Cá Ngựa.

Mục tiêu đợt cải tổ: (1) đổi thương hiệu sang Classivy; (2) tách `App.tsx` khổng lồ thành nhiều file/màn hình; (3) giáo viên tạo, sửa, xoá, khoá tài khoản học sinh; (4) học sinh đăng nhập xem tài khoản của mình; (5) học sinh kết bạn trong lớp, tặng quà, tặng điểm.

## 2. Stack

React 19 + Vite 6 + TypeScript, react-router-dom 7, Tailwind 3.4 (build local, token `brand-*` trong `tailwind.config.js`), Supabase (Auth + Postgres), Vercel. Vitest (unit) + Playwright (smoke test).

## 3. Quyết định đã chốt

- Học sinh đăng nhập bằng **tên đăng nhập + mật khẩu do giáo viên cấp** (email ảo nội bộ, tạo qua Edge Function).
- Tặng điểm dùng **ví "điểm tặng" riêng, có hạn mức theo tuần**; không trừ điểm xếp hạng của người tặng.
- Thứ tự: **tách App.tsx trước**, rồi mới làm dữ liệu/tài khoản.
- **Bỏ chủ đề cung đình**; giữ Pokémon/Boss theo nhận diện Classivy (xanh rừng, xanh lá, vàng, tím).
- Bạn bè chỉ trong cùng lớp; không chat tự do.
- North Star thiết kế: **"Lá non trong tấm khiên"** (Harry xác nhận 2026-10-26).
- Thư mục `.claude/` (skills) được commit vào git.
- Mỗi lớp một trang `/class/<lớp>`, `/class` là trang chọn lớp; Cá Ngựa, Vòng quay, Tặng Pokémon là trang con của lớp; Random vẫn là hộp thoại (D8, 2026-10-27, đã làm trên nhánh Phase 1).
- Màn đăng nhập chỉ còn email + mật khẩu; bỏ "Tạo tài khoản" và "Đăng nhập Google" trên giao diện (D11, 2026-10-27).
- Bỏ hệ cấp bậc cung đình và "Thánh chỉ"/Gemini; bảng Ban thưởng/Phạt dùng Trainer Level (D7, 2026-10-27) - đã làm (task 2.0).
- D13 (2026-10-28): không thêm vai trò phụ huynh; đổi tên hồ sơ mặc định cũ thành "Trainer".
- Phase 4 (D14-D17, 2026-10-28): tên đăng nhập = tên + số ngẫu nhiên (sửa tay được); mật khẩu ngẫu nhiên 8 ký tự in trên thẻ, học sinh bắt buộc đổi ở lần đăng nhập đầu; tách "Thu hồi tài khoản" (giữ học sinh + điểm) với "Xoá học sinh" (xoá hẳn kèm tài khoản, đúng D12; không có xoá mềm); có bảng nhật ký thao tác `teacher_audit_log`. Thiết kế: `docs/adr/0002-phase-4-student-accounts.md`.
- Phase 3 (D12): mô hình lai theo `docs/adr/0001-phase-3-data-model.md`; một học sinh một lớp; **xoá học sinh là xoá hẳn** (kể cả sổ điểm); sổ điểm giữ toàn bộ lịch sử; ảnh đại diện tạm lưu DB (nén); chuyển dữ liệu trong app do giáo viên bấm; có dự án Supabase dev riêng (Harry duyệt 2026-10-27).
- Phase 1: React Context + hook (không thêm thư viện state), `react-router-dom` + `vercel.json`, Playwright làm lưới an toàn, làm trên nhánh `refactor/phase-1-split` (lấy theo mặc định đề xuất khi Harry yêu cầu hoàn thành Phase 1).

## 4. Trạng thái hiện tại

- Phase 0 (nền móng và thương hiệu): hoàn thành.
- Phase 1 (tách App.tsx, router, trang riêng theo lớp): hoàn thành, Harry nghiệm thu và đã gộp vào `main` (2026-10-27).
- Hành vi giữ nguyên: smoke test so DOM và dữ liệu đồng bộ với ảnh gốc tạo từ code trước khi tách, đều khớp.
- Phase 2 (hệ thiết kế, reskin, thuật ngữ): hoàn thành, Harry nghiệm thu preview (2026-10-27), gộp vào `main` qua PR từ nhánh `claude/phase2-rebranding`. Nội dung: bỏ cấp bậc/Gemini, hệ thiết kế + Tailwind local, thuật ngữ Trainer, localStorage `classivy_*`, Modal/Toast và reskin shell, lớp, hồ sơ, cài đặt, đăng nhập, công cụ, điểm danh/bài tập cùng các modal game. Vòng cuối đã làm lại Random và Tặng Pokémon theo nền kem/trắng, CTA xanh rừng/vàng, tăng tương phản và dọn CTA đỏ không có nghĩa cảnh báo. Phông chữ: một nguồn duy nhất `fontFamily.sans` = Plus Jakarta Sans/Be Vietnam Pro; `font-royal` và kiểu VIẾT HOA giãn chữ đã bỏ. Rà soát sau Codex đã sửa: smoke đỏ, CSS ép màu làm nút trừ điểm Battle thành xanh, bảng Cá Ngựa mất nền (xem Nhật ký kiểm chứng trong PLAN).
- Phase 3 (dữ liệu mới + RLS): **hoàn thành 2026-10-28**. Migration `20261027120000_phase3_data_model.sql` đã chạy trên `classivy-dev` và **production** (Harry xác nhận), dữ liệu đã nâng cấp: app dùng bảng `classes`/`students`/`point_ledger` (`data_model_version = 2`), chỉ gửi phần thay đổi. Cột cũ `user_settings.students` giữ làm bản dự phòng tới Phase 7. Bảng `students` cũ của Imperial School đổi tên thành `students_imperial_old` (khoá).
- Bài học Supabase: dự án mới không tự cấp quyền bảng (phải `grant` rõ ràng); dự án gốc có bảng cũ trùng tên. `npm run test:db` mô phỏng cả hai.
- Migration khoá `app_state`/`users` đã chạy trên production (Harry xác nhận 2026-10-28).
- Phase 3 follow-up: PR #4 (`claude/phase3-followup`) đã gộp vào `main`. Việc chạy `20261028130000_rename_legacy_display_names.sql` trên production: **xác nhận lại với Harry** (BRIEF trước ghi là chờ chạy).
- **Phase 4 (đang làm, nhánh `claude/phase4-student-accounts`, chưa commit):** đã viết migration `20261029100000_phase4_student_accounts.sql` (+ hoàn tác), Edge Function `student-accounts` (tạo/hàng loạt, đặt lại mật khẩu, khoá/mở, thu hồi), trang `/class/<lớp>/tai-khoan` (lọc, xác nhận, thẻ đăng nhập in được, nhật ký), ô đăng nhập nhận tên đăng nhập, cổng học sinh tối thiểu (đổi mật khẩu lần đầu; tài khoản học sinh không tải dữ liệu giáo viên). Kiểm chứng tự động đạt (typecheck, 172 test, test:db 2 kiểu dự án, smoke 11/11, build). **Chưa chạy trên Supabase dev/production, Edge Function chưa chạy trên Supabase thật.**

## 5. Bản đồ repo (hiện tại)

- `src/app/`: khung app (`App.tsx` ~20 dòng, `AppRoutes`, `AppLayout`, `AppContext`), `controller/` (gom state/hành động), `providers/` (`GameDataProvider` + `gameData/` đồng bộ Supabase/localStorage, `UiEventsProvider`).
- `src/features/<tính năng>/`: state, hành động, giao diện của class, students, attendance, homework, random, ludo, wheel, shop, pokemon, profile, settings, tools, feedback, auth, accounts (Phase 4: quản lý tài khoản học sinh), studentPortal (Phase 4: cổng học sinh tối thiểu).
- `supabase/functions/`: Edge Function `student-accounts` (`handler.ts` có test, `index.ts` là điểm vào Deno) và `_shared/studentAccount.ts` (logic thuần dùng chung với app). Runbook: `docs/phase-4-runbook.md`.
- `src/domain/`: logic thuần có test (điểm, điểm danh, bài tập, battle, Cá Ngựa, Boss, Pokémon, tiến trình, trứng, ngày/tuần).
- `src/components/` (component dùng chung), `src/data/` (hằng số, `pokemonData`), `src/lib/` (Supabase, âm thanh), `src/types/`.
- `tests/smoke/` + `fixtures/sample-class.json`: smoke test Playwright. `docs/architecture.md`: hướng dẫn kiến trúc.
- `public/brand/` logo; `brand-source/` file gốc; `docs/archive/` tài liệu Imperial School cũ.

## 6. Rủi ro đã biết

- Dữ liệu học sinh nằm trong một cột JSON của giáo viên, chưa phải bảng riêng; đây là nút thắt cho mọi tính năng học sinh. Phần cần thay ở Phase 3 đã gom vào `src/app/providers/gameData/`.
- Thuật ngữ: giữ "Hào Quang"; "Học sĩ" -> "Trainer" (D9); `Ý Chỉ Đồng Hành` -> `Đồng Đội Hỗ Trợ`; các phụ kiện mang tên cung đình đã đổi theo PLAN. Kỹ năng Pokémon lưu theo giáo viên nên tài khoản cũ vẫn thấy tên/mô tả cũ cho tới khi tự sửa hoặc khôi phục trong Cài đặt.
- Đăng nhập hiện chỉ dành cho tài khoản đã tồn tại: email + mật khẩu. UI tạo tài khoản và Google login đã bỏ (D11, Harry xác nhận 2026-10-27); không xóa API nền để Phase 4 còn có thể dùng luồng giáo viên tạo tài khoản học sinh.
- Đã reskin modal Điểm danh/Bài tập và các luồng game. Random/Tặng Pokémon là vòng polish cuối; các CTA đỏ không mang nghĩa nguy hiểm đã dọn, còn đỏ dành cho lỗi/cảnh báo/trừ điểm hoặc sự kiện Cá Ngựa.
- Kiểm chứng sau rà soát (2026-10-27): typecheck 0 lỗi, `npm test` 106/106, build đạt, `npm run smoke` 6/6. Chưa thử tay trên preview Vercel.
- SQL chờ từ Phase 2 (`docs/phase-3-pending-sql.md`) đã gộp vào migration Phase 3. Đổi tên hồ sơ cũ "Học sĩ triều đình" -> "Trainer": Harry duyệt (D13), file `20261028130000_rename_legacy_display_names.sql` chờ Harry chạy trên production.
- Phase 3: `students.points` vẫn do game đặt trực tiếp; sổ điểm là nhật ký (tổng sổ = điểm ngay sau khi chuyển, có thể lệch nếu điểm đổi mà không ghi lịch sử). Ví tặng điểm Phase 6 phải dùng hàm DB atomic riêng (D2).
- Phase 4 tạo tài khoản học sinh phải đặt `app_metadata.role = 'student'` để hồ sơ nhận vai trò học sinh.
- Giới hạn gói miễn phí Supabase (500 MB/dự án, 2 dự án, dự án nghỉ 7 ngày bị tạm dừng) ghi trong runbook Phase 3. Edge Functions gói Free: 256 MB, 2 giây CPU/yêu cầu, 150 giây tổng, 100 hàm (tài liệu Supabase); hạn mức số lần gọi/tháng chưa tìm thấy, xem Dashboard.
- Phase 4 cần thử trên dev: email ảo `@students.classivy.invalid` có được Supabase chấp nhận; phiên đang mở của học sinh bị khoá còn sống bao lâu; trigger xoá `auth.users` khi xoá học sinh; chi tiết trong `docs/phase-4-runbook.md`. API đăng ký công khai của Supabase vẫn mở (UI đã bỏ): khuyến nghị tắt "Allow new users to sign up" (cần Harry quyết).
- Cờ "phải đổi mật khẩu" là cơ chế giao diện, không phải ranh giới bảo mật (DB không biết mật khẩu đã đổi chưa).

## 7. Quyết định còn mở

- Tắt đăng ký công khai của Supabase Auth (khuyến nghị, xem runbook Phase 4 bước 2.6)? Cần Harry quyết vì liên quan cách đăng nhập.
- Ô đăng nhập hiện nhận cả email lẫn tên đăng nhập (chỉnh D11 để học sinh đăng nhập được): Harry xác nhận khi nghiệm thu.
- (Vai trò phụ huynh: Harry quyết định không thêm, D13.)

## 8. Bước tiếp theo

1. Harry chạy `docs/phase-4-runbook.md` bước 1 trên `classivy-dev` (migration `20261029100000_phase4_student_accounts.sql`, `npx supabase functions deploy student-accounts`, thử theo danh sách), báo lại kết quả và 3 mục cần ghi lại. Sau đó mới production (bước 2).
2. Sau khi Harry xác nhận: đóng Phase 4 trong PLAN, gộp nhánh. Phase 5 (cổng học sinh: xem hồ sơ, điểm, Pokémon của chính mình + chính sách RLS cho học sinh) bắt đầu bằng phân tích sâu riêng.
