import json
import os

translations = {
    "ko": {
        "assigneeLabel": "담당자",
        "noMembersTitle": "동행자 없음",
        "noMembersDesc": "수하물을 할당할 동행자가 아직 공유되지 않았습니다.",
        "priorityLabel": "중요도",
        "priorityNormal": "보통",
        "priorityImportant": "중요",
        "priorityRequired": "필수",
        "noteLabel": "메모",
        "cancel": "취소",
        "addItemConfirm": "수하물에 추가",
        "saveItem": "항목 저장"
    },
    "zh": {
        "assigneeLabel": "负责人",
        "noMembersTitle": "无同行者",
        "noMembersDesc": "尚未分享同行者以分配行李。",
        "priorityLabel": "重要程度",
        "priorityNormal": "普通",
        "priorityImportant": "重要",
        "priorityRequired": "必带",
        "noteLabel": "备注",
        "cancel": "取消",
        "addItemConfirm": "添加到行李",
        "saveItem": "保存物品"
    },
    "ja": {
        "assigneeLabel": "担当者",
        "noMembersTitle": "同行者なし",
        "noMembersDesc": "荷物を割り当てる同行者がまだ共有されていません。",
        "priorityLabel": "重要度",
        "priorityNormal": "普通",
        "priorityImportant": "重要",
        "priorityRequired": "必須",
        "noteLabel": "メモ",
        "cancel": "キャンセル",
        "addItemConfirm": "荷物に追加",
        "saveItem": "アイテムを保存"
    },
    "en": {
        "assigneeLabel": "Assignee",
        "noMembersTitle": "No companions",
        "noMembersDesc": "Companions haven't been shared yet to assign items.",
        "priorityLabel": "Priority",
        "priorityNormal": "Normal",
        "priorityImportant": "Important",
        "priorityRequired": "Required",
        "noteLabel": "Note",
        "cancel": "Cancel",
        "addItemConfirm": "Add to packing list",
        "saveItem": "Save item"
    },
    "es": {
        "assigneeLabel": "Responsable",
        "noMembersTitle": "Sin acompañantes",
        "noMembersDesc": "Aún no se han compartido acompañantes para asignar equipaje.",
        "priorityLabel": "Prioridad",
        "priorityNormal": "Normal",
        "priorityImportant": "Importante",
        "priorityRequired": "Obligatorio",
        "noteLabel": "Nota",
        "cancel": "Cancelar",
        "addItemConfirm": "Añadir al equipaje",
        "saveItem": "Guardar artículo"
    },
    "fr": {
        "assigneeLabel": "Responsable",
        "noMembersTitle": "Aucun compagnon",
        "noMembersDesc": "Les compagnons n'ont pas encore été partagés pour assigner des bagages.",
        "priorityLabel": "Priorité",
        "priorityNormal": "Normal",
        "priorityImportant": "Important",
        "priorityRequired": "Obligatoire",
        "noteLabel": "Note",
        "cancel": "Annuler",
        "addItemConfirm": "Ajouter aux bagages",
        "saveItem": "Enregistrer l'article"
    },
    "de": {
        "assigneeLabel": "Verantwortlich",
        "noMembersTitle": "Keine Begleiter",
        "noMembersDesc": "Es wurden noch keine Begleiter geteilt, um Gepäck zuzuweisen.",
        "priorityLabel": "Priorität",
        "priorityNormal": "Normal",
        "priorityImportant": "Wichtig",
        "priorityRequired": "Erforderlich",
        "noteLabel": "Notiz",
        "cancel": "Abbrechen",
        "addItemConfirm": "Zum Gepäck hinzufügen",
        "saveItem": "Artikel speichern"
    },
    "it": {
        "assigneeLabel": "Assegnatario",
        "noMembersTitle": "Nessun compagno",
        "noMembersDesc": "I compagni non sono stati ancora condivisi per assegnare i bagagli.",
        "priorityLabel": "Priorità",
        "priorityNormal": "Normale",
        "priorityImportant": "Importante",
        "priorityRequired": "Obbligatorio",
        "noteLabel": "Nota",
        "cancel": "Annulla",
        "addItemConfirm": "Aggiungi al bagaglio",
        "saveItem": "Salva articolo"
    },
    "pt": {
        "assigneeLabel": "Responsável",
        "noMembersTitle": "Sem acompanhantes",
        "noMembersDesc": "Acompanhantes ainda não foram compartilhados para atribuir bagagem.",
        "priorityLabel": "Prioridade",
        "priorityNormal": "Normal",
        "priorityImportant": "Importante",
        "priorityRequired": "Obrigatório",
        "noteLabel": "Nota",
        "cancel": "Cancelar",
        "addItemConfirm": "Adicionar à bagagem",
        "saveItem": "Salvar item"
    },
    "th": {
        "assigneeLabel": "ผู้รับผิดชอบ",
        "noMembersTitle": "ไม่มีผู้ร่วมเดินทาง",
        "noMembersDesc": "ยังไม่ได้แบ่งปันผู้ร่วมเดินทางเพื่อมอบหมายสัมภาระ",
        "priorityLabel": "ความสำคัญ",
        "priorityNormal": "ปกติ",
        "priorityImportant": "สำคัญ",
        "priorityRequired": "จำเป็น",
        "noteLabel": "บันทึกย่อ",
        "cancel": "ยกเลิก",
        "addItemConfirm": "เพิ่มลงในสัมภาระ",
        "saveItem": "บันทึกสิ่งของ"
    },
    "id": {
        "assigneeLabel": "Penanggung jawab",
        "noMembersTitle": "Tidak ada pendamping",
        "noMembersDesc": "Pendamping belum dibagikan untuk menetapkan bagasi.",
        "priorityLabel": "Prioritas",
        "priorityNormal": "Normal",
        "priorityImportant": "Penting",
        "priorityRequired": "Wajib",
        "noteLabel": "Catatan",
        "cancel": "Batal",
        "addItemConfirm": "Tambahkan ke bagasi",
        "saveItem": "Simpan barang"
    },
    "vi": {
        "assigneeLabel": "Người phụ trách",
        "noMembersTitle": "Chưa có người đồng hành",
        "noMembersDesc": "Người đồng hành chưa được chia sẻ để phân công hành lý.",
        "priorityLabel": "Mức độ cần thiết",
        "priorityNormal": "Thường",
        "priorityImportant": "Quan trọng",
        "priorityRequired": "Bắt buộc",
        "noteLabel": "Ghi chú",
        "cancel": "Hủy",
        "addItemConfirm": "Thêm vào hành lý",
        "saveItem": "Lưu món đồ"
    }
}

for lang, data_dict in translations.items():
    filepath = f"src/locales/{lang}.json"
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if "packing" not in data:
        data["packing"] = {}
        
    for k, v in data_dict.items():
        data["packing"][k] = v

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {filepath}")
