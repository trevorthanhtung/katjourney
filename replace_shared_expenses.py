import re

filepath = r"src\features\share\components\SharedExpensesSection.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Check if useTranslation is already imported and used
has_t = 'const { t } = useTranslation();' in content

# Replace Vietnamese strings - these mirror ExpensesScreen but in the shared view

# Page title & subtitle
content = content.replace(
    '>Chi phí</h2>',
    '>{t("expenses.pageTitle")}</h2>'
)
content = content.replace(
    '>Theo dõi chi tiêu, khoản đã trả và phân chia trong chuyến đi.</p>',
    '>{t("expenses.pageSubtitle")}</p>'
)

# Total section
content = content.replace(
    '>Tổng chi phí chuyến đi</p>',
    '>{t("expenses.totalTrip")}</p>'
)
content = content.replace(
    '>Chi chung chuyến đi</p>',
    '>{t("expenses.sharedTrip")}</p>'
)
content = content.replace(
    '>Chi cá nhân</p>',
    '>{t("expenses.personalExpense")}</p>'
)
content = content.replace(
    '{hasGroups ? "Bình quân / nhóm" : "Bình quân / người"}',
    '{hasGroups ? t("expenses.avgPerGroup") : t("expenses.avgPerPerson")}'
)
content = content.replace(
    '>Chưa có người đồng hành</span>',
    '>{t("expenses.noCompanion")}</span>'
)

# Breakdown sections
content = content.replace(
    '>Chi phí theo hạng mục</h3>',
    '>{t("expenses.byCategory")}</h3>'
)
content = content.replace(
    '>Phần cần góp của từng người/nhóm</h3>',
    '>{t("expenses.sharePerMember")}</h3>'
)
content = content.replace(
    'emptyText="Chưa có khoản chi nào để phân tích."',
    'emptyText={t("expenses.noExpenseAnalysis")}'
)
content = content.replace(
    'emptyText="Chưa có khoản chi chung để phân tích."',
    'emptyText={t("expenses.noSharedAnalysis")}'
)
content = content.replace(
    '>Thêm người đồng hành để xem phần chi của từng người.</p>',
    '>{t("expenses.addCompanionShare")}</p>'
)

# Expense list
content = content.replace(
    '>Danh sách khoản chi</h3>',
    '>{t("expenses.expenseList")}</h3>'
)

# Empty states
content = content.replace(
    '>Chưa có khoản chi nào trong danh sách</h3>',
    '>{t("expenses.noExpenseList")}</h3>'
)
content = content.replace(
    'Đề xuất thêm chi phí để chia đều và quyết toán sau chuyến đi.',
    '{t("expenses.sharedSuggest")}'
)

# Settlement card
content = content.replace(
    '>Cân đối chia tiền</h3>',
    '>{t("expenses.settlementTitle")}</h3>'
)
content = content.replace(
    '"Mọi người đã cân bằng, không ai nợ ai."',
    't("expenses.settlementBalanced")'
)
content = content.replace(
    '"Chưa có khoản chi chung để cân đối chia tiền."',
    't("expenses.settlementNoExpense")'
)
content = content.replace(
    '"Thêm người đồng hành để tính phần cần góp hoặc hoàn lại."',
    't("expenses.settlementAddCompanion")'
)

# Group labels in settlement
content = content.replace(
    '>(Nhóm: {fromGroup})</span>',
    '>{t("expenses.groupLabel", { group: fromGroup })}</span>'
)
content = content.replace(
    '>(Nhóm: {toGroup})</span>',
    '>{t("expenses.groupLabel", { group: toGroup })}</span>'
)

# Expense card badges
content = content.replace(
    '{e.splitType === "personal" ? "Cá nhân" : e.splitMode === "perGroup" ? "Chi theo nhóm" : "Chi chung"}',
    '{e.splitType === "personal" ? t("expenses.personalLabel") : e.splitMode === "perGroup" ? t("expenses.splitPerGroup") : t("expenses.splitShared")}'
)

# Payer display
content = content.replace(
    '>Trả bởi:</span>',
    '>{t("expenses.paidBy")}</span>'
)

# Form fields
content = content.replace(
    '>Số tiền</span>',
    '>{t("expenses.amount")}</span>'
)
content = content.replace(
    'title="Chọn ngoại tệ"',
    'title={t("expenses.selectCurrency")}'
)
content = content.replace(
    'VND (Việt Nam Đồng)',
    '{t("expenses.vnd")}'
)

# Date / Description / Payer labels
content = content.replace(
    'Ngày chi tiêu\n',
    '{t("expenses.dateLabel")}\n'
)
content = content.replace(
    'Nội dung chi tiêu\n',
    '{t("expenses.descLabel")}\n'
)
content = content.replace(
    'placeholder="VD: Taxi, ăn trưa, vé tham quan..."',
    'placeholder={t("expenses.descPlaceholder")}'
)
content = content.replace(
    'Người thanh toán\n',
    '{t("expenses.payerLabel")}\n'
)
content = content.replace(
    'placeholder="Chọn người trả"',
    'placeholder={t("expenses.payerPlaceholder")}'
)

# No companion warning (shared view version)
content = content.replace(
    '<span>Chuyến đi chưa có người đồng hành. Chọn "Cá nhân tự trả" hoặc đề xuất thêm người đồng hành.</span>',
    '<span>{t("expenses.noCompanionShared")}</span>'
)

# Advanced / Category / Custom Cat / Link Timeline
content = content.replace(
    'Chi tiết nâng cao\n',
    '{t("expenses.advanced")}\n'
)
content = content.replace(
    'Hạng mục\n',
    '{t("expenses.categoryLabel")}\n'
)
content = content.replace(
    'Tên hạng mục tự nhập *\n',
    '{t("expenses.customCatLabel")}\n'
)
content = content.replace(
    'placeholder="VD: Quà lưu niệm, Thuê xe máy"',
    'placeholder={t("expenses.customCatPlaceholder")}'
)
content = content.replace(
    'Gắn vào lịch trình (Tùy chọn)\n',
    '{t("expenses.linkTimeline")}\n'
)

# Split method
content = content.replace(
    'Cách chia khoản chi\n',
    '{t("expenses.splitMethod")}\n'
)

# Split buttons
content = content.replace(
    '>Chi chung nhóm\n',
    '>{t("expenses.splitGroupLabel")}\n'
)
content = content.replace(
    '>Cá nhân tự trả\n',
    '>{t("expenses.personalSelfLabel")}\n'
)

# Personal label
content = content.replace(
    'Khoản chi này của ai?\n',
    '{t("expenses.personalOwner")}\n'
)
content = content.replace(
    'placeholder="Chọn người đồng hành (không bắt buộc)"',
    'placeholder={t("expenses.personalPlaceholder")}'
)

# Participants
content = content.replace(
    'Tất cả mọi người',
    '{t("expenses.allPeople")}'
)
# Be careful with these - they might have dynamic content
content = content.replace(
    '`${form.splitAmong.length} người tham gia`',
    't("expenses.nParticipants", { count: form.splitAmong.length })'
)

# Sửa button in participants
content = content.replace(
    '>Sửa\n',
    '>{t("expenses.edit")}\n'
)

# Participate header
content = content.replace(
    '"Tất cả"',
    't("expenses.participateAll")'
)
content = content.replace(
    '`${form.splitAmong.length} người`',
    't("expenses.participateN", { count: form.splitAmong.length })'
)
content = content.replace(
    '>Tham gia (',
    '>{t("expenses.participate")} ('
)

# Close button
content = content.replace(
    '>Đóng\n',
    '>{t("expenses.close")}\n'
)

# Reselect all
content = content.replace(
    '>Chọn lại tất cả\n',
    '>{t("expenses.reselectAll")}\n'
)

# perPerson / perGroup toggle
content = content.replace(
    '>Cá nhân\n',
    '>{t("expenses.perPerson")}\n'
)
content = content.replace(
    '>Gia đình\n',
    '>{t("expenses.perGroup")}\n'
)

# Chia đều mỗi người / Chia theo nhóm
content = content.replace(
    '>Chia đều mỗi người\n',
    '>{t("expenses.perPerson")}\n'
)
content = content.replace(
    '>Chia theo nhóm\n',
    '>{t("expenses.perGroup")}\n'
)

# Ngưòi tham gia label
content = content.replace(
    '>Người tham gia khoản chi này:</span>',
    '>{t("expenses.participate")}:</span>'
)

# Suggestion option
content = content.replace(
    '>Tùy chọn đề xuất</label>',
    '>{t("expenses.suggestOption")}</label>'
)

# Validation errors
content = content.replace(
    '"Vui lòng nhập số tiền lớn hơn 0."',
    't("expenses.errAmount")'
)
content = content.replace(
    '"Vui lòng nhập tên danh mục."',
    't("expenses.errCategory")'
)
content = content.replace(
    '"Vui lòng chọn người trả."',
    't("expenses.errPayer")'
)

# Đang lưu / Đề xuất mới / sửa / xóa
content = content.replace("'Đang lưu...'", "t('expenses.savingNew')")
content = content.replace("'Đề xuất mới'", "t('expenses.suggestNew')")
content = content.replace("'Đề xuất sửa'", "t('expenses.suggestEdit')")
content = content.replace("'Đang xóa...'", "t('expenses.deletingSugg')")
content = content.replace("'Đề xuất xóa'", "t('expenses.suggestDelete')")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done: SharedExpensesSection.tsx")
