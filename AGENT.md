# AGENT.md - Quy tắc làm việc cho mọi AI agent trên Classivy

Tài liệu này áp dụng cho bất kỳ AI agent nào (Claude, Cursor, Codex...) làm việc trong repo. Công cụ riêng của Claude Code nằm ở `CLAUDE.md`.

## 1. Nguồn sự thật (đọc theo thứ tự)

1. `CLASSIVY-BRIEF.md` - trạng thái dự án, quyết định đã chốt. Đọc đầu tiên.
2. `PLAN.md` - các Phase và tasks. Chỉ làm việc trong Phase hiện tại.
3. `DESIGN.md` - hệ thiết kế (màu, chữ, thành phần). Đọc trước khi sửa giao diện.
4. Mã nguồn và test là nguồn xác minh cuối cùng. Khi tài liệu và mã mâu thuẫn, báo lại, không tự đoán.

`docs/archive/` là tài liệu lịch sử của Imperial School, chỉ đọc khi cần tra cứu luật game cũ. Không làm theo chúng nếu mâu thuẫn với các file trên.

## 2. Quy tắc phạm vi

- Không tự mở rộng phạm vi Phase. Việc phát sinh ghi vào mục "Đề xuất phát sinh" trong `PLAN.md`, chờ Harry duyệt.
- Không tự chốt quyết định ảnh hưởng nghiệp vụ, bảo mật, chi phí hoặc kiến trúc. Đưa phương án, ưu/nhược, đề xuất mặc định rồi hỏi.
- Khi được yêu cầu "lập kế hoạch" thì chỉ lập kế hoạch, không viết code.
- Không đổi luật game (điểm, HP, Pokémon, Boss) trong các Phase tái cấu trúc. Tách code phải giữ nguyên hành vi.

## 3. Bảo mật và dữ liệu (không thương lượng)

- Không bao giờ đưa `service_role` key, mật khẩu, token vào mã client, git hay tài liệu. Chỉ khoá `anon` được ở client.
- Mọi bảng Supabase phải bật RLS. Không nới RLS để "cho chạy". Mỗi policy phải có test hoặc kịch bản kiểm tra bằng tay ghi trong PLAN.
- Thao tác tạo/khoá/xoá tài khoản học sinh, chuyển điểm, tặng quà chỉ thực hiện qua Edge Function hoặc hàm DB `security definer` có kiểm tra quyền. Client không được ghi trực tiếp.
- Chuyển điểm/quà phải atomic và ghi sổ cái (ledger) không sửa được.
- Học sinh là trẻ vị thành niên: không chat tự do, không hiển thị thông tin cá nhân của học sinh này cho học sinh khác, giáo viên luôn có quyền xem log và tắt tính năng xã hội.
- Không tự chạy migration lên Supabase thật. Chỉ viết file migration trong `supabase/migrations/` và hướng dẫn Harry chạy. Chỉ coi migration là "đã áp dụng" khi Harry xác nhận.

## 4. Chất lượng và bằng chứng

- Trước khi báo hoàn thành: chạy `npm test` và `npm run build`, đọc kết quả thật.
- Phân biệt rõ trong báo cáo: (a) đã kiểm thử tự động, (b) đã thử thủ công trên dev, (c) chưa kiểm chứng, (d) đã chạy trên production. Không gộp chung.
- Không đánh dấu task xong nếu test đang đỏ hoặc còn lỗi chưa giải quyết.
- Mỗi hàm nghiệp vụ mới (tính điểm, ví, bạn bè) phải có test đơn vị.

## 5. Quy ước mã nguồn

- TypeScript nghiêm ngặt, tránh `any` mới.
- Logic thuần (không React) đặt riêng khỏi UI để test được. Một file component nên dưới khoảng 400-500 dòng.
- Giao diện dùng token trong `DESIGN.md`; không hard-code màu mới.
- Văn bản hiển thị cho người dùng bằng tiếng Việt, giọng thân thiện, phù hợp học sinh 11-15 tuổi.
- Ràng buộc free tier: Supabase và Vercel. Tránh polling dày, tránh tải ảnh lớn vào DB, ưu tiên truy vấn có chỉ mục.

## 6. Git

- Không commit/push nếu Harry chưa yêu cầu. Commit nhỏ, một mục đích, thông điệp tiếng Anh ngắn gọn theo dạng `type(scope): mô tả`.
- Thư mục `.claude/` (skills của dự án) được commit; không commit `__pycache__`. Không `git add` file `.env*` thật.

## 7. Cuối mỗi Phase

1. Chạy kiểm thử trong phạm vi có thể.
2. Cập nhật `PLAN.md` (tick task, ghi ngày, ghi kết quả kiểm chứng).
3. Cập nhật `CLASSIVY-BRIEF.md` để chuyển sang chat sau.
4. Báo cáo cho Harry: đã làm gì, chưa kiểm chứng gì, cần chạy migration nào hoặc làm gì từ phía Harry, quyết định còn mở, Phase kế tiếp.
