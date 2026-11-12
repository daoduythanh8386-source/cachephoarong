# Cá Chép Vượt Vũ Môn V2

Game web luyện phân biệt âm đầu **L / N** cho trẻ em. Giao diện responsive cho iPhone, iPad và máy tính; có 350 mục luyện tập, chế độ chọn chữ và chế độ thu âm gửi lên API serverless để nhận dạng tiếng Việt.

## Có gì mới trong V2?

- Giao diện mới theo phong cách xanh ngọc – vàng kim.
- Cá chép SVG vẽ riêng với vảy ánh kim, vây và đuôi; rồng vàng SVG khi hoàn thành.
- Hiệu ứng chuyển động, tiến trình, chuỗi đúng và thống kê lưu trên thiết bị.
- Micro dùng `getUserMedia` + `MediaRecorder`, không phụ thuộc `SpeechRecognition` của Safari.
- Tệp ghi âm được gửi đến `/api/transcribe`; API gọi OpenAI Audio Transcriptions với model `gpt-transcribe`.
- Khóa API chỉ nằm ở biến môi trường máy chủ `OPENAI_API_KEY`, không nằm trong JavaScript phía trình duyệt.
- Có nút chọn L/N làm phương án dự phòng nếu micro, mạng hoặc dịch vụ nhận dạng không sẵn sàng.

## Cấu trúc

```text
ca-chep-vuot-vu-mon/
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
└── README.md
```

## Triển khai lên Vercel

### 1. Đưa V2 vào GitHub

Cập nhật repository hiện tại bằng toàn bộ nội dung của thư mục này. Giữ nguyên cấu trúc thư mục, đặc biệt là `api/transcribe.js` và `assets/`. Không tải thư mục `node_modules` hoặc tệp `.env` lên GitHub.

### 2. Kết nối / triển khai lại

- Mở https://vercel.com/dashboard.
- Chọn project hiện tại của game.
- Vào **Settings → Environment Variables**.
- Tạo biến mới:
  - **Name:** `OPENAI_API_KEY`
  - **Value:** API key của bạn từ OpenAI Platform.
  - Chọn môi trường **Production**, và nên chọn thêm **Preview** nếu muốn thử bản Preview.
- Save.
- Mở **Deployments**; khi GitHub đã nhận commit V2, Vercel tự tạo deployment mới. Nếu chưa, chọn deployment mới nhất và bấm **Redeploy** sau khi đã lưu biến môi trường.
- Mở deployment trạng thái **Ready** → **Visit**.

### 3. Cấu hình project

- Framework Preset: **Other**.
- Root Directory: thư mục chứa `index.html` và `package.json` (thông thường `./`).
- Build Command: để trống.
- Output Directory: `.`.
- Install Command: để Vercel tự cài dependency từ `package.json`.
- Node.js: 22.x trở lên.

> Nếu repository đặt toàn bộ nội dung bên trong một thư mục con, hãy đặt Root Directory đúng thư mục con đó, không phải thư mục cha rỗng.

## Tạo và quản lý OpenAI API key

1. Tạo API key trong OpenAI Platform: https://platform.openai.com/api-keys.
2. Không dán API key vào `game.js`, `index.html`, GitHub, ảnh chụp màn hình hoặc gửi trong tin nhắn.
3. Chỉ lưu key ở Vercel → Settings → Environment Variables với tên `OPENAI_API_KEY`.
4. Audio transcription là dịch vụ API tính phí theo mức sử dụng và tài khoản API có thể cần thiết lập billing. Kiểm tra giá và hạn mức hiện hành trước khi cho nhiều người dùng.

## Kiểm tra trên iPhone

1. Mở website bằng Safari qua URL HTTPS của Vercel.
2. Nhấn **Luyện nói với micro**.
3. Khi Safari hỏi quyền Microphone, chọn **Allow / Cho phép**.
4. Nhấn **Chạm để bắt đầu nói**, đọc từ trên màn hình trong khoảng 2–5 giây.
5. Nhấn nút lần nữa để kết thúc ghi âm và chờ nhận dạng.
6. Nếu Safari không hiện hộp thoại quyền, kiểm tra Cài đặt iPhone → Safari → Microphone, hoặc Cài đặt → Quyền riêng tư & Bảo mật → Microphone.
7. Nếu không nhận dạng được, dùng nút L/N dự phòng trong màn chơi.

## Chạy thử cục bộ

Yêu cầu Node.js 22+ và npm.

```bash
npm install
```

Chạy frontend tĩnh bằng một static server và chạy API qua Vercel CLI để endpoint `/api/transcribe` hoạt động:

```bash
npm install -g vercel
vercel dev
```

Tạo tệp `.env.local` từ `.env.example`, điền API key thử nghiệm vào `.env.local` (không commit tệp này), sau đó chạy `vercel dev`.

## Giới hạn và lưu ý quan trọng

- Nhận dạng tiếng nói không phải phép đo chuyên môn về phát âm. Mô hình chuyển giọng nói thành văn bản có thể nghe nhầm âm L/N, nhất là khi trẻ nói nhỏ, nói ngọng, có tiếng ồn hoặc giọng vùng miền.
- Game đối chiếu bản chép lời với từ mục tiêu để đưa ra phản hồi học tập; không nên dùng kết quả này để chẩn đoán hoặc đánh giá bệnh lý ngôn ngữ.
- Nếu bản chép lời không rõ, game cho phép bé thử lại hoặc chọn L/N.
- Trình duyệt cần hỗ trợ `MediaRecorder` và `getUserMedia`; quyền micro thường chỉ hoạt động trên HTTPS hoặc localhost.
- Ứng dụng không ghi bản âm thanh vào cơ sở dữ liệu hay ổ đĩa lâu dài; file tạm phía server được xóa sau khi gọi API. Âm thanh được chuyển tới nhà cung cấp nhận dạng để xử lý và việc xử lý/ lưu giữ theo chính sách của nhà cung cấp. Hãy thông báo phù hợp cho phụ huynh trước khi trẻ sử dụng.
- Giới hạn 4 MB mỗi bản ghi; API có giới hạn chống gửi liên tục ở mức cơ bản. Với triển khai công khai quy mô lớn, cần bổ sung xác thực, rate limit dùng Redis/KV, quota và theo dõi chi phí.
- Bộ dữ liệu gồm 350 mục luyện tập như V1; một số mục là cụm từ.

## Tài liệu kỹ thuật

- OpenAI Speech-to-text: https://developers.openai.com/api/docs/guides/speech-to-text
- OpenAI Audio Transcriptions API: https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create
- Vercel Functions: https://vercel.com/docs/functions
