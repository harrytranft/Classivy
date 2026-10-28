# CLASSIVY-BRIEF.md

Tóm tắt trạng thái dự án để chuyển sang chat/phiên sau. Cập nhật cuối mỗi Phase. Chi tiết tasks ở `PLAN.md`.

**Cập nhật lần cuối:** 2026-10-28 (Phase 0-7 hoàn thành và gộp `main`; Phase 8, 9, 10A và 10B xong trên nhánh `claude/phase8-teacher-ui`, chưa commit, chờ Harry xem thử. 10B = Cửa hàng học sinh: migration `supabase/migrations/20261102100000_phase10_student_shop.sql` đã test trên Postgres cục bộ nhưng CHƯA chạy trên Supabase thật, chờ Harry duyệt rồi chạy; Phase 11 (tự động hoá skills) chỉ làm khi Harry yêu cầu)

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
- Phase 5 (D18-D21, 2026-10-28): học sinh đọc hồ sơ qua hàm DB chọn lọc `get_my_student_profile()` (không mở RLS đọc bảng); "hạng" = Trainer Level + danh hiệu + huy hiệu, không có vị trí trong lớp; học sinh chỉ xem; ảnh đại diện giữ trong DB, dời Storage tới Phase 7. Thiết kế: `docs/adr/0003-phase-5-student-portal.md`.
- Phase 6 (D23-D26, 2026-10-28): điểm tặng vào Hào Quang qua hàng chờ (app giáo viên tự gom, không ghi đè/cộng trùng); ví 5 điểm/tuần, 2 điểm/tuần/bạn; quà = sticker + lời khen định sẵn; kết bạn bằng lời mời, tính năng mặc định tắt, giáo viên bật theo lớp và thu hồi được. Thiết kế: `docs/adr/0004-phase-6-social.md`.
- Phase 7 (D28-D31, 2026-10-28): chốt "chỉ giáo viên" trong mọi policy dữ liệu giáo viên; xoá dữ liệu cũ sau sao lưu; ảnh giữ DB, nén ~100 KB; hai máy cùng sửa thì không ghi đè (số phiên bản, báo + tải lại). Thiết kế: `docs/adr/0005-phase-7-hardening.md`.
- D27 (2026-10-28): ô đăng nhập nhận cả email lẫn tên đăng nhập; Supabase đã tắt đăng ký công khai (giáo viên mới do Harry tạo trong Authentication).
- D22 (2026-10-28): giao diện học sinh responsive điện thoại + máy tính bảng + desktop, áp dụng cho mọi màn học sinh từ nay (Phase 6 trở đi); smoke test 3 khổ 390/820/1440px. Chi tiết bố cục ở DESIGN.md mục Layout.
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
- **Phase 4 (hoàn thành 2026-10-28, PR #5 đã gộp `main`):** Harry chạy runbook trên dev và production, xác nhận "ok hết" (gồm thử học sinh trên production và 3 mục "ghi lại"). Nội dung: đã viết migration `20261029100000_phase4_student_accounts.sql` (+ hoàn tác), Edge Function `student-accounts` (tạo/hàng loạt, đặt lại mật khẩu, khoá/mở, thu hồi), trang `/class/<lớp>/tai-khoan` (lọc, xác nhận, thẻ đăng nhập in được, nhật ký), ô đăng nhập nhận tên đăng nhập, cổng học sinh tối thiểu (đổi mật khẩu lần đầu; tài khoản học sinh không tải dữ liệu giáo viên). Kiểm chứng tự động đạt (typecheck, 172 test, test:db 2 kiểu dự án, smoke 11/11, build). 
- **Phase 5 (hoàn thành 2026-10-28, PR #6 đã gộp `main`; Harry xác nhận đã chạy migration và thử ổn):** migration `20261030100000_phase5_student_portal.sql` (+ hoàn tác) thêm hàm `get_my_student_profile()` (security definer: chỉ dữ liệu của người gọi, danh sách khoá cho phép, trứng không lộ Pokémon sắp nở, 30 dòng lịch sử, tài khoản khoá chỉ nhận `locked`). Giao diện hồ sơ học sinh điện thoại trước trong `src/features/studentPortal/` (Hào Quang, Trainer Level, Pokémon, trứng, bộ sưu tập, huy hiệu, lịch sử, nút Cập nhật; màn khoá/chưa gắn/lỗi). Kiểm chứng tự động đạt (typecheck, 182 test, test:db 2 kiểu dự án, smoke 13/13, build). Bổ sung sau nghiệm thu (task 5.7, PR #7 đã gộp): bố cục responsive máy tính bảng/desktop.
- **Phase 6 (hoàn thành 2026-10-28, PR #8):** migration `20261031100000_phase6_social.sql` (+ hoàn tác): cột cài đặt ở `classes`, bảng `student_friendships`, `student_gifts` (bất biến), `student_gift_revocations`, `student_gift_reports`, hàm học sinh (security definer) và `teacher_pending_gift_adjustments()`. App: `src/domain/social.ts`, `src/app/providers/gameData/useGiftCollector.ts` (gom hàng chờ), cổng học sinh `src/features/studentPortal/social/`, trang giáo viên `src/features/social/` (`/class/<lớp>/ban-be`). Harry thử trên dev ổn và xác nhận hoàn thành.
- **Phase 7 (hoàn thành 2026-10-28, PR #9, Harry xác nhận xong và đã gộp `main`):** rà soát `docs/security-review-phase7.md`; migration `20261101100000_phase7_hardening.sql` (`is_teacher()`, `students.revision`, `save_teacher_changes_v2`, thu quyền thừa) và `20261101110000_drop_legacy_data.sql` (chạy sau sao lưu); app gửi số phiên bản, banner `SyncConflictBanner` khi bị từ chối; `npm run test:load` (`scripts/test-load.sh`, `supabase/load/`); hướng dẫn `docs/huong-dan/`; kế hoạch triển khai `docs/phase-7-rollout.md`.
- **Phase 8 (xong 2026-10-28, nhánh `claude/phase8-teacher-ui`, chưa commit):** sửa chớp loading (nguyên nhân: `AuthContext` bật loading mỗi lần Supabase phát lại tín hiệu), trang loading kiểu DictaLearn (`src/app/SplashScreen.tsx`), nav chỉ icon, nút icon một dòng ở trang Class, Check đi học/Homework 4 cột cùng cỡ ("Thiếu" -> "Chưa làm"), vòng quay mặc định chọn hết em có mặt, hẹn giờ to hơn, hiệu ứng điểm trên thẻ, Hồi sinh (`src/domain/revive.ts`; mất Pokémon kèm skills, giữ trứng), phím tắt (Cài đặt + phím ?), đăng xuất không confirm. Kiểm chứng: typecheck, 209 test, build, smoke 23/23. Chưa kiểm chứng: lỗi chớp loading trên trình duyệt thật.
- **Kế hoạch Phase 8-11 (Harry chốt 2026-10-28, quyết định D32-D40 trong `PLAN.md`):** P8 dọn giao diện giáo viên (sửa chớp loading do `AuthContext` bật `loading` mỗi lần `onAuthStateChange`; trang loading như DictaLearn, xem `docs/reference/dictalearn-splash.md`; nav icon-only; Hồi sinh; phím tắt), P9 trang Tặng quà/Vòng quay/Cá Ngựa, P10 cổng học sinh v2 + Shop (có migration), P11 skills tự động (12 skill, luật 2 lượt giữ nguyên).

## 5. Bản đồ repo (hiện tại)

- `src/app/`: khung app (`App.tsx` ~20 dòng, `AppRoutes`, `AppLayout`, `AppContext`), `controller/` (gom state/hành động), `providers/` (`GameDataProvider` + `gameData/` đồng bộ Supabase/localStorage, `UiEventsProvider`).
- `src/features/<tính năng>/`: state, hành động, giao diện của class, students, attendance, homework, random, ludo, wheel, shop, pokemon, profile, settings, tools, feedback, auth, accounts (Phase 4: quản lý tài khoản học sinh), social (Phase 6: trang giáo viên Bạn bè & quà), studentPortal (Phase 4-5: đổi mật khẩu lần đầu + hồ sơ chỉ xem của học sinh; logic đọc dữ liệu ở `src/domain/studentPortal.ts`).
- `supabase/functions/`: Edge Function `student-accounts` (`handler.ts` có test, `index.ts` là điểm vào Deno) và `_shared/studentAccount.ts` (logic thuần dùng chung với app). Runbook: `docs/phase-4-runbook.md`, `docs/phase-5-runbook.md`, `docs/phase-6-runbook.md`.
- `src/domain/`: logic thuần có test (điểm, điểm danh, bài tập, battle, Cá Ngựa, Boss, Pokémon, tiến trình, trứng, ngày/tuần).
- `src/components/` (component dùng chung), `src/data/` (hằng số, `pokemonData`), `src/lib/` (Supabase, âm thanh), `src/types/`.
- `tests/smoke/` + `fixtures/sample-class.json`: smoke test Playwright. `docs/architecture.md`: hướng dẫn kiến trúc.
- `public/brand/` logo; `brand-source/` file gốc; `docs/archive/` tài liệu Imperial School cũ.

## 6. Rủi ro đã biết

- Thuật ngữ: giữ "Hào Quang"; "Học sĩ" -> "Trainer" (D9); `Ý Chỉ Đồng Hành` -> `Đồng Đội Hỗ Trợ`; các phụ kiện mang tên cung đình đã đổi theo PLAN. Kỹ năng Pokémon lưu theo giáo viên nên tài khoản cũ vẫn thấy tên/mô tả cũ cho tới khi tự sửa hoặc khôi phục trong Cài đặt.
- Đăng nhập hiện chỉ dành cho tài khoản đã tồn tại: email + mật khẩu. UI tạo tài khoản và Google login đã bỏ (D11, Harry xác nhận 2026-10-27); không xóa API nền để Phase 4 còn có thể dùng luồng giáo viên tạo tài khoản học sinh.
- Đã reskin modal Điểm danh/Bài tập và các luồng game. Random/Tặng Pokémon là vòng polish cuối; các CTA đỏ không mang nghĩa nguy hiểm đã dọn, còn đỏ dành cho lỗi/cảnh báo/trừ điểm hoặc sự kiện Cá Ngựa.
- Kiểm chứng sau rà soát (2026-10-27): typecheck 0 lỗi, `npm test` 106/106, build đạt, `npm run smoke` 6/6. Chưa thử tay trên preview Vercel.
- SQL chờ từ Phase 2 (`docs/phase-3-pending-sql.md`) đã gộp vào migration Phase 3. Đổi tên hồ sơ cũ "Học sĩ triều đình" -> "Trainer": Harry duyệt (D13), file `20261028130000_rename_legacy_display_names.sql` chờ Harry chạy trên production.
- Phase 3: `students.points` vẫn do game đặt trực tiếp; sổ điểm là nhật ký (tổng sổ = điểm ngay sau khi chuyển, có thể lệch nếu điểm đổi mà không ghi lịch sử). Ví tặng điểm Phase 6 phải dùng hàm DB atomic riêng (D2).
- Phase 4 tạo tài khoản học sinh phải đặt `app_metadata.role = 'student'` để hồ sơ nhận vai trò học sinh. Lỗi đã gặp (2026-10-28): Supabase gắn `app_metadata` SAU khi tạo người dùng nên hồ sơ bị ghi `teacher`; sửa bằng `20261030110000_sync_profile_role.sql` (`profiles.role` luôn theo `app_metadata.role`; tạo trong Authentication = giáo viên).
- Giới hạn gói miễn phí Supabase (500 MB/dự án, 2 dự án, dự án nghỉ 7 ngày bị tạm dừng) ghi trong runbook Phase 3. Edge Functions gói Free: 256 MB, 2 giây CPU/yêu cầu, 150 giây tổng, 100 hàm (tài liệu Supabase); hạn mức số lần gọi/tháng chưa tìm thấy, xem Dashboard.
- Phase 4 đã thử trên dev/production và Harry xác nhận ổn (email ảo `@students.classivy.invalid`, khoá tài khoản, trigger xoá `auth.users` khi xoá học sinh). Phiên đang mở của học sinh bị khoá: hàm Phase 5 chặn dữ liệu ngay. Đăng ký công khai của Supabase: Harry đã tắt (2026-10-28).
- Phase 6: điểm tặng chỉ vào Hào Quang khi app giáo viên đang mở (dữ liệu bảng). Hai lần tặng đồng thời: khoá dòng trong hàm, chưa thử tải thật. Hai máy cùng sửa một học sinh: Phase 7 chặn ghi đè (thao tác bị từ chối phải làm lại).
- Phase 5: lý do trong lịch sử điểm là chữ tự do giáo viên/game ghi; học sinh thấy nguyên văn (nếu có tên bạn khác thì em thấy). Thông báo đăng nhập tài khoản khoá (runbook 1.6): Harry xác nhận đúng như mong đợi.
- Cờ "phải đổi mật khẩu" là cơ chế giao diện, không phải ranh giới bảo mật (DB không biết mật khẩu đã đổi chưa).

## 7. Quyết định còn mở

- Phase 10B (đã làm theo mặc định, Harry có thể đổi): giá trứng 10/20 Hào Quang; nở nhanh = trả phần tiến độ còn thiếu; mua trứng cất Pokémon đồng hành cho tới khi nở; không mua trứng thứ hai khi đang ấp; không đổi đồng hành khi đang ấp. Skill của giáo viên tự sửa chưa hiện đúng tên/mô tả trong thẻ Hồ sơ học sinh (Cửa hàng thì đúng, lấy từ DB).

- (Đã chốt: tắt đăng ký công khai, ô đăng nhập nhận cả email lẫn tên đăng nhập - D27.)
- Phase 6: có muốn bạn cùng lớp chỉ thấy tên gọi (không họ) không? Hiện hiện tên đầy đủ như giáo viên nhập.
- (Vai trò phụ huynh: Harry quyết định không thêm, D13.)

## 8. Bước tiếp theo

1. Harry xem thử Phase 8 (đặc biệt: đổi tab qua lại có còn chớp loading không), rồi cho commit/gộp nhánh `claude/phase8-teacher-ui`.
2. Harry duyệt rồi chạy migration Phase 10B trên Supabase (hoàn tác: `supabase/rollback/20261102100000_phase10_student_shop_down.sql`); chỉ coi là đã áp dụng khi Harry xác nhận. Sau đó bật công tắc "Cho phép học sinh dùng Cửa hàng" ở trang Bạn bè & quà của lớp để thử.
3. Phase 11 (skills tự động hoá) khi Harry yêu cầu.
