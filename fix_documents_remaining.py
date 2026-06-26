import os

file_path = 'src/features/share/components/SharedDocumentsSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('placeholder="VD: Vé máy bay khứ hồi, mã đặt phòng khách sạn..."', 'placeholder={t("documents.inputTitlePlaceholder")}')
content = content.replace('placeholder="VD: PNR ABC123, mã phòng, số vé..."', 'placeholder={t("documents.inputCodePlaceholder")}')
content = content.replace('label="Ngày liên quan"', 'label={t("documents.inputDateLabel")}')
content = content.replace('label="Đường dẫn liên quan"', 'label={t("documents.inputLinkLabel")}')
content = content.replace('placeholder="VD: Link vé điện tử, bản đồ, tệp đặt phòng..."', 'placeholder={t("documents.inputLinkPlaceholder")}')
content = content.replace('label="Ghi chú"', 'label={t("documents.inputNoteLabel")}')
content = content.replace('placeholder="VD: Giờ nhận phòng, hành lý, số điện thoại liên hệ..."', 'placeholder={t("documents.inputNotePlaceholder")}')
content = content.replace('Nhấn để tải ảnh lên', '{t("documents.uploadBtn")}')
content = content.replace('Chấp nhận PNG, JPG, WEBP', '{t("documents.uploadAcceptedFormats")}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed remaining strings in SharedDocumentsSection")
