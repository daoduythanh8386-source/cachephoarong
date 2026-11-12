# Hướng dẫn cập nhật Cá Chép Vượt Vũ Môn V2 bằng iPhone

> Nên cập nhật vào đúng GitHub repository đang kết nối với project Vercel V1. Không xóa repository cũ.

## A. Giải nén bộ V2

1. Tải `ca-chep-vuot-vu-mon-v2.zip` về iPhone.
2. Mở ứng dụng **Tệp (Files)** → **Duyệt** → **Tải về (Downloads)**.
3. Chạm vào file ZIP một lần để giải nén.
4. Mở thư mục `ca_chep-vuot-vu-mon` vừa tạo. Bên trong là các file và thư mục của V2.

## B. Cập nhật GitHub

1. Mở Safari và đăng nhập https://github.com.
2. Mở repository đang chứa V1 và đang kết nối với Vercel.
3. Vào thư mục gốc repository. Nhấn **Add file → Upload files**.
4. Từ ứng dụng Tệp, chọn các file ở thư mục gốc của V2 để tải lên và ghi đè khi GitHub báo trùng:
   - `index.html`
   - `style.css`
   - `game.js`
   - `data.js`
   - `README.md`
   - `package.json`
   - `vercel.json`
   - `.env.example`
5. Kéo xuống cuối trang GitHub, nhập nội dung commit, ví dụ `Upgrade game to V2`, rồi nhấn **Commit changes**.
6. Mở thư mục `assets` trong repository. Chọn **Add file → Upload files**, tải lên hai file V2 cùng tên để thay thế:
   - `koi.svg`
   - `dragon.svg`
   Giữ lại `vietnam-scenes.svg` nếu đang có.
7. Nếu repository chưa có thư mục `api`:
   - Chọn **Add file → Create new file**.
   - Ở ô tên file nhập `api/.gitkeep`, nội dung nhập `api folder` rồi commit.
   - Mở thư mục `api` vừa tạo, chọn **Add file → Upload files**.
   - Tải `transcribe.js` từ thư mục `api` của V2 lên, rồi commit.
   - Có thể xóa file `.gitkeep` sau đó; không bắt buộc.
8. Nếu iPhone không cho chọn nhiều file cùng lúc, tải từng file một và commit từng lần. Không tải nguyên file ZIP lên repository vì Vercel không tự giải nén ZIP trong source repo.

## C. Thêm khóa API vào Vercel (bắt buộc để micro hoạt động)

1. Mở https://platform.openai.com/api-keys và đăng nhập tài khoản OpenAI Platform.
2. Tạo API key mới, sao chép ngay và giữ bí mật. Việc dùng API có thể cần bật thanh toán API riêng; gói ChatGPT không tự động bao gồm chi phí API.
3. Mở https://vercel.com/dashboard → chọn project game.
4. Chọn **Settings → Environment Variables**.
5. Thêm:
   - Key / Name: `OPENAI_API_KEY`
   - Value: dán API key vừa tạo.
   - Environment: chọn **Production**; chọn thêm **Preview** nếu cần.
6. Nhấn **Save**. Không đưa key vào GitHub hoặc gửi cho người khác.

## D. Deploy lại

1. Mở project Vercel → **Deployments**.
2. Nếu GitHub commit mới tự tạo deployment, chờ deployment mới nhất có trạng thái **Ready**.
3. Nếu chưa có deployment mới, mở menu ở project và chọn **Redeploy** cho commit mới nhất sau khi đã lưu biến môi trường.
4. Chọn **Visit** để mở website.

## E. Thử micro trên iPhone

1. Mở website bằng Safari qua đường link HTTPS của Vercel.
2. Chọn **Luyện nói với micro**.
3. Nhấn **Cho phép** khi Safari hỏi quyền micro.
4. Chạm nút micro, đọc từ trên màn hình khoảng 2–5 giây, rồi chạm nút lần nữa để dừng.
5. Chờ dòng chữ máy nhận dạng nghe được. Nếu không rõ, thử lại hoặc chuyển sang chọn L/N.

## Nếu gặp lỗi

- `OPENAI_API_KEY chưa được cấu hình`: kiểm tra tên biến chính xác, chọn Production, Save rồi Redeploy.
- `404` tại `/api/transcribe`: kiểm tra file `api/transcribe.js` nằm ở thư mục gốc repository (cùng cấp với `index.html`), không bị đặt trong thư mục con sai.
- `500` hoặc `502`: kiểm tra Vercel → Deployments → Functions/Logs; kiểm tra API key và billing.
- Không hiện yêu cầu micro: dùng Safari, mở trang HTTPS, kiểm tra Cài đặt iPhone → Safari → Microphone.
- Micro có thể nghe nhầm L/N. Nhận dạng lời nói không phải đánh giá chuyên môn phát âm.
