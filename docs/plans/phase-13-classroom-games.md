# Phase 13 - Trò chơi và công cụ dùng trên lớp (tài khoản giáo viên)

Trạng thái: **KẾ HOẠCH, chưa viết code** (lập 2026-10-29 sau buổi brainstorm với Harry; cùng ngày Harry xác nhận D56, số liệu Boss và "mỗi buổi tối đa 1 con"). Nhánh dự kiến: `claude/phase13-classroom-games`. Quyết định: D48-D57 trong `PLAN.md`.

Nguyên tắc: mọi thứ dùng trên tài khoản giáo viên (học sinh không có thiết bị trong lớp). Không thêm luật điểm riêng cho trò mới; dùng lại Hào Quang, lượt lắc bonus, Vòng quay, kho Pokémon đã có. Không mở rộng phạm vi ngoài các mục dưới.

## 1. Tóm tắt năm yêu cầu của Harry

| # | Yêu cầu | Làm ở | Có đụng Supabase? |
|---|---|---|---|
| 3 | Nút "Đúng hết" ở Random Solo và Battle: +1 lượt tung xúc xắc | 13A | Không |
| 4 | Nút cộng/trừ 1-5 ở Random Solo và Battle | 13A | Không |
| 5 | Boss công bằng hơn khi 1 em sai | 13B | Không |
| 2 | Cá Ngựa có ô sự kiện (thử thách), cài trong Cài đặt; làm được = thêm 1 lượt | 13C + 13D | Có (cột cài đặt, 13C) |
| 1 | Săn Pokémon hoang dã: trang riêng, tự xuất hiện, cài thời gian/tần suất, chia Pokémon cho ai | 13C + 13E | Có (cột cài đặt, 13C) |

Thứ tự làm: 13A, 13B (không cần migration, giao được ngay) rồi 13C (migration), 13D, 13E. Mỗi bước dừng để Harry xem thử trước khi sang bước sau.

## 2. Những điều đã tìm thấy trong mã (làm kế hoạch gọn hơn)

- **Lượt lắc bonus đã có**: `ludoBonusRolls` (theo học sinh) trong `src/features/ludo/useLudoState.ts`, dùng bởi Vòng quay may mắn (phần thưởng `ludo_rolls`); `handleLudoRollDice(student, { isBonusRoll })` trong `ludoActions.ts`; `LudoModal.tsx` đã hiện "Còn N lượt lắc bonus". "Đúng hết" và "làm được thử thách" chỉ cần cộng vào bộ đếm này.
- **Lỗi tiềm ẩn cần sửa trước (13A.6)**: `advanceBattleQueue` trong `ludoActions.ts` chuyển sang em kế tiếp sau MỌI lần lắc, kể cả lắc bonus. Em có lượt bonus sẽ lắc bonus trước (nút Lắc dùng bonus khi còn), rồi bị loại khỏi hàng chờ và mất lượt lắc thường (+1 điểm "trả lời đúng"). Phải chỉ chuyển người khi lắc thường.
- **`ludoBonusRolls` chỉ nằm trong bộ nhớ**: tải lại trang là mất lượt thưởng. Khi "Đúng hết" trở thành nguồn lượt thường xuyên, cần lưu localStorage (13A.7).
- **Ô đặc biệt Cá Ngựa đã chỉnh được trong Cài đặt** (`customLudoTiles`, kiểu `LudoTileSpec`: portal, curse, treasure, monster, restart). Ô thử thách là thêm loại `challenge`, không làm hệ mới.
- **Boss hiện chấm cả nhóm một lần** (`resolveBossSuccess`/`resolveBossFailure` trong `src/domain/bossSystem.ts`, `handleResolveBossRound('success'|'failure')`): thành công = 5 em x 5 sát thương + 5 Hào Quang mỗi em + mỗi em được một lượt Cá Ngựa; thất bại = Pokémon cả 5 em -10 HP. Chỉ cần một em sai là cả nhóm mất.
- **Battle**: điểm Battle của mỗi em (`battleScoreA/B`, tối thiểu -10) chính là số Hào Quang em nhận khi chốt; chênh lệch quyết định HP Pokémon. Nút hiện có: -1, +1, +2, +3, +5.
- **Random Solo** cộng/trừ điểm qua hộp "Ban Thưởng / Phạt" (`SkillPointsModal`) -> `requestPointsUpdate(ids, amount, reason, source)` (`src/features/students/pointsActions.ts`), đã đi qua hộp hỏi skill Phase 11 (Nhân Đôi, Lá Chắn, Kim Bài).
- **Cài đặt mỗi mục là một cột** của `user_settings` (`custom_ludo_tiles`, `boss_encounter_frequency`...), nên cài đặt mới cần chỗ lưu trên cloud (13C). Harry dùng Windows ở Sun Santa và macOS ở nơi khác, nên chỉ lưu localStorage là không đủ.
- **Trang con theo lớp** khai báo ở `CLASS_SUB_PAGES` (`src/app/screenRoutes.ts`); thêm `hunt: 'san-pokemon'`. Phím tắt ở `src/domain/shortcuts.ts` (thêm phím cho Săn Pokémon).
- **Tặng Pokémon cho học sinh** đã có ở hai chỗ (`giftPokemonActions.ts`, phần thưởng `pokemon` của `luckyWheelActions.ts`); sẽ rút phần chung thành một hàm dùng lại cho Săn Pokémon.

## 3. 13A - Chấm điểm nhanh và "Đúng hết" (không đụng Supabase)

Mục tiêu: một lần bấm là xong, không phải mở hộp thoại.

- 13A.1 Component `QuickPointsBar` (`src/components/`): hai hàng nút +1..+5 (xanh) và -1..-5 (đỏ), nút to (cỡ chạm tối thiểu 44 px), dùng token màu trong `DESIGN.md` (đỏ chỉ cho trừ điểm).
- 13A.2 **Random Solo**: đặt `QuickPointsBar` dưới tên và khối skill, trên nút "Ban Thưởng / Phạt" (nút này giữ nguyên cho các công trạng có tên). Bấm gọi `requestPointsUpdate([id], amount, 'Cộng/trừ nhanh (Random)', 'manual')` để vẫn qua hộp hỏi skill. Cộng/trừ Hào Quang trực tiếp cho em.
- 13A.3 **Battle**: nút của mỗi bên thành -5..-1 và +1..+5, điều chỉnh "Điểm Battle vòng này" (cơ chế cũ, tối thiểu -10). Không đổi cách chốt trận.
- 13A.4 **Hoàn tác** (Solo): sau mỗi lần cộng/trừ nhanh hiện nút "Hoàn tác" trong khoảng 8 giây; khôi phục bản chụp của em đó trước lần bấm (điểm, lịch sử, lượt skill, HP) nếu em đó chưa bị thay đổi thêm (so `history[0].id`). Battle: dùng nút -1..-5 để sửa (điểm Battle chưa chốt).
- 13A.5 **Nút "Đúng hết"** (biểu tượng ngôi sao) ở thẻ Solo và ở mỗi bên Battle: cộng 1 vào `ludoBonusRolls[id]`, ghi một dòng lịch sử (0 điểm, "⭐ Đúng hết: +1 lượt lắc Cá Ngựa"), hiện huy hiệu "⭐ +1 lượt lắc (đang có N)". Mỗi em mỗi lượt Random chỉ bấm một lần; bấm lại để huỷ (-1). Không có ở chế độ Boss.
- 13A.6 **Sửa hàng chờ lượt lắc**: chỉ chuyển sang em kế tiếp khi lượt vừa lắc là lắc thường (không phải bonus). Hàm thuần `shouldAdvanceLudoQueue(isBonusRoll)` + test. Giữ nguyên thứ tự hiện tại: có bonus thì lắc bonus trước (để không đổi hành vi Vòng quay may mắn).
- 13A.7 Lưu `ludoBonusRolls` vào localStorage (`classivy_ludo_bonus_rolls`), nạp lại khi mở app; dọn mục bằng 0.
- Mã mới thuần để kiểm thử: `src/domain/ludoRolls.ts` (`grantExtraRoll`, `consumeExtraRoll`, `shouldAdvanceLudoQueue`, `adjustBattleScore`).
- Kiểm thử: vitest cho `ludoRolls`; smoke: (a) Solo bấm +3 rồi Hoàn tác, (b) Solo bấm "Đúng hết" rồi mở Cá Ngựa thấy "Còn 1 lượt lắc bonus", (c) Battle có đủ -5..+5 và nút Đúng hết, (d) hàng chờ Battle: em có bonus vẫn được lắc thường.

## 4. 13B - Boss công bằng theo từng em (không đụng Supabase; đổi luật game)

Luật mới (mặc định đã chốt hướng với Harry 2026-10-29, số liệu chờ thử):

- Giáo viên chấm từng em trong nhóm 5 (đúng hoặc sai), có nút "Cả nhóm đúng" để chấm nhanh, rồi bấm "Chốt vòng".
- Em đúng: gây `damagePerSuccessfulStudent` (5) sát thương, nhận +5 Hào Quang và các tiến độ như hiện tại, được một lượt Cá Ngựa.
- Em sai: chỉ Pokémon của em đó bị Boss phản công (-`failDamage` HP, như hiện tại). Không ai khác bị trừ.
- **Combo**: cả 5 em đúng thì thêm `BOSS_COMBO_BONUS_DAMAGE` = 10 sát thương cho Boss (toàn vòng 35 thay vì 25).
- Phần thưởng Top 5 khi hạ Boss, bộ đếm lượt xuất hiện, hàng chờ chọn nhóm: giữ nguyên.

Ảnh hưởng cân bằng (Boss 500 HP, tham khảo):

| Kết quả một vòng | Luật cũ | Luật mới |
|---|---|---|
| 5/5 đúng | 25 sát thương, 5 em +5 | 35 sát thương (có Combo), 5 em +5 |
| 4/5 đúng | 0 sát thương, cả 5 Pokémon -10 HP | 20 sát thương, 4 em +5, 1 Pokémon -10 HP |
| 1/5 đúng | 0, cả 5 -10 HP | 5, 1 em +5, 4 Pokémon -10 HP |
| 0/5 đúng | 0, cả 5 -10 HP | 0, cả 5 -10 HP |

Boss sẽ ngã nhanh hơn (cần khoảng 15 vòng toàn đúng thay vì 20, và vòng 4/5 cũng có ích). Nếu thấy dễ quá, chỉnh `maxHp`, sát thương mỗi em hoặc Combo ở một chỗ (`BOSS_PRESETS`, hằng Combo trong `bossSystem.ts`).

- 13B.0 Đọc `BossBattlePanel.tsx` (132 dòng), `bossSystem.test.ts`, smoke test Boss hiện có trước khi sửa; chốt bố cục (5 thẻ, mỗi thẻ có nút Đúng/Sai).
- 13B.1 Domain: `resolveBossRound(state, results: { studentId, correct }[], roundId, timestamp, frequency)` trong `src/domain/bossSystem.ts`; trả `damageDealt`, `comboTriggered`, `bossDefeated`, `topContributors`; vẫn idempotent theo `roundId`; vẫn cập nhật `successfulRounds`/`failedRounds`/`appearances` từng em. Thay `resolveBossSuccess`/`resolveBossFailure` (cập nhật test, không để hàm chết).
- 13B.2 Action: `handleResolveBossRound(results)` trong `bossActions.ts` thay cho `('success'|'failure')`: thưởng và phản công áp dụng theo từng em; Cá Ngựa chỉ mở cho các em đúng (nếu có ít nhất một em); thông báo Combo.
- 13B.3 Giao diện `BossBattlePanel`: chấm từng em, "Cả nhóm đúng", "Chốt vòng" chỉ bật khi đã chấm đủ 5 em; hiển thị trước "Sát thương dự kiến" (kèm Combo) để giáo viên thấy ngay.
- 13B.4 Kiểm thử: vitest các ca 5/5, 4/5, 1/5, 0/5, Boss gục giữa vòng, chốt trùng `roundId`, Top contributors; cập nhật smoke Boss.

## 5. 13C - Hạ tầng cài đặt mới (CÓ migration, cần Harry duyệt trước khi chạy)

Săn Pokémon và Ô thử thách cần lưu cấu hình trên cloud. Thêm **một** cột JSON để các cài đặt lớp học sau này không cần migration nữa.

- 13C.1 Migration `supabase/migrations/20261104100000_phase13_classroom_settings.sql`: `alter table public.user_settings add column if not exists classroom_settings jsonb not null default '{}'::jsonb;` (chạy lại được, không đổi RLS, không xoá gì) + hoàn tác `supabase/rollback/20261104100000_phase13_classroom_settings_down.sql`. Trước khi viết: kiểm tra mô hình quyền của `user_settings` (có cấp quyền theo bảng hay theo cột) và bổ sung test vào `npm run test:db` (cả hai kiểu dự án Supabase): chạy hai lần, hàng cũ nhận `{}`, hoàn tác, chạy lại.
- 13C.2 Kiểu và mặc định: `ClassroomSettings { wildHunt: WildHuntSettings; ludoChallenges: LudoChallenge[] }` (`src/types`), mặc định ở `src/data/classroomDefaults.ts`, hàm `normalizeClassroomSettings` (nhận dữ liệu thiếu/sai thì dùng mặc định, giới hạn giá trị hợp lý) + test.
- 13C.3 Nối vào luồng dữ liệu theo mẫu `customLudoTiles`: state trong `useGameDataState.ts`, localStorage `classivy_classroom_settings`, tải/lưu cloud trong `supabaseData.ts`/`cloudStore.ts`, sao lưu/khôi phục JSON (`backupActions.ts`).
- 13C.4 **An toàn khi migration chưa chạy**: nếu dữ liệu tải về không có khoá `classroom_settings` thì app coi cột chưa tồn tại, KHÔNG gửi cột này khi lưu (tránh làm hỏng đồng bộ toàn bộ), vẫn dùng localStorage, và Cài đặt báo "Chưa đồng bộ giữa các máy cho tới khi chạy migration". Nhờ vậy 13D/13E triển khai trước migration cũng không vỡ.
- Thứ tự an toàn khuyến nghị: Harry chạy migration trên dev, thử; chạy trên production; rồi mới triển khai bản app có 13D/13E.

## 6. 13D - Ô thử thách trong Cá Ngựa (cài đặt trong Cài đặt)

- Thêm loại ô `challenge` vào `LudoTileSpec.type`; `value` = số lượt lắc thưởng khi làm được (mặc định 1).
- Danh sách thử thách `ludoChallenges` (13C): mỗi mục có nội dung, biểu tượng, bật/tắt; Cài đặt cho thêm/sửa/xoá. Khi em dừng ở ô thử thách, app bốc ngẫu nhiên một thử thách đang bật (hàm thuần `pickLudoChallenge`, có test; không có thử thách nào bật thì ô không có tác dụng và báo rõ).
- Cài đặt Cá Ngựa (mục "Customize Cá Ngựa" hiện có): thêm loại "Ô thử thách" vào form; thêm nút "Rải ngẫu nhiên N ô thử thách" vào các ô trống (người dùng xem lại rồi lưu). Vị trí ô cố định như các ô khác; mỗi lần bấm nút mới xáo lại.
- Gặp ô: hộp thông báo hiện thử thách và hai nút "Làm được (+N lượt lắc)" / "Chưa làm được". Làm được: cộng `ludoBonusRolls` (cơ chế 13A), ghi nhật ký Cá Ngựa và lịch sử học sinh (0 điểm). Chưa làm được: không phạt. Hộp không đóng được bằng cách bấm nền (phải chọn một trong hai).
- `LudoEventPopupData.type` thêm `'challenge'` kèm nội dung thử thách; `resolveLudoMove` thêm nhánh `challenge` (không di chuyển thêm); bàn cờ (`LudoModal.tsx`) thêm kiểu hiển thị ô thử thách.
- Bộ thử thách mặc định (khoảng 10 mục, Harry sửa được): nói 3 từ về một chủ đề, đặt một câu với từ vừa học, đọc to câu mẫu, nói từ trái nghĩa của một từ, giới thiệu bản thân bằng 2 câu...
- Kiểm thử: vitest `resolveLudoMove` cho ô `challenge` và `pickLudoChallenge`; smoke: đặt một ô thử thách ở ô 1, lắc vào, bấm "Làm được", thấy "Còn 1 lượt lắc bonus".

## 7. 13E - Săn Pokémon hoang dã

### 7.1 Luật chơi (đã chốt hướng, số liệu chỉnh trong Cài đặt)

- Pokémon hoang dã **tự xuất hiện** theo hẹn giờ, không cần bấm gì để gọi. **Mỗi buổi tối đa 1 con** (Harry chốt 2026-10-29). Đồng hồ của lớp bắt đầu chạy khi giáo viên mở trang của lớp đó; hết giờ hẹn (ví dụ 40 phút) thì Pokémon hiện ra trên trang lớp đó. Khi xuất hiện, hiện một **thông báo nổi không chặn thao tác** ở đầu trang với hai nút "Săn ngay" và "Để sau" (nó ở lại tối đa `lingerMinutes` rồi tự đi; bấm "Để sau" hoặc hết giờ ở lại thì con đó mất, không có con thứ hai trong buổi). Không xuất hiện khi lớp có ít hơn `minPresentStudents` em có mặt hoặc khi giáo viên đang ở trang Săn Pokémon, và lùi lại nếu đang mở hộp Random/Cá Ngựa/Vòng quay (không chen ngang).
- Mỗi con có **độ hiếm** (thường, hiếm, huyền thoại). Độ hiếm quyết định **số câu đúng cần** để bắt (mặc định 3, 4, 5) và tỷ lệ xuất hiện. Loài chọn từ kho loài của trứng cùng bậc (`src/domain/eggs.ts`; xác nhận khi bắt đầu 13E.0).
- Trang `/class/<lớp>/san-pokemon`: ảnh Pokémon, thanh "Số câu đúng còn cần", số lần sai còn lại, đồng hồ ở lại; nút "Gọi học sinh" (ngẫu nhiên trong những em có mặt, không gọi lại em đã được gọi trong lần săn này, hết người thì xoay vòng); nút Đúng/Sai cho em đang được gọi.
- Em đúng: Pokémon mất 1 máu (câu đúng). Em sai: Pokémon không mất máu, tính 1 lần sai. Vượt `maxWrong` (mặc định 3) thì Pokémon **bỏ chạy**; không trừ điểm ai (mặc định).
- **Bắt được**: mở **vòng quay** giữa những em đã trả lời đúng trong lần săn này (em đúng nhiều câu có nhiều ô); em trúng nhận Pokémon (vào bộ sưu tập, làm đồng hành nếu chưa có). Các em đúng còn lại nhận `consolationPoints` Hào Quang (mặc định 2, đặt 0 để tắt). Ghi nhật ký phiêu lưu cho em nhận.
- Giữ trạng thái săn ở bộ nhớ (không lưu cloud, không cần bảng mới); chỉ kết quả (Pokémon, điểm, nhật ký) đi vào dữ liệu học sinh như mọi thao tác khác.

### 7.2 Cài đặt (mục mới "Săn Pokémon hoang dã" trong Cài đặt)

Bật/tắt; **hẹn giờ xuất hiện sau X-Y phút kể từ lúc mở trang lớp** (nhập X = Y để cố định, ví dụ 40; mặc định 40-40); số con mỗi buổi cố định là 1 (không có ô cài); ở lại tối đa (mặc định 5 phút); tỷ lệ độ hiếm (mặc định 70/25/5); số câu đúng cần theo độ hiếm (3/4/5); số lần sai tối đa (3); số em có mặt tối thiểu (4); điểm an ủi (2). Có nút **"Gọi thử một Pokémon hoang dã"** để Harry thử ngay không phải chờ.

### 7.3 Kỹ thuật

- `src/domain/wildHunt.ts` (thuần, có test): `rollAppearanceDelay(settings, rng)`, `rollRarity`, `createWildEncounter`, `applyHuntAnswer` (đúng/sai, máu, bỏ chạy, bắt được), `buildCatchWheelEntries` (ô theo số câu đúng), `isEncounterExpired`.
- Hẹn giờ `useWildHuntScheduler` (trong `src/features/hunt/`): so giờ thực (`Date.now()`) mỗi 10-15 giây thay vì phụ thuộc một `setTimeout` dài (trình duyệt làm chậm tab nền); chỉ chạy khi đang ở trang của một lớp.
- **Khi nào tính là bắt đầu buổi học** (D56, Harry xác nhận 2026-10-29): đồng hồ đếm từ lúc mở trang của lớp đó, mỗi lớp một đồng hồ; coi là buổi mới (con mới) nếu app nghỉ ≥ 2 giờ không thao tác hoặc sang ngày khác. Đồng hồ chạy theo giờ thực nên vẫn đúng khi giáo viên chuyển trang trong app; Pokémon hiện ở trang của chính lớp đó.
- Rút hàm dùng chung "trao Pokémon cho học sinh" từ `luckyWheelActions.ts` (phần thưởng `pokemon`) thành hàm trong `src/domain/` có test; Vòng quay may mắn hiện có phải chạy y như cũ (test hồi quy).
- Vòng quay chọn người: 13E.0 đọc `LuckyWheelModal.tsx`; nếu tái dùng được phần chọn học sinh/hiệu ứng thì dùng, nếu gắn chặt với phần thưởng thì làm vòng nhỏ riêng dùng lại âm thanh/hiệu ứng.
- Giao diện: `src/features/hunt/` (`HuntPage.tsx`, `WildEncounterToast.tsx`, `useHuntState.ts`, `huntActions.ts`); thêm `hunt: 'san-pokemon'` vào `CLASS_SUB_PAGES`, route trong `AppRoutes`, phím tắt (đề xuất `o`), mục trên trang lớp, responsive đúng khổ giáo viên đang dùng.

### 7.4 Kiểm thử 13E

Vitest domain (`wildHunt.test.ts`): độ hiếm theo tỷ lệ (rng cố định), đúng/sai/bỏ chạy/bắt được, ô vòng quay theo số câu đúng, hết giờ. Smoke: gọi thử từ Cài đặt -> thông báo -> Săn ngay -> gọi 3 em đúng -> bắt được -> vòng quay -> em nhận Pokémon trong hồ sơ; kịch bản bỏ chạy; kịch bản tắt tính năng thì không xuất hiện.

## 8. Quyết định (Harry xác nhận 2026-10-29) và phần còn mở

Đã xác nhận: D56 hẹn giờ tính từ lúc mở trang lớp; số liệu Boss (5 sát thương/em, Combo +10, Boss 500 HP, phản công 10 HP) đồng ý để làm; Săn Pokémon tối đa 1 con mỗi buổi.

Còn mở (có mặc định, chỉnh được sau):
- Số liệu cân bằng Boss chỉ là điểm xuất phát: thử trên lớp thật rồi chỉnh.
- Các mặc định còn lại của Săn Pokémon ở mục 7.2 (ở lại 5 phút, tỷ lệ độ hiếm 70/25/5, 3/4/5 câu đúng, tối đa 3 lần sai, tối thiểu 4 em có mặt, điểm an ủi 2) và bộ thử thách Cá Ngựa mặc định ở mục 6: Claude đề xuất, Harry sửa.
- Có lưu lượt lắc bonus vào localStorage không (13A.7): mặc định có.
- Phương án khác cho kích hoạt Săn Pokémon: đếm số lượt Random (như Boss) thay vì thời gian. Chưa làm.

## 9. Rủi ro và cách giảm

- **Đổi luật Boss** ảnh hưởng cảm giác chơi: hằng số gom một chỗ, có bảng so sánh ở trên; thử trên lớp rồi chỉnh.
- **Hàng chờ lượt lắc** (13A.6) đụng vào luồng Battle/Boss đang chạy: bắt buộc có test hồi quy và smoke Battle -> Cá Ngựa.
- **Migration chưa chạy mà app đã triển khai**: 13C.4 chặn việc ghi cột lạ để không hỏng đồng bộ.
- **Thông báo Săn Pokémon làm gián đoạn dạy học**: thông báo không chặn thao tác, có "Để sau", chỉ xuất hiện khi không mở hộp thoại khác, tắt được toàn bộ.
- **Vòng quay Săn Pokémon tái dùng code Vòng quay may mắn**: giữ test hồi quy để không đổi hành vi cũ.
- Chưa kiểm chứng được: cảm giác chơi thật (nhịp xuất hiện, độ khó 3-5 câu) cho tới khi Harry thử trên lớp.

## 10. Việc Harry cần làm khi tới lượt

13A, 13B: xem thử và cho commit (không cần chạy gì trên Supabase). 13C: duyệt migration rồi chạy trên dev, sau đó production (SQL Editor), báo lại để ghi "đã áp dụng". 13D, 13E: xem thử, chỉnh số liệu trong Cài đặt cho hợp lớp.
