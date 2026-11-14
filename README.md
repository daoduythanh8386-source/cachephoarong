# Cá Chép Vượt Vũ Môn V3 — Đọc to để sửa ngọng L/N

Game web cho mọi lứa tuổi. Người chơi **đọc to** từ trên cổng. Đọc đúng thì cá chép 3D nhảy qua cổng. Đọc lẫn **L ↔ N** thì game chỉ đúng âm tiết bị sai, cho nghe mẫu, có hình vị trí lưỡi và mẹo tự kiểm tra, rồi yêu cầu đọc lại ngay.

## Có gì mới so với V2

| | V2 | V3 |
|---|---|---|
| Cá chép | Ảnh SVG giả 3D | **Mô hình 3D WebGL thật**: thân lưng gù, 2 đôi râu, vây lưng dài, đuôi chẻ, vảy xếp lớp, đường bên, nắp mang; thân uốn sóng khi bơi |
| Cách chơi | Bấm giữ micro → gửi máy chủ → chờ | **Micro mở liên tục**: cứ đọc là cá hành động, không phải bấm nút |
| Chấm lỗi | So cả từ | **So từng âm tiết**, biết chính xác “L→N” hay “N→L” ở chữ nào |
| Sửa lỗi | Báo sai | Thẻ sửa lỗi: so sánh nghe được/cần đọc, hình lưỡi, mẹo bịt mũi/chạm mũi, đọc mẫu chậm, đọc lại tối đa 3 lần |
| Kho từ | 350 mục | **1.393 mục**: 500 từ đơn, 600 từ đôi (từ ghép 2 âm tiết), 116 cặp từ tối thiểu L–N, 61 câu/ca dao |
| Lứa tuổi | Một chế độ | Bé 4–6 (đọc mẫu trước, chữ to, nhiều thời gian), Học sinh, Người lớn, Cao tuổi |
| Nền | Hình vẽ | **Ảnh thật** Hoàng thành Thăng Long (Đoan Môn) & Dinh Độc Lập, có bóng phản chiếu trên sông |
| Ôn tập | — | Lưu “từ hay sai”, tự lặp lại sau 3 cổng, chế độ “Ôn từ hay sai” |

## Cách chơi

1. Chọn người chơi, nội dung, cảnh nền → **Bắt đầu**. Cho phép trình duyệt dùng micro.
2. Cổng trôi về phía cá. Đọc to từ trên cổng trước khi cổng chạm cá.
3. Đọc đúng: cá nhảy qua cổng, được cộng điểm và chuỗi.
4. Đọc lẫn L/N: hiện thẻ sửa lỗi, nghe mẫu rồi đọc lại.
5. Cổng cuối là **Vũ Môn**: đọc trọn câu để cá hoá rồng.

Không có micro thì chọn **“Nghe & chọn L/N”**: máy đọc từ, người chơi chọn âm đầu.

## Trình duyệt

- **Chrome / Edge (máy tính, Android)**: nghe liên tục tốt nhất. Cần Internet vì phần nhận dạng giọng nói chạy trên máy chủ của trình duyệt.
- **Safari iPhone/iPad/Mac**: dùng được. Cần bật Siri & Đọc chính tả (Cài đặt → Siri). Micro có thể tự ngắt rồi bật lại giữa các câu.
- **Firefox**: không có nhận dạng sẵn → nút micro thành “giữ để nói”. Bản ghi được gửi tới `api/transcribe` (cần `OPENAI_API_KEY` trên Vercel như bản V2).
- Micro chỉ chạy trên **https://** hoặc `localhost`. Mở file `index.html` trực tiếp sẽ không có micro.

## Ảnh nền: 100 danh lam thắng cảnh

Mỗi câu (mỗi cổng) đổi sang một cảnh mới. Có 100 ảnh chụp thật, độ phân giải cao, lấy từ Wikimedia Commons, ghi tên tác giả và giấy phép ở góc ảnh. Gồm 13 cảnh Việt Nam và 87 cảnh thế giới ở châu Á, châu Âu, châu Mỹ, châu Phi và châu Đại Dương.

- Ảnh khung dọc (52 ảnh) dùng bản rộng 1280px. Ảnh khung ngang dùng bản 1920px và được cắt thành khung dọc 9:16 vừa màn hình điện thoại. Màu ảnh được tăng độ tươi nhẹ.
- Trong lúc người chơi đọc câu hiện tại, game tải trước ảnh của câu kế tiếp, nên chuyển cảnh không bị chớp trắng.
- Màn hình chính có 4 chế độ cảnh nền: **100 danh thắng** (xáo trộn), **Việt Nam**, **Thăng Long**, **Độc Lập**.
- Trang `xem-canh.html` cho xem cả 100 ảnh ở khung dọc. Chạm vào ảnh để xem toàn màn hình.
- Danh sách cảnh nằm trong `js/scenes.js`. Xoá một dòng để bỏ cảnh đó. Muốn thêm ảnh riêng, đặt ảnh vào `assets/` rồi thêm dòng dạng `["Tên", "Nơi", "local:assets/ten-anh.jpg", 1080, 1920, "", "Tên bạn"]`.

### Ảnh nền cũ (vẫn dùng được)

Game tải ảnh thật từ Wikimedia Commons (giấy phép CC BY-SA, ghi nguồn ở góc ảnh):

- Hoàng thành Thăng Long – cổng Đoan Môn: `File:Thang_Long_Citadel.jpg`
- Dinh Độc Lập: `File:Independence_Palace_or_Reunification_Palace_(12110625233).jpg` – tác giả Clay Gilliland, CC BY-SA 2.0

Muốn dùng ảnh riêng (chạy không cần mạng, hoặc ảnh đẹp hơn), chép vào `assets/` đúng tên:

```
assets/hoang-thanh-thang-long.jpg
assets/dinh-doc-lap.jpg
```

Game ưu tiên ảnh trong `assets/` trước. Cũng có thể chọn ảnh từ máy ngay trên màn hình chính (mục “Mẹo phát âm · Ảnh nền riêng”). Ảnh chọn kiểu này chỉ dùng cho lần chơi đó.

## Deploy lên Vercel (cập nhật repo cũ)

Cập nhật repository GitHub đang nối với Vercel:

1. **Xoá** các file cũ ở thư mục gốc: `game.js`, `data.js` (bản V3 chuyển chúng vào thư mục `js/`). Có thể xoá `assets/koi.svg`, `assets/vietnam-scenes.svg`.
2. Upload toàn bộ nội dung thư mục này, giữ nguyên cấu trúc:

```
index.html  style.css  package.json  vercel.json  README.md  .env.example
js/data.js  js/speech.js  js/carp3d.js  js/game.js
assets/dragon.svg
api/transcribe.js
```

3. Commit. Vercel sẽ tự deploy.
4. `OPENAI_API_KEY` chỉ cần cho Firefox (chế độ giữ để nói). Model mặc định là `gpt-4o-transcribe`. Đổi bằng biến `OPENAI_TRANSCRIBE_MODEL` nếu cần.

Game là trang tĩnh, nên cũng chạy được trên Netlify / GitHub Pages. Riêng chế độ giữ để nói trên Firefox thì cần hàm `api/transcribe` của Vercel.

## Kiểm soát chất lượng kho từ

- Mọi âm tiết đã được đối chiếu tự động với bộ từ điển *Vietnamese wordlist* (Hồ Ngọc Đức, khoảng 74.000 mục). Không có âm tiết nào nằm ngoài từ điển.
- Ưu tiên từ thông dụng: lấy trước từ thuộc nhóm 11.000 và 22.000 từ phổ biến nhất.
- Dấu thanh thống nhất theo kiểu mới: hòa, lòe, lụy. Bộ chấm cũng hiểu kiểu cũ (hoà, loè).
- Đã loại bỏ từ thô tục, có nghĩa tình dục, bạo lực, chê bai ngoại hình, xúc phạm, nhạy cảm chính trị, tên riêng và từ quá hiếm.
- Cặp từ tối thiểu (lo/no, lên/nên, cá lóc/cá nóc, trở lên/trở nên…) được tìm tự động: chỉ giữ cặp mà cả hai vế đều có trong từ điển.

## Thêm từ vào kho

Mở `js/data.js`, thêm vào danh sách tương ứng (ngăn cách bằng `|`):

- `TU` – từ đơn
- `DOI` – từ đôi (từ ghép 2 âm tiết)
- `CAP` – cặp `['từ L','từ N']` (cả hai đều phải có nghĩa)
- `CAU` – câu

Trùng lặp được tự động loại bỏ.

## Giới hạn cần biết

- Máy nhận dạng giọng nói có xu hướng “đoán” ra từ có nghĩa. Ví dụ người đọc “nàm” có thể vẫn bị ghi thành “làm”. Vì vậy **cặp từ đôi** (lo/no, nắng/lắng…) là phần phát hiện lỗi tin cậy nhất: cả hai từ đều có nghĩa nên máy phải chọn theo âm thật.
- Kết quả là công cụ luyện tập, không thay cho đánh giá của chuyên gia âm ngữ trị liệu.
- Âm thanh micro được trình duyệt gửi tới dịch vụ nhận dạng của Google (Chrome/Edge) hoặc Apple (Safari). Hãy thông báo cho người chơi, nhất là trẻ em và phụ huynh.
