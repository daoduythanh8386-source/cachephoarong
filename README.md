# Cá Chép Vượt Vũ Môn V2 — 3D Game Style

Ứng dụng web tiếng Việt giúp người dùng ở nhiều độ tuổi luyện phân biệt âm đầu **L / N**. Responsive cho iPhone, iPad và máy tính; có 350 mục luyện tập, chế độ chọn chữ và chế độ thu âm gửi tới API serverless để nhận dạng tiếng Việt.

## Điểm nổi bật V2 3D

- Giao diện game mobile theo tông xanh ngọc – vàng kim.
- Cá chép vàng cam SVG có vảy ánh kim, vây/đuôi chi tiết; kết hợp phối cảnh CSS, bóng đổ nhiều lớp và chuyển động bơi để tạo cảm giác 3D.
- Rồng vàng khi hoàn thành thử thách; hiệu ứng ánh sáng, chiều sâu và chuyển động.
- Cảnh sông, thác, cổng Vũ Môn; giao diện thích ứng màn hình iPhone.
- 350 mục luyện tập (175 mục L, 175 mục N), thống kê lưu trên thiết bị.
- Micro dùng `getUserMedia` + `MediaRecorder`, không phụ thuộc `SpeechRecognition` của Safari.
- Bản ghi được gửi đến `/api/transcribe`; API gọi OpenAI Audio Transcriptions với model `gpt-transcribe` và gợi ý ngôn ngữ Việt.
- API key chỉ nằm trong biến môi trường Vercel `OPENAI_API_KEY`, không nằm trong JavaScript trình duyệt.
- Có nút chọn L/N dự phòng khi micro, mạng hoặc dịch vụ nhận dạng không sẵn sàng.

> Ghi chú đồ họa: đây là phong cách **3D-look** dựng bằng SVG nhiều lớp, gradient, CSS perspective và animation; không phải mô hình 3D realtime/WebGL. Muốn cá xoay tự do trong không gian 3D như game Unity/Three.js thì cần thêm mô hình 3D GLB và engine 3D.

## Cấu trúc

```text
ca-chep-vuot-vu-mon-v2-3d/
├── api/
│   └── transcribe.js
├── assets/
│   ├── koi.svg
│   ├── dragon.svg
│   └── vietnam-scenes.svg
├── index.html
├── style.css
├── game.js
├── data.js
├── package.json
├── vercel.json
├── .env.example
└── HUONG-DAN-CAP-NHAT-IPHONE.md
```

## Deploy trên Vercel

### 1. Đưa mã nguồn lên GitHub

Cập nhật repository hiện tại đang kết nối với Vercel bằng toàn bộ nội dung thư mục này. Giữ nguyên cấu trúc, đặc biệt `api/transcribe.js` và `assets/`. Không upload file `.env` hoặc `node_modules`.

### 2. Cấu hình Vercel

- Framework Preset: `Other`.
- Root Directory: thư mục chứa `index.html` và `package.json` (thông thường `./`).
- Build Command: để trống.
- Output Directory: `.`.
- Install Command: để Vercel tự cài dependency từ `package.json`.
- Node.js: 22.x trở lên.

### 3. Thêm OpenAI API key

1. Tạo key tại https://platform.openai.com/api-keys.
2. Vercel → Project → Settings → Environment Variables.
3. Thêm `OPENAI_API_KEY` với giá trị API key, chọn Production (và Preview nếu cần).
4. Save, sau đó deploy lại để deployment mới nhận biến môi trường.

Không đưa API key vào `game.js`, `index.html`, GitHub hoặc tin nhắn. API usage tính phí riêng; gói ChatGPT không bao gồm tự động chi phí API. Kiểm tra billing và usage limits trước khi chia sẻ rộng.

### 4. Deploy

Commit mã nguồn trên GitHub. Vercel sẽ tự tạo deployment. Mở Vercel → Deployments, đợi trạng thái `Ready`, rồi nhấn `Visit`.

## Kiểm tra trên iPhone

1. Mở URL HTTPS Vercel bằng Safari.
2. Nhấn **Luyện nói với micro**.
3. Cho phép Safari truy cập micro.
4. Nhấn giữ nút micro trong khi đọc từ mục tiêu; thả tay để kết thúc ghi âm và gửi bản ghi nhận dạng.
5. Chờ transcript hiện ra. Nếu chưa rõ, thử lại hoặc chọn L/N thủ công.

## Chạy thử

Yêu cầu Node.js 22+.

```bash
npm install
npm install -g vercel
```

Tạo `.env.local` từ `.env.example`, điền API key thử nghiệm vào `.env.local` (không commit tệp này), sau đó:

```bash
vercel dev
```

## Quyền riêng tư và giới hạn

- Micro chỉ ghi âm sau thao tác nhấn nút và quyền truy cập của người dùng.
- Âm thanh được gửi tới dịch vụ nhận dạng để xử lý; ứng dụng không lưu bản ghi âm lâu dài. Hãy thông báo rõ việc xử lý âm thanh cho người sử dụng và chỉ bật micro khi đã có sự đồng ý của người nói.
- API giới hạn tệp ghi âm 4 MB và có throttling cơ bản theo IP. Với triển khai công khai có nhiều người dùng, nên bổ sung rate-limit bền vững (Redis/KV), xác thực/chống lạm dụng và chính sách quyền riêng tư phù hợp.
- Nhận dạng transcript không phải đánh giá chuyên môn phát âm. Mô hình có thể nhầm L/N, đặc biệt khi người nói phát âm chưa rõ, nói nhỏ hoặc môi trường có tiếng ồn. Không dùng kết quả này để chẩn đoán phát âm.
- Hình di sản là minh họa cách điệu, không phải ảnh tư liệu.


## Bản vá nhận dạng tiếng Việt 2.1.1

- Đã sửa tham số ngôn ngữ gửi tới OpenAI Audio Transcriptions thành `language: 'vi'`.
- Giao diện hiển thị thông báo HTTP/API cụ thể hơn thay vì chỉ báo lỗi kết nối chung.
- Sau khi cập nhật, commit thay đổi để Vercel tự triển khai lại. Kiểm tra `api/transcribe.js` có trong repository và biến môi trường `OPENAI_API_KEY` được bật cho Production.
