import re

filepath = "src/features/more/TravelDocumentsSection.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Hooks
if "useTranslation" not in content:
    content = content.replace(
        'import { useLiveQuery } from "dexie-react-hooks";',
        'import { useLiveQuery } from "dexie-react-hooks";\nimport { useTranslation } from "react-i18next";'
    )

if "const { t } = useTranslation();" not in content:
    content = content.replace(
        'function DocumentForm({ tripId, editing, isOpen, onClose, onShowToast }: DocumentFormProps) {',
        'function DocumentForm({ tripId, editing, isOpen, onClose, onShowToast }: DocumentFormProps) {\n  const { t } = useTranslation();'
    )
    content = content.replace(
        '  isReadOnly?: boolean;\n}) {',
        '  isReadOnly?: boolean;\n}) {\n  const { t } = useTranslation();'
    )
    content = content.replace(
        '  isReadOnly?: boolean;\n}) {\n  const documents =',
        '  isReadOnly?: boolean;\n}) {\n  const { t } = useTranslation();\n  const documents ='
    )

replacements = {
    # typeLabels
    'labels={typeLabels}': 'labels={{ ticket: t("documents.typeTicket"), hotel: t("documents.typeHotel"), booking: t("documents.typeBooking"), document: t("documents.typeOther"), contact: t("documents.typeContact"), map: t("documents.typeMap"), other: t("documents.typeOther") }}',
    '{opt.label} ({count})': '{t("documents.type" + (opt.value.charAt(0).toUpperCase() + opt.value.slice(1)))} ({count})',
    '{typeLabels[doc.type || "other"].split(" / ")[0]}': '{t("documents.type" + ((doc.type || "other").charAt(0).toUpperCase() + (doc.type || "other").slice(1))).split(" / ")[0]}',

    # Form placeholders and labels
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
    
    # Save button
    '>Lưu<': '>{t("documents.saveBtn")}<',
    ': "Lưu"}': ': t("documents.saveBtn")}',
    
    # DocumentCard
    'title="Tùy chọn"': 'title={t("documents.optionsBtn")}',
    'Sửa\n                  </button>': '{t("documents.editBtn")}\n                  </button>',
    'Xóa\n                  </button>': '{t("documents.deleteBtn")}\n                  </button>',
    'Mã xác nhận / Code': '{t("documents.codeLabel")}',
    'title="Sao chép mã"': 'title={t("documents.copyCodeBtn")}',
    'Ngày liên quan:': '{t("documents.relatedDateLabel")}',
    'Ảnh đính kèm</p>': '{t("documents.attachmentLabel")}</p>',
    '<span>Mở liên kết trực tuyến</span>': '<span>{t("documents.openLinkBtn")}</span>',
    
    # Main section UI
    'Giấy tờ & đặt chỗ</h2>': '{t("documents.featureTitle")}</h2>',
    'Lưu vé, mã đặt chỗ và thông tin quan trọng để tra cứu nhanh khi cần.</p>': '{t("documents.featureDesc")}</p>',
    '<span>Thêm giấy tờ</span>': '<span>{t("documents.addBtn")}</span>',
    'Tất cả ({documents.length})': '{t("documents.filterAll")} ({documents.length})',
    '"Chưa có giấy tờ nào"': 't("documents.emptyAllTitle")',
    '"Không tìm thấy mục lưu trữ"': 't("documents.emptyFilterTitle")',
    '"Lưu vé, mã đặt chỗ, liên hệ quan trọng hoặc link bản đồ để tra cứu nhanh khi cần."': 't("documents.emptyAllDesc")',
    '"Chọn bộ lọc khác hoặc thêm mới giấy tờ & đặt chỗ thuộc nhóm này."': 't("documents.emptyFilterDesc")',
    
    # Delete modal
    'title="Xóa giấy tờ này?"': 'title={t("documents.deleteModalTitle")}',
    'description="Mục giấy tờ hoặc đặt chỗ này sẽ bị xóa khỏi chuyến đi. Sau khi xóa, không thể hoàn tác."': 'description={t("documents.deleteModalDesc")}',
    'confirmLabel="Xóa giấy tờ"': 'confirmLabel={t("documents.deleteModalConfirm")}',
    '"Đã xóa thành công"': 't("documents.toastDeleted")',
    
    # Options array
    'options={["Chia sẻ với nhóm", "Riêng tư (Chỉ mình tôi)"]}': 'options={[t("documents.privacyGroup"), t("documents.privacyPrivate")]}',
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement TravelDocumentsSection complete")
