-- Phase 6 (ADR 0004): bạn bè trong lớp, quà tặng (sticker + lời nhắn định sẵn), ví điểm tặng theo tuần.
--
-- Nguyên tắc:
-- - Học sinh KHÔNG đọc/ghi thẳng bảng nào; mọi thao tác qua hàm security definer có kiểm tra quyền (giống D18).
-- - Giáo viên đọc dữ liệu lớp mình qua RLS, bật/tắt và đặt hạn mức theo lớp, thu hồi quà.
-- - Quà và thu hồi là sổ cái chỉ thêm (không sửa/xoá, trừ khi xoá dây chuyền theo học sinh/giáo viên như D12).
-- - Điểm tặng KHÔNG ghi thẳng vào students.points (app giáo viên đang mở sẽ ghi đè). Chúng nằm ở "hàng chờ":
--   app giáo viên đọc teacher_pending_gift_adjustments() và cộng vào Hào Quang kèm dòng sổ điểm
--   client_event_id = 'gift-<id>' (thu hồi sau khi đã cộng: 'gift-revoke-<id>'). Dòng sổ điểm là dấu "đã cộng",
--   nên gom lại nhiều lần không bao giờ cộng trùng (D23).
-- Chạy lại được. Hoàn tác: supabase/rollback/20261031100000_phase6_social_down.sql

begin;

-- ---------------------------------------------------------------------------
-- 1. Cài đặt theo lớp: mặc định TẮT; hạn mức 5 điểm/tuần, 2 điểm/tuần cho cùng một bạn (D24, D25).
--    Giáo viên sửa bằng quyền update sẵn có trên classes (RLS: chỉ lớp của mình).
-- ---------------------------------------------------------------------------

alter table public.classes add column if not exists social_enabled boolean not null default false;
alter table public.classes add column if not exists gift_weekly_limit smallint not null default 5;
alter table public.classes add column if not exists gift_per_friend_weekly_limit smallint not null default 2;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'classes_gift_limits_check') then
    alter table public.classes add constraint classes_gift_limits_check
      check (gift_weekly_limit between 0 and 50 and gift_per_friend_weekly_limit between 0 and 50);
  end if;
end $$;

-- Tuần tính theo giờ Việt Nam, bắt đầu thứ Hai (vd '2026-W44').
create or replace function public.social_week_key(p_at timestamptz default now())
returns text
language sql
stable
set search_path = public
as $$
  select to_char((p_at at time zone 'Asia/Ho_Chi_Minh')::date, 'IYYY-"W"IW');
$$;

-- Danh mục sticker / lời nhắn: phải khớp src/domain/social.ts (có test đối chiếu).
create or replace function public.social_sticker_ids()
returns text[] language sql immutable as $$
  select array['star', 'heart', 'clap', 'thumbs', 'fire', 'rainbow', 'leaf', 'trophy'];
$$;

create or replace function public.social_message_ids()
returns text[] language sql immutable as $$
  select array['thanks_help', 'great_answer', 'good_job', 'keep_going', 'team_player', 'kind_friend'];
$$;

-- ---------------------------------------------------------------------------
-- 2. Bạn bè: một dòng cho mỗi cặp (lời mời 'pending' hoặc 'accepted'). Từ chối/huỷ/xoá bạn = xoá dòng.
-- ---------------------------------------------------------------------------

create table if not exists public.student_friendships (
  id bigint generated always as identity primary key,
  teacher_id uuid not null,
  class_id uuid not null,
  requester_id uuid not null,
  addressee_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id),
  foreign key (requester_id, teacher_id) references public.students(id, teacher_id) on delete cascade,
  foreign key (addressee_id, teacher_id) references public.students(id, teacher_id) on delete cascade,
  foreign key (class_id, teacher_id) references public.classes(id, teacher_id) on delete cascade
);

create unique index if not exists student_friendships_pair_key
  on public.student_friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists student_friendships_addressee_idx on public.student_friendships (addressee_id);
create index if not exists student_friendships_class_idx on public.student_friendships (class_id);

alter table public.student_friendships enable row level security;
revoke all on public.student_friendships from anon, authenticated;
grant select, delete on public.student_friendships to authenticated;

drop policy if exists "Friendships: teacher reads own" on public.student_friendships;
create policy "Friendships: teacher reads own"
on public.student_friendships for select to authenticated
using (teacher_id = (select auth.uid()));

drop policy if exists "Friendships: teacher deletes own" on public.student_friendships;
create policy "Friendships: teacher deletes own"
on public.student_friendships for delete to authenticated
using (teacher_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. Quà tặng (sổ cái chỉ thêm) + thu hồi (chỉ thêm) + báo cáo.
-- ---------------------------------------------------------------------------

create table if not exists public.student_gifts (
  id bigint generated always as identity primary key,
  teacher_id uuid not null,
  class_id uuid not null,
  sender_id uuid not null,
  recipient_id uuid not null,
  amount smallint not null default 0 check (amount between 0 and 2),
  sticker_id text not null check (sticker_id = any (public.social_sticker_ids())),
  message_id text check (message_id is null or message_id = any (public.social_message_ids())),
  week_key text not null,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id),
  unique (id, teacher_id),
  foreign key (sender_id, teacher_id) references public.students(id, teacher_id) on delete cascade,
  foreign key (recipient_id, teacher_id) references public.students(id, teacher_id) on delete cascade,
  foreign key (class_id, teacher_id) references public.classes(id, teacher_id) on delete cascade
);

create index if not exists student_gifts_sender_week_idx on public.student_gifts (sender_id, week_key);
create index if not exists student_gifts_recipient_time_idx on public.student_gifts (recipient_id, created_at desc);
create index if not exists student_gifts_teacher_time_idx on public.student_gifts (teacher_id, created_at desc);
create index if not exists student_gifts_class_time_idx on public.student_gifts (class_id, created_at desc);

create table if not exists public.student_gift_revocations (
  gift_id bigint primary key,
  teacher_id uuid not null default auth.uid(),
  reason text not null default '' check (char_length(reason) <= 200),
  revoked_at timestamptz not null default now(),
  foreign key (gift_id, teacher_id) references public.student_gifts(id, teacher_id) on delete cascade
);

create table if not exists public.student_gift_reports (
  id bigint generated always as identity primary key,
  gift_id bigint not null,
  teacher_id uuid not null,
  reporter_id uuid not null,
  created_at timestamptz not null default now(),
  unique (gift_id, reporter_id),
  foreign key (gift_id, teacher_id) references public.student_gifts(id, teacher_id) on delete cascade,
  foreign key (reporter_id, teacher_id) references public.students(id, teacher_id) on delete cascade
);

-- Chặn sửa/xoá (cho phép xoá dây chuyền khi xoá học sinh/lớp/giáo viên).
create or replace function public.social_ledger_block_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception '% is append-only (% not allowed)', tg_table_name, tg_op using errcode = '42501';
end;
$$;

drop trigger if exists student_gifts_no_change on public.student_gifts;
create trigger student_gifts_no_change before update or delete on public.student_gifts
for each row execute function public.social_ledger_block_changes();

drop trigger if exists student_gift_revocations_no_change on public.student_gift_revocations;
create trigger student_gift_revocations_no_change before update or delete on public.student_gift_revocations
for each row execute function public.social_ledger_block_changes();

alter table public.student_gifts enable row level security;
alter table public.student_gift_revocations enable row level security;
alter table public.student_gift_reports enable row level security;

revoke all on public.student_gifts, public.student_gift_revocations, public.student_gift_reports from anon, authenticated;
grant select on public.student_gifts, public.student_gift_revocations, public.student_gift_reports to authenticated;
grant insert (gift_id, teacher_id, reason) on public.student_gift_revocations to authenticated;

drop policy if exists "Gifts: teacher reads own" on public.student_gifts;
create policy "Gifts: teacher reads own" on public.student_gifts for select to authenticated
using (teacher_id = (select auth.uid()));

drop policy if exists "Gift revocations: teacher reads own" on public.student_gift_revocations;
create policy "Gift revocations: teacher reads own" on public.student_gift_revocations for select to authenticated
using (teacher_id = (select auth.uid()));

drop policy if exists "Gift revocations: teacher inserts own" on public.student_gift_revocations;
create policy "Gift revocations: teacher inserts own" on public.student_gift_revocations for insert to authenticated
with check (teacher_id = (select auth.uid()));

drop policy if exists "Gift reports: teacher reads own" on public.student_gift_reports;
create policy "Gift reports: teacher reads own" on public.student_gift_reports for select to authenticated
using (teacher_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 4. Hàm cho học sinh. Mỗi hàm tìm "học sinh đang gọi" và dừng nếu không phải học sinh đang hoạt động.
-- ---------------------------------------------------------------------------

create or replace function public.social_current_student()
returns public.students
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me public.students;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  select s.* into v_me
  from public.students s
  join public.profiles p on p.user_id = s.auth_user_id and p.role = 'student'
  where s.auth_user_id = (select auth.uid()) and s.status = 'active';
  if not found then
    raise exception 'not_active_student' using errcode = '42501';
  end if;
  return v_me;
end;
$$;

-- Bạn cùng lớp có thể kết bạn: cùng lớp, có tài khoản, đang hoạt động.
create or replace function public.social_is_reachable_classmate(p_me public.students, p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.students o
    where o.id = p_other and o.id <> p_me.id and o.teacher_id = p_me.teacher_id and o.class_id = p_me.class_id
      and o.auth_user_id is not null and o.status = 'active'
  );
$$;

create or replace function public.social_class_enabled(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select c.social_enabled from public.classes c where c.id = p_class_id), false);
$$;

-- Trạng thái quà: 'revoked' (đã thu hồi), 'applied' (đã cộng vào Hào Quang), 'pending' (đang chờ cộng).
create or replace function public.social_gift_state(p_gift public.student_gifts)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from public.student_gift_revocations r where r.gift_id = p_gift.id) then 'revoked'
    when p_gift.amount = 0 or exists (
      select 1 from public.point_ledger l
      where l.student_id = p_gift.recipient_id and l.client_event_id = 'gift-' || p_gift.id
    ) then 'applied'
    else 'pending'
  end;
$$;

create or replace function public.student_social_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me public.students := public.social_current_student();
  v_class public.classes;
  v_week text := public.social_week_key();
  v_used integer;
begin
  select * into v_class from public.classes c where c.id = v_me.class_id;
  if not coalesce(v_class.social_enabled, false) then
    return jsonb_build_object('enabled', false);
  end if;

  select coalesce(sum(g.amount), 0) into v_used
  from public.student_gifts g where g.sender_id = v_me.id and g.week_key = v_week;

  return jsonb_build_object(
    'enabled', true,
    'me', v_me.id,
    'wallet', jsonb_build_object(
      'week_key', v_week,
      'limit', v_class.gift_weekly_limit,
      'per_friend_limit', v_class.gift_per_friend_weekly_limit,
      'used', v_used
    ),
    -- Bạn bè (đã chấp nhận, còn cùng lớp): tên + Pokémon đồng hành (không có điểm, không có ảnh).
    'friends', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'name', o.name, 'pet_dex_id', o.game_state #> '{pet,dexId}',
        'given_this_week', (select coalesce(sum(g.amount), 0) from public.student_gifts g
                            where g.sender_id = v_me.id and g.recipient_id = o.id and g.week_key = v_week)
      ) order by o.name)
      from public.student_friendships f
      join public.students o on o.id = case when f.requester_id = v_me.id then f.addressee_id else f.requester_id end
      where f.status = 'accepted' and (f.requester_id = v_me.id or f.addressee_id = v_me.id)
        and o.class_id = v_me.class_id and o.status = 'active'
    ), '[]'::jsonb),
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object('request_id', f.id, 'id', o.id, 'name', o.name) order by f.created_at)
      from public.student_friendships f join public.students o on o.id = f.requester_id
      where f.addressee_id = v_me.id and f.status = 'pending' and o.class_id = v_me.class_id and o.status = 'active'
    ), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object('request_id', f.id, 'id', o.id, 'name', o.name) order by f.created_at)
      from public.student_friendships f join public.students o on o.id = f.addressee_id
      where f.requester_id = v_me.id and f.status = 'pending' and o.class_id = v_me.class_id and o.status = 'active'
    ), '[]'::jsonb),
    -- Bạn cùng lớp chưa có quan hệ nào với em (để gửi lời mời). Xếp theo tên, không có thông tin gì khác.
    'classmates', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name) order by o.name)
      from public.students o
      where o.teacher_id = v_me.teacher_id and o.class_id = v_me.class_id and o.id <> v_me.id
        and o.auth_user_id is not null and o.status = 'active'
        and not exists (select 1 from public.student_friendships f
                        where least(f.requester_id, f.addressee_id) = least(v_me.id, o.id)
                          and greatest(f.requester_id, f.addressee_id) = greatest(v_me.id, o.id))
    ), '[]'::jsonb),
    'received', coalesce((
      select jsonb_agg(x.item order by x.created_at desc) from (
        select g.created_at, jsonb_build_object(
          'id', g.id, 'name', o.name, 'amount', g.amount, 'sticker_id', g.sticker_id, 'message_id', g.message_id,
          'created_at', g.created_at, 'state', public.social_gift_state(g),
          'reported', exists (select 1 from public.student_gift_reports r where r.gift_id = g.id and r.reporter_id = v_me.id)
        ) as item
        from public.student_gifts g join public.students o on o.id = g.sender_id
        where g.recipient_id = v_me.id
        order by g.created_at desc limit 20
      ) x
    ), '[]'::jsonb),
    'sent', coalesce((
      select jsonb_agg(x.item order by x.created_at desc) from (
        select g.created_at, jsonb_build_object(
          'id', g.id, 'name', o.name, 'amount', g.amount, 'sticker_id', g.sticker_id, 'message_id', g.message_id,
          'created_at', g.created_at, 'state', public.social_gift_state(g)
        ) as item
        from public.student_gifts g join public.students o on o.id = g.recipient_id
        where g.sender_id = v_me.id
        order by g.created_at desc limit 20
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.student_send_friend_request(p_student_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me public.students := public.social_current_student();
  v_existing public.student_friendships;
begin
  if not public.social_class_enabled(v_me.class_id) then
    raise exception 'social_disabled' using errcode = 'P0001';
  end if;
  if not public.social_is_reachable_classmate(v_me, p_student_id) then
    raise exception 'not_classmate' using errcode = 'P0001';
  end if;

  select * into v_existing from public.student_friendships f
  where least(f.requester_id, f.addressee_id) = least(v_me.id, p_student_id)
    and greatest(f.requester_id, f.addressee_id) = greatest(v_me.id, p_student_id)
  for update;

  if found then
    -- Bạn kia đã mời em trước: coi như em chấp nhận.
    if v_existing.status = 'pending' and v_existing.addressee_id = v_me.id then
      update public.student_friendships set status = 'accepted', responded_at = now() where id = v_existing.id;
      return 'accepted';
    end if;
    return v_existing.status;
  end if;

  -- Chống làm phiền: tối đa 10 lời mời đang chờ.
  if (select count(*) from public.student_friendships f where f.requester_id = v_me.id and f.status = 'pending') >= 10 then
    raise exception 'too_many_requests' using errcode = 'P0001';
  end if;

  insert into public.student_friendships (teacher_id, class_id, requester_id, addressee_id)
  values (v_me.teacher_id, v_me.class_id, v_me.id, p_student_id);
  return 'pending';
end;
$$;

create or replace function public.student_respond_friend_request(p_request_id bigint, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me public.students := public.social_current_student();
begin
  if not public.social_class_enabled(v_me.class_id) then
    raise exception 'social_disabled' using errcode = 'P0001';
  end if;
  if p_accept then
    update public.student_friendships set status = 'accepted', responded_at = now()
    where id = p_request_id and addressee_id = v_me.id and status = 'pending';
  else
    delete from public.student_friendships
    where id = p_request_id and addressee_id = v_me.id and status = 'pending';
  end if;
  if not found then
    raise exception 'request_not_found' using errcode = 'P0001';
  end if;
  return case when p_accept then 'accepted' else 'declined' end;
end;
$$;

-- Huỷ lời mời đã gửi, hoặc thôi làm bạn. Luôn được phép (kể cả khi lớp tắt tính năng).
create or replace function public.student_remove_friend(p_student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me public.students := public.social_current_student();
begin
  delete from public.student_friendships f
  where least(f.requester_id, f.addressee_id) = least(v_me.id, p_student_id)
    and greatest(f.requester_id, f.addressee_id) = greatest(v_me.id, p_student_id);
end;
$$;

create or replace function public.student_send_gift(p_recipient_id uuid, p_amount integer, p_sticker_id text, p_message_id text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me public.students := public.social_current_student();
  v_class public.classes;
  v_week text := public.social_week_key();
  v_used integer;
  v_to_friend integer;
  v_today integer;
  v_id bigint;
begin
  -- Khoá dòng của người gửi: hai lần bấm cùng lúc được xếp hàng, không vượt hạn mức (atomic).
  perform 1 from public.students s where s.id = v_me.id for update;

  select * into v_class from public.classes c where c.id = v_me.class_id;
  if not coalesce(v_class.social_enabled, false) then
    raise exception 'social_disabled' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount < 0 or p_amount > 2 then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;
  if p_sticker_id is null or not (p_sticker_id = any (public.social_sticker_ids()))
     or (p_message_id is not null and not (p_message_id = any (public.social_message_ids()))) then
    raise exception 'invalid_gift' using errcode = 'P0001';
  end if;
  if not public.social_is_reachable_classmate(v_me, p_recipient_id) or not exists (
    select 1 from public.student_friendships f
    where f.status = 'accepted'
      and least(f.requester_id, f.addressee_id) = least(v_me.id, p_recipient_id)
      and greatest(f.requester_id, f.addressee_id) = greatest(v_me.id, p_recipient_id)
  ) then
    raise exception 'not_friend' using errcode = 'P0001';
  end if;

  -- Tối đa 10 món quà mỗi ngày (kể cả quà không kèm điểm).
  select count(*) into v_today from public.student_gifts g
  where g.sender_id = v_me.id
    and g.created_at >= ((now() at time zone 'Asia/Ho_Chi_Minh')::date::timestamp at time zone 'Asia/Ho_Chi_Minh');
  if v_today >= 10 then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;

  if p_amount > 0 then
    select coalesce(sum(g.amount), 0),
           coalesce(sum(g.amount) filter (where g.recipient_id = p_recipient_id), 0)
    into v_used, v_to_friend
    from public.student_gifts g where g.sender_id = v_me.id and g.week_key = v_week;
    if v_used + p_amount > v_class.gift_weekly_limit then
      raise exception 'weekly_limit' using errcode = 'P0001';
    end if;
    if v_to_friend + p_amount > v_class.gift_per_friend_weekly_limit then
      raise exception 'friend_limit' using errcode = 'P0001';
    end if;
  end if;

  insert into public.student_gifts (teacher_id, class_id, sender_id, recipient_id, amount, sticker_id, message_id, week_key)
  values (v_me.teacher_id, v_me.class_id, v_me.id, p_recipient_id, p_amount, p_sticker_id, p_message_id, v_week)
  returning id into v_id;

  return jsonb_build_object('gift_id', v_id);
end;
$$;

-- Học sinh nhận quà báo cho thầy cô (vd quà làm em khó chịu). Không có nội dung tự do.
create or replace function public.student_report_gift(p_gift_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me public.students := public.social_current_student();
begin
  insert into public.student_gift_reports (gift_id, teacher_id, reporter_id)
  select g.id, g.teacher_id, v_me.id from public.student_gifts g
  where g.id = p_gift_id and g.recipient_id = v_me.id
  on conflict (gift_id, reporter_id) do nothing;
  if not exists (select 1 from public.student_gifts g where g.id = p_gift_id and g.recipient_id = v_me.id) then
    raise exception 'gift_not_found' using errcode = 'P0001';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Hàng chờ điểm tặng cho app giáo viên (security invoker: RLS giáo viên áp dụng).
--    Trả các dòng sổ điểm app cần thêm: cộng quà chưa cộng, trừ quà đã cộng rồi bị thu hồi.
-- ---------------------------------------------------------------------------

create or replace function public.teacher_pending_gift_adjustments()
returns table (student_client_id text, client_event_id text, amount integer, reason text, occurred_at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select r.client_id, 'gift-' || g.id, g.amount::integer,
         '🎁 Quà từ ' || s.name || ': +' || g.amount || ' Hào Quang', g.created_at
  from public.student_gifts g
  join public.students r on r.id = g.recipient_id
  join public.students s on s.id = g.sender_id
  where g.teacher_id = (select auth.uid()) and g.amount > 0
    and not exists (select 1 from public.student_gift_revocations v where v.gift_id = g.id)
    and not exists (select 1 from public.point_ledger l where l.student_id = g.recipient_id and l.client_event_id = 'gift-' || g.id)
  union all
  select r.client_id, 'gift-revoke-' || g.id, -g.amount::integer,
         '↩️ Thu hồi quà từ ' || s.name || ': -' || g.amount || ' Hào Quang', v.revoked_at
  from public.student_gifts g
  join public.student_gift_revocations v on v.gift_id = g.id
  join public.students r on r.id = g.recipient_id
  join public.students s on s.id = g.sender_id
  where g.teacher_id = (select auth.uid()) and g.amount > 0
    and exists (select 1 from public.point_ledger l where l.student_id = g.recipient_id and l.client_event_id = 'gift-' || g.id)
    and not exists (select 1 from public.point_ledger l where l.student_id = g.recipient_id and l.client_event_id = 'gift-revoke-' || g.id)
  order by 5;
$$;

-- ---------------------------------------------------------------------------
-- 6. Quyền gọi hàm.
-- ---------------------------------------------------------------------------

revoke all on function public.social_current_student() from public, anon, authenticated;
revoke all on function public.social_is_reachable_classmate(public.students, uuid) from public, anon, authenticated;
revoke all on function public.social_class_enabled(uuid) from public, anon, authenticated;
revoke all on function public.social_gift_state(public.student_gifts) from public, anon, authenticated;
revoke all on function public.social_week_key(timestamptz) from public, anon;
revoke all on function public.social_sticker_ids() from public, anon;
revoke all on function public.social_message_ids() from public, anon;
grant execute on function public.social_week_key(timestamptz), public.social_sticker_ids(), public.social_message_ids() to authenticated;

revoke all on function public.student_social_overview() from public, anon;
revoke all on function public.student_send_friend_request(uuid) from public, anon;
revoke all on function public.student_respond_friend_request(bigint, boolean) from public, anon;
revoke all on function public.student_remove_friend(uuid) from public, anon;
revoke all on function public.student_send_gift(uuid, integer, text, text) from public, anon;
revoke all on function public.student_report_gift(bigint) from public, anon;
revoke all on function public.teacher_pending_gift_adjustments() from public, anon;
grant execute on function public.student_social_overview(), public.student_send_friend_request(uuid),
  public.student_respond_friend_request(bigint, boolean), public.student_remove_friend(uuid),
  public.student_send_gift(uuid, integer, text, text), public.student_report_gift(bigint),
  public.teacher_pending_gift_adjustments() to authenticated;

commit;
