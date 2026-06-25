import json
import os

langs = ["vi", "en", "ko", "ja", "zh", "es", "fr", "de", "it", "pt", "th", "id"]

new_keys = {
    "packing": {
        "pageTitle": "Chuẩn bị hành lý",
        "pageSubtitle": "Chuẩn bị đủ những món cần mang theo cho chuyến đi.",
        "progressTitle": "Tiến độ chuẩn bị",
        "packedCount": "Đã xếp {{completed}} / {{total}} món",
        "addItem": "Thêm món",
        "catCount": "{{done}} / {{total}} món",
        "cancel": "Hủy",
        "deleteTitle": "Xóa món chuẩn bị này?",
        "deleteDesc": "Món chuẩn bị này sẽ bị xóa khỏi danh sách của chuyến đi. Sau khi xóa, không thể hoàn tác.",
        "deleteConfirm": "Xóa món",
        "prioNormal": "Thường",
        "prioImportant": "Quan trọng",
        "prioRequired": "Bắt buộc",
        "saveItem": "Lưu thông tin",
        "addItemConfirm": "Thêm vào hành lý",
        "editTitle": "Sửa món hành lý",
        "addTitle": "Thêm món hành lý",
        "options": "Tùy chọn",
        "toggleChecklist": "Đánh dấu checklist",
        "noMembersTitle": "Chưa có người đồng hành",
        "noMembersDesc": "Thêm người đồng hành trong Không gian chuyến đi để phân công chuẩn bị hành lý.",
        "quickSuggest": "Gợi ý nhanh",
        "addAllSuggest": "Thêm tất cả gợi ý",
        "assignLabel": "Người phụ trách",
        "noteLabel": "Ghi chú bổ sung",
        "notePlaceholder": "VD: Để trong balo nhỏ, nhớ sạc đầy...",
        "nameLabel": "Tên món đồ *",
        "namePlaceholder": "VD: Sạc dự phòng",
        "categoryLabel": "Danh mục",
        "privateToggle": "Chỉ mình tôi (Bảo mật)",
        "addedStatus": "Đã thêm",
        
        "catGiayTo": "Giấy tờ",
        "catQuanAo": "Quần áo",
        "catDoCaNhan": "Đồ cá nhân",
        "catDienTu": "Thiết bị điện tử",
        "catYTe": "Thuốc & y tế",
        "catTien": "Tiền & ví",
        "catAnNhe": "Đồ ăn nhẹ",
        "catOther": "Khác",

        "sugPassport": "Hộ chiếu & CCCD",
        "sugClothes": "Quần áo dã ngoại",
        "sugPowerBank": "Sạc dự phòng, cáp sạc",
        "sugMeds": "Thuốc hạ sốt, băng cá nhân",
        "sugToothbrush": "Bàn chải & Kem đánh răng",
        "sugMoney": "Tiền mặt & thẻ",
        "sugTowel": "Khăn mặt & Bộ vệ sinh",
        "sugSnacks": "Nước uống & bánh kẹo"
    }
}

for lang in langs:
    filepath = f"src/locales/{lang}.json"
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}")
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if "packing" not in data:
        data["packing"] = {}
        
    for k, v in new_keys["packing"].items():
        data["packing"][k] = v

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {filepath}")
