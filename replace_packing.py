import re

# 1. ChecklistScreen.tsx
filepath = r"src\features\checklist\ChecklistScreen.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Make sure useTranslation is imported and available
if "useTranslation" not in content:
    content = 'import { useTranslation } from "react-i18next";\n' + content

# In ChecklistScreen component
if "const { t } = useTranslation();" not in content:
    content = re.sub(
        r'(export function ChecklistScreen\(\{.*?\}: \{.*?\}.*?\{)',
        r'\1\n  const { t } = useTranslation();',
        content,
        flags=re.DOTALL
    )

replacements = {
    '"Chuẩn bị hành lý"': 't("packing.pageTitle")',
    '"Chuẩn bị đủ những món cần mang theo cho chuyến đi."': 't("packing.pageSubtitle")',
    '>Tiến độ chuẩn bị<': '>{t("packing.progressTitle")}<',
    '`Đã xếp ${stats.completed} / ${stats.total} món`': 't("packing.progressStatus", { completed: stats.completed, total: stats.total })',
    '"Tuyệt vời! Hành lý đã sẵn sàng."': 't("packing.progressPerfect")',
    '"Thêm món đồ đầu tiên để bắt đầu chuẩn bị."': 't("packing.progressEmpty")',
    '>Thêm món<': '>{t("packing.addItem")}<',
    '>Tên món cần mang *<': '>{t("packing.itemName")}<',
    'placeholder="Nhập tên món (vd: Hộ chiếu, áo khoác...)"': 'placeholder={t("packing.itemNamePlaceholder")}',
    '>Vui lòng nhập tên món cần mang.<': '>{t("packing.itemNameError")}<',
    '>Nhóm hành lý<': '>{t("packing.categoryLabel")}<',
    '>Số lượng<': '>{t("packing.quantityLabel")}<',
    '>Số lượng cần mang theo<': '>{t("packing.quantityDesc")}<',
    '>Người phụ trách<': '>{t("packing.assigneeLabel")}<',
    '"Chưa có người phụ trách"': 't("packing.noMembersTitle")',
    '"Thêm thành viên trong chuyến đi để giao việc."': 't("packing.noMembersDesc")',
    '>Mức độ cần thiết<': '>{t("packing.priorityLabel")}<',
    '"Bình thường"': 't("packing.priorityNormal")',
    '"Quan trọng"': 't("packing.priorityImportant")',
    '"Bắt buộc"': 't("packing.priorityRequired")',
    '>Ghi chú<': '>{t("packing.noteLabel")}<',
    'placeholder="Ghi chú thêm về món đồ này..."': 'placeholder={t("packing.notePlaceholder")}',
    '>Vật dụng cá nhân<': '>{t("packing.privateItem")}<',
    '>Không chia sẻ với đoàn khi ghép nhóm<': '>{t("packing.privateItemDesc")}<',
    '>Hủy<': '>{t("packing.cancel")}<',
    '>Lưu thay đổi<': '>{t("packing.save")}<',
    # '>Thêm món<': '>{t("packing.add")}<', (Already covered above by first instance? Wait, >Thêm món< appears twice maybe. One is addItem, one is add)
    'title="Xóa món đồ này?"': 'title={t("packing.deleteConfirmTitle")}',
    'description="Bạn có chắc muốn xóa món đồ này khỏi danh sách chuẩn bị?"': 'description={t("packing.deleteConfirmDesc")}',
    'confirmLabel="Xóa"': 'confirmLabel={t("packing.deleteButton")}',
    '"Đã thêm món đồ mới"': 't("packing.toastAdded")',
    '"Đã cập nhật món đồ"': 't("packing.toastUpdated")',
}

for k, v in replacements.items():
    content = content.replace(k, v)

# For priority mapping
content = re.sub(
    r'(prio === "normal"\s*\?\s*)"Bình thường"',
    r'\1t("packing.priorityNormal")',
    content
)
content = re.sub(
    r'(prio === "important"\s*\?\s*)"Quan trọng"',
    r'\1t("packing.priorityImportant")',
    content
)
content = re.sub(
    r'(prio === "required"\s*\?\s*)"Bắt buộc"',
    r'\1t("packing.priorityRequired")',
    content
)

# For categories
cat_replacement = """  const catMap: Record<string, string> = React.useMemo(() => ({
    "Giấy tờ": t("packing.catDocuments"),
    "Quần áo": t("packing.catClothing"),
    "Đồ cá nhân": t("packing.catPersonal"),
    "Thiết bị điện tử": t("packing.catElectronics"),
    "Thuốc & y tế": t("packing.catMedical"),
    "Tiền & ví": t("packing.catMoney"),
    "Đồ ăn nhẹ": t("packing.catSnacks"),
    "Khác": t("packing.catOther"),
  }), [t]);"""

if "const catMap" not in content:
    content = content.replace("const { t } = useTranslation();", "const { t } = useTranslation();\n" + cat_replacement)

# Apply catMap to category strings in ChecklistScreen
content = content.replace('{type}', '{catMap[type] || type}')
content = content.replace('{cat}', '{catMap[cat] || cat}')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

# 2. PackingSection.tsx
filepath = r"src\features\packing\PackingSection.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

if "const { t } = useTranslation();" not in content:
    content = re.sub(
        r'(export function PackingSection\(\{.*?\}: \{.*?\}.*?\{)',
        r'\1\n  const { t } = useTranslation();',
        content,
        flags=re.DOTALL
    )

replacements_packing = {
    '"Hành lý"': 't("packing.pageTitle")',
    '"Gợi ý thông minh, không lo bỏ sót."': 't("packing.pageSubtitle")',
    '>Chuẩn bị hành lý<': '>{t("packing.pageTitle")}<',
    '{stats.completed} / {stats.total} món đã sẵn sàng': '{t("packing.progressStatus", { completed: stats.completed, total: stats.total })}',
    '"Tuyệt vời! Hành lý đã sẵn sàng."': 't("packing.progressPerfect")',
    '"Thêm món đồ đầu tiên để bắt đầu chuẩn bị."': 't("packing.progressEmpty")',
    '`Còn ${stats.total - stats.completed} món nữa để chuyến đi hoàn hảo.`': 't("packing.progressRemaining", { remaining: stats.total - stats.completed })',
}

for k, v in replacements_packing.items():
    content = content.replace(k, v)

if "const catMap" not in content:
    content = content.replace("const { t } = useTranslation();", "const { t } = useTranslation();\n" + cat_replacement)

content = content.replace('{type}', '{catMap[type] || type}')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

# 3. SharedChecklistSection.tsx
filepath = r"src\features\share\components\SharedChecklistSection.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

if "const { t } = useTranslation();" not in content:
    content = re.sub(
        r'(export function SharedChecklistSection\(\{.*?\}: \{.*?\}.*?\{)',
        r'\1\n  const { t } = useTranslation();',
        content,
        flags=re.DOTALL
    )

replacements_shared = {
    '>Chuẩn bị hành lý và đồ dùng trước chuyến đi<': '>{t("packing.pageSubtitle")}<',
    '>Hành lý & Chuẩn bị<': '>{t("packing.pageTitle")}<',
    '>Món đồ cần chuẩn bị chung<': '>{t("packing.sharedItemsTitle", "Món đồ cần chuẩn bị chung")}<', # Provide fallback text
    '>Thêm món<': '>{t("packing.addItem")}<',
}

for k, v in replacements_shared.items():
    content = content.replace(k, v)

if "const catMap" not in content:
    content = content.replace("const { t } = useTranslation();", "const { t } = useTranslation();\n" + cat_replacement.replace("React.useMemo", "useMemo"))

content = content.replace('{type}', '{catMap[type] || type}')
content = content.replace('title="Xóa món chuẩn bị chung?"', 'title={t("packing.deleteConfirmTitle")}')
content = content.replace('description="Bạn có chắc muốn xóa món đồ này khỏi danh sách chung?"', 'description={t("packing.deleteConfirmDesc")}')
content = content.replace('confirmLabel="Xóa"', 'confirmLabel={t("packing.deleteButton")}')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement complete")
