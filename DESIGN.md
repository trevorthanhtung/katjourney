---
name: Kat Journey Design System
description: Warm vintage editorial-style design system for travelers
colors:
  primary: "#00BFB7"
  primary-usable: "#00AFA8"
  dark: "#030D2E"
  neutral-bg: "#F8FAFC"
  neutral-surface: "#FFFFFF"
  neutral-border: "#E2E8F0"
  neutral-muted: "#64748B"
  accent-yellow: "#F89B02"
  accent-pink: "#E50A62"
  accent-blue: "#0081BE"
typography:
  display:
    fontFamily: "'Bricolage Grotesque', sans-serif"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Plus Jakarta Sans', sans-serif"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  xxl: "32px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.dark}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-usable}"
  card:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: Kat Journey

## 1. Overview

**Creative North Star: "The Traveler's Leather Journal"**

Kat Journey sử dụng một phong cách thiết kế giao diện dạng tạp chí hoài cổ (editorial-style vintage journal). Hệ thống tôn vinh những kỷ niệm thực tế của người dùng bằng một nền kem giấy ấm áp, kết hợp với các đường nét tinh giản, font chữ Serif cách tân hoài cổ và các vi tương tác nảy nhẹ tự nhiên.

Hệ thống thiết kế này loại bỏ các xu hướng thiết kế SaaS công nghiệp lạnh lẽo (như nền xám nhạt phẳng lì, góc bo quá tròn 32px+ vô tội vạ, gradient màu sắc rực rỡ giả tạo) để mang lại cảm giác thân thuộc, riêng tư và giàu cảm xúc.

**Key Characteristics:**
- Nền ấm áp vintage (Warm cream paper background).
- Hoạt ảnh phản hồi tức thì và compositor-friendly (transform & opacity only).
- Bố cục thông thoáng, tối giản chi tiết thừa để nhường chỗ cho hình ảnh và nhật ký chuyến đi.

## 2. Colors

Bảng màu của Kat Journey mang sắc thái ấm áp, tự nhiên, tái hiện các chất liệu lữ hành như trang giấy cũ, mực xanh lục và các màu nhấn gợi nhớ bầu trời, nắng vàng.

### Primary
- **Kat Primary Teal** (#00BFB7 / var(--kat-primary)): Màu ngọc bích nổi bật đại diện cho sự khám phá. Sử dụng cho các hành động chính, trạng thái tích cực và các điểm nhấn thương hiệu.
- **Kat Primary Usable** (#00AFA8 / var(--kat-primary-usable)): Phiên bản tối hơn một chút của Teal dùng cho văn bản hoặc các nút bấm ở trạng thái hover nhằm đảm bảo độ tương phản an toàn (>= 4.5:1).

### Neutral
- **Kat Slate Background** (#F8FAFC / var(--kat-bg)): Màu trắng xám dịu mát (Slate 50), nền chủ đạo của toàn bộ ứng dụng giúp làm dịu mắt và tạo cảm giác hiện đại.
- **Kat Pure White Surface** (#FFFFFF / var(--kat-surface)): Màu trắng tinh khiết dùng cho các thẻ (cards), danh sách và ô nhập liệu nổi bật trên nền xám.
- **Kat Dark Text** (#030D2E / var(--kat-text)): Sắc xanh đen đậm đà thay thế cho màu đen tuyền để hiển thị văn bản, tiêu đề và các icon chính.
- **Kat Muted Gray** (#64748B / var(--kat-muted)): Màu xám đá phiến trầm lắng dùng cho phụ đề, trạng thái trống hoặc các thông tin phụ trợ.
- **Kat Border Slate** (#E2E8F0 / var(--kat-border)): Màu xám viền nhạt dùng cho các đường kẻ mảnh 1px phân tách nội dung mà không gây nhiễu thị giác.

### Accent
- **Kat Amber Yellow** (#F89B02 / var(--kat-yellow)): Sắc nắng ấm dùng cho các thông báo cảnh báo và huy hiệu kỷ niệm.
- **Kat Rose Pink** (#E50A62 / var(--kat-pink)): Màu hồng tím dùng cho các chỉ thị xóa hoặc hành động nguy hại.
- **Kat Sky Blue** (#0081BE / var(--kat-blue)): Màu xanh trời dịu mát cho các liên kết và chỉ dẫn.

**The Rare Accent Rule.** Màu chủ đạo `var(--kat-primary)` chỉ chiếm không quá 10% bề mặt hiển thị của bất kỳ màn hình nào. Sự khan hiếm tạo nên sự sang trọng và định hướng hành động rõ ràng.

## 3. Typography

**Display Font:** 'Bricolage Grotesque', sans-serif
**Body Font:** 'Plus Jakarta Sans', sans-serif

Sự kết hợp giữa font chữ tiêu đề hình học cá tính `Bricolage Grotesque` và font chữ nội dung siêu sạch `Plus Jakarta Sans` tạo ra một sự tương phản độc đáo giữa nét hoài cổ (vintage) và hiện đại (snappy).

### Hierarchy
- **Display** (ExtraBold, 20px - 24px, 1.15): Dùng cho tiêu đề màn hình chính, chào mừng và các con số thống kê lớn. Letter-spacing luôn là `-0.02em`.
- **Headline/Title** (Bold, 15px - 17px, 1.25): Dùng cho tiêu đề các phần, tiêu đề thẻ chuyến đi.
- **Body** (Medium/SemiBold, 13px - 14.5px, 1.5): Dùng cho nội dung văn bản nhật ký, mô tả. Giới hạn chiều dài dòng ở mức 65–75ch để dễ đọc nhất.
- **Label** (Bold, 11px - 12.5px, 1.1, uppercase): Dùng cho thẻ phân loại, ngày tháng và nhãn nút bấm nhỏ.

## 4. Elevation

Kat Journey hướng tới sự phẳng lì tối giản của trang giấy. Chiều sâu được tạo ra bằng cách xếp lớp màu sắc (Layering) thay vì sử dụng bóng đổ dầy đặc.

### Shadow Vocabulary
- **Soft Shadow** (`box-shadow: 0 8px 32px rgba(3, 13, 46, 0.04)`): Dùng cho các thẻ nội dung nằm phẳng trên nền kem.
- **Floating Shadow** (`box-shadow: 0 16px 36px rgba(3, 13, 46, 0.08)`): Dùng cho các modal nổi hẳn lên hoặc menu popover.

**The Flat-By-Default Rule.** Mọi thẻ và nút bấm mặc định phẳng hoàn toàn. Bóng đổ nhẹ chỉ được xuất hiện ở các phần tử thực sự bay nổi trên màn hình (như bottom sheet, modal hoặc toast).

## 5. Components

### Buttons
- **Shape:** Bo góc vừa phải (16px / var(--rounded-md)). Tránh bo tròn hoàn toàn dạng viên thuốc trừ khi đó là các nhãn (tags) nhỏ.
- **States:** Mọi nút bấm phải phản hồi tức thì với sự kiện bấm bằng cách co lại nhẹ (`active:scale-[0.97]`) trong khoảng thời gian `140ms` sử dụng đường cong snappy `cubic-bezier(0.23, 1, 0.32, 1)`.

### Cards
- **Shape:** Bo góc lớn hơn (20px / var(--rounded-lg) hoặc 24px / var(--rounded-xl)).
- **Appearance:** Nền trắng ấm `bg-kat-surface` kết hợp với viền mỏng 1px màu kem `border-kat-border/60`. Tránh sử dụng bóng đổ đậm.

## 6. Do's and Don'ts

### Do's
- Luôn chỉ định rõ các thuộc tính cần chuyển đổi (ví dụ: `transition-transform`, `transition-colors`) thay vì dùng `transition-all`.
- Giữ vững tone nền trắng xám (#F8FAFC) hiện đại và sang trọng.
- Kiểm tra độ tương phản của chữ luôn >= 4.5:1 đối với mọi nhãn văn bản.

### Don'ts
- Không sử dụng gradient màu rực rỡ cho chữ hoặc nền card thông thường.
- Không lạm dụng bóng đổ quá đậm hoặc góc bo tròn tròn xoe 40px+ trên nút bấm hoặc card nhỏ.
- Không đưa hoạt ảnh vào các hành động kích hoạt bằng bàn phím hoặc phím tắt để đảm bảo độ nhạy.
