-- Hoàn tác 20261031100000_phase6_social.sql.
-- CẢNH BÁO: xoá toàn bộ bạn bè, quà tặng, thu hồi, báo cáo và cài đặt xã hội của lớp.
-- Điểm tặng ĐÃ được app giáo viên cộng vào Hào Quang vẫn còn (nằm trong students.points + sổ điểm 'gift-<id>').

begin;

drop function if exists public.teacher_pending_gift_adjustments();
drop function if exists public.student_report_gift(bigint);
drop function if exists public.student_send_gift(uuid, integer, text, text);
drop function if exists public.student_remove_friend(uuid);
drop function if exists public.student_respond_friend_request(bigint, boolean);
drop function if exists public.student_send_friend_request(uuid);
drop function if exists public.student_social_overview();
drop function if exists public.social_gift_state(public.student_gifts);
drop function if exists public.social_class_enabled(uuid);
drop function if exists public.social_is_reachable_classmate(public.students, uuid);
drop function if exists public.social_current_student();

drop table if exists public.student_gift_reports;
drop table if exists public.student_gift_revocations;
drop table if exists public.student_gifts;
drop table if exists public.student_friendships;
drop function if exists public.social_ledger_block_changes();

drop function if exists public.social_sticker_ids();
drop function if exists public.social_message_ids();
drop function if exists public.social_week_key(timestamptz);

alter table public.classes drop constraint if exists classes_gift_limits_check;
alter table public.classes drop column if exists social_enabled;
alter table public.classes drop column if exists gift_weekly_limit;
alter table public.classes drop column if exists gift_per_friend_weekly_limit;

commit;
