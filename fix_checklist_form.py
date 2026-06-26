import os

file_path = 'src/features/share/components/SharedChecklistSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace hardcoded strings in SharedChecklistSection form
content = content.replace('Nhóm hành lý', '{t("packing.categoryLabel")}')
content = content.replace('<span className="text-[12px] font-bold tracking-tight">{cat}</span>', '<span className="text-[12px] font-bold tracking-tight">{catMap[cat] || cat}</span>')
content = content.replace('Số lượng', '{t("packing.quantityLabel")}')

# Ensure we don't accidentally replace something wrong, the strings are quite specific.
# "Nhóm hành lý" only appears once in the label:
# <label className="text-[12.5px] font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
#   <HugeiconsIcon icon={PackageIcon} className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
#   Nhóm hành lý
# </label>
# And "Số lượng" only appears once in the label:
# <label className="text-[12.5px] font-bold text-slate-700 dark:text-slate-300">Số lượng</label>

# Write the updated content back to the file
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed SharedChecklistSection form strings")
