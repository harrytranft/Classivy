# SQL chờ gộp vào migration Phase 3

> **Đã gộp (2026-10-27)** vào `supabase/migrations/20261027120000_phase3_data_model.sql`: mục 1 và phần mặc định/hàm trigger của mục 2. Phần "đổi tên hồ sơ cũ" (sửa dữ liệu thật) vẫn chờ Harry duyệt, xem `docs/phase-3-runbook.md`. File này giữ lại để tra cứu.

Các thay đổi schema phát sinh ở Phase 2. **Không chạy riêng.** Khi viết migration Phase 3 trong `supabase/migrations/`, gộp các đoạn dưới đây (kèm phần hoàn tác) rồi chạy theo quy trình của Phase 3 (dev trước, sao lưu, Harry xác nhận).

## 1. Bỏ cột cấp bậc (D7, task 2.0)

App đã thôi đọc/ghi hai cột này từ task 2.0.

```sql
alter table public.user_settings drop column if exists ranks_male;
alter table public.user_settings drop column if exists ranks_female;

-- Hoàn tác (dữ liệu cũ trong cột không lấy lại được; cần bản sao lưu nếu muốn giữ):
-- alter table public.user_settings add column ranks_male jsonb not null default '[]'::jsonb;
-- alter table public.user_settings add column ranks_female jsonb not null default '[]'::jsonb;
```

## 2. Tên hiển thị mặc định "Học sĩ triều đình" -> "Trainer" (task 2.8)

App (`AuthContext.tsx`) đã dùng "Trainer" khi hồ sơ chưa có tên. Trên Supabase, giá trị mặc định của cột và hàm tạo hồ sơ khi đăng ký vẫn là "Học sĩ triều đình".

```sql
alter table public.profiles alter column display_name set default 'Trainer';

-- Trong hàm trigger tạo hồ sơ (xem supabase-schema.sql, hàm insert vào public.profiles),
-- thay chuỗi dự phòng 'Học sĩ triều đình' bằng 'Trainer' rồi `create or replace function` lại.

-- Tuỳ chọn, CẦN HARRY DUYỆT (sửa dữ liệu thật): đổi tên các hồ sơ còn mang tên mặc định cũ.
-- update public.profiles set display_name = 'Trainer' where display_name = 'Học sĩ triều đình';

-- Hoàn tác:
-- alter table public.profiles alter column display_name set default 'Học sĩ triều đình';
```
