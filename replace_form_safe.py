import re

def replace_more_screen_safe():
    filepath = "src/features/more/MoreScreen.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Form Titles
    content = content.replace('title={editing ? "Sửa thành viên" : "Thêm thành viên"}', 'title={editing ? t("members.formEditTitle") : t("members.formAddTitle")}')
    content = content.replace('{editing ? "Lưu thông tin" : "Thêm thành viên"}', '{editing ? t("members.btnSave") : t("members.btnAdd")}')
    
    # Form Labels & Placeholders
    content = content.replace('Tên thành viên *', '{t("members.nameLabel")}')
    content = content.replace('Giới tính *', '{t("members.genderLabel")}')
    content = content.replace('label: "Nam" }', 'label: t("members.genderMale") }')
    content = content.replace('label: "Nữ" }', 'label: t("members.genderFemale") }')
    content = content.replace('label: "Khác" }', 'label: t("members.genderOther") }')
    content = content.replace('Nhóm / Gia đình (Tuỳ chọn)', '{t("members.groupLabel")}')
    content = content.replace('Là đại diện nhóm', '{t("members.isGroupLeader")}')
    
    content = content.replace('Vai trò trong chuyến đi', '{t("members.roleLabel")}')
    content = content.replace('Vai trò giúp chia chi phí, chuẩn bị hành lý và ghi chú rõ ràng hơn.', '{t("members.roleHelpDesc")}')
    
    content = content.replace('Ghi chú\n            </span>', '{t("members.noteLabelShort")}\n            </span>')
    content = content.replace('placeholder="VD: Ăn chay, dễ say xe, phụ trách đặt phòng..."', 'placeholder={t("members.notePlaceholderDetailed")}')
    
    # Menu strings
    content = content.replace('\n                  Sửa\n                </button>', '\n                  {t("members.menuEdit")}\n                </button>')
    content = content.replace('\n                  Xóa\n                </button>', '\n                  {t("members.menuDelete")}\n                </button>')

    # Delete Confirm Modal props
    content = content.replace('title="Xóa thành viên này?"', 'title={t("members.deleteConfirmTitle")}')
    content = content.replace('? "Thành viên này đang liên quan đến chi phí hoặc checklist. Hãy kiểm tra trước khi xóa."', '? t("members.deleteConfirmWarning")')
    content = content.replace('sẽ không còn xuất hiện trong danh sách chuyến đi. Các dữ liệu liên quan như chi phí hoặc phân công có thể cần được kiểm tra lại.', '{t("members.deleteConfirmDesc1")}')
    content = content.replace('confirmLabel="Xóa thành viên"', 'confirmLabel={t("members.menuDelete")}')
    content = content.replace('onShowToast?.("Đã xóa thành viên");', 'onShowToast?.(t("members.toastDeletedMember"));')
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

replace_more_screen_safe()
