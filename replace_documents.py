import re

filepath = "src/features/more/TravelDocumentsSection.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Make sure useTranslation is imported and initialized if not already
if "useTranslation" not in content:
    content = content.replace(
        'import { useLiveQuery } from "dexie-react-hooks";',
        'import { useLiveQuery } from "dexie-react-hooks";\nimport { useTranslation } from "react-i18next";'
    )

if "const { t } = useTranslation();" not in content:
    # Need to insert it into DocumentForm, DocumentCard, and TravelDocumentsSection
    content = content.replace(
        'function DocumentForm({ tripId, editing, isOpen, onClose, onShowToast }: DocumentFormProps) {',
        'function DocumentForm({ tripId, editing, isOpen, onClose, onShowToast }: DocumentFormProps) {\n  const { t } = useTranslation();'
    )
    content = content.replace(
        'function DocumentCard({ ',
        'function DocumentCard({ '
    )
    # Actually wait, DocumentCard arguments are spread across multiple lines. Let's do it right after function declaration opening block:
    content = content.replace(
        '  isReadOnly?: boolean;\n}) {',
        '  isReadOnly?: boolean;\n}) {\n  const { t } = useTranslation();'
    )
    content = content.replace(
        '  isReadOnly?: boolean;\n}) {\n  const documents =',
        '  isReadOnly?: boolean;\n}) {\n  const { t } = useTranslation();\n  const documents ='
    )

replacements = {
    # typeOptions array
    '{ value: "ticket", label: "Vé di chuyển" }': '{ value: "ticket", label: "Vé di chuyển" }', # We can't translate typeOptions here easily as it's outside component. Actually we don't need it if we replace the labels in Select component dynamically. But the Select component uses `options` and `labels`.

    # Let's fix the typeOptions, typeLabels inside the component instead, or use a hook to get labels.
    # Fortunately, they are just used in the UI. 
    # In DocumentForm: labels={typeLabels} -> labels={{ ticket: t("documents.typeTicket"), hotel: t("documents.typeHotel"), booking: t("documents.typeBooking"), document: t("documents.typeOther"), contact: t("documents.typeContact"), map: t("documents.typeMap"), other: t("documents.typeOther") }}
    
    'labels={typeLabels}': 'labels={{ ticket: t("documents.typeTicket"), hotel: t("documents.typeHotel"), booking: t("documents.typeBooking"), document: t("documents.typeOther"), contact: t("documents.typeContact"), map: t("documents.typeMap"), other: t("documents.typeOther") }}',
    
    # In filter buttons:
    # {typeOptions.map(opt => { ... {opt.label} ... })}
    # Let's map opt.label inside the button:
    '{opt.label}': '{t("documents.type" + (opt.value.charAt(0).toUpperCase() + opt.value.slice(1)))}',
    
    # In DocumentCard:
    '{typeLabels[doc.type || "other"].split(" / ")[0]}': '{t("documents.type" + ((doc.type || "other").charAt(0).toUpperCase() + (doc.type || "other").slice(1))).split(" / ")[0]}',

    # Form placeholders
    'title={editing ? "Sửa giấy tờ & đặt chỗ" : "Thêm giấy tờ & đặt chỗ"}': 'title={editing ? t("documents.editDocumentTitle") : t("documents.addDocumentTitle")}',
    '"Vui lòng nhập tiêu đề."': 't("documents.titleRequired")',
    '"Đã cập nhật giấy tờ"': 't("documents.toastUpdated")',
    '"Đã lưu giấy tờ mới"': 't("documents.toastSaved")',
    '"Có lỗi xảy ra khi lưu tài liệu"': 't("documents.toastError")',
    'label="Tên mục *"': 'label={t("documents.inputTitleLabel")}',
    'placeholder="VD: Vé máy bay khứ hồi, mã đặt phòng khách sạn..."': 'placeholder={t("documents.inputTitlePlaceholder")}',
    'label="Phân loại"': 'label={t("documents.inputTypeLabel")}',
    'label="Quyền chia sẻ"': 'label={t("documents.inputPrivacyLabel")}',
    '"Riêng tư (Chỉ mình tôi)"': 't("documents.privacyPrivate")',
    '"Chia sẻ với nhóm"': 't("documents.privacyGroup")',
    'label="Mã / thông tin đặt chỗ"': 'label={t("documents.inputCodeLabel")}',
    'placeholder="VD: PNR ABC123, mã phòng, số vé..."': 'placeholder={t("documents.inputCodePlaceholder")}',
    'Thông tin bổ sung': '{t("documents.advancedInfoLabel")}',
    'label="Ngày liên quan"': 'label={t("documents.inputDateLabel")}',
    'label="Đường dẫn liên quan"': 'label={t("documents.inputLinkLabel")}',
    'placeholder="VD: Link vé điện tử, bản đồ, tệp đặt phòng..."': 'placeholder={t("documents.inputLinkPlaceholder")}',
    'label="Ghi chú"': 'label={t("documents.inputNoteLabel")}',
    'placeholder="VD: Giờ nhận phòng, hành lý, số điện thoại liên hệ..."': 'placeholder={t("documents.inputNotePlaceholder")}',
    'Ảnh đính kèm (Vé/CCCD/...)': '{t("documents.inputAttachmentLabel")}',
    'Nhấn để tải ảnh lên': '{t("documents.uploadBtn")}',
    'Chấp nhận PNG, JPG, WEBP': '{t("documents.uploadAcceptedFormats")}',
    
    # DocumentCard buttons
    'Tùy chọn': '{t("documents.optionsBtn")}',
    'Sửa': '{t("documents.editBtn")}',
    'Xóa': '{t("documents.deleteBtn")}',
    'Mã xác nhận / Code': '{t("documents.codeLabel")}',
    'Sao chép mã': '{t("documents.copyCodeBtn")}',
    'Ngày liên quan:': '{t("documents.relatedDateLabel")}',
    'Ảnh đính kèm': '{t("documents.attachmentLabel")}',
    'Mở liên kết trực tuyến': '{t("documents.openLinkBtn")}',
    
    # Main section UI
    'Giấy tờ & đặt chỗ': '{t("documents.featureTitle")}',
    'Lưu vé, mã đặt chỗ và thông tin quan trọng để tra cứu nhanh khi cần.': '{t("documents.featureDesc")}',
    'Thêm giấy tờ': '{t("documents.addBtn")}',
    'Tất cả': '{t("documents.filterAll")}',
    '"Chưa có giấy tờ nào"': 't("documents.emptyAllTitle")',
    '"Không tìm thấy mục lưu trữ"': 't("documents.emptyFilterTitle")',
    '"Lưu vé, mã đặt chỗ, liên hệ quan trọng hoặc link bản đồ để tra cứu nhanh khi cần."': 't("documents.emptyAllDesc")',
    '"Chọn bộ lọc khác hoặc thêm mới giấy tờ & đặt chỗ thuộc nhóm này."': 't("documents.emptyFilterDesc")',
    
    # Delete modal
    'title="Xóa giấy tờ này?"': 'title={t("documents.deleteModalTitle")}',
    'description="Mục giấy tờ hoặc đặt chỗ này sẽ bị xóa khỏi chuyến đi. Sau khi xóa, không thể hoàn tác."': 'description={t("documents.deleteModalDesc")}',
    'confirmLabel="Xóa giấy tờ"': 'confirmLabel={t("documents.deleteModalConfirm")}',
    '"Đã xóa thành công"': 't("documents.toastDeleted")',
    
    # Missing save btn
    '>Lưu<': '>{t("documents.saveBtn")}<',
    ': "Lưu"}': ': t("documents.saveBtn")}',
    
    # Specific options in array
    'options={["Chia sẻ với nhóm", "Riêng tư (Chỉ mình tôi)"]}': 'options={[t("documents.privacyGroup"), t("documents.privacyPrivate")]}',
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement TravelDocumentsSection complete")
