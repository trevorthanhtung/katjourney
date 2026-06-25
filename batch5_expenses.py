import json
import os

langs = ["vi", "en", "ko", "ja", "zh", "es", "fr", "de", "it", "pt", "th", "id"]

new_keys = {
    "expenses": {
        "pageTitle": "Chi phí",
        "pageSubtitle": "Theo dõi chi tiêu, khoản đã trả và phần cần chia trong chuyến đi.",
        "addExpense": "Thêm khoản chi",
        "totalTrip": "Tổng chi phí chuyến đi",
        "sharedTrip": "Chi chung chuyến đi",
        "personalExpense": "Chi cá nhân",
        "avgPerGroup": "Bình quân / nhóm",
        "avgPerPerson": "Bình quân / người",
        "noCompanion": "Chưa có người đồng hành",
        "byCategory": "Chi phí theo hạng mục",
        "sharePerMember": "Phần cần góp của từng người/nhóm",
        "addCompanionStats": "Thêm người đồng hành để thống kê.",
        "addCompanionShare": "Thêm người đồng hành để xem phần chi của từng người.",
        "expenseList": "Danh sách khoản chi",
        "noExpenses": "Chưa có khoản chi nào",
        "noExpensesDesc": "Ghi lại chi phí ăn uống, di chuyển, vé tham quan để hệ thống tự động cân đối chia tiền sau chuyến đi.",
        "deleteTitle": "Xóa khoản chi này?",
        "deleteDesc": "Khoản chi này sẽ bị xóa khỏi danh sách chi phí của chuyến đi. Sau khi xóa, không thể hoàn tác.",
        "deleteConfirm": "Xóa khoản chi",
        "settlementTitle": "Cân đối chia tiền",
        "settlementBalanced": "Mọi người đã cân bằng, không ai nợ ai.",
        "settlementAddCompanion": "Thêm người đồng hành để tính phần cần góp hoặc hoàn lại.",
        "settlementNoExpense": "Chưa có khoản chi chung để cân đối chia tiền.",
        "groupLabel": "(Nhóm: {{group}})",
        "unnamed": "Khoản chi không tên",
        "splitPersonal": "Chi cá nhân",
        "splitPerGroup": "Chi theo nhóm",
        "splitShared": "Chi chung",
        "paidByOf": "Của: {{name}}",
        "paidByPay": "Trả: {{name}}",
        "paidByNone": "Chưa chọn",
        "personalLabel": "Cá nhân",
        "forNPeople": "(cho {{count}} người)",
        "options": "Tùy chọn",
        "edit": "Sửa",
        "delete": "Xóa",
        "editExpense": "Sửa khoản chi",
        "amount": "Số tiền",
        "selectCurrency": "Chọn ngoại tệ",
        "vnd": "VND (Việt Nam Đồng)",
        "exchangeRate": "Tỷ giá: 1 {{currency}} = {{rate}} đ",
        "errAmount": "Vui lòng nhập số tiền lớn hơn 0.",
        "errPayer": "Vui lòng chọn người trả.",
        "errCategory": "Vui lòng nhập tên danh mục.",
        "dateLabel": "Ngày chi tiêu",
        "descLabel": "Nội dung chi tiêu",
        "descPlaceholder": "VD: Taxi, ăn trưa, vé tham quan...",
        "payerLabel": "Người thanh toán",
        "payerPlaceholder": "Chọn người trả",
        "noCompanionWarn": "Chuyến đi chưa có người đồng hành. Thêm người đồng hành để tính phần cần góp hoặc hoàn lại.",
        "personalOwner": "Khoản chi này của ai?",
        "personalPlaceholder": "Chọn người đồng hành (không bắt buộc)",
        "advanced": "Chi tiết nâng cao",
        "categoryLabel": "Hạng mục",
        "customCatLabel": "Tên hạng mục tự nhập *",
        "customCatPlaceholder": "VD: Quà lưu niệm, Thuê xe máy",
        "linkTimeline": "Gắn vào lịch trình (Tùy chọn)",
        "noLink": "Không gắn (Chi phí chung)",
        "splitMethod": "Cách chia khoản chi",
        "splitSharedGroup": "Chi chung nhóm",
        "splitPersonalSelf": "Cá nhân tự trả",
        "allPeople": "Tất cả mọi người",
        "nParticipants": "{{count}} người tham gia",
        "participateAll": "Tất cả",
        "participateN": "{{count}} người",
        "participate": "Tham gia",
        "close": "Đóng",
        "reselectAll": "Chọn lại tất cả",
        "perPerson": "Cá nhân",
        "perGroup": "Gia đình",
        "save": "Lưu",
        "add": "Thêm",
        "toastUpdated": "Đã cập nhật khoản chi",
        "toastAdded": "Đã thêm khoản chi",
        "noCatYet": "Chưa có danh mục chi phí.",
        "noSharedAnalysis": "Chưa có khoản chi chung để phân tích.",
        "noExpenseAnalysis": "Chưa có khoản chi nào để phân tích.",
        "noExpenseList": "Chưa có khoản chi nào trong danh sách",
        "noCompanionShared": "Chuyến đi chưa có người đồng hành. Chọn \"Cá nhân tự trả\" hoặc đề xuất thêm người đồng hành.",
        "sharedSuggest": "Đề xuất thêm chi phí để chia đều và quyết toán sau chuyến đi.",
        "suggestOption": "Tùy chọn đề xuất",
        "paidBy": "Trả bởi:",
        "savingNew": "Đang lưu...",
        "suggestNew": "Đề xuất mới",
        "savingEdit": "Đang lưu...",
        "suggestEdit": "Đề xuất sửa",
        "deletingSugg": "Đang xóa...",
        "suggestDelete": "Đề xuất xóa",
        "splitGroupLabel": "Chi chung nhóm",
        "personalSelfLabel": "Cá nhân tự trả"
    }
}

for lang in langs:
    filepath = f"src/locales/{lang}.json"
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if "expenses" not in data:
        data["expenses"] = {}
        
    for k, v in new_keys["expenses"].items():
        data["expenses"][k] = v

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {filepath}")
