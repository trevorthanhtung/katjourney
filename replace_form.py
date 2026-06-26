import re

def replace_more_screen():
    filepath = "src/features/more/MoreScreen.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Form
    content = content.replace('Tên thành viên *', '{t("members.nameLabel")}')
    content = content.replace('Giới tính *', '{t("members.genderLabel")}')
    content = content.replace('label: "Nam" }', 'label: t("members.genderMale") }')
    content = content.replace('label: "Nữ" }', 'label: t("members.genderFemale") }')
    content = content.replace('label: "Khác" }', 'label: t("members.genderOther") }')
    content = content.replace('Nhóm / Gia đình (Tuỳ chọn)', '{t("members.groupLabel")}')
    content = content.replace('Là đại diện nhóm', '{t("members.isGroupLeader")}')
    content = content.replace('Dùng để liên hệ nhanh trong chuyến đi khi cần.', '{t("members.phoneHelp")}')
    content = content.replace('Vai trò trong chuyến đi', '{t("members.roleLabel")}')
    content = content.replace('Vai trò giúp chia chi phí, chuẩn bị hành lý và ghi chú rõ ràng hơn.', '{t("members.roleHelpDesc")}')
    content = content.replace('Ghi chú\n            </span>', '{t("members.noteLabelShort")}\n            </span>')
    content = content.replace('VD: Ăn chay, dễ say xe, phụ trách đặt phòng...', '{t("members.notePlaceholderDetailed")}')
    content = content.replace('Thêm thành viên"}', 't("members.btnAdd")}')
    content = content.replace('Lưu thông tin"', 't("members.btnSave")')

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

replace_more_screen()
