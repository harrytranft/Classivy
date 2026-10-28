-- Phase 10B (D32, D33): Cửa hàng học sinh. Học sinh mua trứng, mua skill, ấp nhanh trứng và đổi Pokémon
-- đồng hành/hỗ trợ ở nhà. Mọi thao tác là một hàm DB security definer: kiểm tra tài khoản đang hoạt động,
-- kiểm tra giáo viên đã bật Cửa hàng cho lớp (mặc định TẮT), khoá dòng học sinh, kiểm số dư, trừ điểm,
-- ghi sổ điểm (append-only) và sửa students.game_state trong CÙNG một giao dịch (atomic).
-- students.revision tự tăng (trigger Phase 7) nên app giáo viên đang mở sẽ bị báo "dữ liệu cũ" khi lưu, không ghi đè.
-- Học sinh KHÔNG được mở thêm quyền đọc/ghi bảng nào: chỉ gọi các hàm bên dưới.
-- Luật game giữ nguyên như app giáo viên: trứng thường 10đ / đặc biệt 20đ; mua trứng thay trứng cũ và cất
-- Pokémon đồng hành vào bộ sưu tập; ấp nhanh tốn số điểm còn thiếu; skill cho Pokémon đồng hành, mỗi skill tối đa 2 lượt.
-- Chạy lại được. Hoàn tác: supabase/rollback/20261102100000_phase10_student_shop_down.sql

begin;

-- ---------------------------------------------------------------------------
-- 1. Công tắc theo lớp (giáo viên sửa bằng quyền update sẵn có trên classes) + nguồn sổ điểm mới
-- ---------------------------------------------------------------------------

alter table public.classes add column if not exists student_shop_enabled boolean not null default false;

do $$
declare v_name text;
begin
  for v_name in
    select c.conname from pg_constraint c
    where c.conrelid = 'public.point_ledger'::regclass and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%opening_balance%'
  loop
    execute format('alter table public.point_ledger drop constraint %I', v_name);
  end loop;
  alter table public.point_ledger add constraint point_ledger_source_check
    check (source in ('app', 'migration', 'opening_balance', 'student_shop'));
end $$;

-- ---------------------------------------------------------------------------
-- 2. Dữ liệu tham chiếu: kho Pokémon cho trứng và danh sách skill mặc định (khớp src/data/pokemonData.ts).
--    Không ai ngoài hàm security definer đọc được. Skill giáo viên tự chỉnh (user_settings.pet_skills) được ưu tiên.
-- ---------------------------------------------------------------------------

create table if not exists public.shop_egg_pool (dex_id integer primary key, is_special boolean not null);
create table if not exists public.shop_default_skills (
  id text primary key, name text not null, icon text not null, cost integer not null check (cost > 0), description text not null
);
alter table public.shop_egg_pool enable row level security;
alter table public.shop_default_skills enable row level security;
revoke all on public.shop_egg_pool, public.shop_default_skills from public, anon, authenticated;

insert into public.shop_egg_pool (dex_id, is_special) values (1,false),(2,false),(3,false),(4,false),(5,false),(6,false),(7,false),(8,false),(9,false),(10,false),(11,false),(12,false),(13,false),(14,false),(15,false),(16,false),(17,false),(18,false),(19,false),(20,false),(21,false),(22,false),(23,false),(24,false),(25,false),(26,false),(27,false),(28,false),(29,false),(30,false),(31,false),(32,false),(33,false),(34,false),(35,false),(36,false),(37,false),(38,false),(39,false),(40,false),(41,false),(42,false),(43,false),(44,false),(45,false),(46,false),(47,false),(48,false),(49,false),(50,false),(51,false),(52,false),(53,false),(54,false),(55,false),(56,false),(57,false),(58,false),(59,false),(60,false),(61,false),(62,false),(63,false),(64,false),(65,false),(66,false),(67,false),(68,false),(69,false),(70,false),(71,false),(72,false),(73,false),(74,false),(75,false),(76,false),(77,false),(78,false),(79,false),(80,false),(81,false),(82,false),(83,false),(84,false),(85,false),(86,false),(87,false),(88,false),(89,false),(90,false),(91,false),(92,false),(93,false),(94,false),(95,false),(96,false),(97,false),(98,false),(99,false),(100,false),(101,false),(102,false),(103,false),(104,false),(105,false),(106,false),(107,false),(108,false),(109,false),(110,false),(111,false),(112,false),(113,false),(114,false),(115,false),(116,false),(117,false),(118,false),(119,false),(120,false),(121,false),(122,false),(123,false),(124,false),(125,false),(126,false),(127,false),(128,false),(129,false),(130,false),(131,false),(132,false),(133,false),(134,false),(135,false),(136,false),(137,false),(138,false),(139,false),(140,false),(141,false),(142,false),(143,false),(144,true),(145,true),(146,true),(147,false),(148,false),(149,false),(150,true),(151,true),(152,false),(153,false),(154,false),(155,false),(156,false),(157,false),(158,false),(159,false),(160,false),(161,false),(162,false),(163,false),(164,false),(165,false),(166,false),(167,false),(168,false),(169,false),(170,false),(171,false),(172,false),(173,false),(174,false),(175,false),(176,false),(177,false),(178,false),(179,false),(180,false),(181,false),(182,false),(183,false),(184,false),(185,false),(186,false),(187,false),(188,false),(189,false),(190,false),(191,false),(192,false),(193,false),(194,false),(195,false),(196,false),(197,false),(198,false),(199,false),(200,false),(201,false),(202,false),(203,false),(204,false),(205,false),(206,false),(207,false),(208,false),(209,false),(210,false),(211,false),(212,false),(213,false),(214,false),(215,false),(216,false),(217,false),(218,false),(219,false),(220,false),(221,false),(222,false),(223,false),(224,false),(225,false),(226,false),(227,false),(228,false),(229,false),(230,false),(231,false),(232,false),(233,false),(234,false),(235,false),(236,false),(237,false),(238,false),(239,false),(240,false),(241,false),(242,false),(243,true),(244,true),(245,true),(246,false),(247,false),(248,false),(249,true),(250,true),(251,true),(252,false),(253,false),(254,false),(255,false),(256,false),(257,false),(258,false),(259,false),(260,false),(261,false),(262,false),(263,false),(264,false),(265,false),(266,false),(267,false),(268,false),(269,false),(270,false),(271,false),(272,false),(273,false),(274,false),(275,false),(276,false),(277,false),(278,false),(279,false),(280,false),(281,false),(282,false),(283,false),(284,false),(285,false),(286,false),(287,false),(288,false),(289,false),(290,false),(291,false),(292,false),(293,false),(294,false),(295,false),(296,false),(297,false),(298,false),(299,false),(300,false),(301,false),(302,false),(303,false),(304,false),(305,false),(306,false),(307,false),(308,false),(309,false),(310,false),(311,false),(312,false),(313,false),(314,false),(315,false),(316,false),(317,false),(318,false),(319,false),(320,false),(321,false),(322,false),(323,false),(324,false),(325,false),(326,false),(327,false),(328,false),(329,false),(330,false),(331,false),(332,false),(333,false),(334,false),(335,false),(336,false),(337,false),(338,false),(339,false),(340,false),(341,false),(342,false),(343,false),(344,false),(345,false),(346,false),(347,false),(348,false),(349,false),(350,false),(351,false),(352,false),(353,false),(354,false),(355,false),(356,false),(357,false),(358,false),(359,false),(360,false),(361,false),(362,false),(363,false),(364,false),(365,false),(366,false),(367,false),(368,false),(369,false),(370,false),(371,false),(372,false),(373,false),(374,false),(375,false),(376,false),(377,true),(378,true),(379,true),(380,true),(381,true),(382,true),(383,true),(384,true),(385,true),(386,true),(387,false),(388,false),(389,false),(390,false),(391,false),(392,false),(393,false),(394,false),(395,false),(396,false),(397,false),(398,false),(399,false),(400,false),(401,false),(402,false),(403,false),(404,false),(405,false),(406,false),(407,false),(408,false),(409,false),(410,false),(411,false),(412,false),(413,false),(414,false),(415,false),(416,false),(417,false),(418,false),(419,false),(420,false),(421,false),(422,false),(423,false),(424,false),(425,false),(426,false),(427,false),(428,false),(429,false),(430,false),(431,false),(432,false),(433,false),(434,false),(435,false),(436,false),(437,false),(438,false),(439,false),(440,false),(441,false),(442,false),(443,false),(444,false),(445,false),(446,false),(447,false),(448,false),(449,false),(450,false),(451,false),(452,false),(453,false),(454,false),(455,false),(456,false),(457,false),(458,false),(459,false),(460,false),(461,false),(462,false),(463,false),(464,false),(465,false),(466,false),(467,false),(468,false),(469,false),(470,false),(471,false),(472,false),(473,false),(474,false),(475,false),(476,false),(477,false),(478,false),(479,false),(480,true),(481,true),(482,true),(483,true),(484,true),(485,true),(486,true),(487,true),(488,true),(489,false),(490,false),(491,true),(492,true),(493,true),(494,true),(495,false),(496,false),(497,false),(498,false),(499,false),(500,false),(501,false),(502,false),(503,false),(504,false),(505,false),(506,false),(507,false),(508,false),(509,false),(510,false),(511,false),(512,false),(513,false),(514,false),(515,false),(516,false),(517,false),(518,false),(519,false),(520,false),(521,false),(522,false),(523,false),(524,false),(525,false),(526,false),(527,false),(528,false),(529,false),(530,false),(531,false),(532,false),(533,false),(534,false),(535,false),(536,false),(537,false),(538,false),(539,false),(540,false),(541,false),(542,false),(543,false),(544,false),(545,false),(546,false),(547,false),(548,false),(549,false),(550,false),(551,false),(552,false),(553,false),(554,false),(555,false),(556,false),(557,false),(558,false),(559,false),(560,false),(561,false),(562,false),(563,false),(564,false),(565,false),(566,false),(567,false),(568,false),(569,false),(570,false),(571,false),(572,false),(573,false),(574,false),(575,false),(576,false),(577,false),(578,false),(579,false),(580,false),(581,false),(582,false),(583,false),(584,false),(585,false),(586,false),(587,false),(588,false),(589,false),(590,false),(591,false),(592,false),(593,false),(594,false),(595,false),(596,false),(597,false),(598,false),(599,false),(600,false),(601,false),(602,false),(603,false),(604,false),(605,false),(606,false),(607,false),(608,false),(609,false),(610,false),(611,false),(612,false),(613,false),(614,false),(615,false),(616,false),(617,false),(618,false),(619,false),(620,false),(621,false),(622,false),(623,false),(624,false),(625,false),(626,false),(627,false),(628,false),(629,false),(630,false),(631,false),(632,false),(633,false),(634,false),(635,false),(636,false),(637,false),(638,true),(639,true),(640,true),(641,true),(642,true),(643,true),(644,true),(645,true),(646,true),(647,true),(648,true),(649,true),(650,false),(651,false),(652,false),(653,false),(654,false),(655,false),(656,false),(657,false),(658,false),(659,false),(660,false),(661,false),(662,false),(663,false),(664,false),(665,false),(666,false),(667,false),(668,false),(669,false),(670,false),(671,false),(672,false),(673,false),(674,false),(675,false),(676,false),(677,false),(678,false),(679,false),(680,false),(681,false),(682,false),(683,false),(684,false),(685,false),(686,false),(687,false),(688,false),(689,false),(690,false),(691,false),(692,false),(693,false),(694,false),(695,false),(696,false),(697,false),(698,false),(699,false),(700,false),(701,false),(702,false),(703,false),(704,false),(705,false),(706,false),(707,false),(708,false),(709,false),(710,false),(711,false),(712,false),(713,false),(714,false),(715,false),(716,true),(717,true),(718,true),(719,true),(720,true),(721,true),(722,false),(723,false),(724,false),(725,false),(726,false),(727,false),(728,false),(729,false),(730,false),(731,false),(732,false),(733,false),(734,false),(735,false),(736,false),(737,false),(738,false),(739,false),(740,false),(741,false),(742,false),(743,false),(744,false),(745,false),(746,false),(747,false),(748,false),(749,false),(750,false),(751,false),(752,false),(753,false),(754,false),(755,false),(756,false),(757,false),(758,false),(759,false),(760,false),(761,false),(762,false),(763,false),(764,false),(765,false),(766,false),(767,false),(768,false),(769,false),(770,false),(771,false),(772,true),(773,true),(774,false),(775,false),(776,false),(777,false),(778,false),(779,false),(780,false),(781,false),(782,false),(783,false),(784,false),(785,true),(786,true),(787,true),(788,true),(789,true),(790,true),(791,true),(792,true),(793,false),(794,false),(795,false),(796,false),(797,false),(798,false),(799,false),(800,true),(801,true),(802,true),(803,false),(804,false),(805,false),(806,false),(807,true),(808,true),(809,true),(810,false),(811,false),(812,false),(813,false),(814,false),(815,false),(816,false),(817,false),(818,false),(819,false),(820,false),(821,false),(822,false),(823,false),(824,false),(825,false),(826,false),(827,false),(828,false),(829,false),(830,false),(831,false),(832,false),(833,false),(834,false),(835,false),(836,false),(837,false),(838,false),(839,false),(840,false),(841,false),(842,false),(843,false),(844,false),(845,false),(846,false),(847,false),(848,false),(849,false),(850,false),(851,false),(852,false),(853,false),(854,false),(855,false),(856,false),(857,false),(858,false),(859,false),(860,false),(861,false),(862,false),(863,false),(864,false),(865,false),(866,false),(867,false),(868,false),(869,false),(870,false),(871,false),(872,false),(873,false),(874,false),(875,false),(876,false),(877,false),(878,false),(879,false),(880,false),(881,false),(882,false),(883,false),(884,false),(885,false),(886,false),(887,false),(888,true),(889,true),(890,true),(891,true),(892,true),(893,true),(894,true),(895,true),(896,true),(897,true),(898,true),(899,false),(900,false),(901,false),(902,false),(903,false),(904,false),(905,true),(906,false),(907,false),(908,false),(909,false),(910,false),(911,false),(912,false),(913,false),(914,false),(915,false),(916,false),(917,false),(918,false),(919,false),(920,false),(921,false),(922,false),(923,false),(924,false),(925,false),(926,false),(927,false),(928,false),(929,false),(930,false),(931,false),(932,false),(933,false),(934,false),(935,false),(936,false),(937,false),(938,false),(939,false),(940,false),(941,false),(942,false),(943,false),(944,false),(945,false),(946,false),(947,false),(948,false),(949,false),(950,false),(951,false),(952,false),(953,false),(954,false),(955,false),(956,false),(957,false),(958,false),(959,false),(960,false),(961,false),(962,false),(963,false),(964,false),(965,false),(966,false),(967,false),(968,false),(969,false),(970,false),(971,false),(972,false),(973,false),(974,false),(975,false),(976,false),(977,false),(978,false),(979,false),(980,false),(981,false),(982,false),(983,false),(984,false),(985,false),(986,false),(987,false),(988,false),(989,false),(990,false),(991,false),(992,false),(993,false),(994,false),(995,false),(996,false),(997,false),(998,false),(999,false),(1000,false),(1001,true),(1002,true),(1003,true),(1004,true),(1005,false),(1006,false),(1007,true),(1008,true),(1009,true),(1010,true),(1011,false),(1012,false),(1013,false),(1014,true),(1015,true),(1016,true),(1017,true),(1018,false),(1019,false),(1020,true),(1021,true),(1022,true),(1023,true),(1024,true),(1025,true)
on conflict (dex_id) do update set is_special = excluded.is_special;

insert into public.shop_default_skills (id, name, icon, cost, description) values
  ('sk_evade','Skill Né Trực Diện','💨',25,'Khi giáo viên gọi trả lời câu hỏi khó, có quyền trao lại quyền trả lời cho bạn khác.'),
  ('sk_guard','Lá Chắn Hộ Vệ','🛡️',20,'Giảm 50% số điểm bị phạt của lần đầu sai sót trong ngày.'),
  ('sk_double','Pháp Bảo Nhân Đôi','🎰',30,'Cơ hội nhân đôi (+100%) số điểm nhận được từ một câu trả lời xuất sắc.'),
  ('sk_rescue','Hộ Tống Đồng Đội','🤝',20,'Được tặng tối đa 3 điểm của mình để cứu viện một bạn khác bị phạt.'),
  ('sk_swap','Đổi Đề Thần Tốc','🔄',22,'Yêu cầu Thầy/Cô đổi câu hỏi khác dễ hơn nếu câu hiện tại quá khó.'),
  ('sk_decree','Đồng Đội Hỗ Trợ','📜',26,'Được phép mời một Trainer bất kỳ cùng thảo luận để hỗ trợ trả lời câu hỏi.'),
  ('sk_survival','Kim Bài Miễn Tử','🎫',40,'Bỏ qua một lần bị trừ điểm (muộn học, quên bài tập, nghịch đồ, vv.)'),
  ('sk_clairvoyance','Mắt Thần Trí Tuệ','👁️',24,'Được nhận một gợi ý trực tiếp từ Thầy/Cô trước khi chốt đáp án.'),
  ('sk_companion','Trợ Thủ Tra Cứu','📖',16,'Được đặc cách mở vở xem tài liệu hoặc tra cứu trong vòng 30 giây.'),
  ('sk_rapid','Cướp Quyền Tranh Đoạt','⚡',20,'Được ưu tiên tuyệt đối giành quyền phát biểu đầu tiên khi giơ tay.'),
  ('sk_soul_link','Đồng Tâm Hiệp Lực','🔗',30,'Khi bạn cùng bàn của bạn trả lời đúng, bạn cũng được cộng ké 1 điểm ấm lòng.'),
  ('sk_lucky','Vòng Quay Tự Tin','🎡',24,'Nhận ngay +2 điểm nếu bạn được gọi trúng qua nút Random.'),
  ('sk_cloak','Tàng Hình Chi Thuật','🌫️',28,'Bật ẩn thân để không bị gọi tên trả lời câu hỏi hoặc giao nhiệm vụ trong 1 tiết học.'),
  ('sk_furious','Khiên Chắn Phản Đòn','💥',18,'Phá giải hoàn toàn trò đùa giỡn, cướp điểm từ bạn bè khác.'),
  ('sk_dual','Song Kiếm Hợp Bích','⚔️',25,'Đồng trả lời câu hỏi khó cùng 1 bạn khác, cả 2 đều được hưởng trọn số điểm cộng.'),
  ('sk_recovery','Sám Hối Thu Hồi','⚖️',25,'Xin phục hồi 50% số điểm vừa bị trừ bằng cách hứa tiếp thu tích cực.'),
  ('sk_blessing','Phúc Lành Trấn An','✨',20,'Khiến cả lớp nhận hiệu ứng cộng thêm 1 điểm khi ai đó trả lời đúng.'),
  ('sk_inspire','Truyền Cảm Hứng','🗣️',18,'Trainer dũng cảm mở màn nhận xét bài học sẽ nhận điểm gấp đôi.'),
  ('sk_healing','Bạch Ngọc Chữa Lành','💚',22,'Rút lại 1 kết quả trừ điểm gần nhất trong ngày hôm nay của chính mình.'),
  ('sk_scholar','Ủy Thác Trạng Nguyên','🎖️',35,'Nhờ vả Trạng Nguyên bảng xếp hạng gánh tạ câu hỏi và chia đôi cát-xê điểm.'),
  ('sk_time_warp','Bẻ Cong Thời Gian','⏳',20,'Yêu cầu cộng thêm 10 giây thời gian suy nghĩ bài kiểm tra hoặc trả lời câu hỏi.'),
  ('sk_emperor','Sức Mạnh Thiên Tử','👑',50,'Lần thăng cấp tiếp theo của bạn sẽ cộng thêm 5 điểm Hào Quang bonus.')
on conflict (id) do update set name = excluded.name, icon = excluded.icon, cost = excluded.cost, description = excluded.description;


-- ---------------------------------------------------------------------------
-- 3. Hàm phụ (nội bộ, không cấp cho API)
-- ---------------------------------------------------------------------------

-- Học sinh đang đăng nhập (khoá dòng để hai thao tác cùng lúc không đè nhau).
-- p_require_open = true: lớp phải đang bật Cửa hàng, nếu không báo 'shop_closed'.
create or replace function public.shop_current_student(p_require_open boolean)
returns public.students
language plpgsql
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
  where s.auth_user_id = (select auth.uid()) and s.status = 'active'
  for update of s;
  if not found then
    raise exception 'not_active_student' using errcode = '42501';
  end if;
  if p_require_open and not coalesce((select c.student_shop_enabled from public.classes c where c.id = v_me.class_id), false) then
    raise exception 'shop_closed';
  end if;
  return v_me;
end;
$$;

-- Thú có instanceId này đã nằm trong danh sách chưa?
create or replace function public.shop_pet_in(p_pets jsonb, p_pet jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select exists (
    select 1 from jsonb_array_elements(coalesce(p_pets, '[]'::jsonb)) e
    where e->>'instanceId' is not distinct from p_pet->>'instanceId'
      and (p_pet->>'instanceId' is not null or e->>'dexId' = p_pet->>'dexId')
  );
$$;

-- Ghi bản mới của một thú vào danh sách (thay đúng thú đó, hoặc thêm lên đầu nếu chưa có).
create or replace function public.shop_upsert_pet(p_pets jsonb, p_pet jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select case
    when public.shop_pet_in(p_pets, p_pet) then (
      select coalesce(jsonb_agg(case
        when e->>'instanceId' is not distinct from p_pet->>'instanceId'
             and (p_pet->>'instanceId' is not null or e->>'dexId' = p_pet->>'dexId')
        then p_pet else e end order by o), '[]'::jsonb)
      from jsonb_array_elements(coalesce(p_pets, '[]'::jsonb)) with ordinality as t(e, o))
    else jsonb_build_array(p_pet) || coalesce(p_pets, '[]'::jsonb)
  end;
$$;

-- Danh sách kỹ năng bán: kỹ năng riêng của giáo viên nếu có, không thì bộ mặc định.
create or replace function public.shop_skill_catalog(p_teacher uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
    when jsonb_typeof(us.pet_skills) = 'array' and jsonb_array_length(us.pet_skills) > 0 then us.pet_skills
    else (select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'icon', d.icon, 'cost', d.cost, 'description', d.description) order by d.cost, d.id), '[]'::jsonb)
          from public.shop_default_skills d)
  end
  from (select 1) x
  left join public.user_settings us on us.user_id = p_teacher;
$$;

-- Ghi sổ cái + cập nhật điểm/dữ liệu trong một bước (gọi trong cùng giao dịch với hàm mua).
create or replace function public.shop_commit(p_me public.students, p_cost integer, p_state jsonb, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.students;
begin
  update public.students
     set points = points - p_cost, game_state = p_state
   where id = p_me.id
   returning * into v_row;
  if p_cost > 0 then
    insert into public.point_ledger (teacher_id, student_id, amount, reason, client_event_id, source, created_by)
    values (p_me.teacher_id, p_me.id, -p_cost, left(p_reason, 500), 'shop-' || gen_random_uuid()::text, 'student_shop', (select auth.uid()));
  end if;
  return jsonb_build_object('points', v_row.points, 'revision', v_row.revision);
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Hàm cho học sinh (đều chỉ chạy cho học sinh đang hoạt động, sửa dữ liệu của chính em)
-- ---------------------------------------------------------------------------

create or replace function public.student_shop_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me public.students;
  v_enabled boolean;
  v_egg jsonb;
begin
  select s.* into v_me
  from public.students s
  join public.profiles p on p.user_id = s.auth_user_id and p.role = 'student'
  where s.auth_user_id = (select auth.uid()) and s.status = 'active';
  if not found then
    raise exception 'not_active_student' using errcode = '42501';
  end if;
  v_enabled := coalesce((select c.student_shop_enabled from public.classes c where c.id = v_me.class_id), false);
  v_egg := v_me.game_state->'egg';
  return jsonb_build_object(
    'enabled', v_enabled,
    'points', v_me.points,
    'revision', v_me.revision,
    'eggPrices', jsonb_build_object('normal', 10, 'special', 20),
    'skills', case when v_enabled then public.shop_skill_catalog(v_me.teacher_id) else '[]'::jsonb end
  );
end;
$$;

create or replace function public.student_shop_buy_egg(p_kind text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me public.students := public.shop_current_student(true);
  v_state jsonb := coalesce(v_me.game_state, '{}'::jsonb);
  v_cost integer;
  v_required integer;
  v_dex integer;
  v_special boolean;
  v_pet jsonb := v_state->'pet';
  v_egg jsonb;
begin
  if p_kind not in ('normal', 'special') then
    raise exception 'invalid_item';
  end if;
  if v_state->'egg'->>'status' = 'egg' then
    raise exception 'egg_in_progress';
  end if;
  v_cost := case p_kind when 'special' then 20 else 10 end;
  v_required := case p_kind when 'special' then 15 else 10 end;
  if v_me.points < v_cost then
    raise exception 'not_enough_points';
  end if;

  v_special := p_kind = 'special' or (random() * 100) >= 80;
  select e.dex_id into v_dex from public.shop_egg_pool e where e.is_special = v_special order by random() limit 1;

  v_egg := jsonb_build_object(
    'instanceId', 'egg-' || gen_random_uuid()::text,
    'progress', 0, 'status', 'egg', 'assignedDexId', v_dex, 'kind', p_kind,
    'requiredProgress', v_required,
    'acquiredAt', (extract(epoch from clock_timestamp()) * 1000)::bigint,
    'source', 'shop');

  -- Trứng đang ấp thì Pokémon đồng hành cất vào bộ sưu tập cho tới khi trứng nở.
  if jsonb_typeof(v_pet) = 'object' then
    if not public.shop_pet_in(v_state->'pets', v_pet) then
      v_state := jsonb_set(v_state, '{pets}', jsonb_build_array(v_pet) || coalesce(v_state->'pets', '[]'::jsonb));
    else
      v_state := jsonb_set(v_state, '{pets}', public.shop_upsert_pet(v_state->'pets', v_pet));
    end if;
    v_state := v_state - 'pet';
  end if;
  v_state := jsonb_set(v_state, '{egg}', v_egg);

  return public.shop_commit(v_me, v_cost, v_state, 'Mua ' || case p_kind when 'special' then 'trứng đặc biệt' else 'trứng thường' end);
end;
$$;

create or replace function public.student_shop_hatch_egg()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me public.students := public.shop_current_student(true);
  v_state jsonb := coalesce(v_me.game_state, '{}'::jsonb);
  v_egg jsonb := v_state->'egg';
  v_required integer;
  v_cost integer;
  v_pet jsonb;
  v_now bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_journal jsonb := coalesce(v_state->'adventureJournal', '[]'::jsonb);
  v_shiny boolean := random() < 0.02;
begin
  if v_egg->>'status' is distinct from 'egg' then
    raise exception 'no_egg';
  end if;
  v_required := coalesce(nullif((v_egg->>'requiredProgress')::integer, 0),
    case v_egg->>'kind' when 'legendary' then 30 when 'special' then 15 else 10 end);
  v_cost := greatest(0, v_required - coalesce((v_egg->>'progress')::integer, 0));
  if v_me.points < v_cost then
    raise exception 'not_enough_points';
  end if;

  v_pet := jsonb_build_object(
    'instanceId', 'pk-' || gen_random_uuid()::text,
    'dexId', (v_egg->>'assignedDexId')::integer,
    'baseDexId', (v_egg->>'assignedDexId')::integer,
    'name', '', 'hp', 100,
    'accessories', '[]'::jsonb, 'skills', '[]'::jsonb,
    'isShiny', v_shiny);

  v_journal := jsonb_build_array(jsonb_build_object(
    'id', v_now::text || random()::text, 'timestamp', v_now, 'type', 'pokemon-hatched',
    'text', 'Một Pokémon vừa nở cho ' || v_me.name || '.', 'petInstanceId', v_pet->>'instanceId')) || v_journal;
  if v_shiny then
    v_journal := jsonb_build_array(jsonb_build_object(
      'id', v_now::text || random()::text, 'timestamp', v_now, 'type', 'shiny-acquired',
      'text', v_me.name || ' tìm thấy một Pokémon Shiny.', 'petInstanceId', v_pet->>'instanceId')) || v_journal;
  end if;

  v_state := jsonb_set(v_state, '{egg}', v_egg || jsonb_build_object('status', 'hatched', 'progress', v_required, 'requiredProgress', v_required));
  v_state := jsonb_set(v_state, '{pet}', v_pet);
  v_state := jsonb_set(v_state, '{pets}', jsonb_build_array(v_pet) || coalesce(v_state->'pets', '[]'::jsonb));
  v_state := jsonb_set(v_state, '{pokemonProgress}',
    coalesce(v_state->'pokemonProgress', '{}'::jsonb)
    || jsonb_build_object('hatchedEggs', coalesce((v_state->'pokemonProgress'->>'hatchedEggs')::integer, 0) + 1));
  v_state := jsonb_set(v_state, '{adventureJournal}', (select coalesce(jsonb_agg(e order by o), '[]'::jsonb)
    from jsonb_array_elements(v_journal) with ordinality t(e, o) where o <= 80));

  return public.shop_commit(v_me, v_cost, v_state, 'Nở trứng nhanh') || jsonb_build_object('hatchedDexId', (v_pet->>'dexId')::integer, 'isShiny', v_shiny);
end;
$$;

create or replace function public.student_shop_buy_skill(p_skill_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me public.students := public.shop_current_student(true);
  v_state jsonb := coalesce(v_me.game_state, '{}'::jsonb);
  v_pet jsonb := v_state->'pet';
  v_skill jsonb;
  v_cost integer;
begin
  if jsonb_typeof(v_pet) is distinct from 'object' then
    raise exception 'no_companion';
  end if;
  select e into v_skill from jsonb_array_elements(public.shop_skill_catalog(v_me.teacher_id)) e where e->>'id' = p_skill_id limit 1;
  if v_skill is null then
    raise exception 'invalid_item';
  end if;
  if coalesce(v_pet->'skills', '[]'::jsonb) @> to_jsonb(p_skill_id) then
    raise exception 'already_owned';
  end if;
  v_cost := greatest(0, coalesce((v_skill->>'cost')::integer, 0));
  if v_me.points < v_cost then
    raise exception 'not_enough_points';
  end if;

  v_pet := jsonb_set(v_pet, '{skills}', coalesce(v_pet->'skills', '[]'::jsonb) || to_jsonb(p_skill_id));
  v_pet := jsonb_set(v_pet, '{skillUses}', coalesce(v_pet->'skillUses', '{}'::jsonb) || jsonb_build_object(p_skill_id, 0));
  v_state := jsonb_set(v_state, '{pet}', v_pet);
  v_state := jsonb_set(v_state, '{pets}', public.shop_upsert_pet(v_state->'pets', v_pet));

  return public.shop_commit(v_me, v_cost, v_state, 'Mua kỹ năng: ' || coalesce(v_skill->>'name', p_skill_id));
end;
$$;

-- Đổi Pokémon đồng hành (miễn phí, không giới hạn). Không đổi được khi đang ấp trứng.
create or replace function public.student_set_companion(p_instance_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me public.students := public.shop_current_student(true);
  v_state jsonb := coalesce(v_me.game_state, '{}'::jsonb);
  v_pet jsonb := v_state->'pet';
  v_target jsonb;
begin
  if v_state->'egg'->>'status' = 'egg' then
    raise exception 'egg_in_progress';
  end if;
  select e into v_target from jsonb_array_elements(coalesce(v_state->'pets', '[]'::jsonb)) e where e->>'instanceId' = p_instance_id limit 1;
  if v_target is null then
    raise exception 'invalid_item';
  end if;
  if jsonb_typeof(v_pet) = 'object' then
    v_state := jsonb_set(v_state, '{pets}', public.shop_upsert_pet(v_state->'pets', v_pet));
  end if;
  v_state := jsonb_set(v_state, '{pet}', v_target);
  if v_state->>'supportPetInstanceId' = p_instance_id then
    v_state := v_state - 'supportPetInstanceId';
  end if;
  return public.shop_commit(v_me, 0, v_state, '');
end;
$$;

-- Chọn (hoặc bỏ) Pokémon hỗ trợ. NULL = bỏ.
create or replace function public.student_set_support(p_instance_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me public.students := public.shop_current_student(true);
  v_state jsonb := coalesce(v_me.game_state, '{}'::jsonb);
begin
  if p_instance_id is null then
    v_state := v_state - 'supportPetInstanceId';
  else
    if not exists (select 1 from jsonb_array_elements(coalesce(v_state->'pets', '[]'::jsonb)) e where e->>'instanceId' = p_instance_id) then
      raise exception 'invalid_item';
    end if;
    if v_state->'pet'->>'instanceId' = p_instance_id then
      raise exception 'invalid_item';
    end if;
    v_state := jsonb_set(v_state, '{supportPetInstanceId}', to_jsonb(p_instance_id));
  end if;
  return public.shop_commit(v_me, 0, v_state, '');
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Quyền: chỉ người đã đăng nhập gọi được các hàm cho học sinh; hàm phụ không cấp cho API.
-- ---------------------------------------------------------------------------

revoke all on function public.shop_current_student(boolean) from public, anon, authenticated;
revoke all on function public.shop_pet_in(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.shop_upsert_pet(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.shop_skill_catalog(uuid) from public, anon, authenticated;
revoke all on function public.shop_commit(public.students, integer, jsonb, text) from public, anon, authenticated;

revoke all on function public.student_shop_overview() from public, anon;
revoke all on function public.student_shop_buy_egg(text) from public, anon;
revoke all on function public.student_shop_hatch_egg() from public, anon;
revoke all on function public.student_shop_buy_skill(text) from public, anon;
revoke all on function public.student_set_companion(text) from public, anon;
revoke all on function public.student_set_support(text) from public, anon;
grant execute on function public.student_shop_overview() to authenticated;
grant execute on function public.student_shop_buy_egg(text) to authenticated;
grant execute on function public.student_shop_hatch_egg() to authenticated;
grant execute on function public.student_shop_buy_skill(text) to authenticated;
grant execute on function public.student_set_companion(text) to authenticated;
grant execute on function public.student_set_support(text) to authenticated;

commit;
