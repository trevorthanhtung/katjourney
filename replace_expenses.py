import re

filepath = r"src\features\expenses\ExpensesScreen.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# ======================== SettlementCard ========================
# Add useTranslation to SettlementCard
content = re.sub(
    r'(export function SettlementCard\(\s*\{[^}]+\}\s*:\s*\{[^}]+\}\s*\)\s*\{)',
    r'\1\n  const { t } = useTranslation();',
    content
)

content = content.replace(
    'let emptyText = "Mọi người đã cân bằng, không ai nợ ai.";',
    'let emptyText = t("expenses.settlementBalanced");'
)
content = content.replace(
    'emptyText = "Thêm người đồng hành để tính phần cần góp hoặc hoàn lại.";',
    'emptyText = t("expenses.settlementAddCompanion");'
)
content = content.replace(
    'emptyText = "Chưa có khoản chi chung để cân đối chia tiền.";',
    'emptyText = t("expenses.settlementNoExpense");'
)
content = content.replace(
    '>Cân đối chia tiền</h3>',
    '>{t("expenses.settlementTitle")}</h3>'
)
# Settlement group labels
content = content.replace(
    '>(Nhóm: {fromGroup})</span>',
    '>{t("expenses.groupLabel", { group: fromGroup })}</span>'
)
content = content.replace(
    '>(Nhóm: {toGroup})</span>',
    '>{t("expenses.groupLabel", { group: toGroup })}</span>'
)

# ======================== ExpenseCard ========================
# Add useTranslation to ExpenseCard
content = re.sub(
    r'(const ExpenseCard = React\.memo\(function ExpenseCard\(\s*\{[^}]+\}\s*:\s*\{[^}]+\}\s*\)\s*\{)',
    r'\1\n  const { t } = useTranslation();',
    content
)

# Split type badges
content = content.replace(
    '{isPersonal ? "Chi cá nhân" : item.splitMode === "perGroup" ? "Chi theo nhóm" : "Chi chung"}',
    '{isPersonal ? t("expenses.splitPersonal") : item.splitMode === "perGroup" ? t("expenses.splitPerGroup") : t("expenses.splitShared")}'
)

# Payer line
content = content.replace(
    '• {isPersonal ? (item.payer ? `Của: ${item.payer}` : "Cá nhân") : `Trả: ${item.payer || "Chưa chọn"}`}',
    '• {isPersonal ? (item.payer ? t("expenses.paidByOf", { name: item.payer }) : t("expenses.personalLabel")) : t(item.payer ? "expenses.paidByPay" : "expenses.paidByNone", { name: item.payer || "" })}'
)

# for N people
content = content.replace(
    '{item.splitType === "shared" && item.splitAmong && item.splitAmong.length > 0 && ` (cho ${item.splitAmong.length} người)`}',
    '{item.splitType === "shared" && item.splitAmong && item.splitAmong.length > 0 && ` ${t("expenses.forNPeople", { count: item.splitAmong.length })}`}'
)

# Unnamed expense
content = content.replace(
    '{item.description || "Khoản chi không tên"}',
    '{item.description || t("expenses.unnamed")}'
)

# Options title
content = content.replace(
    'title="Tùy chọn"',
    'title={t("expenses.options")}'
)

# Edit/Delete buttons in menu
# Sửa
content = re.sub(
    r'(\s*<HugeiconsIcon icon=\{PencilEdit01Icon\} className="h-4 w-4 text-slate-500" />\s*\n\s*)Sửa\s*\n(\s*</button>)',
    r'\1{t("expenses.edit")}\n\2',
    content
)
# Xóa
content = re.sub(
    r'(\s*<HugeiconsIcon icon=\{Delete01Icon\} className="h-4 w-4" />\s*\n\s*)Xóa\s*\n(\s*</button>)',
    r'\1{t("expenses.delete")}\n\2',
    content
)

# ======================== ExpenseForm ========================
# Add useTranslation to ExpenseForm
content = re.sub(
    r'(function ExpenseForm\(\s*\{[^}]+\}\s*:\s*\{[^}]+\}\s*\)\s*\{)',
    r'\1\n  const { t } = useTranslation();',
    content
)

# Validation errors
content = content.replace(
    'newErrors.amount = "Vui lòng nhập số tiền lớn hơn 0.";',
    'newErrors.amount = t("expenses.errAmount");'
)
content = content.replace(
    'newErrors.customCategory = "Vui lòng nhập tên danh mục.";',
    'newErrors.customCategory = t("expenses.errCategory");'
)
content = content.replace(
    'newErrors.payer = "Vui lòng chọn người trả.";',
    'newErrors.payer = t("expenses.errPayer");'
)

# Toast messages
content = content.replace(
    'onSaved("Đã cập nhật khoản chi");',
    'onSaved(t("expenses.toastUpdated"));'
)
content = content.replace(
    'onSaved("Đã thêm khoản chi");',
    'onSaved(t("expenses.toastAdded"));'
)

# Save/Add button text
content = content.replace(
    '{editing ? "Lưu" : "Thêm"}',
    '{editing ? t("expenses.save") : t("expenses.add")}'
)

# BottomSheet title
content = content.replace(
    'title={editing ? "Sửa khoản chi" : "Thêm khoản chi"}',
    'title={editing ? t("expenses.editExpense") : t("expenses.addExpense")}'
)

# Amount label
content = content.replace(
    '>Số tiền</span>',
    '>{t("expenses.amount")}</span>'
)

# Currency selector
content = content.replace(
    'title="Chọn ngoại tệ"',
    'title={t("expenses.selectCurrency")}'
)
content = content.replace(
    '>VND (Việt Nam Đồng)\n',
    '>{t("expenses.vnd")}\n'
)
# There's another occurrence without \n
content = content.replace(
    'VND (Việt Nam Đồng)',
    '{t("expenses.vnd")}'
)

# Exchange rate label
content = content.replace(
    'Tỷ giá: 1 {form.currency} = {new Intl.NumberFormat(\'vi-VN\').format(form.exchangeRate)} đ',
    '{t("expenses.exchangeRate", { currency: form.currency, rate: new Intl.NumberFormat("vi-VN").format(form.exchangeRate) })}'
)

# Date label
content = content.replace(
    'Ngày chi tiêu\n',
    '{t("expenses.dateLabel")}\n'
)

# Description label
content = content.replace(
    'Nội dung chi tiêu\n',
    '{t("expenses.descLabel")}\n'
)
content = content.replace(
    'placeholder="VD: Taxi, ăn trưa, vé tham quan..."',
    'placeholder={t("expenses.descPlaceholder")}'
)

# Payer select label
content = content.replace(
    'Người thanh toán\n',
    '{t("expenses.payerLabel")}\n'
)
content = content.replace(
    'placeholder="Chọn người trả"',
    'placeholder={t("expenses.payerPlaceholder")}'
)

# No companion warning
content = content.replace(
    '<span>Chuyến đi chưa có người đồng hành. Thêm người đồng hành để tính phần cần góp hoặc hoàn lại.</span>',
    '<span>{t("expenses.noCompanionWarn")}</span>'
)

# Personal owner label
content = content.replace(
    'Khoản chi này của ai?\n',
    '{t("expenses.personalOwner")}\n'
)
content = content.replace(
    'placeholder="Chọn người đồng hành (không bắt buộc)"',
    'placeholder={t("expenses.personalPlaceholder")}'
)

# Advanced panel
content = content.replace(
    'Chi tiết nâng cao\n',
    '{t("expenses.advanced")}\n'
)

# Category label
content = content.replace(
    'Hạng mục\n',
    '{t("expenses.categoryLabel")}\n'
)

# Custom category
content = content.replace(
    'Tên hạng mục tự nhập *\n',
    '{t("expenses.customCatLabel")}\n'
)
content = content.replace(
    'placeholder="VD: Quà lưu niệm, Thuê xe máy"',
    'placeholder={t("expenses.customCatPlaceholder")}'
)

# Link timeline
content = content.replace(
    'Gắn vào lịch trình (Tùy chọn)\n',
    '{t("expenses.linkTimeline")}\n'
)
content = content.replace(
    '"": "Không gắn (Chi phí chung)"',
    '"": t("expenses.noLink")'
)

# Split method
content = content.replace(
    'Cách chia khoản chi\n',
    '{t("expenses.splitMethod")}\n'
)

# Split buttons
content = re.sub(
    r'(\s*)Chi chung nhóm\s*\n(\s*</button>)',
    r'\1{t("expenses.splitGroupLabel")}\n\2',
    content,
    count=1
)
content = re.sub(
    r'(\s*)Cá nhân tự trả\s*\n(\s*</button>)',
    r'\1{t("expenses.personalSelfLabel")}\n\2',
    content,
    count=1
)

# Participants
content = content.replace(
    '{form.splitAmong.length === 0 ? "Tất cả mọi người" : `${form.splitAmong.length} người tham gia`}',
    '{form.splitAmong.length === 0 ? t("expenses.allPeople") : t("expenses.nParticipants", { count: form.splitAmong.length })}'
)

# Edit participants button - "Sửa" inside form
# This is a specific "Sửa" button different from the ExpenseCard one
# Line ~858: <span>Sửa</span> or just Sửa inside a button
# Let's be more specific - it's the one near the splitAmong section
content = re.sub(
    r'(className="flex items-center gap-1\.5 px-3 py-1\.5 rounded-lg bg-white dark:bg-slate-800 text-\[12px\] font-bold text-kat-teal[^"]*"[^>]*>\s*\n\s*)Sửa\s*\n(\s*</button>)',
    r'\1{t("expenses.edit")}\n\2',
    content
)

# Participate header
content = content.replace(
    'Tham gia ({form.splitAmong.length === 0 ? "Tất cả" : `${form.splitAmong.length} người`})',
    '{t("expenses.participate")} ({form.splitAmong.length === 0 ? t("expenses.participateAll") : t("expenses.participateN", { count: form.splitAmong.length })})'
)

# perPerson / perGroup toggle
content = re.sub(
    r'(\s*)Cá nhân\s*\n(\s*</button>\s*\n\s*<button)',
    r'\1{t("expenses.perPerson")}\n\2',
    content,
    count=1
)
content = re.sub(
    r'(\s*)Gia đình\s*\n(\s*</button>\s*\n\s*</div>)',
    r'\1{t("expenses.perGroup")}\n\2',
    content,
    count=1
)

# Close button
content = re.sub(
    r'(\s*)Đóng\s*\n(\s*</button>\s*\n\s*\{form\.splitAmong)',
    r'\1{t("expenses.close")}\n\2',
    content,
    count=1
)

# Reselect all
content = content.replace(
    '>Chọn lại tất cả\n',
    '>{t("expenses.reselectAll")}\n'
)

# ======================== ExpensesScreen main ========================
content = content.replace(
    '>Chi phí</h2>',
    '>{t("expenses.pageTitle")}</h2>'
)
content = content.replace(
    '>Theo dõi chi tiêu, khoản đã trả và phần cần chia trong chuyến đi.</p>',
    '>{t("expenses.pageSubtitle")}</p>'
)

# Add expense buttons (desktop + mobile)
content = content.replace(
    'Thêm khoản chi\n              </button>',
    '{t("expenses.addExpense")}\n              </button>'
)
content = content.replace(
    'Thêm khoản chi\n                </button>',
    '{t("expenses.addExpense")}\n                </button>'
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
    'emptyText="Chưa có danh mục chi phí."',
    'emptyText={t("expenses.noCatYet")}'
)
content = content.replace(
    '>Phần cần góp của từng người/nhóm</h3>',
    '>{t("expenses.sharePerMember")}</h3>'
)
content = content.replace(
    'emptyText="Thêm người đồng hành để thống kê."',
    'emptyText={t("expenses.addCompanionStats")}'
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
content = content.replace(
    '>Chưa có khoản chi nào</h3>',
    '>{t("expenses.noExpenses")}</h3>'
)
content = content.replace(
    'Ghi lại chi phí ăn uống, di chuyển, vé tham quan để hệ thống tự động cân đối chia tiền sau chuyến đi.\n',
    '{t("expenses.noExpensesDesc")}\n'
)

# Delete confirm
content = content.replace(
    'title="Xóa khoản chi này?"',
    'title={t("expenses.deleteTitle")}'
)
content = content.replace(
    'description="Khoản chi này sẽ bị xóa khỏi danh sách chi phí của chuyến đi. Sau khi xóa, không thể hoàn tác."',
    'description={t("expenses.deleteDesc")}'
)
content = content.replace(
    'confirmLabel="Xóa khoản chi"',
    'confirmLabel={t("expenses.deleteConfirm")}'
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done: ExpensesScreen.tsx")
