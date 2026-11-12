# Cập nhật Cá Chép Vượt Vũ Môn V2 3D bằng iPhone

Bạn đã có project V1 trên Vercel? Hãy cập nhật **repository GitHub hiện tại**, không tạo project Vercel mới.

## 1. Giải nén trên iPhone

1. Tải file `ca-chep-vuot-vu-mon-v2-3d.zip` về iPhone.
2. Mở **Tệp (Files)** → **Duyệt** → **Tải về (Downloads)**.
3. Chạm file ZIP một lần để giải nén.
4. Mở thư mục `ca-chep-vuot-vu-mon-v2-3d`.

## 2. Cập nhật repository GitHub

1. Mở Safari → https://github.com → đăng nhập.
2. Mở repository hiện tại chứa game V1.
3. Vào thư mục gốc (nơi có `index.html`).
4. Chọn **Add file → Upload files**.
5. Trong ứng dụng Tệp, chọn các file ở thư mục gốc của bản V2 3D để upload/ghi đè:
   - `index.html`
   - `style.css`
   - `game.js`
   - `data.js`
   - `package.json`
   - `vercel.json`
   - `.env.example`
   - `README.md`
   - `HUONG-DAN-CAP-NHAT-IPHONE.md`
6. Kéo xuống cuối trang, nhập commit message `Upgrade game V2 3D` rồi nhấn **Commit changes**.
7. Trong repository, mở `assets` → **Add file → Upload files** → tải lên `koi.svg` và `dragon.svg` để ghi đè. Giữ lại `vietnam-scenes.svg`.
8. Mở hoặc tạo thư mục `api`. Upload `transcribe.js` vào đúng đường dẫn `api/transcribe.js`.
9. Kiểm tra `api/transcribe.js` nằm ngang cấp với `index.html` thông qua thư mục `api` ở root, không bị lồng trong một thư mục khác.

Nếu GitHub trên iPhone không cho chọn nhiều file, upload từng file một. Không upload ZIP nguyên khối vào repository.

## 3. Thêm khóa API trong Vercel

1. Tạo API key tại https://platform.openai.com/api-keys.
2. Mở https://vercel.com/dashboard → chọn project game.
3. Chọn **Settings → Environment Variables**.
4. Name: `OPENAI_API_KEY`.
5. Value: dán API key.
6. Environment: chọn **Production** (có thể chọn thêm Preview).
7. Nhấn **Save**.

Không dán API key vào GitHub, file HTML/JS hoặc gửi cho người khác. API có tính phí riêng; cần kiểm tra billing/usage trên OpenAI Platform.

## 4. Deploy lại

1. Mở project Vercel → **Deployments**.
2. Chờ commit mới trên GitHub tạo deployment mới.
3. Nếu chưa có, kiểm tra Git repository đã kết nối và chọn **Redeploy** cho commit mới nhất sau khi thêm biến môi trường.
4. Đợi trạng thái **Ready** → nhấn **Visit**.

Nếu Vercel yêu cầu cấu hình: Framework `Other`, Root Directory `./`, Build Command để trống, Output Directory `.`. Để Vercel cài dependency từ `package.json`.

## 5. Thử micro trên iPhone

1. Mở URL Vercel bằng Safari (HTTPS).
2. Nhấn **Luyện nói với micro**.
3. Cho phép Microphone khi Safari hỏi.
4. Nhấn giữ nút micro trong khi đọc một từ; thả tay để kết thúc ghi âm và gửi nhận dạng.
5. Chờ máy hiện transcript. Nếu chưa rõ, đọc lại hoặc chọn L/N.

## Xử lý lỗi nhanh

- **OPENAI_API_KEY chưa được cấu hình:** kiểm tra tên biến đúng chính tả, Environment Production, Save và Redeploy.
- **404 `/api/transcribe`:** kiểm tra file đúng đường dẫn `api/transcribe.js` tại root repository.
- **500/502:** kiểm tra Vercel → Deployments → Functions/Logs, API key và billing.
- **Không hiện quyền micro:** mở bằng Safari qua HTTPS; kiểm tra Cài đặt iPhone → Quyền riêng tư & Bảo mật → Microphone và quyền Safari.
- **Máy nghe nhầm L/N:** đây là nhận dạng lời nói, không phải công cụ đánh giá phát âm; thử lại trong môi trường yên tĩnh hoặc dùng chế độ chọn chữ.


## Bản vá nhận dạng tiếng Việt 2.1.1

- Đã sửa tham số ngôn ngữ gửi tới OpenAI Audio Transcriptions thành `language: 'vi'`.
- Giao diện hiển thị thông báo HTTP/API cụ thể hơn thay vì chỉ báo lỗi kết nối chung.
- Sau khi cập nhật, commit thay đổi để Vercel tự triển khai lại. Kiểm tra `api/transcribe.js` có trong repository và biến môi trường `OPENAI_API_KEY` được bật cho Production.


## Bản cập nhật thao tác micro nhấn giữ (Push-to-talk)

Ở bản cập nhật này, người dùng **nhấn giữ nút micro trong lúc đọc** và **thả tay để kết thúc ghi âm, gửi lên máy chủ và xem kết quả**. Trên GitHub, thay các tệp `game.js`, `index.html` và `style.css` ở thư mục gốc bằng các tệp cùng tên trong ZIP. Giữ nguyên `api/transcribe.js`, khóa `OPENAI_API_KEY` và các tệp khác. Sau khi Commit, Vercel tự triển khai; mở lại game và tải mới trang.
