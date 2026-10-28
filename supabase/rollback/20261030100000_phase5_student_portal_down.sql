-- Hoàn tác 20261030100000_phase5_student_portal.sql. Không đụng dữ liệu: chỉ xoá hàm đọc hồ sơ học sinh
-- (cổng học sinh quay về màn chờ của Phase 4).

begin;

drop function if exists public.get_my_student_profile();

commit;
