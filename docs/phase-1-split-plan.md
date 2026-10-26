# Kế hoạch Phase 1: Tách App.tsx

> Trạng thái: **đã thực hiện S0-S15 (2026-10-26), chờ Harry nghiệm thu S16** (checklist mục 7). Quyết định A-D lấy theo mặc định đề xuất. Kết quả, các điểm khác kế hoạch và nhật ký kiểm chứng: xem Phase 1 trong `PLAN.md`; kiến trúc sau khi tách: `docs/architecture.md`.
> Nguyên tắc cứng: giữ nguyên hành vi và giao diện; không đổi luật game; không đổi schema Supabase.

## 1. Hiện trạng đo được

`App.tsx` có 7.936 dòng, một component `App` duy nhất từ dòng 356 đến 7.936. Số liệu:

| Thành phần | Số lượng / vị trí |
|---|---|
| `useState` | ~200 (dòng 357-580) |
| `useEffect` | 19 (đồng bộ cloud, lưu localStorage, thời tiết, điểm danh, Boss...) |
| Hàm xử lý (handler) | ~110, trải từ dòng 601 đến 4.570 |
| Phần giao diện (JSX) | dòng 4.572-7.932 |
| Truy cập `localStorage` | 72 chỗ |
| Màn hình | 4: Plaza (dòng 4.861-5.018), Class (5.019-5.122), Profile (5.123-5.922, 3 tab), Settings (5.923-6.256) |
| Hộp thoại lớn (modal) | Random (~360 dòng, 3 chế độ solo/battle/boss), Lucky Wheel (~205), Ludo/Cá Ngựa (~211 + 57), Shop (~204), Tặng Pokémon (~186), User (~155), Skill (~119), Release (~92), Hatch (~70), Claim-all (~56), Group (~52), Timer (~47), Level-up, Edict... |

Các hàm lớn nhất, cần cẩn trọng nhất khi tách: `handleLudoRollDice` (~278 dòng), `handleResolveBattle` (~184), `handleUpdatePoints` (~148), `handleResolveBossRound` (~132), `handleConfirmAttendanceCheck` (~120), `handleConfirmHomeworkCheck` (~120).

### Ba điều rút ra

1. **`handleUpdatePoints` là "trung tâm"**: Random, Battle, Boss, Ludo, Lucky Wheel, điểm danh, bài tập đều gọi nó hoặc gọi lại cùng một chuỗi hiệu ứng (toast Pokémon, nhật ký phiêu lưu, XP trainer, rương tuần). Phải tách nó đầu tiên và dùng chung.
2. **Vòng phụ thuộc Random - Ludo - Lucky Wheel**: bắn xong Ludo thì quay Lucky Wheel, xong lại quay về Random (`ludoReturnHint`, `handleRandomFromLudo`, `openLudoForClass`). Ba tính năng này không thể tách độc lập; cần một lớp "điều phối modal" chung.
3. **Phần lớn state là state của giao diện** (mở/đóng modal, ô nhập), chỉ khoảng 15 state là dữ liệu dùng chung: `students`, `ranksMale/Female`, `skills`, `petSkills`, âm thanh, `customLudoTiles`, `luckyWheelRewards`, `bossStatesByClass`, `bossEncounterFrequency`. State giao diện chuyển về đúng component sở hữu nó là xong, không cần "đưa lên chung".

## 2. Chiến lược: bóc từng lớp, luôn chạy được

Không viết lại một lần. Mỗi bước nhỏ phải kết thúc ở trạng thái `npm test` + `npm run build` + smoke test đều xanh, rồi mới commit. Nếu một bước hỏng, quay lại commit trước.

Hướng đi theo thứ tự: **lưới an toàn → di chuyển file → rút phần thuần ra → dựng "kho state" dùng chung → tách màn hình/tính năng → dọn dẹp**.

## 3. Cấu trúc thư mục đích

```
src/
  main.tsx                     (thay index.tsx)
  app/
    App.tsx                    (khung mỏng, < 300 dòng)
    routes.tsx                 (4 màn hình thành route)
    AppLayout.tsx              (dock, thanh trên, các modal toàn cục)
    providers/
      GameStateProvider.tsx    (students, ranks, skills, cài đặt, boss...)
      CloudSyncProvider.tsx    (đồng bộ Supabase + localStorage)
      UiEventsProvider.tsx     (toast Pokémon, level-up, release queue, hatch)
      ModalHost.tsx            (điều phối modal liên tính năng: random/ludo/wheel)
  features/
    auth/        AuthContext, AuthLoginForm, UserModal
    plaza/       màn Plaza
    class/       màn Class, lưới thẻ học sinh, SkillModal, chọn nhiều
    profile/     màn Profile: tab info / pet / fusion, trứng, expedition, rương tuần
    settings/    màn Settings, từng khối cài đặt, backup/import/export
    attendance/  điểm danh
    homework/    kiểm tra bài tập
    random/      modal Random: solo, battle, boss
    boss/        (UI Boss; logic giữ ở bossSystem.ts)
    shop/        Shop, mua trứng/skill, xem lại đơn
    pokemon/     gift, hatch, release, fusion, pokedex, level-up
    wheel/       Lucky Wheel
    ludo/        Cá Ngựa
    tools/       group maker, timer, thời tiết
  domain/        (logic thuần, có test: bossSystem, gameEvents, expeditionSystem,
                  pokemonProgression, trainerProgression, pokemonPassives, eggs, points)
  components/ui/ (dùng chung, nhỏ; hệ thiết kế đầy đủ ở Phase 2)
  lib/           supabaseClient, supabaseData, storage, gemini, dates
  types/         types.ts, tách theo miền nếu cần
  data/          pokemonData, constants
```

Quy ước: file component dưới ~400-500 dòng (ngoại lệ có ghi chú: `pokemonData.ts` là dữ liệu). Logic thuần nằm trong `domain/`, không import React.

## 4. Các bước thực hiện

Mỗi bước (S) có: việc làm, tiêu chí xong, độ lớn (S nhỏ, M vừa, L lớn). Cuối mỗi bước: `npm test`, `npm run build`, smoke test, commit trên nhánh `refactor/phase-1-split`.

**S0 - Lưới an toàn (M).** Chưa tách gì.
- Bộ dữ liệu mẫu cố định (`fixtures/sample-class.json`: 2 lớp, ~12 học sinh, có Pokémon, trứng, Boss) nạp qua chức năng Import JSON hiện có.
- Smoke test tự động chạy ở chế độ khách (không cần Supabase): nạp dữ liệu mẫu, mở từng màn hình và từng modal chính, kiểm tra không có lỗi console, lưu ảnh chụp màn hình làm "ảnh gốc".
- Chụp ảnh gốc và DOM gốc của 4 màn hình trước khi đổi bất cứ thứ gì.
- Xong khi: chạy smoke test trên code hiện tại cho kết quả sạch và lặp lại được.

**S1 - Chuyển vào `src/` (S).** Chỉ di chuyển file, sửa đường dẫn import, `vite.config.ts` (alias), `tsconfig.json`, `index.html` (đường dẫn script). Không đổi nội dung. Xong khi test, build, smoke đều như cũ.

**S2 - Rút phần thuần ra khỏi App (M).** Không phụ thuộc state: các interface cục bộ (dòng 83-147) sang `types/`; `getLocalDateKey/WeekKey`, hằng số Ludo, hàm trứng (`getEggLabel`, `getEggCost`, `createEgg`, `getRandomEggDexId`, `createInstanceId`), hàm thời tiết thuần, `AuthLoginForm`, `SettingsSection`. Mục tiêu: App giảm khoảng 600-800 dòng. Viết test cho các hàm thuần mới lộ ra (trứng, khoá ngày/tuần).

**S3 - Kho state dùng chung (L).** `GameStateProvider` giữ ~15 state dữ liệu; `CloudSyncProvider` gom các effect đồng bộ Supabase và localStorage (dòng 764, 939, 1027, 1117-1151) và các hàm sao lưu/khôi phục/xuất/nhập. Hành vi lưu giữ nguyên từng chữ (cùng khoá localStorage, cùng điều kiện `!user`). Đây là bước rủi ro cao nhất của dữ liệu: xem mục 6.

**S4 - Sự kiện giao diện chung (M).** `UiEventsProvider`: toast Pokémon, level-up, hàng đợi release, thông báo hatch. Hiện nhiều tính năng gọi các hàm này; sau bước này mọi tính năng dùng chung một hook `useUiEvents()`.

**S5 - Hành động nghiệp vụ dùng chung (L).** Rút `handleUpdatePoints`, `applyTrainerJourneyProgress`, `appendAdventureJournal`, `addWeeklyChestProgress`, các hàm trứng (`advanceEggForStudent`), `applyAuraRewardToStudent` thành `domain/` (phần thuần, có test) và hook `useStudentActions()` (phần gọi state). Thêm test đặc trưng (characterization test) ghi lại kết quả hiện tại của các luồng cộng/trừ điểm trước khi di chuyển.

**S6 - Router và khung giao diện (M).** Thêm `react-router-dom`. Biến `currentScreen` thành route: `/` Plaza, `/class`, `/student/:id` (hồ sơ; hiện là `profile` + `editingStudent`), `/settings`. `AppLayout` chứa dock, thanh trên, modal toàn cục. Thêm `vercel.json` để các đường dẫn con không bị 404 khi tải lại trang.

**S7 - Tính năng độc lập nhỏ (S-M).** Group maker, Timer, Thời tiết, User modal. Ít phụ thuộc, dùng để kiểm chứng mô hình provider/hook trước khi đụng phần lớn.

**S8 - Settings (M).** Tự chứa nhất trong 4 màn hình. Chia thành các khối: chung, rank, kỹ năng, kỹ năng Pokémon, Lucky Wheel, Ludo tile, Boss, âm thanh, sao lưu.

**S9 - Plaza + Class + Skill modal (M).** Lọc/sắp xếp/chọn nhiều/lưới thẻ.

**S10 - Profile (L).** Ba tab info / pet / fusion (~800 dòng), kèm trứng, expedition, rương tuần, huy hiệu, nhật ký, Pokédex hồ sơ. Chia nhỏ theo tab thành nhiều file.

**S11 - Điểm danh và bài tập (M).** Hai modal và hai hàm xác nhận dài (~120 dòng mỗi hàm).

**S12 - Shop, Hatch, Gift Pokémon, Release (M-L).** Gồm mua trứng/skill, xem lại đơn, ấp trứng, tặng Pokémon (có animation, hẹn giờ), hàng đợi release.

**S13 - Random: solo, battle, boss (L).** Modal Random 3 chế độ; `handleRandom`, `handleResolveBattle`, `handleResolveBossRound`. Logic Boss đã nằm sẵn ở `bossSystem.ts`, chỉ tách phần UI và nối.

**S14 - Lucky Wheel và Ludo (L).** Phần khó nhất vì vòng phụ thuộc với Random. `ModalHost` điều phối "mở Ludo", "mở Wheel", "quay lại Random". `handleLudoRollDice` (~278 dòng) tách thành logic thuần (`domain/ludo`) có test + phần giao diện.

**S15 - Dọn dẹp (M).** Xoá state/hàm chết, `React.lazy` theo route để giảm cảnh báo chunk 1,3 MB, rà `tech-debt`, thêm test cho phần lộ ra. App còn là khung mỏng.

**S16 - Nghiệm thu (S).** Harry chạy checklist hồi quy (mục 7) trên bản preview, cập nhật PLAN và BRIEF, báo cáo.

## 5. Quyết định cần Harry duyệt

| # | Câu hỏi | Mặc định đề xuất | Lý do / đánh đổi |
|---|---|---|---|
| A | Kho state | **React Context + hook**, tách context dữ liệu và context hành động. Không thêm thư viện | App hiện đã render lại toàn bộ khi đổi state nên Context không tệ hơn. Zustand tiện chọn lọc cập nhật hơn nhưng thêm phụ thuộc; có thể chuyển sau nếu cần |
| B | Router | **`react-router-dom` + `vercel.json`** (URL sạch như `/student/123`) | Cổng học sinh ở Phase 5 cần URL riêng. HashRouter không cần cấu hình nhưng URL xấu và khó tách `/student` về sau |
| C | Smoke test | **Thêm Playwright làm devDependency** và lệnh `npm run smoke` | Là lưới an toàn duy nhất cho giao diện. Không đi kèm vào bản chạy thật. Nhược: lần đầu cần tải trình duyệt (~150MB) trên máy bạn nếu muốn tự chạy |
| D | Nhánh làm việc | **Nhánh `refactor/phase-1-split`**, commit nhỏ sau mỗi bước, gộp vào `main` khi Harry nghiệm thu | Vercel tự tạo bản preview theo nhánh để bạn thử mà không ảnh hưởng bản đang dùng |

## 6. Rủi ro và cách giảm

| Rủi ro | Cách giảm |
|---|---|
| **Mất hoặc ghi đè dữ liệu cloud** khi thử bằng tài khoản thật (hiện mọi thay đổi tự đồng bộ lên Supabase) | Bạn xuất JSON sao lưu trước. Mọi kiểm thử của mình dùng chế độ khách + dữ liệu mẫu, không đăng nhập tài khoản thật. S3 giữ nguyên điều kiện ghi và tên khoá |
| Lỗi "closure cũ" (stale state) khi chuyển handler sang hook | Dùng cập nhật dạng hàm `setX(prev => ...)` như đang có; characterization test cho `handleUpdatePoints` và các luồng thưởng |
| Hồi quy giao diện khó thấy | Ảnh chụp và DOM gốc ở S0; so sánh sau mỗi bước |
| Vòng phụ thuộc Random - Ludo - Wheel | Làm S4 (sự kiện UI) và `ModalHost` trước; tách ba tính năng này cùng lúc ở S13-S14 |
| Preview trên Vercel thiếu biến môi trường Supabase | Bản preview chạy được ở chế độ khách; muốn thử cloud phải thêm biến cho môi trường Preview (việc của Harry, ghi rõ ở báo cáo) |
| Phạm vi trượt sang làm giao diện mới | Cấm đổi class Tailwind, màu, chữ trong Phase 1; reskin để Phase 2 |

## 7. Checklist hồi quy thủ công (Harry chạy ở S16, dùng dữ liệu mẫu hoặc bản sao lưu)

1. Khách: nạp JSON, thêm/sửa/xoá học sinh, chọn nhiều.
2. Cộng/trừ điểm một học sinh và nhiều học sinh; thử từng kỹ năng; lý do tuỳ chọn.
3. Điểm danh (có mặt/trễ/vắng) và kiểm tra bài tập; kiểm tra không check hai lần cùng buổi.
4. Random solo (đúng/sai), battle (thắng/thua), boss (đủ 5 trainer, thành công/thất bại, hạ boss).
5. Lucky Wheel: mở, quay, nhận từng loại thưởng.
6. Cá Ngựa: tung xúc xắc, ô đặc biệt, về đích mở Lucky Wheel, quay lại Random.
7. Shop: mua trứng và skill, xem lại đơn, xác nhận.
8. Trứng: ấp, nở (cả Shiny), tặng Pokémon, Pokémon HP về 0 và màn release.
9. Hồ sơ: ba tab, đổi tên Pokémon, chọn active/support, hợp nhất, dùng skill, expedition, rương tuần, huy hiệu, nhật ký, Pokédex.
10. Cài đặt: sửa rank, skill, skill Pokémon, phần thưởng Wheel, ô Ludo, tần suất Boss, âm thanh; tải lại trang vẫn giữ.
11. Xuất/nhập JSON; sao lưu/khôi phục cloud (chỉ với tài khoản thử).
12. Đăng ký, đăng nhập, đăng xuất, đồng bộ giữa hai trình duyệt.
13. Group maker, Timer, thời tiết.
14. Tải lại trang ở từng URL con; nút Back/Forward của trình duyệt.

## 8. Việc phía Harry trong Phase 1

- Duyệt kế hoạch này (4 quyết định A-D).
- Xuất JSON sao lưu dữ liệu thật trước khi thử bất kỳ bản preview nào bằng tài khoản thật.
- Cuối Phase: chạy checklist mục 7 trên bản preview và xác nhận để gộp vào `main`.
- Không có migration Supabase trong Phase 1.

## 9. Ngoài phạm vi Phase 1

Đổi giao diện/màu/chữ, đổi thuật ngữ cung đình, đổi khoá localStorage, tài khoản học sinh, bảng dữ liệu mới. Tất cả thuộc các Phase sau.
