-- Hoàn tác 20261101100000_phase7_hardening.sql: trả các policy về như sau Phase 6 (không chốt vai trò),
-- bỏ cột students.revision và save_teacher_changes_v2. App mới tự quay về save_teacher_changes khi không có v2.
-- Không cấp lại quyền gọi trực tiếp hàm trigger (không cần).

begin;

drop policy if exists "Classes: teacher reads own" on public.classes;
create policy "Classes: teacher reads own" on public.classes for select to authenticated using (teacher_id = (select auth.uid()));
drop policy if exists "Classes: teacher inserts own" on public.classes;
create policy "Classes: teacher inserts own" on public.classes for insert to authenticated with check (teacher_id = (select auth.uid()));
drop policy if exists "Classes: teacher updates own" on public.classes;
create policy "Classes: teacher updates own" on public.classes for update to authenticated
using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()));

drop policy if exists "Students: teacher reads own" on public.students;
create policy "Students: teacher reads own" on public.students for select to authenticated using (teacher_id = (select auth.uid()));
drop policy if exists "Students: teacher inserts own" on public.students;
create policy "Students: teacher inserts own" on public.students for insert to authenticated with check (teacher_id = (select auth.uid()));
drop policy if exists "Students: teacher updates own" on public.students;
create policy "Students: teacher updates own" on public.students for update to authenticated
using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()));
drop policy if exists "Students: teacher deletes own" on public.students;
create policy "Students: teacher deletes own" on public.students for delete to authenticated using (teacher_id = (select auth.uid()));

drop policy if exists "Ledger: teacher reads own" on public.point_ledger;
create policy "Ledger: teacher reads own" on public.point_ledger for select to authenticated using (teacher_id = (select auth.uid()));
drop policy if exists "Ledger: teacher inserts own" on public.point_ledger;
create policy "Ledger: teacher inserts own" on public.point_ledger for insert to authenticated
with check (teacher_id = (select auth.uid()) and created_by = (select auth.uid()));

drop policy if exists "Settings are readable by owner" on public.user_settings;
create policy "Settings are readable by owner" on public.user_settings for select using (auth.uid() = user_id);
drop policy if exists "Settings are insertable by owner" on public.user_settings;
create policy "Settings are insertable by owner" on public.user_settings for insert with check (auth.uid() = user_id);
drop policy if exists "Settings are updatable by owner" on public.user_settings;
create policy "Settings are updatable by owner" on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Audit log: teacher reads own" on public.teacher_audit_log;
create policy "Audit log: teacher reads own" on public.teacher_audit_log for select to authenticated using (teacher_id = (select auth.uid()));

drop policy if exists "Friendships: teacher reads own" on public.student_friendships;
create policy "Friendships: teacher reads own" on public.student_friendships for select to authenticated using (teacher_id = (select auth.uid()));
drop policy if exists "Friendships: teacher deletes own" on public.student_friendships;
create policy "Friendships: teacher deletes own" on public.student_friendships for delete to authenticated using (teacher_id = (select auth.uid()));
drop policy if exists "Gifts: teacher reads own" on public.student_gifts;
create policy "Gifts: teacher reads own" on public.student_gifts for select to authenticated using (teacher_id = (select auth.uid()));
drop policy if exists "Gift revocations: teacher reads own" on public.student_gift_revocations;
create policy "Gift revocations: teacher reads own" on public.student_gift_revocations for select to authenticated using (teacher_id = (select auth.uid()));
drop policy if exists "Gift revocations: teacher inserts own" on public.student_gift_revocations;
create policy "Gift revocations: teacher inserts own" on public.student_gift_revocations for insert to authenticated with check (teacher_id = (select auth.uid()));
drop policy if exists "Gift reports: teacher reads own" on public.student_gift_reports;
create policy "Gift reports: teacher reads own" on public.student_gift_reports for select to authenticated using (teacher_id = (select auth.uid()));

drop function if exists public.save_teacher_changes_v2(jsonb);
drop trigger if exists students_bump_revision on public.students;
drop function if exists public.students_bump_revision();
alter table public.students drop column if exists revision;
drop function if exists public.is_teacher();

commit;
