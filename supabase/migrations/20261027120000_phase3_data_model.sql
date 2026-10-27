-- Phase 3: mô hình dữ liệu mới (ADR docs/adr/0001-phase-3-data-model.md).
-- Bảng classes, students, point_ledger; view student_recent_history; hàm save_teacher_changes;
-- profiles.role; user_settings.data_model_version; gộp docs/phase-3-pending-sql.md.
--
-- Chạy: Supabase Dashboard > SQL Editor, dự án DEV trước. Chạy lại lần hai không lỗi (idempotent).
-- Hoàn tác: supabase/rollback/20261027120000_phase3_data_model_down.sql
-- Không đụng dữ liệu cũ trong user_settings.students / boss_states_by_class (giữ để hoàn tác).

begin;

-- ---------------------------------------------------------------------------
-- 1. SQL chờ từ Phase 2 (docs/phase-3-pending-sql.md)
-- ---------------------------------------------------------------------------

alter table public.user_settings drop column if exists ranks_male;
alter table public.user_settings drop column if exists ranks_female;

alter table public.profiles alter column display_name set default 'Trainer';

-- ---------------------------------------------------------------------------
-- 2. profiles.role: 'teacher' (mặc định) hoặc 'student' (Phase 4, chỉ Edge Function đặt
--    qua app_metadata, client không sửa được).
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists role text not null default 'teacher';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('teacher', 'student'));
  end if;
end $$;

-- Client chỉ được ghi các cột hồ sơ thường, không ghi role.
revoke insert, update on public.profiles from anon, authenticated;
grant insert (user_id, email, display_name, photo_url, last_login_at, updated_at)
  on public.profiles to authenticated;
grant update (user_id, email, display_name, photo_url, last_login_at, updated_at)
  on public.profiles to authenticated;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name, photo_url, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', 'Trainer'),
    coalesce(new.raw_user_meta_data->>'photo_url', new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg'),
    case when new.raw_app_meta_data->>'role' = 'student' then 'student' else 'teacher' end
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    display_name = excluded.display_name,
    photo_url = excluded.photo_url,
    updated_at = now();

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. user_settings.data_model_version: 1 = dữ liệu cũ (cột students), 2 = bảng mới.
--    App chỉ đổi sang 2 sau khi chuyển dữ liệu và đối chiếu khớp.
-- ---------------------------------------------------------------------------

alter table public.user_settings
  add column if not exists data_model_version smallint not null default 1;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_settings_data_model_version_check') then
    alter table public.user_settings
      add constraint user_settings_data_model_version_check check (data_model_version in (1, 2));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Hàm dùng chung
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. classes
-- ---------------------------------------------------------------------------

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  boss_state jsonb check (boss_state is null or jsonb_typeof(boss_state) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (teacher_id, name),
  unique (id, teacher_id)
);

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

alter table public.classes enable row level security;

revoke all on public.classes from anon, authenticated;
grant select, insert, update on public.classes to authenticated;

drop policy if exists "Classes: teacher reads own" on public.classes;
create policy "Classes: teacher reads own"
on public.classes for select to authenticated
using (teacher_id = (select auth.uid()));

drop policy if exists "Classes: teacher inserts own" on public.classes;
create policy "Classes: teacher inserts own"
on public.classes for insert to authenticated
with check (teacher_id = (select auth.uid()));

drop policy if exists "Classes: teacher updates own" on public.classes;
create policy "Classes: teacher updates own"
on public.classes for update to authenticated
using (teacher_id = (select auth.uid()))
with check (teacher_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 6. students
-- ---------------------------------------------------------------------------

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  class_id uuid not null,
  client_id text not null check (char_length(client_id) between 1 and 100),
  name text not null check (char_length(name) between 1 and 100),
  gender text not null check (gender in ('Nam', 'Nữ')),
  points integer not null default 0,
  -- Ảnh base64 tạm thời (Q5), app nén về <= ~200 KB; Phase 5 chuyển sang Storage.
  avatar text check (avatar is null or octet_length(avatar) <= 300000),
  game_state jsonb not null default '{}'::jsonb check (jsonb_typeof(game_state) = 'object'),
  -- Phase 4: tài khoản đăng nhập của học sinh. Client không ghi được hai cột này.
  auth_user_id uuid unique references auth.users(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'locked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, client_id),
  unique (id, teacher_id),
  -- Lớp phải thuộc cùng giáo viên (kiểm tra ở DB, không chỉ dựa vào RLS).
  foreign key (class_id, teacher_id) references public.classes(id, teacher_id) -- no action: kiểm tra cuối câu lệnh, để xoá giáo viên (cascade) không vướng
);

create index if not exists students_class_idx on public.students (class_id, teacher_id);

drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

alter table public.students enable row level security;

revoke all on public.students from anon, authenticated;
grant select, delete on public.students to authenticated;
grant insert (teacher_id, class_id, client_id, name, gender, points, avatar, game_state)
  on public.students to authenticated;
grant update (class_id, name, gender, points, avatar, game_state)
  on public.students to authenticated;

drop policy if exists "Students: teacher reads own" on public.students;
create policy "Students: teacher reads own"
on public.students for select to authenticated
using (teacher_id = (select auth.uid()));

drop policy if exists "Students: teacher inserts own" on public.students;
create policy "Students: teacher inserts own"
on public.students for insert to authenticated
with check (teacher_id = (select auth.uid()));

drop policy if exists "Students: teacher updates own" on public.students;
create policy "Students: teacher updates own"
on public.students for update to authenticated
using (teacher_id = (select auth.uid()))
with check (teacher_id = (select auth.uid()));

-- Q3: xoá học sinh là xoá hẳn (sổ điểm của em đó bị xoá theo).
drop policy if exists "Students: teacher deletes own" on public.students;
create policy "Students: teacher deletes own"
on public.students for delete to authenticated
using (teacher_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 7. point_ledger: sổ điểm chỉ thêm. Không sửa được; chỉ bị xoá theo khi xoá học sinh.
-- ---------------------------------------------------------------------------

create table if not exists public.point_ledger (
  id bigint generated always as identity primary key,
  teacher_id uuid not null default auth.uid(),
  student_id uuid not null,
  amount integer not null,
  reason text not null default '' check (char_length(reason) <= 500),
  client_event_id text not null check (char_length(client_event_id) between 1 and 100),
  source text not null default 'app' check (source in ('app', 'migration', 'opening_balance')),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  unique (student_id, client_event_id),
  foreign key (student_id, teacher_id) references public.students(id, teacher_id) on delete cascade
);

create index if not exists point_ledger_student_time_idx
  on public.point_ledger (student_id, occurred_at desc, id desc);
create index if not exists point_ledger_teacher_idx on public.point_ledger (teacher_id);

create or replace function public.point_ledger_block_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Cho phép xoá khi đến từ khoá ngoại (xoá học sinh / xoá tài khoản giáo viên).
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'point_ledger is append-only (% not allowed)', tg_op
    using errcode = '42501';
end;
$$;

drop trigger if exists point_ledger_no_update on public.point_ledger;
create trigger point_ledger_no_update
before update on public.point_ledger
for each row execute function public.point_ledger_block_changes();

drop trigger if exists point_ledger_no_delete on public.point_ledger;
create trigger point_ledger_no_delete
before delete on public.point_ledger
for each row execute function public.point_ledger_block_changes();

alter table public.point_ledger enable row level security;

revoke all on public.point_ledger from anon, authenticated;
grant select on public.point_ledger to authenticated;
grant insert (teacher_id, student_id, amount, reason, client_event_id, source, occurred_at)
  on public.point_ledger to authenticated;

drop policy if exists "Ledger: teacher reads own" on public.point_ledger;
create policy "Ledger: teacher reads own"
on public.point_ledger for select to authenticated
using (teacher_id = (select auth.uid()));

drop policy if exists "Ledger: teacher inserts own" on public.point_ledger;
create policy "Ledger: teacher inserts own"
on public.point_ledger for insert to authenticated
with check (teacher_id = (select auth.uid()) and created_by = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 8. 50 dòng lịch sử gần nhất mỗi học sinh (RLS của bảng gốc vẫn áp dụng).
--    Bỏ dòng 'opening_balance' (số dư chuyển từ dữ liệu cũ) để lịch sử trên app giữ y như trước.
-- ---------------------------------------------------------------------------

create or replace view public.student_recent_history
with (security_invoker = true) as
select h.student_id, s.client_id as student_client_id, h.client_event_id, h.amount, h.reason, h.occurred_at, h.id
from public.students s
cross join lateral (
  select l.id, l.student_id, l.client_event_id, l.amount, l.reason, l.occurred_at
  from public.point_ledger l
  where l.student_id = s.id and l.source <> 'opening_balance'
  order by l.occurred_at desc, l.id desc
  limit 50
) h;

revoke all on public.student_recent_history from anon, authenticated;
grant select on public.student_recent_history to authenticated;

-- ---------------------------------------------------------------------------
-- 9. save_teacher_changes: ghi một gói thay đổi trong một transaction.
--    security invoker => chạy với quyền giáo viên, RLS và quyền theo cột vẫn áp dụng.
--
-- p_changes = {
--   "classes":  [{ "name": text, "boss_state": object|null }],
--   "students": [{ "client_id", "class_name", "name", "gender", "points", "avatar", "game_state" }],
--   "history":  [{ "student_client_id", "client_event_id", "amount", "reason", "occurred_at_ms", "source" }],
--   "deleted_student_client_ids": [text]
-- }
-- Trả về thời điểm lưu (mili giây).
-- ---------------------------------------------------------------------------

create or replace function public.save_teacher_changes(p_changes jsonb)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_teacher uuid := auth.uid();
  v_missing text;
begin
  if v_teacher is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if jsonb_typeof(p_changes) is distinct from 'object' then
    raise exception 'p_changes must be an object' using errcode = '22023';
  end if;

  -- Lớp: tạo mới hoặc cập nhật trạng thái Boss.
  insert into public.classes (teacher_id, name, boss_state)
  select v_teacher, c->>'name', nullif(c->'boss_state', 'null'::jsonb)
  from jsonb_array_elements(coalesce(p_changes->'classes', '[]'::jsonb)) c
  on conflict (teacher_id, name) do update
    set boss_state = excluded.boss_state;

  -- Lớp còn thiếu của học sinh (không đổi boss_state của lớp đã có).
  insert into public.classes (teacher_id, name)
  select distinct v_teacher, s->>'class_name'
  from jsonb_array_elements(coalesce(p_changes->'students', '[]'::jsonb)) s
  on conflict (teacher_id, name) do nothing;

  -- Học sinh: tạo mới hoặc cập nhật.
  insert into public.students (teacher_id, class_id, client_id, name, gender, points, avatar, game_state)
  select
    v_teacher,
    cl.id,
    s->>'client_id',
    s->>'name',
    s->>'gender',
    (s->>'points')::integer,
    nullif(s->>'avatar', ''),
    coalesce(s->'game_state', '{}'::jsonb)
  from jsonb_array_elements(coalesce(p_changes->'students', '[]'::jsonb)) s
  join public.classes cl on cl.teacher_id = v_teacher and cl.name = s->>'class_name'
  on conflict (teacher_id, client_id) do update
    set class_id = excluded.class_id,
        name = excluded.name,
        gender = excluded.gender,
        points = excluded.points,
        avatar = excluded.avatar,
        game_state = excluded.game_state;

  -- Dòng sổ điểm phải trỏ tới học sinh có thật của giáo viên này (không âm thầm bỏ qua).
  select h->>'student_client_id' into v_missing
  from jsonb_array_elements(coalesce(p_changes->'history', '[]'::jsonb)) h
  where not exists (
    select 1 from public.students st
    where st.teacher_id = v_teacher and st.client_id = h->>'student_client_id'
  )
  limit 1;
  if found then
    raise exception 'history references unknown student %', v_missing using errcode = '23503';
  end if;

  -- Sổ điểm: thêm dòng mới; gửi lại dòng đã có thì bỏ qua.
  insert into public.point_ledger (teacher_id, student_id, amount, reason, client_event_id, source, occurred_at)
  select
    v_teacher,
    st.id,
    (h->>'amount')::integer,
    coalesce(h->>'reason', ''),
    h->>'client_event_id',
    coalesce(h->>'source', 'app'),
    to_timestamp((h->>'occurred_at_ms')::double precision / 1000.0)
  from jsonb_array_elements(coalesce(p_changes->'history', '[]'::jsonb)) with ordinality as e(h, ord)
  join public.students st on st.teacher_id = v_teacher and st.client_id = h->>'student_client_id'
  order by e.ord
  on conflict (student_id, client_event_id) do nothing;

  -- Xoá hẳn học sinh (Q3); sổ điểm của em đó bị xoá theo.
  delete from public.students
  where teacher_id = v_teacher
    and client_id in (
      select jsonb_array_elements_text(coalesce(p_changes->'deleted_student_client_ids', '[]'::jsonb))
    );

  return (extract(epoch from clock_timestamp()) * 1000)::bigint;
end;
$$;

revoke all on function public.save_teacher_changes(jsonb) from public, anon;
grant execute on function public.save_teacher_changes(jsonb) to authenticated;

commit;
