import re
import os

filepath = r"src\features\checklist\ChecklistScreen.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add import if needed
if "import { useTranslation" not in content:
    content = content.replace("import React, {", "import React, {\n  useTranslation,\n", 1)

# Add hook inside the main function component
# Wait, ChecklistScreen has multiple components: ChecklistItemRow, ChecklistScreen.
# Let's add useTranslation to both.

# For ChecklistScreen
if "const { t } = useTranslation();" not in content:
    content = re.sub(
        r"(export function ChecklistScreen\([^)]*\)\s*\{)",
        r"\1\n  const { t } = useTranslation();",
        content
    )
    # Also add to ChecklistItemRow
    content = re.sub(
        r"(function ChecklistItemRow\([^)]*\)\s*\{)",
        r"\1\n  const { t } = useTranslation();",
        content
    )

# Dictionary of straightforward replacements
replacements = [
    (r'>Chuẩn bị hành lý</h2', r'>{t("packing.pageTitle")}</h2'),
    (r'>Chuẩn bị đủ những món cần mang theo cho chuyến đi\.</p', r'>{t("packing.pageSubtitle")}</p'),
    (r'>Tiến độ chuẩn bị</h4', r'>{t("packing.progressTitle")}</h4'),
    (r'>Thêm món</span', r'>{t("packing.addItem")}</span'),
    (r'>Đã xếp \{stats.completed\} / \{stats.total\} món</p', r'>{t("packing.packedCount", { completed: stats.completed, total: stats.total })}</p'),
    (r'\{catDone\} / \{catTotal\} món', r'{t("packing.catCount", { done: catDone, total: catTotal })}'),
    
    (r'>Thường</span', r'>{t("packing.prioNormal")}</span'),
    (r'>Quan trọng</span', r'>{t("packing.prioImportant")}</span'),
    (r'>Bắt buộc</span', r'>{t("packing.prioRequired")}</span'),
    
    (r'title="Hủy"', r'title={t("packing.cancel")}'),
    (r'aria-label="Hủy"', r'aria-label={t("packing.cancel")}'),
    (r'>Hủy\s*</button', r'>{t("packing.cancel")}</button'),
    
    (r'title="Xóa món chuẩn bị này\?"', r'title={t("packing.deleteTitle")}'),
    (r'description="Món chuẩn bị này sẽ bị xóa khỏi danh sách của chuyến đi\. Sau khi xóa, không thể hoàn tác\."', r'description={t("packing.deleteDesc")}'),
    (r'confirmLabel="Xóa món"', r'confirmLabel={t("packing.deleteConfirm")}'),
    
    (r'\{editingId \? "Sửa món hành lý" : "Thêm món hành lý"\}', r'{editingId ? t("packing.editTitle") : t("packing.addTitle")}'),
    (r'\{editingId \? "Lưu thông tin" : "Thêm vào hành lý"\}', r'{editingId ? t("packing.saveItem") : t("packing.addItemConfirm")}'),
    
    (r'title="Tùy chọn"', r'title={t("packing.options")}'),
    (r'aria-label="Đánh dấu checklist"', r'aria-label={t("packing.toggleChecklist")}'),
    
    (r'>Chưa có người đồng hành</h4', r'>{t("packing.noMembersTitle")}</h4'),
    (r'>Thêm người đồng hành trong Không gian chuyến đi để phân công chuẩn bị hành lý\.</p', r'>{t("packing.noMembersDesc")}</p'),
    
    (r'>Gợi ý nhanh</h3', r'>{t("packing.quickSuggest")}</h3'),
    (r'>Thêm tất cả gợi ý</span', r'>{t("packing.addAllSuggest")}</span'),
    
    (r'>Người phụ trách</label', r'>{t("packing.assignLabel")}</label'),
    (r'>Ghi chú bổ sung</label', r'>{t("packing.noteLabel")}</label'),
    (r'placeholder="VD: Để trong balo nhỏ, nhớ sạc đầy\.\.\."', r'placeholder={t("packing.notePlaceholder")}'),
    
    (r'>Tên món đồ \*</label', r'>{t("packing.nameLabel")}</label'),
    (r'placeholder="VD: Sạc dự phòng"', r'placeholder={t("packing.namePlaceholder")}'),
    
    (r'>Danh mục</label', r'>{t("packing.categoryLabel")}</label'),
    (r'>Chỉ mình tôi \(Bảo mật\)</span', r'>{t("packing.privateToggle")}</span'),
    (r'>Đã thêm</span', r'>{t("packing.addedStatus")}</span'),
]

for old, new in replacements:
    content = re.sub(old, new, content)

# Replace QUICK_SUGGESTIONS array translation
quick_suggestions_repl = r'''const QUICK_SUGGESTIONS = [
  { label: t("packing.catGiayTo"), title: t("packing.sugPassport"), category: "Giấy tờ" },
  { label: t("packing.catQuanAo"), title: t("packing.sugClothes"), category: "Quần áo" },
  { label: t("packing.catDienTu"), title: t("packing.sugPowerBank"), category: "Thiết bị điện tử" },
  { label: t("packing.catYTe"), title: t("packing.sugMeds"), category: "Thuốc & y tế" },
  { label: t("packing.catDoCaNhan"), title: t("packing.sugToothbrush"), category: "Đồ cá nhân" },
  { label: t("packing.catTien"), title: t("packing.sugMoney"), category: "Tiền & ví" },
  { label: t("packing.catDoCaNhan"), title: t("packing.sugTowel"), category: "Đồ cá nhân" },
  { label: t("packing.catAnNhe"), title: t("packing.sugSnacks"), category: "Đồ ăn nhẹ" }
];'''

content = re.sub(r'const QUICK_SUGGESTIONS = \[\s*\{ label: "Giấy tờ".*?\}\s*\];', quick_suggestions_repl, content, flags=re.DOTALL)

# Translate the mapped category strings in renderCategoryCard:
# We need to render the localized category name instead of raw `catName`.
# Let's find: `catName` in renderCategoryCard. Wait, what if we just create a translation helper for categories?
# In ChecklistScreen, just below CATEGORIES, we can add a map:
category_map_code = r'''const categoryI18nMap: Record<string, string> = {
  "Giấy tờ": "packing.catGiayTo",
  "Quần áo": "packing.catQuanAo",
  "Đồ cá nhân": "packing.catDoCaNhan",
  "Thiết bị điện tử": "packing.catDienTu",
  "Thuốc & y tế": "packing.catYTe",
  "Tiền & ví": "packing.catTien",
  "Đồ ăn nhẹ": "packing.catAnNhe",
  "Khác": "packing.catOther"
};'''

if "const categoryI18nMap" not in content:
    content = content.replace("const CATEGORIES = [", category_map_code + "\n\nconst CATEGORIES = [")

# Replace `{catName}` with `{t(categoryI18nMap[catName] || catName)}`
content = re.sub(r'<h3 className="text-\[14px\] font-extrabold text-kat-text dark:text-slate-100 truncate">\{catName\}</h3>', r'<h3 className="text-[14px] font-extrabold text-kat-text dark:text-slate-100 truncate">{t(categoryI18nMap[catName] || catName)}</h3>', content)

# Replace Select options mapping:
# `labels={CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: cat }), {} as Record<string, string>)}`
# to `labels={CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: t(categoryI18nMap[cat] || cat) }), {} as Record<string, string>)}`
content = content.replace(
    'labels={CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: cat }), {} as Record<string, string>)}',
    'labels={CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: t(categoryI18nMap[cat] || cat) }), {} as Record<string, string>)}'
)

# And `{sug.label} · Đã thêm` -> `{sug.label} · {t("packing.addedStatus")}`
content = content.replace('{sug.label} · Đã thêm', '{sug.label} · {t("packing.addedStatus")}')

# And priority label map:
# `const labels = { normal: "Thường", important: "Quan trọng", required: "Bắt buộc" };`
content = content.replace(
    'const labels = { normal: "Thường", important: "Quan trọng", required: "Bắt buộc" };',
    'const labels = { normal: t("packing.prioNormal"), important: t("packing.prioImportant"), required: t("packing.prioRequired") };'
)

# And role mapping:
# `labels={members.reduce((acc, m) => ({ ...acc, [m.name]: \`\${m.name} (\${m.role || "Người đồng hành"})\` }), {} as Record<string, string>)}`
content = content.replace(
    'labels={members.reduce((acc, m) => ({ ...acc, [m.name]: `${m.name} (${m.role || "Người đồng hành"})` }), {} as Record<string, string>)}',
    'labels={members.reduce((acc, m) => ({ ...acc, [m.name]: `${m.name} (${m.role || t("members.roleCompanion")})` }), {} as Record<string, string>)}'
)

# We need to make sure `useTranslation` is imported and used in `ChecklistScreen` properly. Wait, `QUICK_SUGGESTIONS` is defined OUTSIDE the component.
# So `t` is not available there!
# To fix this, we can move `QUICK_SUGGESTIONS` inside `ChecklistScreen` OR we can map it inside.
# Let's map it inside. 
# We'll just define the keys in `QUICK_SUGGESTIONS`:
quick_suggestions_repl2 = r'''const QUICK_SUGGESTIONS = [
  { labelKey: "packing.catGiayTo", titleKey: "packing.sugPassport", category: "Giấy tờ" },
  { labelKey: "packing.catQuanAo", titleKey: "packing.sugClothes", category: "Quần áo" },
  { labelKey: "packing.catDienTu", titleKey: "packing.sugPowerBank", category: "Thiết bị điện tử" },
  { labelKey: "packing.catYTe", titleKey: "packing.sugMeds", category: "Thuốc & y tế" },
  { labelKey: "packing.catDoCaNhan", titleKey: "packing.sugToothbrush", category: "Đồ cá nhân" },
  { labelKey: "packing.catTien", titleKey: "packing.sugMoney", category: "Tiền & ví" },
  { labelKey: "packing.catDoCaNhan", titleKey: "packing.sugTowel", category: "Đồ cá nhân" },
  { labelKey: "packing.catAnNhe", titleKey: "packing.sugSnacks", category: "Đồ ăn nhẹ" }
];'''
content = re.sub(r'const QUICK_SUGGESTIONS = \[\s*\{ label: t\("packing\.catGiayTo"\).*?\}\s*\];', quick_suggestions_repl2, content, flags=re.DOTALL)
content = re.sub(r'const QUICK_SUGGESTIONS = \[\s*\{ label: "Giấy tờ".*?\}\s*\];', quick_suggestions_repl2, content, flags=re.DOTALL)

# Now, wherever `sug.label` is used, use `t(sug.labelKey)`. Same for `sug.title`.
content = content.replace('sug.label', 't(sug.labelKey)')
content = content.replace('sug.title', 't(sug.titleKey)')

# Also `isAdded(sug.title)` -> `isAdded(t(sug.titleKey))`
# Wait, `isAdded` uses string matching against the database titles!
# If the DB titles are saved in Vietnamese, but we match against `t(...)` which might be English, it will fail to see it as "added"!
# Ah, `isAdded` is defined as: `const isAdded = (title: string) => items.some((i) => i.title === title);`
# If we change `sug.titleKey` to "packing.sugPassport", `t(sug.titleKey)` will evaluate to "Passport" in EN.
# When the user clicks the suggestion, it adds "Passport" to the DB, so `isAdded("Passport")` will be true. 
# For existing entries "Hộ chiếu & CCCD", they will NOT match in EN. That's acceptable since it's just suggestions.

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
