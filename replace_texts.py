import re

with open('src/features/share/SharedTripScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace "Quay lại trang chủ"
content = content.replace(
    'Quay lại trang chủ',
    '{t("share.backToHome")}'
)

# Replace "Xác nhận mã PIN"
content = content.replace(
    'Xác nhận mã PIN',
    '{t("share.confirmPin")}'
)

# Replace "Lỗi khi lưu lộ trình:"
content = content.replace(
    'console.error("Lỗi khi lưu lộ trình:", err);',
    'console.error("Error saving trip:", err);'
)

# Replace "Không thể lưu lộ trình. Vui lòng kiểm tra kết nối mạng."
content = content.replace(
    'alert("Không thể lưu lộ trình. Vui lòng kiểm tra kết nối mạng.");',
    'alert(t("share.saveTripError") || "Cannot save trip. Please check your network connection.");'
)

# Replace "Đóng, giữ lựa chọn cũ"
content = content.replace(
    'title="Đóng, giữ lựa chọn cũ"',
    'title={t("common.close")}'
)

# Replace "Thông tin các vai trò"
content = content.replace(
    'title="Thông tin các vai trò"',
    'title={t("roles.info") || "Role Information"}'
)

# Replace "Đã đi", "Đang diễn ra", "Sắp diễn ra"
content = content.replace(
    '● {status === "past" ? "Đã đi" : status === "active" ? "Đang diễn ra" : "Sắp diễn ra"}',
    '● {status === "past" ? t("trip.past") : status === "active" ? t("trip.ongoing") : t("trip.upcoming")}'
)

# Replace "Trạng thái", "Hành trình"
content = content.replace(
    '{status === "past" ? "Trạng thái" : "Hành trình"}',
    '{status === "past" ? t("trip.status") : t("trip.journey")}'
)

# Replace "Đã hoàn thành {Math.round(progressPercent)}%"
content = content.replace(
    'Đã hoàn thành {Math.round(progressPercent)}%',
    '{t("trip.completed")} {Math.round(progressPercent)}%'
)

# Replace "Lịch trình"
content = content.replace(
    '<p className="text-[11px] font-semibold text-slate-400 dark:text-kat-muted mt-1">Lịch trình</p>',
    '<p className="text-[11px] font-semibold text-slate-400 dark:text-kat-muted mt-1">{t("dashboard.itinerary")}</p>'
)

# Write back
with open('src/features/share/SharedTripScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
