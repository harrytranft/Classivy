-- Hoàn tác Phase 12C: gỡ hàm Hợp nhất của học sinh. Pokémon đã hợp nhất giữ nguyên (chỉ là dữ liệu bình thường).
begin;
drop function if exists public.student_fuse_pets(text[]);
drop function if exists public.shop_total_xp_for_level(integer);
drop function if exists public.shop_pet_level(jsonb);
commit;
