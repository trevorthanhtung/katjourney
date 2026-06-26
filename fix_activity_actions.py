import json
import os

locales_dir = 'src/locales'
translations = {
    "vi": {
        "suggestDelete": "Đề xuất xóa",
        "proposeDeleteActivityTitle": "Đề xuất xóa hoạt động?",
        "proposeDeleteActivityDesc": "Bạn đang gửi đề xuất xóa hoạt động này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn.",
        "deleting": "Đang xóa...",
        "saving": "Đang lưu..."
    },
    "en": {
        "suggestDelete": "Suggest delete",
        "proposeDeleteActivityTitle": "Propose deleting activity?",
        "proposeDeleteActivityDesc": "You are proposing to delete this activity. The trip owner will review your proposal.",
        "deleting": "Deleting...",
        "saving": "Saving..."
    },
    "fr": {
        "suggestDelete": "Suggérer de supprimer",
        "proposeDeleteActivityTitle": "Proposer de supprimer l'activité ?",
        "proposeDeleteActivityDesc": "Vous proposez de supprimer cette activité. Le propriétaire du voyage examinera votre proposition.",
        "deleting": "Suppression en cours...",
        "saving": "Enregistrement en cours..."
    },
    "es": {
        "suggestDelete": "Sugerir eliminar",
        "proposeDeleteActivityTitle": "¿Proponer eliminar la actividad?",
        "proposeDeleteActivityDesc": "Estás proponiendo eliminar esta actividad. El propietario del viaje revisará tu propuesta.",
        "deleting": "Eliminando...",
        "saving": "Guardando..."
    },
    "de": {
        "suggestDelete": "Löschen vorschlagen",
        "proposeDeleteActivityTitle": "Löschen der Aktivität vorschlagen?",
        "proposeDeleteActivityDesc": "Du schlägst vor, diese Aktivität zu löschen. Der Reiseveranstalter wird deinen Vorschlag überprüfen.",
        "deleting": "Wird gelöscht...",
        "saving": "Wird gespeichert..."
    },
    "it": {
        "suggestDelete": "Suggerisci eliminazione",
        "proposeDeleteActivityTitle": "Proporre l'eliminazione dell'attività?",
        "proposeDeleteActivityDesc": "Stai proponendo di eliminare questa attività. Il proprietario del viaggio esaminerà la tua proposta.",
        "deleting": "Eliminazione in corso...",
        "saving": "Salvataggio in corso..."
    },
    "pt": {
        "suggestDelete": "Sugerir exclusão",
        "proposeDeleteActivityTitle": "Propor a exclusão da atividade?",
        "proposeDeleteActivityDesc": "Você está propondo excluir esta atividade. O proprietário da viagem analisará sua proposta.",
        "deleting": "Excluindo...",
        "saving": "Salvando..."
    },
    "id": {
        "suggestDelete": "Sarankan hapus",
        "proposeDeleteActivityTitle": "Usulkan penghapusan aktivitas?",
        "proposeDeleteActivityDesc": "Anda mengusulkan untuk menghapus aktivitas ini. Pemilik perjalanan akan meninjau usulan Anda.",
        "deleting": "Menghapus...",
        "saving": "Menyimpan..."
    },
    "ja": {
        "suggestDelete": "削除を提案",
        "proposeDeleteActivityTitle": "アクティビティの削除を提案しますか？",
        "proposeDeleteActivityDesc": "このアクティビティの削除を提案しています。旅行のオーナーがあなたの提案を確認します。",
        "deleting": "削除中...",
        "saving": "保存中..."
    },
    "ko": {
        "suggestDelete": "삭제 제안",
        "proposeDeleteActivityTitle": "활동 삭제를 제안하시겠습니까?",
        "proposeDeleteActivityDesc": "이 활동을 삭제하도록 제안하고 있습니다. 여행 주최자가 제안을 검토합니다.",
        "deleting": "삭제 중...",
        "saving": "저장 중..."
    },
    "th": {
        "suggestDelete": "เสนอให้ลบ",
        "proposeDeleteActivityTitle": "เสนอให้ลบกิจกรรม?",
        "proposeDeleteActivityDesc": "คุณกำลังเสนอให้ลบกิจกรรมนี้ เจ้าของการเดินทางจะตรวจสอบข้อเสนอของคุณ",
        "deleting": "กำลังลบ...",
        "saving": "กำลังบันทึก..."
    },
    "zh": {
        "suggestDelete": "建议删除",
        "proposeDeleteActivityTitle": "建议删除活动？",
        "proposeDeleteActivityDesc": "您正在建议删除此活动。行程创建者将审核您的建议。",
        "deleting": "正在删除...",
        "saving": "正在保存..."
    }
}

for lang, trans in translations.items():
    filepath = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "share" not in data:
            data["share"] = {}
        data["share"].update(trans)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated translations")

file_path = 'src/features/share/components/SharedActivitiesSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('{isDirectEdit ? "Sửa" : "Đề xuất sửa"}', '{isDirectEdit ? t("timeline.editBtn") : t("share.suggestEdit")}')
content = content.replace('{isDirectEdit ? "Xóa" : "Đề xuất xóa"}', '{isDirectEdit ? t("share.delete") : t("share.suggestDelete")}')
content = content.replace('title="Xóa hoạt động này"', 'title={t("timeline.deleteThisActivity")}')
content = content.replace('title={isDirectEdit ? "Xóa hoạt động?" : "Đề xuất xóa hoạt động?"}', 'title={isDirectEdit ? t("timeline.deleteActivityTitle") : t("share.proposeDeleteActivityTitle")}')
content = content.replace('description={isDirectEdit ? "Bạn có chắc chắn muốn xóa hoạt động này? Hành động này không thể hoàn tác." : "Bạn đang gửi đề xuất xóa hoạt động này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."}', 'description={isDirectEdit ? t("timeline.deleteActivityDesc") : t("share.proposeDeleteActivityDesc")}')
content = content.replace('confirmLabel={isDirectEdit ? "Xóa" : "Đề xuất xóa"}', 'confirmLabel={isDirectEdit ? t("timeline.deleteActivityConfirm") : t("share.suggestDelete")}')

content = content.replace("'Đang xóa...' : 'Đề xuất xóa'", "t('share.deleting') : t('share.suggestDelete')")
content = content.replace("'Đang lưu...' : 'Đề xuất sửa'", "t('share.saving') : t('share.suggestEdit')")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated SharedActivitiesSection")
