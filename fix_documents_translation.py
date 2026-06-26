import os
import re

file_path = 'src/features/share/components/SharedDocumentsSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace JSX strings
content = content.replace(
    'isUploading ? <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin text-slate-400" /> : "Lưu"',
    'isUploading ? <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin text-slate-400" /> : t("documents.saveBtn")'
)

content = content.replace('>Giấy tờ & đặt chỗ<', '>{t("documents.featureTitle")}<')
content = content.replace('          Chung\n', '          {t("packing.sharedTab")}\n')
content = content.replace('          Cá nhân\n', '          {t("packing.personalTab")}\n')
content = content.replace('Đề xuất xóa\n', '{t("share.suggestDelete")}\n')
content = content.replace('title="Đề xuất xóa"', 'title={t("share.suggestDelete")}')
content = content.replace('>Ảnh đính kèm<', '>{t("documents.attachmentLabel")}<')

content = content.replace(
    '? "Chưa có giấy tờ cá nhân" : "Chưa có giấy tờ nào"',
    '? t("documents.emptyPrivate") : t("documents.emptyAllTitle")'
)
content = content.replace(
    '? "Thêm các thông tin vé, đặt phòng của riêng bạn tại đây"\n              : "Các thông tin vé, đặt phòng chung cho chuyến đi sẽ hiển thị ở đây"',
    '? t("documents.emptyAllDesc") : t("documents.emptyAllDesc")'
)

content = content.replace('          Thêm giấy tờ cá nhân\n', '          {t("documents.addPrivate")}\n')

content = content.replace(
    'title={editingDoc ? "Sửa giấy tờ cá nhân" : "Thêm giấy tờ cá nhân"}',
    'title={editingDoc ? t("documents.editPrivate") : t("documents.addPrivate")}'
)

content = content.replace('label="Tên mục *"', 'label={t("documents.inputTitleLabel")}')
content = content.replace('>Vui lòng nhập tên mục<', '>{t("documents.titleRequired")}<')

content = content.replace('label="Phân loại"', 'label={t("documents.inputTypeLabel")}')

labels_to_replace = '''labels={{
                ticket: "Vé di chuyển",
                hotel: "Đặt phòng",
                booking: "Mã đặt chỗ",
                contact: "Liên hệ",
                map: "Bản đồ",
                other: "Khác"
              }}'''
labels_replacement = '''labels={{
                ticket: t("documents.typeTicket"),
                hotel: t("documents.typeHotel"),
                booking: t("documents.typeBooking"),
                contact: t("documents.typeContact"),
                map: t("documents.typeMap"),
                other: t("documents.typeOther")
              }}'''
content = content.replace(labels_to_replace, labels_replacement)

content = content.replace('label="Mã / thông tin đặt chỗ"', 'label={t("documents.inputCodeLabel")}')
content = content.replace('                Thông tin bổ sung\n', '                {t("documents.advancedInfoLabel")}\n')
content = content.replace('>Ảnh đính kèm (Vé/CCCD/...)<', '>{t("documents.inputAttachmentLabel")}<')

content = content.replace('              Sửa\n', '              {t("documents.editBtn")}\n')
content = content.replace('              Xóa\n', '              {t("documents.deleteBtn")}\n')

content = content.replace(
    'title={activeSubTab === \'private\' ? "Xóa tài liệu?" : "Đề xuất xóa tài liệu?"}',
    'title={activeSubTab === \'private\' ? t("documents.deleteModalTitle") : t("documents.suggestDeleteTitle")}'
)
content = content.replace(
    'description={activeSubTab === \'private\' ? "Hành động này sẽ xóa vĩnh viễn tài liệu cá nhân này khỏi thiết bị." : "Bạn đang gửi đề xuất xóa tài liệu này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."}',
    'description={activeSubTab === \'private\' ? t("documents.deleteModalDesc") : t("documents.suggestDeleteDesc")}'
)
content = content.replace(
    'confirmLabel={activeSubTab === \'private\' ? "Xóa" : "Đề xuất xóa"}',
    'confirmLabel={activeSubTab === \'private\' ? t("documents.deleteBtn") : t("share.suggestDelete")}'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed SharedDocumentsSection")
