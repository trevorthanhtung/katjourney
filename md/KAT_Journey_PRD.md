# KAT Journey

## Your Journey. Your Memories.

**Phiên bản:** v1.0\
**Người thực hiện:** thanhtungg.\
**Loại ứng dụng:** Progressive Web App (PWA)\
**Mục tiêu:** Ứng dụng hỗ trợ lên kế hoạch, quản lý và lưu giữ những
chuyến đi theo cách đơn giản, đẹp mắt và hoạt động hoàn toàn offline.

------------------------------------------------------------------------

# 1. Tầm nhìn sản phẩm

> "Biến mọi chuyến đi thành một câu chuyện đáng nhớ."

KAT Journey không cố gắng trở thành Traveloka hay Booking.\
Đây là một cuốn sổ tay du lịch kỹ thuật số dành cho cá nhân và nhóm bạn.

------------------------------------------------------------------------

# 2. Triết lý thiết kế

-   Offline First.
-   Không cần Firebase.
-   Không cần tài khoản.
-   Dễ sử dụng.
-   Tối ưu cho điện thoại.
-   Ưu tiên trải nghiệm hơn số lượng tính năng.

------------------------------------------------------------------------

# 3. Đối tượng người dùng

## Cá nhân

-   Người thích tự lên kế hoạch du lịch.
-   Người quản lý chuyến đi bằng Excel.

## Nhóm bạn

-   Du lịch từ 2--10 người.
-   Cần quản lý lịch trình và chi phí.

## Gia đình

-   Cần tập trung toàn bộ thông tin chuyến đi vào một nơi.

------------------------------------------------------------------------

# 4. Hành trình người dùng

## Trước chuyến đi

-   Tạo chuyến đi.
-   Thêm thành viên.
-   Lên timeline.
-   Chuẩn bị checklist.
-   Dự trù chi phí.

## Trong chuyến đi

-   Theo dõi lịch trình.
-   Cập nhật chi tiêu.
-   Đánh dấu checklist.
-   Xem địa điểm.

## Sau chuyến đi

-   Viết nhật ký.
-   Tổng kết chi phí.
-   Xem Travel Wrapped.
-   Xuất báo cáo PDF.

------------------------------------------------------------------------

# 5. Tính năng cốt lõi

## Quản lý chuyến đi

-   Tạo chuyến đi.
-   Chỉnh sửa.
-   Sao chép.
-   Xóa.

Thông tin: - Tên chuyến đi. - Địa điểm. - Ngày bắt đầu. - Ngày kết
thúc. - Ảnh bìa.

------------------------------------------------------------------------

## Timeline

Mỗi hoạt động gồm: - Thời gian. - Tiêu đề. - Địa điểm. - Ghi chú. - Link
Google Maps. - Trạng thái hoàn thành.

------------------------------------------------------------------------

## Thành viên

-   Tên.
-   Vai trò.
-   Số điện thoại.
-   Ghi chú.

Hành động nhanh: - Gọi điện. - Sao chép số điện thoại.

------------------------------------------------------------------------

## Checklist

### Trước chuyến đi

-   Đặt vé.
-   Đặt phòng.
-   Chuẩn bị giấy tờ.

### Trong chuyến đi

-   Check-in.
-   Trả xe.
-   Mua quà.

------------------------------------------------------------------------

## Chi phí

Theo dõi: - Tổng chi phí. - Theo danh mục. - Người thanh toán.

Danh mục: - Di chuyển. - Ăn uống. - Lưu trú. - Vé tham quan. - Khác.

------------------------------------------------------------------------

## Expense Split

Tự động tính toán ai cần trả cho ai.

------------------------------------------------------------------------

# 6. Tính năng nâng cao

## Smart Packing List

Đề xuất hành lý theo loại chuyến đi: - Biển. - Leo núi. - Camping. -
Thành phố.

------------------------------------------------------------------------

## Countdown

Hiển thị số ngày còn lại trước khi khởi hành.

------------------------------------------------------------------------

## Mood Tracker

Theo dõi cảm xúc mỗi ngày.

------------------------------------------------------------------------

## Travel Journal

Viết nhật ký du lịch.

------------------------------------------------------------------------

## Memory Map

Lưu lại những địa điểm đã ghé thăm.

------------------------------------------------------------------------

## Trip Wrapped

Tổng kết chuyến đi: - Địa điểm đã đi. - Chi phí. - Thành viên nổi bật. -
Ngày đáng nhớ.

------------------------------------------------------------------------

## Scratch Map

Tô màu những tỉnh thành đã đặt chân tới.

------------------------------------------------------------------------

# 7. Công nghệ sử dụng

Frontend: - React. - TypeScript. - Vite.

UI: - Tailwind CSS.

Lưu trữ: - IndexedDB. - Dexie.js.

Xuất dữ liệu: - XLSX. - jsPDF.

PWA: - vite-plugin-pwa.

------------------------------------------------------------------------

# 8. Cấu trúc dữ liệu

## Trips

-   id
-   title
-   location
-   startDate
-   endDate

## Members

-   id
-   tripId
-   name
-   phone
-   role

## Events

-   id
-   tripId
-   date
-   time
-   title
-   location

## Expenses

-   id
-   tripId
-   amount
-   payer
-   category

## Checklist

-   id
-   tripId
-   title
-   completed

## JournalEntries

-   id
-   tripId
-   date
-   content

------------------------------------------------------------------------

# 9. Backup

Hỗ trợ:

Export: - PDF. - Excel. - .kattrip

Import: - Excel. - .kattrip

------------------------------------------------------------------------

# 10. Lộ trình phát triển

## MVP

-   Quản lý chuyến đi.
-   Timeline.
-   Checklist.
-   Thành viên.
-   Chi phí.

## Version 1.0

-   Smart Packing.
-   Expense Split.
-   Countdown.
-   Journal.

## Version 2.0

-   Wrapped.
-   Memory Map.
-   Scratch Map.
-   Photo Missions.

------------------------------------------------------------------------

# 11. Không nằm trong phạm vi

-   Firebase.
-   Đăng nhập.
-   Chat.
-   Mạng xã hội.
-   AI phức tạp.

------------------------------------------------------------------------

# 12. Giá trị cốt lõi

KAT Journey là nơi giúp người dùng:

-   Chuẩn bị cho chuyến đi.
-   Đồng hành trong chuyến đi.
-   Gìn giữ ký ức sau chuyến đi.
