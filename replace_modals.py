import re

# 1. Update ConfirmDeleteTripDialog.tsx
file_delete = "src/components/ConfirmDeleteTripDialog.tsx"
with open(file_delete, "r", encoding="utf-8") as f:
    content = f.read()

# Add useTranslation
if "useTranslation" not in content:
    content = content.replace('import React from "react";', 'import React from "react";\nimport { useTranslation } from "react-i18next";')

# Add const { t } = useTranslation();
if "const { t } = useTranslation();" not in content:
    content = content.replace('ConfirmDeleteTripDialogProps) {\n  return (', 'ConfirmDeleteTripDialogProps) {\n  const { t } = useTranslation();\n  return (')

# Replace strings
content = content.replace('title="Xóa vĩnh viễn chuyến đi này?"', 'title={t("more.deleteModalTitle")}')
content = content.replace('description="Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu của chuyến đi, bao gồm thành viên, lịch trình, chi phí, chuẩn bị, bản tin hành trình, giấy tờ và phương án dự phòng khỏi thiết bị này. Bạn không thể hoàn tác."', 'description={t("more.deleteModalDesc")}')
content = content.replace('Để xác nhận, vui lòng nhập chính xác chữ XÓA.', '{t("more.deleteModalWarning")}')
content = content.replace('confirmLabel="Xóa vĩnh viễn chuyến đi"', 'confirmLabel={t("more.deleteModalConfirm")}')
content = content.replace('confirmationText="XÓA"', 'confirmationText={t("more.deleteModalMatch")}')
content = content.replace('inputPlaceholder="Nhập XÓA"', 'inputPlaceholder={t("more.deleteModalInput")}')

with open(file_delete, "w", encoding="utf-8") as f:
    f.write(content)


# 2. Update MoreScreen.tsx
file_more = "src/features/more/MoreScreen.tsx"
with open(file_more, "r", encoding="utf-8") as f:
    content_more = f.read()

# Make sure Trans is imported
if "Trans" not in content_more:
    content_more = content_more.replace('import { useTranslation } from "react-i18next";', 'import { useTranslation, Trans } from "react-i18next";')

# Replace Archive strings
content_more = content_more.replace('title="Đóng gói kỷ niệm?"', 'title={t("more.archiveModalTitle")}')
content_more = content_more.replace('Hành trình này sẽ được đóng gói và đưa vào góc <b className="text-kat-dark">Kỷ niệm</b>. \n            Mọi dữ liệu sẽ được chuyển sang chế độ <b className="text-kat-dark">chỉ xem</b> để lưu giữ nguyên vẹn những khoảnh khắc của bạn.', '<Trans i18nKey="more.archiveModalDesc" components={{ b: <b className="text-kat-dark" /> }} />')
content_more = content_more.replace('Đồng ý đóng gói\n            </button>', '{t("more.archiveModalConfirm")}\n            </button>')

# Replace Unarchive strings
content_more = content_more.replace('title="Mở khóa chuyến đi?"', 'title={t("more.unarchiveModalTitle")}')
content_more = content_more.replace('Chuyến đi sẽ được <b className="text-emerald-700 dark:text-emerald-300">mở khóa trở lại</b>. Bạn có thể tiếp tục lên lịch trình, đăng bài viết bản tin và quản lý chi phí như bình thường.', '<Trans i18nKey="more.unarchiveModalDesc" components={{ b: <b className="text-emerald-700 dark:text-emerald-300" /> }} />')
content_more = content_more.replace('Tiếp tục hành trình\n            </button>', '{t("more.unarchiveModalConfirm")}\n            </button>')

with open(file_more, "w", encoding="utf-8") as f:
    f.write(content_more)

print("Replacement modals complete")
