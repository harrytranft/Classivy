# Phase 3 - Hướng dẫn chạy migration (cho Harry)

Làm lần lượt từ trên xuống. Mỗi bước có ô để tick. **Chưa làm bước nào trên Supabase thật** cho tới khi Harry tự chạy và xác nhận.

File liên quan:
- Migration: `supabase/migrations/20261027120000_phase3_data_model.sql`
- Hoàn tác: `supabase/rollback/20261027120000_phase3_data_model_down.sql`
- Thiết kế: `docs/adr/0001-phase-3-data-model.md`

## Điều cần biết trước

- App mới **chạy được cả trước và sau** khi chạy migration. Chưa chạy migration: app lưu y như cũ. Đã chạy: lần đăng nhập sau, app hiện hộp thoại "Nâng cấp cách lưu dữ liệu".
- Migration **không sửa, không xoá** dữ liệu học sinh cũ (cột `user_settings.students`). Cột này được giữ làm bản dự phòng tới Phase 7.
- Migration có xoá 2 cột cấp bậc cũ `ranks_male`, `ranks_female` (D7). App đã thôi dùng chúng từ Phase 2.
- Gói miễn phí Supabase: 500 MB dữ liệu mỗi dự án, tối đa 2 dự án đang chạy. Dự án không ai dùng trong 7 ngày sẽ bị tạm dừng (bấm "Restore" để mở lại). Ước tính sổ điểm khoảng 15-20 MB/năm cho 100 học sinh.

## Bước 1 - Dự án dev (bản thử, Q7)

- [ ] 1.1 Vào supabase.com, tạo dự án mới tên `classivy-dev` (gói Free, vùng Singapore).
- [ ] 1.2 Vào **SQL Editor**, dán toàn bộ `supabase-schema.sql` (schema cũ, **bản mới nhất trên nhánh Phase 3**: có thêm phần cấp quyền mà dự án Supabase mới tạo cần), bấm **Run**. Nếu app báo lỗi `permission denied for table ...` trong Console thì là đã dán bản cũ: dán lại bản mới và **Run** lần nữa (chạy lại không mất dữ liệu).
- [ ] 1.3 Vào **Authentication > Users**, tạo một tài khoản giáo viên thử (email + mật khẩu).
- [ ] 1.4a Lấy dữ liệu thật để thử: mở app thật (trang Vercel), đăng nhập tài khoản cũ, Cài đặt > "Export JSON Backup". Máy tải về file `classivy_backup_....json`.
- [ ] 1.4b Chạy app ở máy với dự án dev: tạo file `.env.local`, ghi `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` của **dự án dev** (Project Settings > API, chỉ lấy khoá `anon`). Chạy `npm run dev`, mở `localhost:3000`, đăng nhập bằng tài khoản thử ở bước 1.3. **App trống là bình thường** (dự án dev mới chưa có dữ liệu; dữ liệu thật vẫn nằm ở dự án cũ).
- [ ] 1.4c Trên `localhost:3000`: Cài đặt > "Import JSON Restore", chọn file ở bước 1.4a. Tải lại trang: lớp và học sinh hiện ra. Kiểm tra trên Supabase **dự án dev** > Table Editor > `user_settings`: cột `students` có dữ liệu.
- [ ] 1.5 Trong SQL Editor của dự án dev, dán toàn bộ file migration, bấm **Run**. Kết quả mong đợi: "Success. No rows returned".
- [ ] 1.6 Tải lại app: hộp thoại "Nâng cấp cách lưu dữ liệu" hiện ra, có số lớp, học sinh, tổng Hào Quang. Kiểm tra các con số đúng như lớp thật.
- [ ] 1.7 Bấm "Tải bản sao lưu và nâng cấp": máy tải về một file `classivy_backup_...json`, rồi app báo "Xong! ... đối chiếu khớp".
- [ ] 1.8 Thử dùng bình thường: cộng/trừ điểm, điểm danh, bài tập, Random/Boss, Cá Ngựa, Vòng quay, xoá một học sinh thử. Tải lại trang: mọi thứ còn nguyên.
- [ ] 1.9 Kiểm tra trên Supabase (SQL Editor):

  ```sql
  select count(*) from public.students;           -- = số học sinh
  select data_model_version from public.user_settings; -- = 2
  -- Tổng sổ điểm phải bằng điểm hiện tại của từng học sinh (kết quả rỗng là đúng):
  select s.name, s.points, sum(l.amount) as tong_so
  from public.students s join public.point_ledger l on l.student_id = s.id
  group by s.id having s.points <> sum(l.amount);
  ```
  Lưu ý: sau khi nâng cấp, nếu điểm thay đổi mà không kèm dòng lịch sử (vd đặt lại Hào Quang) thì truy vấn cuối có thể có dòng. Đó là bình thường ở Phase 3 (sổ là nhật ký); quan trọng là ngay sau bước 1.7 kết quả phải rỗng.
- [ ] 1.10 (Tuỳ chọn) Thử hoàn tác trên dev: chạy file rollback, tải lại app: app quay về cách lưu cũ với dữ liệu trước lúc nâng cấp. Sau đó chạy lại migration và nâng cấp lại.

Báo lại kết quả bước 1 cho Claude trước khi sang bước 2.

## Bước 2 - Production (dữ liệu thật)

Chỉ làm sau khi bước 1 ổn. Nên làm ngoài giờ dạy.

- [ ] 2.1 **Sao lưu:** trong app thật, Cài đặt > "Export JSON Backup". Thêm nữa, nếu được: Supabase > Database > Backups (gói Free có bản sao lưu hằng ngày nhưng không tải về được; file JSON là bản chắc chắn nhất).
- [ ] 2.2 Gộp PR Phase 3 vào `main` để Vercel triển khai app mới. App mới vẫn dùng cách lưu cũ cho tới khi chạy migration, nên thứ tự 2.2 và 2.3 không bắt buộc, nhưng nên triển khai app trước.
- [ ] 2.3 Supabase dự án thật > SQL Editor: dán file migration, **Run**.
- [ ] 2.4 Mở app, đăng nhập, làm như bước 1.6 - 1.9.
- [ ] 2.5 Mỗi máy/trình duyệt khác của Harry: chỉ cần tải lại trang; máy đã nâng cấp thì máy khác tự đọc bảng mới.

## Nếu có sự cố

| Tình huống | Làm gì |
|---|---|
| Hộp thoại báo "Cần sửa trước khi nâng cấp" | Sửa đúng học sinh được nêu (vd chọn lớp cho em đó), rồi tải lại trang |
| Báo "Chưa nâng cấp được" | Dữ liệu cũ an toàn, app vẫn dùng cách lưu cũ. Bấm "Thử lại"; nếu vẫn lỗi, chụp màn hình gửi Claude |
| Đã nâng cấp nhưng dữ liệu sai | Không thao tác thêm. Chạy trong SQL Editor: `update public.user_settings set data_model_version = 1;` rồi tải lại app: app quay về dữ liệu cũ (thay đổi sau lúc nâng cấp sẽ không có). Báo Claude |
| Muốn gỡ hẳn Phase 3 | Chạy file rollback (xoá các bảng mới). Dữ liệu cũ còn nguyên |

## Chưa làm trong Phase 3 (cần Harry duyệt riêng)

- Đổi tên các hồ sơ giáo viên còn mang tên mặc định cũ "Học sĩ triều đình" thành "Trainer" (sửa dữ liệu thật): `update public.profiles set display_name = 'Trainer' where display_name = 'Học sĩ triều đình';`
- Xoá cột cũ `user_settings.students`, `boss_states_by_class`: để tới Phase 7.
