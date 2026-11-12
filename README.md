# Cá Chép Vượt Vũ Môn

Game web luyện nhận biết âm đầu **L – N** cho trẻ nhỏ. Bản V1 chạy hoàn toàn phía trình duyệt, không cần backend.

## Tính năng hiện có
- 350 mục luyện tập: 175 mục bắt đầu bằng L và 175 mục bắt đầu bằng N.
- Mỗi lượt gồm 10 câu ngẫu nhiên; chọn L hoặc N để trả lời.
- Phản hồi đúng/sai, điểm số, chuỗi đúng và chuyển động cá chép tiến/lùi.
- 4 chặng giao diện: Sông Vũ Môn, Hoàng thành Thăng Long, Dinh Độc Lập, chặng hóa rồng.
- Lưu thống kê trên thiết bị bằng LocalStorage.
- Đọc từ bằng Speech Synthesis nếu trình duyệt có hỗ trợ.
- Chế độ micro có nút bật nghe theo từng câu, dùng Web Speech Recognition khi được hỗ trợ; nếu không có, người chơi vẫn chọn L/N bình thường.
- Giao diện responsive cho điện thoại và máy tính.

## Chạy trên máy tính
1. Giải nén thư mục.
2. Mở terminal tại thư mục dự án.
3. Chạy máy chủ tĩnh, ví dụ:
   ```bash
   python -m http.server 8000
   ```
4. Mở `http://localhost:8000`.

Có thể mở trực tiếp `index.html`, nhưng chạy qua localhost giúp API micro hoạt động ổn định hơn.

## Đưa lên GitHub và Vercel
1. Tạo repository GitHub mới.
2. Đưa toàn bộ thư mục và thư mục `assets` lên repository.
3. Trên Vercel chọn **Add New → Project**, import repository.
4. Framework Preset chọn **Other**; Build Command và Output Directory để trống hoặc đặt Output Directory là `.`.
5. Deploy. Netlify cũng có thể triển khai bằng cách kéo thả thư mục dự án đã giải nén.

## Lưu ý về micro và phát âm
Web Speech Recognition là nhận dạng lời nói thành văn bản, không đo trực tiếp khẩu hình, vị trí lưỡi hay độ chuẩn của âm vị. Trong bản này, kết quả micro chỉ hiển thị nội dung máy nghe được; trẻ vẫn tự chọn đáp án L/N. Muốn đánh giá phát âm chuyên sâu cần mô hình âm học/đánh giá phát âm tiếng Việt được kiểm chứng.

## Ghi chú dữ liệu
Danh sách gồm từ đơn và cụm từ bắt đầu bằng L/N. Một số mục ít phổ biến hoặc mang tính từ vựng mở rộng; giáo viên/phụ huynh nên chọn lọc theo độ tuổi và vùng phương ngữ. Không dùng các âm tiết giả như “núa”, “nều”, “nưới” làm đáp án từ vựng chuẩn.

## Cấu trúc
- `index.html` – giao diện và cấu trúc màn hình.
- `style.css` – màu sắc, bố cục, responsive và hoạt ảnh.
- `game.js` – logic trò chơi, micro, đọc từ và lưu thành tích.
- `data.js` – 350 mục luyện tập.
- `assets/` – minh họa SVG cá chép, rồng và bối cảnh.

## Checklist tự kiểm tra bản giao
- [x] Có đủ 175 mục L và 175 mục N trong dữ liệu.
- [x] Mỗi mục được gắn nhãn theo chữ cái đầu.
- [x] Có 10 câu mỗi lượt và xáo trộn câu hỏi.
- [x] Có khóa trả lời kép để tránh cộng điểm nhiều lần.
- [x] Có tiến/lùi cá chép, điểm, chuỗi đúng và kết quả màn.
- [x] Có lưu thống kê bằng LocalStorage.
- [x] Có phương án dự phòng khi không hỗ trợ Speech Recognition.
- [x] Có giao diện responsive và tài nguyên SVG nội bộ.
- [ ] Chưa chạy kiểm thử trên thiết bị iPhone/Android thực tế trong phiên bàn giao này.
- [ ] Chưa triển khai GitHub/Vercel/Netlify vì cần tài khoản và thao tác của chủ dự án.
