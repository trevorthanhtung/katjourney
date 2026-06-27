# Hướng Dẫn Sử Dụng Hình Ảnh / Assets

Tài liệu này liệt kê toàn bộ các hình ảnh và tệp tài nguyên tĩnh đang được sử dụng trong dự án (nằm trong thư mục `public/`) và giải thích mục đích của từng tệp.

## 1. Các hình ảnh ở ngoài cùng (`public/`)

| Tên tệp | Mục đích sử dụng | Vị trí dùng trong code |
| :--- | :--- | :--- |
| **`donates.png`** | Hình ảnh mã QR hoặc thông tin quyên góp. | Được gọi trong `SettingsSheet.tsx` ở phần "Ủng hộ / Donate". |
| **`logo-dark.png`** | Logo phiên bản dành riêng cho chế độ Tối (Dark Mode). | Được dùng ở `SettingsSheet.tsx` khi người dùng bật Dark Mode. |

*Lưu ý: Các tệp không phải hình ảnh như `manifest.webmanifest` (cấu hình app PWA), `robots.txt` (cấu hình Google Search) và `sitemap.xml` (bản đồ web) là các tệp kỹ thuật bắt buộc để SEO và cài đặt app.*

## 2. Các hình ảnh trong thư mục con (`public/asset/`)

Để dễ quản lý, các hình ảnh đã được phân loại gọn gàng vào từng thư mục theo chức năng:

| Thư mục / Tên tệp | Mục đích sử dụng | Vị trí dùng trong code |
| :--- | :--- | :--- |
| **`logo.png`** | Logo chính thức của ứng dụng (bản sáng màu). | Dùng ở mọi nơi: Màn hình chờ (`SplashScreen.tsx`), Màn hình chào (`WelcomeScreen.tsx`), và cài đặt. |
| 📁 **`favicons/`** | Chứa `favicon.ico`, `favicon-...png` và `apple-touch-icon.png`. Biểu tượng hiển thị trên tab trình duyệt và khi lưu app ra màn hình iPhone. | Nạp tự động qua file `index.html`. |
| 📁 **`pwa/`** | Chứa `icon-192.png`, `icon-512.png` và `maskable-icon-512.png`. Biểu tượng tiêu chuẩn cho Android và Windows khi cài đặt app dưới dạng PWA. | Khai báo trong tệp `manifest.webmanifest`. |
| 📁 **`social/`** | Chứa `og-image.webp` và `share-square-...png`. Hình ảnh lớn hiển thị lên khi bạn gửi link trang web của app qua Zalo, Facebook, Messenger. | Khai báo trong `index.html` (thẻ Open Graph / Twitter). |

> ✅ **Đã dọn dẹp:** Các hình ảnh bị trùng lặp, không dùng tới (như `public/logo.png`, `public/donates.webp`, `public/icons/icon.svg`) đã bị gỡ bỏ để tránh nhầm lẫn và giảm dung lượng tải trang.
