-- Hoàn tác Phase 10B (Cửa hàng học sinh). Giữ nguyên dữ liệu học sinh đã đổi; chỉ gỡ hàm, bảng tham chiếu, cột công tắc.
begin;
drop function if exists public.student_set_support(text);
drop function if exists public.student_set_companion(text);
drop function if exists public.student_shop_buy_skill(text);
drop function if exists public.student_shop_hatch_egg();
drop function if exists public.student_shop_buy_egg(text);
drop function if exists public.student_shop_overview();
drop function if exists public.shop_commit(public.students, integer, jsonb, text);
drop function if exists public.shop_skill_catalog(uuid);
drop function if exists public.shop_upsert_pet(jsonb, jsonb);
drop function if exists public.shop_pet_in(jsonb, jsonb);
drop function if exists public.shop_current_student(boolean);
drop table if exists public.shop_default_skills;
drop table if exists public.shop_egg_pool;
alter table public.classes drop column if exists student_shop_enabled;
-- Ràng buộc 'source' giữ nguyên (đã gồm 'student_shop'): sổ cái chỉ được thêm, không sửa, nên không đổi lại các dòng cũ.
commit;
