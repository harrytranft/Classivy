# Kiến trúc mã nguồn Classivy (sau Phase 1)

Tài liệu cho người và AI agent làm việc trên repo. Cập nhật lần cuối: 2026-10-26 (kết thúc phần code của Phase 1).

## 1. Bức tranh tổng thể

```
src/main.tsx                React root (StrictMode + AuthProvider)
src/app/App.tsx             BrowserRouter -> GameDataProvider -> UiEventsProvider -> AppProvider -> AppRoutes
src/app/AppRoutes.tsx       /class (mặc định), /plaza, /settings, /student/:id; / và đường dẫn lạ -> /class
src/app/AppLayout.tsx       Cổng đăng nhập, thanh điều hướng, dock trạng thái, <Outlet/> và mọi hộp thoại toàn cục
src/app/AppContext.tsx      useApp(): state + hành động của toàn app (giống phạm vi của App.tsx cũ)
src/app/controller/         appState.ts (gom state), appActions.ts (gom hành động), useDerivedState.ts (giá trị suy ra)
src/app/providers/          GameDataProvider (dữ liệu + đồng bộ), UiEventsProvider (toast, level-up, nở trứng, Pokémon rời đi)
src/features/<tính năng>/   state hook, actions, component giao diện của từng tính năng
src/domain/                 logic thuần (không React), có unit test
src/components/             component giao diện dùng chung (thẻ học sinh, dock, modal điểm danh...)
src/data/                   hằng số, dữ liệu Pokémon
src/lib/                    Supabase, Gemini, âm thanh
src/types/                  kiểu dữ liệu (index.ts: dữ liệu; app.ts: kiểu riêng của giao diện)
```

## 2. Luồng dữ liệu

1. **GameDataProvider** (`src/app/providers/`) giữ dữ liệu được lưu: học sinh, cấp bậc, kỹ năng, kỹ năng Pokémon, âm thanh, ô Cá Ngựa, phần thưởng Vòng quay, Boss theo lớp.
   - `gameData/useGameDataState.ts`: khởi tạo state (một số đọc từ localStorage).
   - `gameData/useCloudSync.ts`: tải từ Supabase khi đăng nhập; tự đồng bộ lên sau 1,5 giây khi dữ liệu đổi.
   - `gameData/useLocalPersistence.ts`: lưu/đọc localStorage (khoá `imperial_*` giữ nguyên tới Phase 2).
   - `gameData/backupActions.ts`: xuất/nhập JSON, sao lưu/khôi phục thủ công.
   - Phase 3 sẽ thay phần đồng bộ (một snapshot JSON mỗi giáo viên) bằng bảng dữ liệu riêng; chỉ cần sửa trong thư mục này.
2. **UiEventsProvider**: toast Pokémon, thông báo level-up, nở trứng, hàng đợi Pokémon rời đi, "thánh chỉ".
3. **AppProvider** (`AppContext.tsx`) ghép mỗi lần render:
   - `useAppState()`: dữ liệu + sự kiện + state của từng tính năng (`features/*/use*State.ts`) + giá trị suy ra (`useDerivedState`).
   - `createAppActions(state)`: gọi từng nhóm hành động `features/*/*Actions.ts`.
   - các effect của tính năng (`features/*/use*Effects.ts`), đồng bộ URL hồ sơ (`useProfileRouteSync`).
4. **Giao diện** đọc mọi thứ qua `const { ... } = useApp();`.

## 3. Hành động (actions) và cách các tính năng gọi nhau

Mỗi file `*Actions.ts` có dạng:

```ts
export interface LudoActions { openLudoForClass: (...) => void; ... }   // API công khai của tính năng
export const createLudoActions = (appState: AppState, app: AppActions): LudoActions => {
  const { students, setStudents, ... } = appState;   // state đọc lúc render
  const openLudoForClass = (...) => { ... };
  const handleRandomFromLudo = () => { ...; window.setTimeout(() => app.handleRandom(), 0); };  // gọi tính năng khác qua `app`
  return { openLudoForClass, ... };
};
```

- Gọi hàm của tính năng khác luôn qua `app.<tên>` (đã nối đủ trước khi có sự kiện người dùng).
- Logic tính toán dài nằm trong `src/domain/` và có test; file actions chỉ lo đọc state, gọi domain, cập nhật state, âm thanh, thông báo.

| Tính năng | Thư mục | Logic thuần trong `domain/` |
|---|---|---|
| Cộng/trừ điểm (trung tâm) | `features/students` | `points.ts` |
| Lớp học, chọn nhiều, nhận quà cả lớp | `features/class` | `progression.ts` |
| Điểm danh / Bài tập | `features/attendance`, `features/homework` | `attendance.ts`, `homework.ts` |
| Random, Battle, Boss Raid | `features/random` | `battle.ts`, `bossSystem.ts` |
| Cá Ngựa | `features/ludo` | `ludo.ts` |
| Vòng quay may mắn | `features/wheel` | `luckyWheel.ts` |
| Shop | `features/shop` | `eggs.ts` |
| Pokémon (trứng, skill, hợp nhất, tặng, rời đi) | `features/pokemon`, `features/profile` | `pokemonProgression.ts`, `pokemonCollection.ts`, `progression.ts`, `gameEvents.ts`, `expeditionSystem.ts` |
| Cài đặt | `features/settings` | - |
| Chia nhóm, hẹn giờ, thời tiết | `features/tools` | `weather.ts` |
| Đăng nhập, tài khoản giáo viên | `features/auth` | - |

## 4. Định tuyến

| Đường dẫn | Trang |
|---|---|
| `/class` | Chọn lớp (mặc định khi mở app) |
| `/class/<lớp>` | Trang lớp: lưới học sinh, điểm danh, bài tập, Random (hộp thoại), Shop... |
| `/class/<lớp>/ca-ngua` | Cá Ngựa của lớp |
| `/class/<lớp>/vong-quay` | Vòng quay may mắn (tick chọn học sinh ngay trên trang) |
| `/class/<lớp>/tang-pokemon` | Tặng Pokémon |
| `/plaza`, `/settings`, `/student/<id>` | Plaza, Cài đặt, Hồ sơ |

- Lớp đang chọn (`filterClass`) lấy từ URL (`src/app/useClassRoute.ts`); ngoài trang lớp thì app nhớ lớp mở gần nhất. Cờ `showLudoModal`, `showLuckyWheelModal`, `showGiftPokemonModal` cũng lấy từ URL; mở/đóng bằng `goToClassPage` (đóng dùng `replace` để không tạo thêm bước Back).
- Đóng Vòng quay sau khi về đích Cá Ngựa thì quay lại bàn cờ; đóng Tặng Pokémon thì về trang đã mở nó.
- Tên lớp sai trên đường dẫn: hiện "Không tìm thấy lớp" (`ClassPageGuard`).
- `currentScreen` / `setCurrentScreen` vẫn dùng như cũ nhưng đọc/ghi URL (`src/app/useScreenRoute.ts`); "Lớp học" về trang lớp đang chọn.
- `/student/:id`: tải lại trang hoặc Back/Forward sẽ mở đúng học sinh (`useProfileRouteSync.ts`); id không tồn tại thì về `/class`.
- Khi chuyển `/` -> `/class` giữ nguyên `?query` và `#hash` vì Supabase đọc mã đăng nhập (Google, xác nhận email) từ URL.
- `vercel.json` chuyển mọi đường dẫn về `index.html` để tải lại trang không bị 404.
- Plaza, Hồ sơ, Cài đặt được tải khi mở lần đầu (`React.lazy`); Gemini SDK tải khi cần.

## 5. Kiểm thử

| Lệnh | Nội dung |
|---|---|
| `npm test` | Vitest: logic thuần trong `src/domain/` và `src/app/screenRoutes.ts` |
| `npm run smoke` | Playwright: build production (không nén), dữ liệu mẫu `fixtures/sample-class.json`, Supabase giả, giờ cố định, số ngẫu nhiên có seed. So DOM từng màn hình/hộp thoại và dữ liệu đồng bộ lên "đám mây" sau các luồng chính với ảnh gốc trong `tests/smoke/__snapshots__/` |
| `npm run typecheck` | Kiểm tra kiểu TypeScript (phải 0 lỗi) |
| `npm run build` | Build production |

- Lần đầu chạy smoke trên máy mới: `npx playwright install chromium`.
- Smoke test **không** chạm Supabase thật: biến môi trường trong `playwright.config.ts` ghi đè `.env`, mọi request mạng ra ngoài bị chặn.
- Khi CỐ Ý đổi giao diện (Phase 2): `npm run smoke -- --update-snapshots`, rồi xem lại diff ảnh gốc trước khi commit.

## 6. Quy ước khi thêm tính năng

1. State riêng: `features/<x>/use<X>State.ts`, rồi thêm vào `useBaseState` trong `app/controller/appState.ts`.
2. Hành động: `features/<x>/<x>Actions.ts` theo mẫu ở mục 3, rồi thêm vào `app/controller/appActions.ts`.
3. Tính toán nghiệp vụ mới: hàm thuần trong `src/domain/` + test (bắt buộc theo AGENT.md).
4. Giao diện: component trong `features/<x>/`, đọc dữ liệu bằng `useApp()`; màn hình mới thì thêm route trong `AppRoutes.tsx`.
5. File component dưới ~400-500 dòng.

## 7. Nợ kỹ thuật đã biết (chưa xử lý trong Phase 1)

- Tailwind nạp qua CDN (đổi ở Phase 2 theo PLAN 2.x).
- `useApp()` trả toàn bộ state, nên mọi component render lại khi bất kỳ state nào đổi (giống App.tsx cũ). Có thể chia nhỏ context hoặc dùng selector khi cần tối ưu.
- Vài hàm vẫn gọi `alert`/`confirm` của trình duyệt (giữ nguyên hành vi; đổi sang hộp thoại riêng ở Phase 2 nếu muốn).
