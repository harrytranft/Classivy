# PLAN.md - Classivy (cải tổ toàn bộ)

> Thay thế hoàn toàn PLAN.md cũ của Imperial School 3.0 (bản cũ lưu ở `docs/archive/imperial-school-3.0-plan.md` và trong lịch sử git).
> Cập nhật file này sau mỗi Phase. Quy trình báo cáo ở cuối file.

**Cập nhật lần cuối:** 2026-10-27 | **Phase hiện tại:** Phase 2 (đang làm)

## Mục tiêu

1. Đổi thương hiệu Imperial School thành **Classivy** (logo, màu, tên, ngôn ngữ).
2. Tách `App.tsx` (~7.900 dòng) thành nhiều file, màn hình, tính năng.
3. Giáo viên tạo, quản lý, sửa, xoá, khoá tài khoản học sinh.
4. Học sinh đăng nhập xem tài khoản của mình.
5. Học sinh kết bạn trong lớp, tương tác (tặng quà, tặng điểm).

## Quyết định đã chốt

| # | Quyết định | Ngày |
|---|---|---|
| D1 | Học sinh đăng nhập bằng tên đăng nhập + mật khẩu do giáo viên cấp (email ảo nội bộ, tạo qua Edge Function) | 2026-10-26 |
| D2 | Tặng điểm dùng ví "điểm tặng" riêng, hạn mức theo tuần, không trừ điểm xếp hạng của người tặng | 2026-10-26 |
| D3 | Tách App.tsx trước, làm dữ liệu/tài khoản sau | 2026-10-26 |
| D4 | Bỏ chủ đề cung đình, giữ Pokémon/Boss theo nhận diện Classivy | 2026-10-26 |
| D6 | North Star thiết kế "Lá non trong tấm khiên"; thư mục `.claude/` được commit | 2026-10-26 |
| D7 | Bỏ hẳn hệ cấp bậc cung đình (Imperial School) và hộp "Thánh chỉ"/Gemini. Bảng Ban thưởng/Phạt hiển thị Trainer Level thay cho cấp bậc. Làm ở đầu Phase 2 | 2026-10-27 |
| D8 | Mỗi lớp một trang `/class/<lớp>`; `/class` là trang chọn lớp; Cá Ngựa, Vòng quay, Tặng Pokémon là trang con của lớp; Vòng quay tick chọn học sinh trên trang; Random giữ dạng hộp thoại | 2026-10-27 |
| D9 | Thuật ngữ: giữ "Hào Quang" (điểm); "Học sĩ" đổi thành "Trainer" | 2026-10-27 |
| D10 | Bỏ hẳn trang Plaza và phần thời tiết (Weather Plaza trong Cài đặt). Thanh điều hướng màu xanh như nền logo, bo hai góc phải; nút Tặng quà màu trắng; dock phóng to kiểu macOS | 2026-10-27 |
| D5 | Bạn bè chỉ trong cùng lớp; không chat tự do (chỉ lời nhắn/emoji định sẵn) | 2026-10-26 (đề xuất, mặc định) |

## Tổng quan Phase

| Phase | Nội dung | Trạng thái | Chạm vào Supabase thật? |
|---|---|---|---|
| 0 | Nền móng: tài liệu, đổi tên, logo | Hoàn thành | Không |
| 1 | Tách App.tsx, thêm router, giữ nguyên hành vi | Hoàn thành (2026-10-27) | Không |
| 2 | Hệ thiết kế Classivy, reskin, thuật ngữ trung tính, đổi khoá localStorage | Đang làm | Không |
| 3 | Mô hình dữ liệu mới + RLS + chuyển dữ liệu cũ | Chưa bắt đầu | **Có (migration)** |
| 4 | Giáo viên quản lý tài khoản học sinh | Chưa bắt đầu | **Có (migration + Edge Function)** |
| 5 | Cổng học sinh: đăng nhập, xem hồ sơ | Chưa bắt đầu | Có |
| 6 | Bạn bè, quà tặng, tặng điểm | Chưa bắt đầu | **Có (migration)** |
| 7 | Hardening, kiểm thử bảo mật, ra mắt | Chưa bắt đầu | Có |

Ghi chú: so với lộ trình đã trao đổi, Phase 2 (reskin + thuật ngữ) được tách riêng để các Phase tài khoản/xã hội dùng ngay hệ thiết kế mới; các Phase sau dời xuống một số.

---

## Phase 0 - Nền móng và thương hiệu (HOÀN THÀNH 2026-10-26)

**Mục tiêu:** có bộ tài liệu nền, đổi tên và logo; không đụng logic game hay dữ liệu.

- [x] 0.1 Khảo sát toàn bộ chuỗi thương hiệu cũ (Imperial, cung đình, học sĩ...) trong repo
- [x] 0.2 Trích bảng màu từ 4 file logo gốc
- [x] 0.3 Đưa logo vào `public/brand/` (bản tối ưu), `brand-source/` (bản gốc), tạo favicon, apple-touch-icon, icon 192/512
- [x] 0.4 Đổi tên hiển thị: `index.html` (tiêu đề, favicon, theme-color), `metadata.json`, `package.json`, `package-lock.json`, tên file sao lưu JSON
- [x] 0.5 Viết `DESIGN.md` (bản nháp seed từ logo)
- [x] 0.6 Viết `CLAUDE.md`, `AGENT.md`, `CLASSIVY-BRIEF.md`; viết lại `README.md`
- [x] 0.7 Viết lại `PLAN.md` (file này); lưu tài liệu cũ vào `docs/archive/`
- [x] 0.8 Kiểm chứng: `npm test`, `npm run build` (xem kết quả ở "Nhật ký kiểm chứng")

**Cố ý chưa làm trong Phase 0 (đã dời sang Phase 2):** đổi khoá localStorage `imperial_*`, thuật ngữ cung đình trong UI/rank/prompt Gemini, giá trị mặc định "Học sĩ triều đình" trong `AuthContext.tsx` và `supabase-schema.sql`, giao diện/màu trong app. Lý do: đổi khoá localStorage làm mất dữ liệu khách nếu không có đoạn chuyển; đổi schema default cần chạy SQL trên Supabase.

**Bàn giao cho Harry:** xem báo cáo cuối Phase 0. Không có migration.

**Nhật ký kiểm chứng:** ghi ở cuối file.

---

## Phase 1 - Tách App.tsx (giữ nguyên hành vi) (HOÀN THÀNH 2026-10-27)

**Mục tiêu:** `App.tsx` còn là lớp khung mỏng (< ~300 dòng); mỗi tính năng có thư mục riêng; có router; hành vi người dùng không đổi.

**Nguyên tắc:** tách dần theo kiểu "bóc từng lớp" (không viết lại một lần). Sau mỗi bước phải `npm test` + `npm run build` xanh. Không đổi luật game. Không đổi giao diện.

**Cấu trúc mục tiêu (đề xuất, chốt ở task 1.1):**

```
src/
  app/            (App.tsx khung, router, providers)
  features/
    auth/  class/  students/  random/ (solo, battle, boss)
    attendance/  homework/  shop/  pokemon/  ludo/  wheel/
    tools/ (group, timer)  plaza/  settings/  profile/
  components/ui/  (dùng chung)
  lib/            (supabase, storage, utils)
  state/          (store/hook dùng chung)
  types/  constants/
```

**Tasks:**

- [x] 1.1 Lập kế hoạch tách chi tiết: xem `docs/phase-1-split-plan.md` (2026-10-26). Quyết định A-D lấy theo mặc định đề xuất khi Harry yêu cầu "hoàn thành toàn bộ Phase 1": Context + hook, `react-router-dom` + `vercel.json`, Playwright (devDependency), nhánh `refactor/phase-1-split`
- [x] 1.2 (S0) Lưới an toàn (2026-10-26): `fixtures/sample-class.json` (2 lớp, 12 học sinh), `tests/smoke/app.spec.ts` (`npm run smoke`): DOM 4 màn hình + 11 hộp thoại + dữ liệu đồng bộ sau 9 luồng thao tác. Ảnh gốc tạo từ code TRƯỚC khi tách
- [x] 1.3 (S1) Chuyển vào `src/` theo cấu trúc `app/ features/ domain/ data/ lib/ types/ components/` (2026-10-26)
- [x] 1.4 (S2) Rút phần thuần (types, hằng số, hàm trứng/ngày, AuthLoginForm, SettingsSection) ra khỏi App (2026-10-26)
- [x] 1.5 (S3) `GameDataProvider` + `providers/gameData/` (state, đồng bộ Supabase, localStorage, sao lưu/khôi phục), giữ nguyên khoá và điều kiện lưu (2026-10-26)
- [x] 1.6 (S4) `UiEventsProvider` (toast, level-up, nở trứng, hàng đợi Pokémon rời đi, thánh chỉ) (2026-10-26)
- [x] 1.7 (S5) Hành động theo tính năng (`features/*/*Actions.ts`, gọi nhau qua `app.*`); `handleUpdatePoints` -> `domain/points.ts`; tiến trình -> `domain/progression.ts`, `pokemonCollection.ts`; test đặc trưng (2026-10-26)
- [x] 1.8 (S6) Router: `/class` (mặc định), `/plaza`, `/settings`, `/student/:id`; `vercel.json` (2026-10-26)
- [x] 1.9 (S7-S9) Tools/Group/Timer/Thời tiết/User modal; Settings; Plaza + Class + Skill modal (2026-10-26)
- [x] 1.10 (S10) Profile tách theo tab: info / pet (trứng, Pokémon) / fusion + 3 panel (2026-10-26)
- [x] 1.11 (S11-S12) Điểm danh, bài tập (`domain/attendance.ts`, `domain/homework.ts`); Shop, Hatch, Gift, Release (2026-10-26)
- [x] 1.12 (S13-S14) Random/Battle/Boss (`domain/battle.ts`); Lucky Wheel + Cá Ngựa (`domain/ludo.ts`) (2026-10-26)
- [x] 1.13 (S15) Dọn dẹp: lazy-load Plaza/Hồ sơ/Cài đặt và Gemini, tách chunk thư viện (chunk chính 1,40 MB -> 0,50 MB, hết cảnh báo), xoá state/hàm chết, bỏ `importmap` cũ của AI Studio; nợ kỹ thuật ghi ở `docs/architecture.md` mục 7 (2026-10-26)
- [x] 1.13b Theo góp ý nghiệm thu của Harry (D8, 2026-10-27): trang riêng cho từng lớp và cho Cá Ngựa / Vòng quay / Tặng Pokémon (`useClassRoute`, `ClassPickerScreen`, `ClassPageGuard`); dữ liệu đồng bộ sau mọi luồng thử giữ nguyên
- [x] 1.14 (S16) Nghiệm thu (2026-10-27): Harry đã chạy checklist trên bản preview và đồng ý gộp; nhánh `refactor/phase-1-split` gộp vào `main`. Nghiệm thu: Harry chạy checklist hồi quy (`docs/phase-1-split-plan.md` mục 7) trên bản preview Vercel của nhánh; xác nhận để gộp vào `main`

**Khác so với kế hoạch ban đầu (đã cân nhắc, không đổi hành vi):**
- Không tạo `ModalHost` riêng: Random, Cá Ngựa, Vòng quay gọi nhau qua `app.*`; mọi hộp thoại render trong `AppLayout`.
- State giao diện của từng tính năng nằm trong hook của tính năng nhưng vẫn "sống" ở cấp `AppProvider` (không chuyển vào bên trong component) để giữ nguyên hành vi đóng/mở hộp thoại như cũ.
- Code được di chuyển bằng script đọc cây cú pháp TypeScript (không chép tay), sau đó tách thêm logic thuần có test.
- Hai chỉnh sửa nhỏ không đổi kết quả hiển thị: `normalizeClassBossState` không tạo ID Boss bỏ đi mỗi lần render; Boss của lớp hiện tại được `useMemo`.

**Tiêu chí hoàn thành:** `npm test` và `npm run build` xanh; không file nào > ~500 dòng (ngoại lệ có ghi chú, ví dụ dữ liệu `pokemonData`); checklist hồi quy đạt. Hiện trạng: test, build, smoke xanh; `App.tsx` 21 dòng; file lớn nhất (ngoài `pokemonData.ts`) là `domain/gameEvents.ts` 504 dòng (có từ trước, chưa đụng); checklist hồi quy chờ Harry.

**Bàn giao cho Harry (dự kiến):** không migration; chạy checklist hồi quy trên bản dev/preview.

**Kỹ năng dùng:** `engineering:tech-debt`, `engineering:testing-strategy`, `engineering:code-review`.

---

## Phase 2 - Hệ thiết kế Classivy, reskin, thuật ngữ

**Mục tiêu:** giao diện đúng nhận diện Classivy; bỏ thuật ngữ cung đình; không mất dữ liệu người dùng cũ.

- [x] 2.0 **Bỏ hệ cấp bậc** (quyết định D7, làm đầu tiên) - xong 2026-10-27, kết quả ở "Nhật ký kiểm chứng":
  - Bảng Ban thưởng/Phạt: thay 3 ô "Level Hiện Tại / Điểm lên Level / Điểm xuống Level" bằng Trainer Level (cấp + danh hiệu + tiến độ XP, như trên thẻ học sinh)
  - Bỏ hộp "Thánh chỉ" và toàn bộ Gemini (`lib/geminiService.ts`, gói `@google/genai`, biến `GEMINI_API_KEY` trong `.env.example`, README, `vite.config.ts`)
  - Bỏ `getRank`, state/lưu trữ `ranksMale`/`ranksFemale`, `DEFAULT_RANKS_*`, khoá localStorage cấp bậc, `handleAvatarUpload` (không dùng), `rankChanges` trong `domain/points.ts`
  - Dữ liệu: app thôi đọc/ghi `ranks_male`/`ranks_female`; KHÔNG đổi Supabase ở Phase 2 (xoá cột gộp vào migration Phase 3). File sao lưu cũ có phần cấp bậc vẫn nhập được (bỏ qua phần đó) - viết test cho việc này
  - Lỗi "danh sách cấp bậc rỗng làm trắng trang" tự hết theo
  - Kiểm chứng: `npm test`, `npm run typecheck`, `npm run build`, cập nhật ảnh gốc smoke test có chủ đích (`npm run smoke -- --update-snapshots`) và xem lại diff
- [x] 2.1 Chốt `DESIGN.md` chính thức (2026-10-27): theo skill `impeccable`, viết `PRODUCT.md` (Harry xác nhận người dùng: giáo viên trên laptop/màn chiếu; học sinh chưa đăng nhập tới Phase 5), Harry chọn "gộp" bản nháp với những gì đã dựng; hướng thiết kế do Harry ghim nên không bốc thăm hướng mới. Hợp đồng hướng thiết kế trang lớp: `.impeccable/surfaces/`
- [x] 2.2 Chuyển Tailwind từ CDN sang build local, đưa token màu/chữ/bo góc vào cấu hình - xong 2026-10-27: Tailwind 3.4 (cùng dòng v3 với CDN cũ) + PostCSS, `tailwind.config.js` có token `brand-*` từ DESIGN.md (chưa dùng ở màn nào, dành cho 2.3-2.4)
- [x] 2.3 Dựng thư viện `components/ui/` - có Button, Card, Chip, ProgressBar (có "chồi lá"), ShieldScore, EmptyState, Modal và toast Pokémon không chặn thao tác. Avatar tiếp tục dùng `StudentAvatar` hiện hữu.
- [x] 2.4 Reskin các màn hình đã tách; rà token tương phản, focus và thao tác modal
  - [x] Bản mẫu (Harry chọn "làm mẫu trước", 2026-10-27): khung app (thanh điều hướng trái luôn hiện, gộp nút đồng bộ), trang chọn lớp, trang lớp (thanh công cụ, thẻ học sinh, dock công cụ có chữ), màn chờ đăng nhập. **Harry duyệt hướng 2026-10-27**, kèm chỉnh sửa D10 (đã làm: màu thanh điều hướng, bo góc, nút Tặng quà, dock macOS, bỏ Plaza/thời tiết)
  - [x] Các màn còn lại đã chuyển token/lớp phủ Classivy theo từng đợt; Plaza và weather bị bỏ theo D10. Playfair không còn được tải; lớp tương thích `font-royal` nay dùng font Classivy để bảo toàn bố cục cũ trong khi các màn được dọn dần.
  - [~] Đợt 1 (2026-10-27): đã reskin khung Hồ sơ, Cài đặt, Đăng nhập/đăng ký, Tài khoản giáo viên, Chia nhóm và Hẹn giờ bằng Card/Modal/Button token Classivy. Nội dung sâu của ba tab Hồ sơ, các biểu mẫu Cài đặt, Điểm danh/Bài tập và các modal game còn giao diện cũ; không đổi hành vi/dữ liệu.
- [x] 2.5 **Quyết định với Harry:** bộ thuật ngữ (D9, 2026-10-27): giữ "Hào Quang", "Học sĩ" -> "Trainer". Đã đổi 3 mô tả vật phẩm/kỹ năng trong `pokemonData.ts`. Lưu ý: danh sách kỹ năng Pokémon được lưu riêng theo giáo viên (sửa được ở Cài đặt), nên tài khoản đã có dữ liệu vẫn thấy chữ cũ ở 2 kỹ năng "Ý Chỉ Đồng Hành", "Truyền Cảm Hứng" cho tới khi tự sửa. Còn mở: tên kỹ năng "Ý Chỉ Đồng Hành" và vài chữ "hoàng" trong dữ liệu Pokémon/Boss
  - Bổ sung theo Harry duyệt: `Ý Chỉ Đồng Hành` -> `Đồng Đội Hỗ Trợ`; `Áo Choàng Hoàng Gia` -> `Áo Choàng Huyền Ảo`; `Vương Miện Hoàng Đế` -> `Vương Miện Nhà Vô Địch`; mô tả "hào quang hoàng tộc" -> "hào quang rực rỡ". Tài khoản đã lưu `petSkills` riêng vẫn giữ tên cũ cho tới khi giáo viên khôi phục/sửa danh sách trong Cài đặt.
- [x] ~~2.6 Đổi prompt Gemini~~ - không cần nữa: Gemini bị bỏ ở 2.0 (D7)
- [x] 2.7 Đổi khoá localStorage `imperial_*` thành `classivy_*` **kèm đoạn chuyển dữ liệu một lần** (đọc khoá cũ, ghi khoá mới, giữ bản cũ để hoàn tác) và test - xong 2026-10-27. Cách hoàn tác: xoá các khoá `classivy_*` và `classivy_storage_migrated_v1` trong trình duyệt rồi tải lại trang
- [x] 2.8 Đổi giá trị mặc định "Học sĩ triều đình" thành "Trainer" trong `AuthContext.tsx`; SQL đổi default (và xoá cột cấp bậc) soạn sẵn ở `docs/phase-3-pending-sql.md` để gộp vào migration Phase 3, không chạy riêng (2026-10-27)
- [x] 2.9 Cập nhật `DESIGN.md`, PLAN, BRIEF; báo cáo (2026-10-27)

**Bàn giao cho Harry (dự kiến):** duyệt bộ thuật ngữ mới; thử bản preview; không migration (SQL đổi default gộp vào Phase 3).

**Kỹ năng dùng:** `impeccable`, `ui-ux-pro-max`, `design-system`, `brand`, `design:accessibility-review`, `design:ux-copy`.

---

## Phase 3 - Mô hình dữ liệu mới + RLS (roadmap, sẽ phân tích sâu khi tới)

**Mục tiêu:** học sinh, lớp, điểm là dữ liệu bảng thật, có RLS chặt, dữ liệu cũ được chuyển sang mà không mất.

- [ ] 3.1 ADR về data model (`engineering:architecture`): bảng lớp, học sinh, thành viên lớp, sổ cái điểm, trạng thái tài khoản; cách giữ dữ liệu game (Pokémon, Boss, Ludo) dạng JSON hay bảng
- [ ] 3.2 Viết migration trong `supabase/migrations/` (có phần hoàn tác), kèm RLS và test RLS; gồm xoá cột `ranks_male`, `ranks_female` khỏi `user_settings` (D7)
- [ ] 3.3 Script chuyển dữ liệu từ `user_settings.students` sang bảng mới, có chế độ chạy thử (dry-run) và đối chiếu số lượng
- [ ] 3.4 Lớp truy cập dữ liệu mới trong app; giữ chế độ khách (guest) nếu còn dùng
- [ ] 3.5 Kiểm tra trên **dự án Supabase dev/branch** trước; kiểm tra giới hạn gói miễn phí
- [ ] 3.6 `deploy-checklist`, sao lưu trước khi chạy trên production

**Bàn giao cho Harry:** sao lưu dữ liệu, chạy migration trên dev rồi production theo hướng dẫn; xác nhận từng bước trước khi coi là đã áp dụng.

---

## Phase 4 - Giáo viên quản lý tài khoản học sinh (roadmap)

- [ ] 4.1 Edge Function: tạo tài khoản (đơn lẻ và hàng loạt từ danh sách lớp), đặt lại mật khẩu, khoá/mở khoá, xoá mềm
- [ ] 4.2 Quy ước tên đăng nhập, mật khẩu ban đầu, ép đổi mật khẩu lần đầu
- [ ] 4.3 Màn hình quản lý học sinh (tìm, lọc, sửa, khoá, xoá, in thẻ đăng nhập)
- [ ] 4.4 Nhật ký thao tác của giáo viên; xác nhận trước khi xoá
- [ ] 4.5 Kiểm thử phân quyền: giáo viên chỉ thấy học sinh lớp mình

---

## Phase 5 - Cổng học sinh (roadmap)

- [ ] 5.1 Trang đăng nhập học sinh, giao diện điện thoại trước
- [ ] 5.2 Xem hồ sơ: điểm, rank, Pokémon, huy hiệu, lịch sử điểm (chỉ của mình)
- [ ] 5.3 Tài khoản bị khoá hiển thị thông báo rõ ràng, không lộ thông tin
- [ ] 5.4 Kiểm thử RLS: học sinh không đọc được dữ liệu người khác

---

## Phase 6 - Bạn bè, quà tặng, tặng điểm (roadmap)

- [ ] 6.1 Kết bạn trong cùng lớp (gửi lời mời, chấp nhận, huỷ); giáo viên bật/tắt tính năng theo lớp
- [ ] 6.2 Ví "điểm tặng" có hạn mức tuần do giáo viên đặt; hàm DB atomic + sổ cái bất biến
- [ ] 6.3 Quà tặng (vật phẩm/emoji/lời nhắn định sẵn), không chat tự do
- [ ] 6.4 Chống lạm dụng: giới hạn tần suất, chặn gian lận qua lại giữa hai tài khoản, báo cáo, giáo viên xem và thu hồi giao dịch
- [ ] 6.5 Thiết kế tương tác lành mạnh (không bêu xấu, không xếp hạng cuối lớp công khai)

---

## Phase 7 - Hardening và ra mắt (roadmap)

- [ ] 7.1 Rà soát bảo mật (RLS, Edge Function, giới hạn tốc độ, lộ khoá)
- [ ] 7.2 Kiểm thử tải nhẹ theo quy mô lớp thật; theo dõi giới hạn free tier
- [ ] 7.3 Hướng dẫn sử dụng cho giáo viên và học sinh; thông báo phụ huynh nếu cần
- [ ] 7.4 Kế hoạch triển khai từng lớp (pilot một lớp trước)

---

## Đề xuất phát sinh (chờ Harry duyệt)

- Có cần vai trò phụ huynh (xem điểm con) không? Hiện ngoài phạm vi.
- ~~**[Lỗi game]** Cá Ngựa: bị Quái vật giữ, lắc 6 vẫn bị kẹt~~ → Harry duyệt sửa, **đã sửa 2026-10-26** (`checkMonsterEscape` trong `src/domain/ludo.ts`, có test).
- ~~**[Lỗi có sẵn]** Danh sách cấp bậc rỗng làm trắng trang~~ → giải quyết bằng việc bỏ hệ cấp bậc (D7, task 2.0).
- ~~**[Chất lượng mã]** Cài `@types/react`~~ → Harry duyệt, **đã làm 2026-10-26**: cài `@types/react`, `@types/react-dom`, thêm `src/vite-env.d.ts`, sửa lỗi kiểu còn lại; `npm run typecheck` = 0 lỗi.
- ~~**[Lỗi có sẵn, dữ liệu]** Trước khi đăng nhập xong, app ghi `[]` đè bản lưu học sinh trên máy~~ → Harry duyệt, **đã sửa 2026-10-27** (`useLocalPersistence.ts` chỉ ghi khi `!authLoading`; smoke test nhóm 6 kiểm tra học sinh trên máy được đẩy lên đám mây ở lần đăng nhập đầu; bỏ bản sửa thì test đỏ).
- **[Giao diện, gộp vào 2.4]** Thông báo "Pokémon phản ứng" phủ một lớp trong suốt lên toàn màn hình: bấm vào bất kỳ đâu (kể cả nút "Lắc xí ngầu" ở Cá Ngựa) chỉ để tắt thông báo, phải bấm lần nữa. Phát hiện khi smoke test chạy với CSS thật. Đề xuất khi reskin: thông báo không chặn thao tác bên dưới.
- ~~**[Giao diện, nhỏ]** Hiệu ứng làm mờ khi rê chuột trên thẻ học sinh có thể bị "kẹt"~~ → **đã bỏ hiệu ứng làm mờ** khi reskin thẻ học sinh (2026-10-27).
- **[Truy cập, gộp vào 2.4]** Thẻ học sinh bấm được bằng chuột nhưng chưa vào được bằng phím Tab (là `div` có `onClick`). Đề xuất đổi sang nút/đường dẫn thật khi rà `accessibility-review`.

## Quy trình sau mỗi Phase

1. Chạy kiểm thử trong phạm vi có thể (`npm test`, `npm run build`, kiểm tra thủ công nếu cần).
2. Cập nhật `PLAN.md` (tick task, ghi ngày, kết quả kiểm chứng) và `CLASSIVY-BRIEF.md`.
3. Báo cáo cho Harry, gồm: đã làm gì; chưa kiểm chứng gì; **migration nào cần chạy** (tên file, thứ tự, chạy ở dev hay production); Harry cần làm gì; quyết định còn mở; Phase tiếp theo làm gì.
4. Không coi thay đổi là đã áp dụng trên Supabase/Vercel thật cho đến khi Harry xác nhận.

## Nhật ký kiểm chứng

**Phase 0 - 2026-10-26** (kiểm thử tự động, trên bản sao tạm, chưa chạy trên Vercel/Supabase thật):
- `npm ci`: thành công.
- `npm test`: 3 file test, 28 test đạt.
- `npm run build`: thành công (507 module); chỉ còn cảnh báo chunk lớn đã biết (~1,34 MB).
- Chưa kiểm tra bằng mắt trên trình duyệt: tiêu đề tab "Classivy" và favicon mới (cần Harry xem khi chạy `npm run dev`).
- Không có thay đổi nào trên Supabase hay Vercel.

**Phase 1 / S2 - 2026-10-26** (kiểm thử tự động trên máy ảo; chưa thử tay, chưa chạy trên Vercel/Supabase thật):
- `npm test`: 7 file test, 48 test đạt (thêm 20 test cho ngày/tuần, trứng, thời tiết, số ngẫu nhiên, `isBossEncounterFrequency`).
- `npm run build`: thành công (513 module); vẫn chỉ cảnh báo chunk lớn đã biết.
- `tsc --noEmit`: không thêm lỗi mới (các lỗi kiểu cũ trong `App.tsx`, `gameEvents.ts`, `supabaseClient.ts` có từ trước, không thuộc S2).
- Smoke test tạm bằng Playwright (script nằm ngoài repo, chưa phải S0): phiên đăng nhập giả, chặn mạng Supabase. So văn bản hiển thị trước/sau của màn đăng nhập, đăng ký, Plaza, Lớp học, Cài đặt, bật/tắt một khối cài đặt: giống hệt; ảnh chụp chỉ khác ở đồng hồ. 0 lỗi console. Chưa phủ: các modal, dữ liệu học sinh thật, Tailwind CDN (bị chặn mạng nên ảnh không có style).

**Phase 1 - 2026-10-26** (kiểm thử tự động trên máy ảo; chưa thử tay; chưa chạy trên Vercel/Supabase thật):
- `npm test`: 13 file, 94 test đạt (thêm test cho điểm, điểm danh, bài tập, battle, Cá Ngựa, tiến trình, bộ sưu tập Pokémon, Vòng quay, Boss, định tuyến).
- `npm run build`: thành công, không còn cảnh báo chunk lớn (chunk chính ~499 kB).
- `tsc --noEmit`: đúng bộ lỗi cũ có từ trước (so từng thông báo), không thêm lỗi mới.
- `npm run smoke`: 5 nhóm test đạt. 4 nhóm so với ảnh gốc tạo từ code TRƯỚC khi tách (cùng dữ liệu mẫu, giờ cố định, số ngẫu nhiên có seed): DOM giống hệt ở đăng nhập, đăng ký, Lớp, Plaza, Cài đặt (mở hết các khối), Hồ sơ 3 tab, Random, Cá Ngựa, Vòng quay, Shop, Chia nhóm, Hẹn giờ, Điểm danh, Bài tập, Tặng Pokémon, Tài khoản, bảng điểm; dữ liệu đồng bộ lên "đám mây" giống hệt sau: cộng điểm, điểm danh, bài tập, Random solo -> Cá Ngựa -> lắc, Battle, Shop, Tặng Pokémon, Vòng quay, đổi tần suất Boss. Nhóm 5 kiểm tra URL: tải lại ở từng đường dẫn, Back/Forward, đường dẫn lạ.
- Smoke test không phủ: Boss Raid đủ 5 người, Pokémon về 0 HP và màn rời đi, hợp nhất, dùng skill, nhập/xuất JSON, sao lưu/khôi phục, đăng ký/đăng nhập thật, Google login, đồng bộ giữa 2 trình duyệt, Tailwind CDN (bị chặn trong máy ảo nên không so được màu/bố cục). Các mục này nằm trong checklist S16 của Harry.
- Không có thay đổi nào trên Supabase hay Vercel. Không có migration.

**Sau Phase 1 - 2026-10-26** (theo duyệt của Harry; kiểm thử tự động, chưa thử tay, chưa chạy trên Vercel/Supabase thật):
- Sửa lỗi Cá Ngựa lắc 6 vẫn bị Quái vật giữ; cài `@types/react`/`@types/react-dom`, sửa lỗi kiểu (`npm run typecheck`: 0 lỗi, trước đó ~20 lỗi); xoá `.sync-out.tgz`.
- `npm test`: 13 file, 97 test đạt. `npm run build`: thành công. `npm run smoke`: 5/5 đạt (ảnh gốc không đổi vì luồng thử không đi vào ô Quái vật).
- Thử nhập file sao lưu cũ (2026-10-27, kiểm thử tự động, Supabase giả): xuất JSON từ code trước nhánh (`253253c`) rồi nhập vào code mới: thành công, 12/12 học sinh đúng điểm/Pokémon/trứng, không lỗi; dùng bảng điểm và hồ sơ sau khi nhập vẫn bình thường. Chưa thử với file sao lưu thật của Harry.
- Trang riêng theo lớp (D8, 2026-10-27, kiểm thử tự động): `npm run typecheck` 0 lỗi; `npm test` 100 test đạt; `npm run build` thành công, không cảnh báo; `npm run smoke` 5/5 đạt hai lần liên tiếp, test định tuyến 6/6 lần lặp. Ảnh chụp dữ liệu đám mây sau mọi luồng không đổi. Ảnh giao diện cập nhật có chủ đích: trang chọn lớp mới, chữ "← Danh sách lớp" trong ô chọn lớp, trang con không còn vẽ lưới học sinh phía sau, danh sách tick ở Vòng quay (đã đối chiếu: ngoài các chỗ này không có dòng mới). Chưa thử tay.
- Nghiệm thu S16 (2026-10-27): Harry thử thủ công trên bản preview Vercel của nhánh và đồng ý; gộp vào `main`. Không có migration, không thay đổi Supabase.

**Phase 2 / task 2.0 - 2026-10-27** (kiểm thử tự động trên máy ảo; chưa thử tay; chưa chạy trên Vercel/Supabase thật):
- Đã bỏ: `RankInfo`, `getRank`, `DEFAULT_RANKS_*`, khoá `imperial_ranks_*`, state `ranksMale`/`ranksFemale`, `handleAvatarUpload`, `rankChanges`, hộp "Thánh chỉ" (`EdictModal`, state `edict`), `lib/geminiService.ts`, gói `@google/genai`, `GEMINI_API_KEY` (README, `vite.config.ts`, cấu hình Playwright).
- Bảng Ban thưởng/Phạt: thay 3 ô cấp bậc bằng khung Trainer Level (cấp, danh hiệu, thanh XP, "Trainer XP a/b") giống thẻ học sinh.
- App thôi đọc/ghi `ranks_male`/`ranks_female` (giá trị cũ trên Supabase để nguyên; xoá cột ở Phase 3). Nhập file sao lưu đi qua `domain/backup.ts` (`pickBackupFields`) chỉ lấy trường còn dùng; test với `fixtures/sample-class.json` (có phần cấp bậc): nhập được, bỏ đúng phần cấp bậc.
- `npm run typecheck`: 0 lỗi. `npm test`: 14 file, 103 test đạt (bỏ 1 test cấp bậc, thêm 4 test sao lưu). `npm run build`: thành công, không cảnh báo (chunk chính ~470 kB).
- `npm run smoke`: lần đầu 2 nhóm đỏ đúng chỗ dự kiến; cập nhật ảnh gốc có chủ đích. Đã đối chiếu diff: `30-skill-modal.html` chỉ đổi khung bên trái (Trainer Level thay 3 ô cấp bậc); 10 file dữ liệu đám mây chỉ MẤT hai trường `ranks_male`/`ranks_female`, không thêm/đổi dòng nào khác. Chạy lại: 5/5 đạt.

**Phase 2 / task 2.7 - 2026-10-27** (kiểm thử tự động trên máy ảo; chưa thử tay; chưa chạy trên Vercel/Supabase thật):
- 11 khoá `imperial_*` đổi thành `classivy_*` (danh sách ở `LEGACY_STORAGE_KEYS`, `src/data/constants.ts`). Ba khoá âm thanh trước đây viết thẳng chuỗi nay dùng hằng số. Khoá không có tiền tố `imperial_` (`custom_ludo_tiles`, `trainer_weather_*`) giữ nguyên.
- `domain/storageMigration.ts` chạy một lần trong `src/main.tsx` trước khi render: chỉ chép khi khoá mới trống, không xoá khoá cũ, ghi cờ `classivy_storage_migrated_v1`, không làm sập app nếu trình duyệt chặn localStorage. 6 unit test.
- Smoke test mới (nhóm 6): máy có khoá cũ, đám mây trống -> lần đăng nhập đầu đẩy đúng tần suất Boss và phần thưởng Vòng quay đọc từ khoá cũ; khoá cũ còn nguyên. Đã thử tắt đoạn chuyển: test đỏ đúng chỗ (nhận `occasional` thay vì `rare`).
- `npm run typecheck` 0 lỗi; `npm test` 15 file, 109 test đạt; `npm run build` thành công; `npm run smoke` 6/6 đạt, ảnh gốc 5 nhóm cũ không đổi.

**Phase 2 / sửa lỗi bản lưu máy + task 2.5, 2.8 - 2026-10-27** (kiểm thử tự động; chưa thử tay; chưa chạy trên Vercel/Supabase thật):
- `useLocalPersistence.ts`: chỉ ghi học sinh/kỹ năng/Boss vào máy khi đã biết trạng thái đăng nhập. Smoke nhóm 6 mở rộng: học sinh và kỹ năng ở khoá cũ được đẩy lên đám mây ở lần đăng nhập đầu; dùng lại code cũ thì test đỏ.
- "Học sĩ" -> "Trainer" (D9). `npm run smoke -- --update-snapshots`: 14 file ảnh gốc đổi, đã đối chiếu: mọi dòng đổi chỉ là 2 mô tả kỹ năng chứa chữ "Học sĩ".
- `npm run typecheck` 0 lỗi; `npm test` 109 test đạt; `npm run build` thành công; `npm run smoke` 6/6 đạt.

**Phase 2 / task 2.2 - 2026-10-27** (kiểm thử tự động; chưa thử tay; chưa chạy trên Vercel thật):
- Bỏ `<script src="https://cdn.tailwindcss.com">`; Tailwind 3.4.19 build cùng Vite (`tailwind.config.js`, `postcss.config.js`, `@tailwind` ở cuối `src/index.css` để giữ thứ tự ưu tiên như khi CDN chèn style vào cuối `<head>`). File CSS ~119 kB (gzip ~17 kB).
- Không so được pixel với bản CDN vì CDN bị chặn trong máy ảo; trước đây smoke test cũng chạy không có CSS. Nay smoke test chạy với CSS thật: DOM và dữ liệu đồng bộ của cả 6 nhóm khớp ảnh gốc, KHÔNG phải cập nhật ảnh gốc. Hai chỗ test phải thao tác giống người dùng hơn: rê chuột vào thanh điều hướng bên trái trước khi bấm (thanh này ẩn ngoài mép màn hình), và nút "Lắc xí ngầu" bị thông báo Pokémon che (ghi ở "Đề xuất phát sinh").
- Thêm `SMOKE_SCREENSHOTS=1 npm run smoke` để lưu ảnh chụp từng màn vào `test-results/screens/` (không so sánh, không commit). Đã xem ảnh trang lớp, Ban thưởng/Phạt, Cá Ngựa: đủ màu, bố cục đúng.
- `npm run typecheck` 0 lỗi; `npm test` 109 đạt; `npm run build` thành công; `npm run smoke` 6/6 đạt hai lần liên tiếp.
- Cần Harry: mở bản preview Vercel của nhánh, so nhanh với bản đang chạy (màu, bố cục, hộp thoại) vì máy ảo không so được với CDN.

**Phase 2 / task 2.1, 2.3, bản mẫu 2.4 - 2026-10-27** (kiểm thử tự động + xem ảnh chụp trên máy ảo; chưa thử tay; chưa chạy trên Vercel thật):
- Thêm `PRODUCT.md`, cập nhật `DESIGN.md` (chính thức), `src/components/ui/`, `src/components/ClassDock.tsx` (thay `LiquidDock`), gói `lucide-react` (icon, MIT, miễn phí). Bỏ CSS "liquid glass".
- Tương phản đo bằng công thức WCAG cho 20 cặp chữ/nền đã dùng: tất cả đạt AA sau khi sửa 3 cặp (chữ trứng, nhãn "Hào Quang", chữ gợi ý ô tìm kiếm).
- `npm run typecheck` 0 lỗi; `npm test` 109 đạt; `npm run build` thành công; `npm run smoke` 6/6 đạt hai lần. Ảnh gốc DOM cập nhật có chủ đích (32 file .html: thay đổi giao diện); **12 file dữ liệu đám mây không đổi** = mọi luồng thao tác giữ nguyên kết quả. Test đổi 2 bộ chọn: dock theo `role="toolbar"`, nút cộng điểm theo tên "Cộng điểm ...".
- Đã xem ảnh chụp: trang chọn lớp, trang lớp, trạng thái rê chuột (nút vắng/cộng/trừ), chế độ chọn nhiều (dock đủ nút Phản hồi/Xóa sau khi sửa lỗi bị cắt). Trong máy ảo không tải được Google Fonts và ảnh đại diện (bị chặn mạng) nên chữ trong ảnh chụp là phông dự phòng.

**Phase 2 / reskin đợt 1 - 2026-10-27** (kiểm thử tự động cục bộ; chưa thử tay/preview Vercel):
- Theo Harry duyệt: khung Cài đặt, Hồ sơ, đăng nhập/đăng ký, Tài khoản giáo viên, Chia nhóm và Hẹn giờ đổi sang token Classivy; tái sử dụng `Modal`, `Button`, `Card`, `Chip`. Không thay đổi state, luồng đăng nhập, chia nhóm, hẹn giờ hay cấu trúc Supabase/localStorage.
- Dọn thuật ngữ dữ liệu mặc định theo quyết định đã chốt: `Ý Chỉ Đồng Hành` -> `Đồng Đội Hỗ Trợ`, hai phụ kiện hoàng gia thành `Áo Choàng Huyền Ảo` và `Vương Miện Nhà Vô Địch`, mô tả "hào quang hoàng tộc" thành "hào quang rực rỡ". `petSkills` từng giáo viên đã lưu không bị ghi đè.
- `npm run typecheck`: đạt. `npm test`: 106/106 đạt ở lần chạy lại; lần đầu có 1 test nở trứng flaky do Pokémon shiny ngẫu nhiên, không liên quan thay đổi này. `npm run build`: đạt.
- Snapshot smoke đã cập nhật có chủ đích cho đăng nhập/đăng ký, Cài đặt, ba tab Hồ sơ, Chia nhóm, Hẹn giờ, Tài khoản và các snapshot dữ liệu cloud có thay đổi `sk_decree`. Nhóm "các màn hình chính" đã chạy xanh riêng sau khi đổi bộ chọn từ `Trainer Settings` sang `Cài đặt lớp học`; nhóm modal kết thúc không có `error-context`. Nên chạy lại đủ 6/6 smoke trên preview/CI trước khi gộp. Không migration, không deploy.

**Phase 2 / làm sạch Imperial ở đăng nhập, Cài đặt, Hồ sơ - 2026-10-27:**
- Theo Harry duyệt: form đăng nhập chỉ còn email + mật khẩu. Bỏ UI tạo tài khoản và nút Google; code đăng ký/Google trong `AuthContext` giữ lại cho Phase 4, chỉ không còn lối vào trên giao diện giáo viên hiện tại.
- Đổi primary đỏ còn lồng sâu trong Cài đặt/Hồ sơ thành `brand-forest`; phần xoá/cảnh báo vẫn đỏ vì là trạng thái nguy hiểm có nghĩa. Các heading `font-royal` trong bề mặt Hồ sơ được thay bằng Plus Jakarta Sans/Be Vietnam Pro theo `DESIGN.md`.
- Cập nhật smoke test: bỏ snapshot `02-register.html` và không còn thao tác tạo tài khoản; cập nhật snapshot đăng nhập, Cài đặt và ba tab Hồ sơ. `npm run typecheck`, `npm test` (106/106) và `npm run build` đạt.

**Phase 2 / Điểm danh và Bài tập - 2026-10-27:**
- Reskin `AttendanceCheckModal` và `HomeworkCheckModal` bằng Modal/Button/Chip dùng chung. Đổi copy tiếng Anh còn sót sang tiếng Việt, giữ nguyên cách chọn trạng thái, số đã chốt và hành động ghi điểm.
- Cập nhật snapshot `26-attendance.html` và `27-homework.html`. `npm run typecheck` đạt; cần chạy lại toàn bộ test/build/smoke ở cuối cụm.

**Phase 2 / modal game còn lại - 2026-10-27:**
- Đồng bộ lớp phủ của Random/Battle/Boss, Cá Ngựa, Vòng quay, Shop, Tặng Pokémon, Ấp trứng, Pokémon rời đội hình và Skill Points sang nền `forest-deep`; thay serif `font-royal` trong các modal game bằng font Classivy; các primary đỏ cũ chuyển thành `forest`, giữ đỏ cho trạng thái nguy hiểm.
- `LevelUpModal` và `BossDefeatedModal` đã được chuyển sang Modal/Card/Button dùng chung. `npm run typecheck`, `npm test` (106/106) và `npm run build` đạt. Chạy `npm run smoke -- --update-snapshots` đã bắt đầu cập nhật snapshot (`20-random`); cần chạy/đối chiếu lại đầy đủ 6 nhóm trước khi chốt Phase 2.

