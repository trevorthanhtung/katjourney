# Cấu Trúc Dự Án KAT Journey

Tài liệu này giải thích chi tiết mục đích của từng thư mục và tệp cấu hình trong dự án của bạn sau khi đã được dọn dẹp gọn gàng.

## 📂 Các Thư Mục Chính

| Thư mục | Mục đích sử dụng | Có thể xoá không? |
| --- | --- | --- |
| **`src/`** | **Trái tim của dự án**. Chứa toàn bộ mã nguồn của ứng dụng (React components, CSS, logic xử lý, kết nối cơ sở dữ liệu). Mọi thứ bạn lập trình đều nằm ở đây. | ❌ KHÔNG |
| **`public/`** | Chứa các tài nguyên tĩnh (hình ảnh, icon, tệp robot, manifest) được phục vụ trực tiếp cho người dùng mà không qua xử lý. Ví dụ: `logo.png`, `donates.png`. | ❌ KHÔNG |
| **`api/`** | Chứa các hàm Serverless hoặc mã nguồn Backend cục bộ. Thường được sử dụng để tương tác với các API an toàn (như Vercel Functions). | ❌ KHÔNG |
| **`docs/`** | Nơi lưu trữ các tài liệu mô tả về thiết kế dự án (`DESIGN.md`), quy mô sản phẩm (`PRODUCT.md`) và các ghi chú liên quan. | ⚠️ Có thể (nhưng không nên) |
| **`tests/`** | Chứa các kịch bản kiểm thử tự động (Playwright) để test xem các chức năng của app (đăng nhập, thêm chuyến đi) có chạy đúng không. | ❌ KHÔNG |
| **`test-results/` & `playwright-report/`** | Chứa kết quả và ảnh chụp màn hình sau khi chạy kiểm thử tự động. Hai thư mục này được tự động tạo ra. | ✅ CÓ (sẽ tự tạo lại) |
| **`node_modules/`** | Chứa mã nguồn của các thư viện bên thứ 3 (React, Tailwind, Vite, v.v.). Thư mục này rất nặng. | ✅ CÓ (Khôi phục bằng `npm install`) |
| **`dist/`** | Chứa sản phẩm mã nguồn cuối cùng (đã được nén và tối ưu hoá) sẵn sàng để đưa lên mạng. | ✅ CÓ (Khôi phục bằng `npm run build`) |
| **`.git/`** | Thư mục ẩn của Git, lưu trữ toàn bộ lịch sử chỉnh sửa code của bạn. | ❌ KHÔNG (Xoá là mất lịch sử code) |
| **`.agents/`, `.kiro/`, `.vscode/`** | Các thư mục ẩn chứa cấu hình cho trợ lý AI (Gemini), phần mềm chỉnh sửa code (VS Code) hoặc các công cụ lập trình cục bộ. | ⚠️ Có thể (nhưng mất cài đặt) |

---

## 📄 Các Tệp Cấu Hình Gốc (Root Files)

Các tệp này **bắt buộc phải nằm ở ngoài cùng** của dự án để các công cụ lập trình có thể nhận diện và hoạt động.

### ⚙️ Cấu hình chạy dự án
*   **`package.json`**: Cuốn "sổ hộ khẩu" của dự án. Chứa tên dự án, danh sách các thư viện cần cài đặt và các lệnh chạy (như `npm run dev`).
*   **`package-lock.json`**: Lưu trữ chính xác phiên bản của từng thư viện bên thứ 3 để đảm bảo ai tải dự án về chạy cũng giống y hệt nhau.
*   **`vite.config.ts`**: Tệp cấu hình của Vite (công cụ giúp ứng dụng chạy cực nhanh khi bạn đang viết code và build ra bản cuối cùng).
*   **`index.html`**: Điểm neo đầu tiên của ứng dụng trên trình duyệt web.

### 🎨 Cấu hình Giao diện & Ngôn ngữ
*   **`tsconfig.json` & `tsconfig.node.json`**: Cấu hình của TypeScript (ngôn ngữ lập trình chính của dự án), giúp kiểm tra lỗi logic và cú pháp.
*   **`tailwind.config.js`**: Cấu hình của Tailwind CSS, chứa các tuỳ chỉnh về màu sắc, kích thước, font chữ của giao diện.
*   **`postcss.config.js`**: Công cụ hỗ trợ xử lý mã CSS sau khi viết xong.

### 🧪 Cấu hình Kiểm thử (Testing)
*   **`playwright.config.ts` & `playwright.test-dev.config.ts`**: Các tệp cấu hình cho Playwright - công cụ chạy giả lập người dùng bấm trên web để tìm lỗi.

### 🚀 Cấu hình Đưa lên mạng (Deployment)
*   **`vercel.json`**: Hướng dẫn cho máy chủ Vercel biết cách chạy và định tuyến ứng dụng này khi được đưa lên mạng.

### 🔒 Cấu hình Bảo mật & Khác
*   **`.env.local`**: Chứa các biến môi trường và mật khẩu (như API key). **Tuyệt đối không gửi file này cho ai!**
*   **`.gitignore`**: Danh sách những file hoặc thư mục mà Git sẽ KHÔNG lưu trữ (ví dụ như `node_modules` hoặc `.env.local`).
*   **`README.md`**: Lời giới thiệu dự án hiển thị trên trang chủ của GitHub/GitLab.
*   **`skills-lock.json`**: Cấu hình các tính năng cho trợ lý AI.

---

> 💡 **Kết luận:** Trạng thái dự án hiện tại của bạn đã là gọn gàng nhất. Không có thêm tệp tin nào dư thừa. Tất cả các script chạy một lần, file ảnh thừa thãi đã được gỡ bỏ trong lần dọn dẹp trước.
