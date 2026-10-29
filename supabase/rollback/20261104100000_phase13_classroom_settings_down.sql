-- Hoàn tác Phase 13C: xoá cột classroom_settings (mất cài đặt Săn Pokémon/thử thách đã lưu trên đám mây;
-- app giáo viên vẫn giữ bản trong localStorage của từng máy và tự coi như chưa có cột).
begin;
alter table public.user_settings drop column if exists classroom_settings;
commit;
