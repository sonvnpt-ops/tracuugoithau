# ĐẶC TẢ YÊU CẦU XÂY DỰNG WEB APP – TRA CỨU THÔNG TIN NHÀ THẦU

**Tên ứng dụng:** Tra cứu thông tin nhà thầu  
**Nền tảng triển khai:** Google AI Studio (Build)  
**Ngôn ngữ giao diện:** Tiếng Việt  
**Nguồn dữ liệu đầu vào:** `view_notifys_report_202611061000(1).xlsx`

---

## 1. Mục tiêu sản phẩm

Xây dựng một web app hiện đại để người dùng tra cứu nhanh thông tin trong dữ liệu đấu thầu, tập trung vào ba trường văn bản:

1. `goods_info_str` – thông tin hàng hóa.
2. `services_info_str` – thông tin dịch vụ.
3. `persons_info_str` – thông tin nhân sự.

Người dùng cần tìm được gói thầu có chứa một hàng hóa, dịch vụ, vị trí nhân sự, chuyên ngành, chứng chỉ, yêu cầu kinh nghiệm hoặc cụm từ bất kỳ trong ba trường trên; sau đó xem được ngữ cảnh và thông tin gói thầu liên quan.

Ứng dụng trước hết là **công cụ tìm kiếm và khai thác dữ liệu**, không phải chatbot hỏi đáp chung. Kết quả phải dựa trên dữ liệu trong file, không tự suy diễn hoặc tự bổ sung thông tin.

## 2. Phân tích file dữ liệu nguồn

File Excel có một sheet `Sheet0`, gồm **2.817 bản ghi dữ liệu** (không tính dòng tiêu đề) và 51 cột.

Ba trường trọng tâm có dữ liệu không rỗng theo thống kê sơ bộ:

| Trường | Số bản ghi có nội dung | Vai trò |
|---|---:|---|
| `goods_info_str` | 811 | Tra cứu hàng hóa, thiết bị, phần mềm, tên hàng hóa, số lượng, đơn vị tính, nguồn gốc, giá |
| `services_info_str` | 1.824 | Tra cứu mô tả dịch vụ, phạm vi, hạng mục, số lượng, đơn vị tính, nguồn gốc, giá |
| `persons_info_str` | 298 | Tra cứu vị trí nhân sự, số lượng, số năm kinh nghiệm, số hợp đồng, chuyên ngành, bằng cấp, chứng chỉ và điều kiện nhân sự |

Các trường này là chuỗi văn bản tự do, không phải JSON chuẩn. Một ô có thể chứa nhiều mục, thường được ngăn cách bằng xuống dòng. Nội dung có thể có dấu tiếng Việt, dấu câu, cách viết hoa/thường và định dạng không đồng nhất.

Ví dụ cấu trúc thực tế:

- Hàng hóa: `Tên : ... - Số lượng : ... - Đơn vị tính : ... - Nguồn gốc : ... - Giá : ...`
- Dịch vụ: `Mô tả: ... - Mục: ... - Số lượng: ... - Đơn vị tính: ...`
- Nhân sự: `Tên vị trí yêu cầu: ... - Số lượng: ... - Số Năm: ... - Số Hợp đồng: ... - Chuyên ngành: ...`

**Nguyên tắc quan trọng:** Luôn lưu và hiển thị nguyên văn nội dung ba trường. Có thể phân tích/tách mục để hỗ trợ lọc và trình bày, nhưng không được làm mất dữ liệu gốc. Nếu không phân tích được một mục, vẫn phải tìm kiếm được trong văn bản nguyên bản.

## 3. Phạm vi chức năng

### 3.1. Tìm kiếm chính

Đặt một ô tìm kiếm lớn, dễ nhận biết ở đầu trang.

Các chế độ tìm kiếm:

- **Tất cả:** tìm đồng thời trong `goods_info_str`, `services_info_str`, `persons_info_str`.
- **Hàng hóa:** chỉ tìm trong `goods_info_str`.
- **Dịch vụ:** chỉ tìm trong `services_info_str`.
- **Nhân sự:** chỉ tìm trong `persons_info_str`.

Mặc định là **Tất cả**.

Hành vi tìm kiếm:

- Tìm kiếm theo từ khóa hoặc cụm từ.
- Hỗ trợ nhập tiếng Việt có dấu và không dấu.
- Không phân biệt chữ hoa/chữ thường.
- Loại bỏ khác biệt khoảng trắng thừa khi so khớp.
- Hỗ trợ tìm nhiều từ khóa; mặc định các từ được hiểu theo điều kiện AND (tất cả từ khóa phải xuất hiện). Có lựa chọn chuyển sang OR (chỉ cần một từ khóa xuất hiện).
- Hỗ trợ tìm cụm từ chính xác khi người dùng đặt trong dấu ngoặc kép, ví dụ `"quản lý dự án"`.
- Nút xóa nhanh nội dung tìm kiếm.
- Có thể nhấn Enter để tìm.
- Không yêu cầu AI tạo câu trả lời thay cho kết quả tìm kiếm; kết quả phải truy ngược được tới bản ghi nguồn.

Ví dụ từ khóa cần hỗ trợ:

- `máy chủ ảo`
- `phần mềm quản lý`
- `đường truyền Internet`
- `PMP`
- `CISSP`
- `kiểm thử phần mềm`
- `Toán tin ứng dụng`
- `nhân sự quản lý dự án`

### 3.2. Bộ lọc nâng cao

Có khu vực bộ lọc có thể thu gọn/mở rộng, gồm:

- Trường nội dung: Tất cả / Hàng hóa / Dịch vụ / Nhân sự.
- Mã kế hoạch lựa chọn nhà thầu (`plan_no`).
- Tên gói thầu (`bid_name`).
- Tên kế hoạch (`plan_name`).
- Tên dự án (`project_name`).
- Bên mời thầu (`procuring_entity_name`).
- Nhà đầu tư (`investor_name`).
- Lĩnh vực đầu tư (`invest_field`).
- Loại gói thầu (`bid_form` hoặc `contract_type`, tùy dữ liệu có giá trị).
- Tỉnh/thành (`province_code`).
- Khoảng thời gian công bố (`original_public_date`): từ ngày – đến ngày.
- Có/không có nội dung trong từng trường hàng hóa, dịch vụ, nhân sự.

Các bộ lọc phải kết hợp với từ khóa tìm kiếm theo điều kiện AND. Bộ lọc không có dữ liệu hoặc không áp dụng được phải được ẩn/disable, không hiển thị tùy chọn giả.

Có nút **Áp dụng bộ lọc** và **Đặt lại**. Trên màn hình nhỏ, bộ lọc mở trong drawer/panel.

### 3.3. Danh sách kết quả

Hiển thị kết quả dạng các thẻ (cards) hoặc danh sách phân tách rõ ràng, ưu tiên khả năng đọc.

Mỗi kết quả cần có:

- Tên gói thầu (`bid_name`) – tiêu đề chính.
- Mã kế hoạch (`plan_no`).
- Tên dự án (`project_name`).
- Bên mời thầu (`procuring_entity_name`).
- Chủ đầu tư/nhà đầu tư (`investor_name`) nếu có.
- Lĩnh vực (`invest_field`) nếu có.
- Giá gói thầu (`bid_price`) và đơn vị (`bid_price_unit`) nếu có.
- Ngày công bố (`original_public_date`) nếu có.
- Nhãn chỉ ra nội dung khớp: **Hàng hóa**, **Dịch vụ**, **Nhân sự**.
- Đoạn trích nội dung có từ khóa, làm nổi bật từ khóa bằng màu nền/đậm.
- Số lượng mục hoặc số đoạn khớp trong từng trường (nếu xác định được).

Nếu một gói thầu khớp nhiều trường, hiển thị nhiều nhãn tương ứng nhưng chỉ tạo một kết quả gói thầu, tránh lặp bản ghi.

Sắp xếp mặc định: mức độ phù hợp giảm dần; cho phép đổi sang ngày công bố mới nhất/cũ nhất và tên gói thầu A–Z.

Phân trang mặc định 20 kết quả/trang; cho phép 20, 50, 100 kết quả/trang. Hiển thị tổng số kết quả và số trang. Không tải toàn bộ kết quả lớn lên giao diện cùng lúc.

### 3.4. Xem chi tiết gói thầu

Khi chọn một kết quả, mở trang chi tiết hoặc panel chi tiết.

Bố cục đề xuất:

**A. Thông tin chung**

- Mã kế hoạch, tên gói thầu.
- Tên kế hoạch, tên dự án.
- Bên mời thầu, nhà đầu tư.
- Loại hợp đồng, hình thức/phương thức lựa chọn nhà thầu.
- Giá gói thầu, giá dự toán, thời gian thực hiện hợp đồng.
- Địa điểm mở thầu, địa điểm phát hành/nhận hồ sơ nếu có.
- Ngày công bố, ngày công bố kết quả nếu có.
- Liên kết thông báo (`tbmt_url`) nếu có.

**B. Thông tin hàng hóa**

- Hiển thị toàn bộ `goods_info_str` theo từng dòng/mục.
- Giữ nguyên nội dung gốc.
- Nếu tách được, trình bày từng mục thành khối thông tin gồm tên, số lượng, đơn vị tính, nguồn gốc, giá.
- Nếu không tách được, hiển thị nguyên văn trong vùng văn bản có xuống dòng hợp lý.

**C. Thông tin dịch vụ**

- Hiển thị toàn bộ `services_info_str`.
- Chia các mục theo dòng/đoạn.
- Giữ nguyên mô tả và các thuộc tính như số lượng, đơn vị tính, nguồn gốc, giá nếu có.

**D. Yêu cầu nhân sự**

- Hiển thị toàn bộ `persons_info_str`.
- Nếu phân tích được, trình bày từng vị trí nhân sự thành khối riêng: tên vị trí, số lượng, số năm kinh nghiệm, số hợp đồng, chuyên ngành, bằng cấp/chứng chỉ và yêu cầu khác.
- Không lược bỏ các điều kiện dài hoặc phần tài liệu chứng minh.
- Có nút mở rộng/thu gọn nội dung dài.

Trong trang chi tiết, từ khóa đã tìm phải tiếp tục được làm nổi bật. Có nút sao chép nội dung từng trường và nút quay lại danh sách, giữ nguyên từ khóa/bộ lọc/trang hiện tại.

### 3.5. Thống kê nhanh

Trên đầu trang hoặc cạnh khu vực tìm kiếm, hiển thị các chỉ số:

- Tổng số gói thầu trong dữ liệu.
- Số gói thầu có thông tin hàng hóa.
- Số gói thầu có thông tin dịch vụ.
- Số gói thầu có thông tin nhân sự.

Sau khi tìm kiếm, có thể hiển thị số kết quả khớp theo từng nhóm Hàng hóa / Dịch vụ / Nhân sự. Cần phân biệt số gói thầu duy nhất với số trường/mục khớp để tránh gây hiểu nhầm.

## 4. Yêu cầu về giao diện và trải nghiệm người dùng (UI/UX)

Phong cách: **hiện đại, tối giản, chuyên nghiệp, ưu tiên đọc dữ liệu nhiều chữ**.

### 4.1. Bố cục tổng thể

- Header gọn, tên ứng dụng và khu vực thao tác.
- Khu vực tìm kiếm nổi bật ở phần đầu.
- Bộ chọn phạm vi tìm kiếm đặt ngay cạnh hoặc bên dưới ô tìm kiếm.
- Bộ lọc nâng cao có thể thu gọn.
- Khu vực kết quả có tổng số kết quả, sắp xếp và phân trang.
- Chi tiết gói thầu mở bằng trang riêng hoặc panel rộng; không dùng popup nhỏ cho nội dung dài.

### 4.2. Nguyên tắc thiết kế

- Nền sáng trung tính, màu chủ đạo xanh navy/xanh dương; màu nhấn dùng tiết chế.
- Font chữ sans-serif dễ đọc, hỗ trợ tiếng Việt tốt.
- Cỡ chữ nội dung tối thiểu khoảng 14–16 px trên desktop.
- Tiêu đề, nhãn trường và nội dung có phân cấp thị giác rõ.
- Khoảng cách giữa các khối thoáng; đường phân cách nhẹ.
- Dùng badge để phân biệt Hàng hóa / Dịch vụ / Nhân sự.
- Nội dung dài phải xuống dòng, không tràn ngang.
- Hạn chế bảng quá rộng; ưu tiên thẻ thông tin và các khối nội dung.
- Có trạng thái tải dữ liệu, không có kết quả, lỗi đọc file và lỗi tìm kiếm.
- Responsive tốt trên desktop, tablet và điện thoại.
- Có hỗ trợ bàn phím: Tab, Enter, Escape khi phù hợp; trạng thái focus rõ ràng.
- Màu chữ/nền đạt độ tương phản tốt.

### 4.3. Màn hình chính đề xuất

1. **Thanh tiêu đề:** logo dạng chữ/biểu tượng đơn giản, tên “Tra cứu thông tin nhà thầu”.
2. **Khối tìm kiếm:** ô nhập lớn, nút Tìm kiếm, chọn phạm vi tìm.
3. **Khối bộ lọc:** các trường lọc phổ biến; bộ lọc nâng cao có thể thu gọn.
4. **Khối thống kê:** tổng số kết quả và số kết quả theo từng nhóm.
5. **Danh sách kết quả:** mỗi kết quả là một card dễ quét mắt.
6. **Chi tiết:** thông tin chung và ba vùng nội dung Hàng hóa / Dịch vụ / Nhân sự, có thể dùng tab nhưng phải thể hiện rõ trường nào có nội dung.

## 5. Xử lý và tổ chức dữ liệu

### 5.1. Nạp dữ liệu

- Cho phép nạp file Excel `.xlsx` theo đúng cấu trúc file nguồn.
- Đọc sheet `Sheet0` (nếu tên sheet thay đổi, có thể cho chọn sheet hoặc tự chọn sheet đầu tiên có đủ cột bắt buộc).
- Dòng đầu là tên cột.
- Mỗi dòng dữ liệu là một gói thầu/bản ghi.
- Kiểm tra sự tồn tại của ba cột bắt buộc: `goods_info_str`, `services_info_str`, `persons_info_str`.
- Khuyến nghị dùng `plan_no` làm khóa định danh nếu có; nếu trùng hoặc rỗng, tạo khóa nội bộ ổn định, không tự gộp hai bản ghi chỉ vì tên giống nhau.
- Giữ nguyên giá trị gốc, kiểu dữ liệu và nội dung văn bản.
- Chuẩn hóa ngày/giá chỉ ở lớp hiển thị; không ghi đè dữ liệu gốc.
- Báo số dòng đọc thành công, dòng lỗi và lý do lỗi.
- Nếu file lớn, xử lý bất đồng bộ hoặc theo lô để tránh treo giao diện.

### 5.2. Mô hình dữ liệu logic đề xuất

Không cần ép ba trường văn bản tự do thành cấu trúc cứng ngay khi nhập. Dùng mô hình hai lớp:

**Lớp 1 – Bản ghi gói thầu (`TenderRecord`)**

- `id`: khóa nội bộ.
- `plan_no`
- `bid_name`
- `plan_name`
- `project_name`
- `procuring_entity_name`
- `investor_code`
- `investor_name`
- `contract_type`
- `bid_form`
- `bid_mode`
- `invest_field`
- `bid_price`
- `bid_price_unit`
- `bid_estimate_price`
- `contract_period`
- `contract_period_unit`
- `original_public_date`
- `public_kq_date`
- `province_code`
- `tbmt_url`
- Các trường nguồn khác được giữ lại trong `raw_data` để không mất thông tin.

**Lớp 2 – Nội dung tra cứu (`SearchContent`)**

- `record_id`: liên kết đến `TenderRecord`.
- `content_type`: một trong `goods`, `services`, `persons`.
- `raw_content`: nội dung nguyên bản từ Excel.
- `normalized_content`: nội dung chuẩn hóa phục vụ tìm kiếm.
- `search_tokens` hoặc chỉ mục tìm kiếm tương đương.
- `parsed_items`: danh sách mục đã phân tích được (có thể rỗng).
- `parse_status`: `parsed`, `partial`, `raw_only`.

Một bản ghi gói thầu có tối đa ba bản ghi nội dung tương ứng ba loại. Có thể tạo thêm bảng `SearchItem` để lưu từng mục tách ra nếu việc phân tích đạt độ tin cậy; mỗi mục phải giữ `raw_item` và thứ tự xuất hiện.

### 5.3. Chuẩn hóa để tìm kiếm

Tạo hàm chuẩn hóa riêng, không thay đổi nội dung gốc:

- Chuyển về chữ thường.
- Chuẩn hóa Unicode tiếng Việt về dạng thống nhất (NFC).
- Tạo thêm chuỗi không dấu để tìm kiếm linh hoạt.
- Chuẩn hóa khoảng trắng, tab, xuống dòng và một số dấu phân cách.
- Không xóa các ký tự có ý nghĩa trong mã/chứng chỉ, ví dụ `ISO/IEC 27001`, `PMP`, `C++`, `C#`, `Windows 11`.
- Không chỉ tìm trên bản đã tách mục; luôn tìm trên toàn bộ chuỗi gốc và chuỗi chuẩn hóa.

### 5.4. Phân tích các mục văn bản

Có thể dùng quy tắc/regex để tách nội dung theo dòng hoặc các mẫu `Tên :`, `Mô tả:`, `Tên vị trí yêu cầu:`. Việc tách phải chịu được dấu cách không đồng nhất, dấu hai chấm có/không có khoảng trắng và nội dung nhiều dòng.

- Hàng hóa: cố gắng nhận diện tên, số lượng, đơn vị tính, nguồn gốc, giá.
- Dịch vụ: cố gắng nhận diện mô tả, mục, số lượng, đơn vị tính, nguồn gốc, giá.
- Nhân sự: cố gắng nhận diện tên vị trí, số lượng, số năm, số hợp đồng, chuyên ngành, chứng chỉ và yêu cầu khác.
- Nội dung nhân sự thường dài và có dấu gạch đầu dòng; không được cắt bỏ hoặc làm mất đoạn.
- Trường nào không xác định được thì để trống/không xác định, không tự điền.
- Nếu parser không chắc chắn, dùng chế độ `raw_only` và vẫn cho phép tìm kiếm.

## 6. Thuật toán tìm kiếm và xếp hạng

Ưu tiên triển khai tìm kiếm cục bộ trên dữ liệu đã nạp, không cần gọi AI cho mỗi truy vấn.

### 6.1. Quy trình

1. Nhận từ khóa và phạm vi tìm.
2. Chuẩn hóa truy vấn theo cùng quy tắc với dữ liệu.
3. Lọc theo phạm vi trường và bộ lọc metadata.
4. Tìm kiếm trên nội dung nguyên bản/chuỗi chuẩn hóa/chuỗi không dấu.
5. Gom các kết quả theo bản ghi gói thầu.
6. Tính điểm phù hợp.
7. Trích đoạn chứa từ khóa và làm nổi bật.
8. Phân trang và hiển thị.

### 6.2. Xếp hạng gợi ý

- Cụm từ chính xác: điểm cao nhất.
- Từ khóa xuất hiện trong tên hàng hóa/mô tả/vị trí nhân sự: điểm cao.
- Từ khóa xuất hiện nhiều lần: cộng điểm có giới hạn.
- Khớp trong nhiều trường: cộng điểm.
- Khớp trong metadata như tên gói thầu: có thể cộng điểm phụ, nhưng phải phân biệt với khớp trong ba trường trọng tâm.

Hiển thị lý do khớp, ví dụ: “Khớp trong Dịch vụ – 2 đoạn” hoặc “Khớp trong Nhân sự – vị trí Quản lý dự án”.

Không sử dụng mô hình ngôn ngữ để tự tạo kết quả khớp không có trong dữ liệu.

### 6.3. Tìm kiếm ngữ nghĩa – giai đoạn mở rộng

Có thể bổ sung tìm kiếm ngữ nghĩa bằng embedding để hỗ trợ câu hỏi gần nghĩa, ví dụ “nhân sự có chứng chỉ quản lý dự án” hoặc “dịch vụ thuê máy chủ”. Nếu triển khai:

- Kết quả ngữ nghĩa phải được gắn nhãn “Gợi ý liên quan”, tách biệt với “Khớp từ khóa”.
- Mỗi kết quả phải trỏ về bản ghi và đoạn văn bản nguồn.
- Không được khẳng định một chứng chỉ/điều kiện có tồn tại nếu đoạn nguồn không thể hiện điều đó.
- Người dùng có thể chuyển giữa “Khớp chính xác/từ khóa” và “Tìm nội dung liên quan”.
- Nếu không cấu hình được embedding hoặc API, ứng dụng vẫn phải hoạt động đầy đủ với tìm kiếm từ khóa.

## 7. Kiến trúc và yêu cầu kỹ thuật

Đề nghị Google AI Studio tạo ứng dụng web theo kiến trúc đơn giản, dễ chạy và dễ mở rộng:

- Frontend: React + TypeScript.
- UI: Tailwind CSS hoặc hệ thống component hiện đại tương đương.
- Đọc Excel: thư viện SheetJS (`xlsx`) hoặc thư viện tương đương.
- Tìm kiếm: chỉ mục tìm kiếm phía client (ví dụ MiniSearch/Fuse.js hoặc giải pháp phù hợp); cần hỗ trợ tiếng Việt không dấu bằng trường chuẩn hóa riêng.
- Quản lý trạng thái: React hooks hoặc thư viện nhẹ.
- Lưu dữ liệu: ưu tiên IndexedDB để lưu file/dữ liệu đã nhập trên trình duyệt, tránh giới hạn localStorage. Có thể bổ sung backend/database khi cần chia sẻ dữ liệu nhiều người dùng.
- Không gửi dữ liệu nhà thầu lên dịch vụ AI bên ngoài nếu chưa có sự đồng ý rõ ràng của người quản trị.
- Tách các module: `excelImporter`, `dataNormalizer`, `searchEngine`, `resultHighlighter`, `tenderDetail`, `filterPanel`.
- Có dữ liệu mẫu hoặc chế độ demo để kiểm tra giao diện, nhưng phải phân biệt rõ dữ liệu demo với dữ liệu thật.

Nếu AI Studio lựa chọn stack khác, vẫn phải giữ đầy đủ yêu cầu chức năng và khả năng triển khai web responsive.

## 8. Quy tắc an toàn dữ liệu và độ tin cậy

- Không tự sửa nội dung gốc.
- Không tự suy luận giá, số lượng, chứng chỉ, kinh nghiệm hoặc tên nhân sự.
- Không biến giá trị `N/A`, ô rỗng hoặc dấu `-` thành một thông tin xác nhận.
- Nội dung trích dẫn phải giữ đúng ngữ cảnh và có thể xem toàn bộ đoạn gốc.
- Nếu một trường trống, hiển thị “Không có dữ liệu”.
- Khi không có kết quả, gợi ý kiểm tra dấu tiếng Việt, bỏ bớt từ khóa hoặc chuyển phạm vi sang “Tất cả”.
- Khi file thiếu cột bắt buộc, báo chính xác tên cột thiếu và không âm thầm bỏ qua.
- Có thông tin nguồn: tên file, thời điểm nạp và số bản ghi đã đọc.

## 9. Tiêu chí nghiệm thu

Ứng dụng được xem là đạt yêu cầu khi:

1. Nạp được file Excel nguồn và đọc đúng 2.817 bản ghi (hoặc báo rõ số bản ghi thực tế nếu file được cập nhật).
2. Nhận diện đúng ba trường trọng tâm.
3. Tìm kiếm được trong từng trường riêng và cả ba trường.
4. Tìm kiếm được tiếng Việt có dấu/không dấu và không phân biệt hoa thường.
5. Hỗ trợ cụm từ chính xác, nhiều từ khóa AND/OR.
6. Một gói thầu khớp nhiều trường chỉ xuất hiện một lần trong danh sách, nhưng hiển thị đủ nhãn khớp.
7. Kết quả có đoạn trích và làm nổi bật từ khóa.
8. Mở chi tiết xem được nguyên văn ba trường, không bị cắt nội dung.
9. Bộ lọc metadata kết hợp chính xác với tìm kiếm.
10. Sắp xếp, phân trang và đặt lại bộ lọc hoạt động đúng.
11. Giao diện responsive, dễ đọc trên desktop và điện thoại.
12. Không có kết quả giả do AI tự tạo; mọi kết quả đều truy xuất được về dòng dữ liệu nguồn.

### Bộ ca kiểm thử bắt buộc

- Tìm `PMP` trong phạm vi Nhân sự.
- Tìm `Toán tin ứng dụng` và `toan tin ung dung` trong Nhân sự, so sánh kết quả.
- Tìm `đường truyền Internet` trong Dịch vụ.
- Tìm `máy chủ ảo` trong Tất cả.
- Tìm cụm từ `"quản lý dự án"` trong Nhân sự.
- Tìm `CISSP OR PMP` và `CISSP AND PMP` để kiểm tra logic OR/AND.
- Mở một kết quả có nhiều mục hàng hóa/dịch vụ/nhân sự và kiểm tra nội dung không bị cắt.
- Tìm một từ khóa không tồn tại và kiểm tra trạng thái không có kết quả.
- Nạp file thiếu một cột bắt buộc và kiểm tra thông báo lỗi.

## 10. Thứ tự ưu tiên triển khai

**P0 – Bắt buộc trong phiên bản đầu tiên**

- Nạp Excel.
- Tìm kiếm toàn văn trong ba trường, riêng lẻ hoặc đồng thời.
- Tìm có dấu/không dấu, cụm từ, AND/OR.
- Danh sách kết quả có đoạn trích và highlight.
- Trang/panel chi tiết hiển thị nguyên văn.
- Bộ lọc cơ bản, sắp xếp, phân trang.
- Giao diện responsive và trạng thái lỗi/rỗng/loading.

**P1 – Nên có**

- Bộ lọc nâng cao theo metadata.
- Tách mục hàng hóa/dịch vụ/nhân sự bằng parser.
- Thống kê số bản ghi có dữ liệu và số kết quả theo nhóm.
- Lưu dữ liệu đã nhập trong IndexedDB.
- Xuất danh sách kết quả ra Excel/CSV.

**P2 – Mở rộng**

- Tìm kiếm ngữ nghĩa bằng embedding.
- So sánh các gói thầu theo hàng hóa, dịch vụ hoặc yêu cầu nhân sự.
- Lưu truy vấn thường dùng và đánh dấu kết quả.
- Quản lý nhiều bộ dữ liệu/nhiều phiên bản file.
- Backend và phân quyền khi triển khai cho nhiều người dùng.

---

## 11. Chỉ dẫn trực tiếp cho AI Studio

Hãy xây dựng ứng dụng hoàn chỉnh theo đặc tả này, không chỉ tạo mockup giao diện.

Ưu tiên tuyệt đối trải nghiệm tìm kiếm và đọc kết quả trong ba trường `goods_info_str`, `services_info_str`, `persons_info_str`.

Hãy thực hiện theo thứ tự:

1. Đọc và phân tích file Excel người dùng cung cấp, nhận diện sheet, header và dữ liệu thực tế.
2. Xây dựng chức năng nhập dữ liệu và kiểm tra cấu trúc.
3. Xây dựng chuẩn hóa dữ liệu và bộ máy tìm kiếm.
4. Xây dựng giao diện danh sách kết quả, đoạn trích và highlight.
5. Xây dựng màn hình chi tiết gói thầu.
6. Hoàn thiện bộ lọc, sắp xếp, phân trang và responsive.
7. Chạy các ca kiểm thử trong mục 9 với dữ liệu thật.

Không được thay dữ liệu thật bằng dữ liệu mẫu. Không được bỏ qua các trường văn bản dài. Không được cắt nội dung ba trường trọng tâm khi hiển thị chi tiết. Nếu có giới hạn kỹ thuật, hãy thông báo rõ và đưa ra phương án xử lý thay vì âm thầm bỏ dữ liệu.

**Kết quả mong muốn:** một web app tra cứu dữ liệu nhà thầu có giao diện chuyên nghiệp, tìm kiếm nhanh, chính xác, dễ đọc và có thể truy xuất nội dung gốc của từng gói thầu.
