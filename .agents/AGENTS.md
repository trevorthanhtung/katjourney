# Kat Journey - AI Handoff & Context

_Bản hướng dẫn dành cho các AI Assistants (Claude, Cursor, ChatGPT, Gemini, v.v.)_

Đây là tài liệu quan trọng mô tả kiến trúc, công nghệ và các quy tắc sống còn của dự án **Kat Journey**. Bất kỳ AI nào khi bắt đầu làm việc với dự án này đều **PHẢI** đọc kỹ và tuân thủ tuyệt đối.

---

## 1. Tổng quan dự án (Project Overview)

- **Tên dự án**: Kat Journey (v3.0.x)
- **Mô tả**: Ứng dụng PWA (Progressive Web App) quản lý chuyến đi, lịch trình, chi phí, danh sách hành lý, hỗ trợ đồng bộ đám mây và chia sẻ với bạn bè.
- **Triết lý**: **OFFLINE-FIRST**. Ứng dụng phải hoạt động mượt mà 100% không cần mạng. Mọi thay đổi lưu vào Local (IndexedDB), sau đó đồng bộ ngầm (Background Sync) lên Cloud khi có mạng.

## 2. Tech Stack (Công nghệ lõi)

- **Framework**: React 18 + Vite + TypeScript.
- **Styling**: Vanilla CSS (tập trung tại `src/styles.css`). **Không sử dụng Tailwind/Bootstrap.**
- **Database (Local)**: `dexie` và `dexie-react-hooks` (IndexedDB).
- **Database (Cloud/Auth)**: `@supabase/supabase-js`.
- **Animation**: `framer-motion` + View Transition API nguyên bản của trình duyệt.
- **Icons**: `@hugeicons/react`.
- **PWA**: `vite-plugin-pwa` (với Service Worker được thiết lập sẵn).
- **Internationalization**: `react-i18next` (Anh/Việt).

## 3. Cấu trúc thư mục (Folder Structure)

- `src/db.ts`: Trái tim của ứng dụng - Định nghĩa Schema cho Dexie DB.
- `src/App.tsx`: Component gốc, quản lý layout tổng.
- `src/hooks/useAppNavigation.ts`: **QUAN TRỌNG**. Xử lý luồng định hướng (Routing) thông qua `history.pushState` và sự kiện `popstate`. **Không dùng React Router**.
- `src/hooks/useTripData.ts`: Quản lý nạp toàn bộ dữ liệu của 1 chuyến đi từ Dexie.
- `src/features/`: Chứa các màn hình chức năng chính:
  - `home/`: Tổng quan chuyến đi.
  - `timeline/`: Lịch trình (Events).
  - `expenses/`: Chi tiêu.
  - `checklist/`: Hành lý.
  - `journal/`: Nhật ký (Text & Photo).
  - `archive/`: Chuyến đi đã lưu trữ.
  - `trips/`: Màn hình quản lý toàn bộ chuyến đi.
  - `shared/`: Chế độ xem chuyến đi được chia sẻ (Read-only qua Supabase).
- `src/services/`: Chứa logic thao tác với Supabase, Auto-Sync (`useCloudBackup.ts`), Share trip.
- `src/utils/`: Các hàm helpers (format date, export PDF, excel...).

## 4. QUY TẮC CỐT LÕI MÀ AI PHẢI TUÂN THỦ (CORE RULES)

🚨 **RULE #1: CẤM ĐƯỢC CHẠM VÀO UI/UX** 🚨
Giao diện ứng dụng (CSS, màu sắc, khoảng cách, animation) đã được tối ưu ĐẠT MỨC HOÀN HẢO. Trừ khi User có yêu cầu cụ thể (ví dụ: "Sửa màu nút này", "Thêm padding vào đây"), AI **TUYỆT ĐỐI KHÔNG ĐƯỢC** tự ý thay đổi cấu trúc thẻ HTML, class CSS, hay các thông số `framer-motion` có sẵn.

🚨 **RULE #2: LUÔN LÀ OFFLINE-FIRST** 🚨
Mọi thao tác ghi/sửa/xóa dữ liệu **phải** được thực hiện qua Dexie (`db.xyz.put`, `db.xyz.delete`). KHÔNG BAO GIỜ gọi API lên Supabase trực tiếp để lưu dữ liệu khi người dùng thao tác. Hệ thống Sync (Background Sync) sẽ tự động bắt các thay đổi trong Dexie và đẩy lên Supabase sau.

🚨 **RULE #3: ROUTING DO TỰ XÂY DỰNG** 🚨
Không đề xuất cài đặt `react-router-dom`. Dự án đã có hệ thống routing tuỳ chỉnh dựa trên View Transition API và `window.history`. Mọi sự thay đổi về Tab (home, timeline, expenses...) hay chuyển chuyến đi đều được kiểm soát trong `src/hooks/useAppNavigation.ts`.

🚨 **RULE #4: AN TOÀN TRƯỚC KHI REFACTOR** 🚨
Mọi đề xuất refactor code phải giữ nguyên state và props đang có. Ưu tiên tạo Hook mới thay vì nhồi nhét logic vào Component.

🚨 **RULE #5: 100% I18N (ĐA NGÔN NGỮ)** 🚨
Tuyệt đối không được để lọt bất kỳ chuỗi văn bản Tiếng Việt nào cứng (hardcoded) trên giao diện (UI). Tất cả mọi text hiển thị cho người dùng phải được bọc qua hàm `t(...)` của hook `useTranslation` (từ thư viện `react-i18next`). Các text nằm trong data seed hoặc truy vấn data (ví dụ `db.ts` hoặc các key lọc dữ liệu) thì giữ nguyên gốc để không làm vỡ Data.

🚨 **RULE #6: CHUẨN PONYTAIL (LƯỜI BIẾNG NHƯNG HIỆU QUẢ)** 🚨

- Tôn trọng nguyên tắc YAGNI (You Aren't Gonna Need It). Không "over-engineering".
- Ưu tiên cấu trúc component "phẳng" (flat). Một file component to (ví dụ `HomeScreen.tsx` hàng ngàn dòng) vẫn được chấp nhận nếu luồng logic (trạng thái rỗng, trạng thái có dữ liệu, trạng thái lịch sử) rõ ràng và dễ đọc từ trên xuống dưới.
- Không tự ý xé nhỏ Component nếu việc đó dẫn đến tình trạng "Prop Drilling" (truyền prop qua nhiều tầng) không cần thiết.
- Tái sử dụng các UI một cách thông minh, nhưng nếu logic của 2 màn hình quá khác nhau (ví dụ: Local App Edit vs Shared Trip Read-Only), hãy chấp nhận nhân bản code (WET) để giữ ranh giới Offline/Online an toàn.

---

**Thông điệp cho AI**: Khi đọc được file này, hãy confirm với User rằng "Tôi đã đọc AGENTS.md và hiểu rõ luật chơi của Kat Journey. Chế độ UI/UX Freeze đang được bật, tôi sẽ tuân thủ tuyệt đối chuẩn Ponytail, 100% i18n và Offline-First!"
