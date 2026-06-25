import re

filepath = r"src\features\checklist\ChecklistScreen.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace QUICK_SUGGESTIONS object
old_sug = """const QUICK_SUGGESTIONS = [
  { labelKey: "packing.catGiayTo", titleKey: "packing.sugPassport", category: "Giấy tờ" },
  { labelKey: "packing.catQuanAo", titleKey: "packing.sugJacket", category: "Quần áo" },
  { labelKey: "packing.catDienTu", titleKey: "packing.sugCharger", category: "Thiết bị điện tử" },
  { labelKey: "packing.catYTe", titleKey: "packing.sugMedicine", category: "Thuốc & y tế" },
  { labelKey: "packing.catDoCaNhan", titleKey: "packing.sugToothbrush", category: "Đồ cá nhân" },
  { labelKey: "packing.catTien", titleKey: "packing.sugMoney", category: "Tiền & ví" },
  { labelKey: "packing.catDoCaNhan", titleKey: "packing.sugTowel", category: "Đồ cá nhân" },
  { labelKey: "packing.catAnNhe", titleKey: "packing.sugSnacks", category: "Đồ ăn nhẹ" }
];"""

# wait, I checked earlier, some of those strings were different in the file: sugJacket vs sugClothes
# Let's use regex to replace the keys or just manually do it carefully.
# Actually, I can just replace individual string values:
content = content.replace('"packing.catGiayTo"', '"packing.catDocuments"')
content = content.replace('"packing.catQuanAo"', '"packing.catClothing"')
content = content.replace('"packing.catDienTu"', '"packing.catElectronics"')
content = content.replace('"packing.catYTe"', '"packing.catMedical"')
content = content.replace('"packing.catDoCaNhan"', '"packing.catPersonal"')
content = content.replace('"packing.catTien"', '"packing.catMoney"')
content = content.replace('"packing.catAnNhe"', '"packing.catSnacks"')

content = content.replace('"packing.sugJacket"', '"packing.sugClothes"')
content = content.replace('"packing.sugCharger"', '"packing.sugPowerBank"')
content = content.replace('"packing.sugMedicine"', '"packing.sugMeds"')
content = content.replace('"packing.sugTowel"', '"packing.sugTowel"')

# Missing texts
content = content.replace(
    'Đã xếp {stats.completed} / {stats.total} món',
    '{t("packing.progressStatus", { completed: stats.completed, total: stats.total })}'
)

content = content.replace(
    '>Gợi ý nhanh cho hành lý<',
    '>{t("packing.quickSuggestionsTitle")}<'
)

content = content.replace(
    '>Cuộn ngang ›<',
    '>{t("packing.scrollRight")}<'
)

content = content.replace(
    '>Chưa có món đồ nào trong hành lý<',
    '>{t("packing.emptyStateTitle")}<'
)

content = content.replace(
    '>Thêm giấy tờ, quần áo, thiết bị hoặc thuốc men để chuyến đi sẵn sàng hơn.<',
    '>{t("packing.emptyStateDesc")}<'
)

content = content.replace(
    '>Gợi ý nhanh<',
    '>{t("packing.quickSuggestions")}<'
)

# And in QUICK_SUGGESTIONS render, sug.category needs to be mapped:
# {sug.category} -> {catMap[sug.category] || sug.category}
content = content.replace(
    '''<HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5 text-teal-400" />
                      {sug.category}''',
    '''<HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5 text-teal-400" />
                      {catMap[sug.category] || sug.category}'''
)

content = content.replace(
    '''<HugeiconsIcon icon={Add01Icon} className="h-4 w-4 text-kat-accent-yellow" />
                    {sug.category}''',
    '''<HugeiconsIcon icon={Add01Icon} className="h-4 w-4 text-kat-accent-yellow" />
                    {catMap[sug.category] || sug.category}'''
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement missing complete")
