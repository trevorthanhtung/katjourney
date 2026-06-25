import re

def multi_replace(filepath, replacements):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    for k, v in replacements.items():
        content = content.replace(k, v)
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

# 1. ChecklistScreen.tsx
replacements_checklist = {
    '>Cá nhân<': '>{t("packing.privateTag")}<',
    '>Sửa<': '>{t("packing.edit")}<',
    '>Xóa<': '>{t("packing.deleteAction")}<',
    '"Đã xóa: ': 't("packing.toastDeleted") + " "', # I missed this toast previously
    'placeholder="Chọn người đồng hành"': 'placeholder={t("packing.companionSelect")}',
    '>Thêm vào hành lý<': '>{t("packing.addToList")}<',
    '>Thường<': '>{t("packing.priorityNormal")}<',
    '"Sửa"': 't("packing.edit")',
    '"Xóa"': 't("packing.deleteAction")'
}

multi_replace(r"src\features\checklist\ChecklistScreen.tsx", replacements_checklist)

# 2. SharedChecklistSection.tsx
replacements_shared = {
    '>Cá nhân<': '>{t("packing.privateTag")}<',
    ' ? "Sửa" : ': ' ? t("packing.edit") : ',
    ' ? "Xóa" : ': ' ? t("packing.deleteAction") : ',
    '"Đề xuất sửa"': 't("packing.proposeEdit")',
    '"Đề xuất xóa"': 't("packing.proposeDelete")',
    '"Đề xuất thêm"': 't("packing.proposeAdd")',
    '"Chưa có chuẩn bị cá nhân"': 't("packing.emptyPrivate")',
    '"Chưa có chuẩn bị nào"': 't("packing.emptyShared")',
    '"Thêm chuẩn bị cá nhân"': 't("packing.addPrivate")',
    '"Thêm chuẩn bị"': 't("packing.addToList")',
    '"Sửa chuẩn bị cá nhân"': 't("packing.editPrivate")',
    '"Sửa chuẩn bị"': 't("packing.edit")',
    '"Đề xuất sửa chuẩn bị"': 't("packing.proposeEdit")',
    '"Đề xuất thêm chuẩn bị"': 't("packing.proposeAdd")',
    '"Thường"': 't("packing.priorityNormal")',
    '"Quan trọng"': 't("packing.priorityImportant")',
    '"Bắt buộc"': 't("packing.priorityRequired")',
    'placeholder="Chọn người đồng hành"': 'placeholder={t("packing.companionSelect")}',
    '"Lưu thay đổi"': 't("packing.saveChanges")',
    '"Thêm vào hành lý"': 't("packing.addToList")',
    '"Gửi đề xuất sửa"': 't("packing.proposeEdit")',
    '"Gửi đề xuất thêm"': 't("packing.proposeAdd")',
    '"Xóa mục chuẩn bị cá nhân?"': 't("packing.deletePrivateTitle")',
    '"Đề xuất xóa mục này?"': 't("packing.proposeDeleteTitle")',
    '"Hành động này sẽ xóa vĩnh viễn mục chuẩn bị cá nhân của bạn và không thể hoàn tác."': 't("packing.deletePrivateDesc")',
    '"Bạn đang gửi đề xuất xóa mục chuẩn bị này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."': 't("packing.proposeDeleteDesc")',
    '>Đang xóa...<': '>{t("packing.deleting", "Đang xóa...")}<',
    '>Đang lưu...<': '>{t("packing.saving", "Đang lưu...")}<',
    '>Sửa<': '>{t("packing.edit")}<',
    '>Xóa<': '>{t("packing.deleteAction")}<',
}

multi_replace(r"src\features\share\components\SharedChecklistSection.tsx", replacements_shared)

print("Replacement final complete")
