import json
import os

locales_dir = 'src/locales'
translations = {
    "vi": {
        "share": {
            "suggestEditExpenseTitle": "Đề xuất sửa chi phí",
            "suggestAddExpenseTitle": "Đề xuất thêm chi phí",
            "suggestDeleteExpenseTitle": "Đề xuất xóa khoản chi?",
            "suggestDeleteExpenseDesc": "Bạn đang gửi đề xuất xóa khoản chi này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn.",
            "suggestLabel": "Đề xuất",
            "updatedDirectly": "Đã cập nhật trực tiếp!",
            "suggestSent": "Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi."
        }
    },
    "en": {
        "share": {
            "suggestEditExpenseTitle": "Suggest Editing Expense",
            "suggestAddExpenseTitle": "Suggest Adding Expense",
            "suggestDeleteExpenseTitle": "Suggest Deleting Expense?",
            "suggestDeleteExpenseDesc": "You are proposing to delete this expense. The trip owner will review your proposal.",
            "suggestLabel": "Suggest",
            "updatedDirectly": "Updated directly!",
            "suggestSent": "Suggestion sent. The trip owner will review it."
        }
    },
    "es": {
        "share": {
            "suggestEditExpenseTitle": "Sugerir editar gasto",
            "suggestAddExpenseTitle": "Sugerir agregar gasto",
            "suggestDeleteExpenseTitle": "¿Sugerir eliminar gasto?",
            "suggestDeleteExpenseDesc": "Estás proponiendo eliminar este gasto. El organizador revisará tu propuesta.",
            "suggestLabel": "Sugerir",
            "updatedDirectly": "¡Actualizado directamente!",
            "suggestSent": "Sugerencia enviada. El organizador la revisará."
        }
    },
    "fr": {
        "share": {
            "suggestEditExpenseTitle": "Suggérer la modification de la dépense",
            "suggestAddExpenseTitle": "Suggérer l'ajout d'une dépense",
            "suggestDeleteExpenseTitle": "Suggérer la suppression de la dépense ?",
            "suggestDeleteExpenseDesc": "Vous proposez de supprimer cette dépense. L'organisateur examinera votre proposition.",
            "suggestLabel": "Suggérer",
            "updatedDirectly": "Mis à jour directement !",
            "suggestSent": "Suggestion envoyée. L'organisateur l'examinera."
        }
    },
    "de": {
        "share": {
            "suggestEditExpenseTitle": "Ausgabenbearbeitung vorschlagen",
            "suggestAddExpenseTitle": "Ausgabenzusatz vorschlagen",
            "suggestDeleteExpenseTitle": "Ausgabenlöschung vorschlagen?",
            "suggestDeleteExpenseDesc": "Sie schlagen vor, diese Ausgabe zu löschen. Der Reiseveranstalter wird Ihren Vorschlag prüfen.",
            "suggestLabel": "Vorschlagen",
            "updatedDirectly": "Direkt aktualisiert!",
            "suggestSent": "Vorschlag gesendet. Der Reiseveranstalter wird ihn prüfen."
        }
    },
    "it": {
        "share": {
            "suggestEditExpenseTitle": "Suggerisci modifica spesa",
            "suggestAddExpenseTitle": "Suggerisci aggiunta spesa",
            "suggestDeleteExpenseTitle": "Suggerire eliminazione spesa?",
            "suggestDeleteExpenseDesc": "Stai proponendo di eliminare questa spesa. L'organizzatore esaminerà la tua proposta.",
            "suggestLabel": "Suggerisci",
            "updatedDirectly": "Aggiornato direttamente!",
            "suggestSent": "Suggerimento inviato. L'organizzatore lo esaminerà."
        }
    },
    "pt": {
        "share": {
            "suggestEditExpenseTitle": "Sugerir edição de despesa",
            "suggestAddExpenseTitle": "Sugerir adição de despesa",
            "suggestDeleteExpenseTitle": "Sugerir exclusão de despesa?",
            "suggestDeleteExpenseDesc": "Você está propondo excluir esta despesa. O organizador da viagem analisará sua proposta.",
            "suggestLabel": "Sugerir",
            "updatedDirectly": "Atualizado diretamente!",
            "suggestSent": "Sugestão enviada. O organizador irá analisá-la."
        }
    },
    "id": {
        "share": {
            "suggestEditExpenseTitle": "Sarankan Edit Pengeluaran",
            "suggestAddExpenseTitle": "Sarankan Tambah Pengeluaran",
            "suggestDeleteExpenseTitle": "Sarankan Hapus Pengeluaran?",
            "suggestDeleteExpenseDesc": "Anda mengusulkan untuk menghapus pengeluaran ini. Pemilik perjalanan akan meninjau usulan Anda.",
            "suggestLabel": "Sarankan",
            "updatedDirectly": "Langsung diperbarui!",
            "suggestSent": "Saran dikirim. Pemilik perjalanan akan meninjaunya."
        }
    },
    "ja": {
        "share": {
            "suggestEditExpenseTitle": "費用の編集を提案",
            "suggestAddExpenseTitle": "費用の追加を提案",
            "suggestDeleteExpenseTitle": "費用の削除を提案しますか？",
            "suggestDeleteExpenseDesc": "この費用の削除を提案しています。旅行のオーナーがあなたの提案を確認します。",
            "suggestLabel": "提案",
            "updatedDirectly": "直接更新されました！",
            "suggestSent": "提案を送信しました。旅行のオーナーが確認します。"
        }
    },
    "ko": {
        "share": {
            "suggestEditExpenseTitle": "비용 편집 제안",
            "suggestAddExpenseTitle": "비용 추가 제안",
            "suggestDeleteExpenseTitle": "비용 삭제를 제안하시겠습니까?",
            "suggestDeleteExpenseDesc": "이 비용을 삭제하도록 제안하고 있습니다. 여행 주최자가 제안을 검토합니다.",
            "suggestLabel": "제안",
            "updatedDirectly": "직접 업데이트되었습니다!",
            "suggestSent": "제안이 전송되었습니다. 여행 주최자가 검토합니다."
        }
    },
    "th": {
        "share": {
            "suggestEditExpenseTitle": "เสนอแก้ไขค่าใช้จ่าย",
            "suggestAddExpenseTitle": "เสนอเพิ่มค่าใช้จ่าย",
            "suggestDeleteExpenseTitle": "เสนอให้ลบค่าใช้จ่าย?",
            "suggestDeleteExpenseDesc": "คุณกำลังเสนอให้ลบค่าใช้จ่ายนี้ เจ้าของการเดินทางจะตรวจสอบข้อเสนอของคุณ",
            "suggestLabel": "เสนอ",
            "updatedDirectly": "อัปเดตโดยตรงแล้ว!",
            "suggestSent": "ส่งข้อเสนอแล้ว เจ้าของการเดินทางจะตรวจสอบ"
        }
    },
    "zh": {
        "share": {
            "suggestEditExpenseTitle": "建议编辑费用",
            "suggestAddExpenseTitle": "建议添加费用",
            "suggestDeleteExpenseTitle": "建议删除费用？",
            "suggestDeleteExpenseDesc": "您正在建议删除此费用。行程创建者将审核您的建议。",
            "suggestLabel": "建议",
            "updatedDirectly": "已直接更新！",
            "suggestSent": "建议已发送。行程创建者将进行审核。"
        }
    }
}

for lang, trans in translations.items():
    filepath = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "share" not in data:
            data["share"] = {}
        data["share"].update(trans["share"])
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


file_path = 'src/features/share/components/SharedExpensesSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace hardcoded strings in SharedExpensesSection
content = content.replace("isDirectEdit ? 'Đã cập nhật trực tiếp!' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.'", 'isDirectEdit ? t("share.updatedDirectly") : t("share.suggestSent")')
content = content.replace('{isDirectEdit ? "Thêm khoản chi" : "Đề xuất thêm"}', '{isDirectEdit ? t("expenses.addExpense") : t("share.suggestAdd")}')
content = content.replace('{isDirectEdit ? "Sửa chi phí" : "Đề xuất sửa"}', '{isDirectEdit ? t("expenses.editExpense") : t("share.suggestEdit")}')
content = content.replace('{isDirectEdit ? "Xóa chi phí" : "Đề xuất xóa"}', '{isDirectEdit ? t("expenses.deleteConfirm") : t("share.suggestDelete")}')

content = content.replace('title={isDirectEdit ? (editingId ? "Sửa chi phí" : "Thêm chi phí") : (editingId ? "Đề xuất sửa chi phí" : "Đề xuất thêm chi phí")}', 'title={isDirectEdit ? (editingId ? t("expenses.editExpense") : t("expenses.addExpense")) : (editingId ? t("share.suggestEditExpenseTitle") : t("share.suggestAddExpenseTitle"))}')
content = content.replace('{isSubmitting ? "Đang lưu..." : isDirectEdit ? (editingId ? "Lưu" : "Thêm") : "Đề xuất"}', '{isSubmitting ? t("expenses.savingNew") : isDirectEdit ? (editingId ? t("expenses.save") : t("expenses.add")) : t("share.suggestLabel")}')

content = content.replace(' Tham gia ({', ' {t("expenses.participate")} ({')
content = content.replace('Tham gia ({', '{t("expenses.participate")} ({')

content = content.replace('title={isDirectEdit ? "Xóa khoản chi?" : "Đề xuất xóa khoản chi?"}', 'title={isDirectEdit ? t("expenses.deleteTitle") : t("share.suggestDeleteExpenseTitle")}')
content = content.replace('description={isDirectEdit ? "Bạn có chắc chắn muốn xóa khoản chi này? Hành động này không thể hoàn tác." : "Bạn đang gửi đề xuất xóa khoản chi này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."}', 'description={isDirectEdit ? t("expenses.deleteDesc") : t("share.suggestDeleteExpenseDesc")}')
content = content.replace('confirmLabel={isDirectEdit ? "Xóa" : "Đề xuất xóa"}', 'confirmLabel={isDirectEdit ? t("expenses.delete") : t("share.suggestDelete")}')

# Write the updated content back to the file
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed SharedExpensesSection")
