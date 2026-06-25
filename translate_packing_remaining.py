import json
import os

translations = {
    "ko": {
        "deleteTitle": "이 항목을 삭제하시겠습니까?",
        "deleteDesc": "이 항목은 여행 준비 목록에서 삭제됩니다. 이 작업은 취소할 수 없습니다.",
        "deleteConfirm": "항목 삭제",
        "catCount": "{{done}} / {{total}} 항목",
        "toastDeleted": "삭제됨:",
        "statusEmpty": "준비할 항목이 없습니다.",
        "statusRemaining": "준비할 항목이 {{remaining}}개 남았습니다.",
        "itemNameLabel": "항목 이름 *",
        "addItem": "항목 추가",
        "emptyStateDetailed": "항목이 없습니다. 제안을 받아 준비를 시작하세요!",
        "editItem": "항목 편집",
        "itemPlaceholder": "예: 전동 칫솔"
    },
    "zh": {
        "deleteTitle": "删除此物品？",
        "deleteDesc": "此物品将从旅行清单中删除。此操作无法撤销。",
        "deleteConfirm": "删除物品",
        "catCount": "{{done}} / {{total}} 件",
        "toastDeleted": "已删除：",
        "statusEmpty": "暂无待准备物品。",
        "statusRemaining": "还剩 {{remaining}} 件物品待准备。",
        "itemNameLabel": "物品名称 *",
        "addItem": "添加物品",
        "emptyStateDetailed": "暂无物品，获取建议开始准备吧！",
        "editItem": "编辑物品",
        "itemPlaceholder": "例：电动牙刷"
    },
    "ja": {
        "deleteTitle": "このアイテムを削除しますか？",
        "deleteDesc": "このアイテムは旅行リストから削除されます。この操作は元に戻せません。",
        "deleteConfirm": "アイテムを削除",
        "catCount": "{{done}} / {{total}} アイテム",
        "toastDeleted": "削除しました:",
        "statusEmpty": "準備するアイテムはありません。",
        "statusRemaining": "残り {{remaining}} 個のアイテムを準備する必要があります。",
        "itemNameLabel": "アイテム名 *",
        "addItem": "アイテムを追加",
        "emptyStateDetailed": "アイテムがありません。提案を受けて準備を始めましょう！",
        "editItem": "アイテムを編集",
        "itemPlaceholder": "例：電動歯ブラシ"
    },
    "en": {
        "deleteTitle": "Delete this item?",
        "deleteDesc": "This item will be removed from the trip's packing list. This action cannot be undone.",
        "deleteConfirm": "Delete Item",
        "catCount": "{{done}} / {{total}} items",
        "toastDeleted": "Deleted:",
        "statusEmpty": "No items to prepare yet.",
        "statusRemaining": "{{remaining}} items left to prepare.",
        "itemNameLabel": "Item Name *",
        "addItem": "Add item",
        "emptyStateDetailed": "No items yet. Get suggestions to start packing!",
        "editItem": "Edit item",
        "itemPlaceholder": "e.g. Electric toothbrush"
    },
    "es": {
        "deleteTitle": "¿Eliminar este artículo?",
        "deleteDesc": "Este artículo se eliminará de la lista del viaje. Esta acción no se puede deshacer.",
        "deleteConfirm": "Eliminar artículo",
        "catCount": "{{done}} / {{total}} artículos",
        "toastDeleted": "Eliminado:",
        "statusEmpty": "No hay artículos por preparar.",
        "statusRemaining": "Faltan {{remaining}} artículos por preparar.",
        "itemNameLabel": "Nombre del artículo *",
        "addItem": "Añadir artículo",
        "emptyStateDetailed": "No hay artículos. ¡Obtén sugerencias para empezar!",
        "editItem": "Editar artículo",
        "itemPlaceholder": "Ej: Cepillo eléctrico"
    },
    "fr": {
        "deleteTitle": "Supprimer cet article ?",
        "deleteDesc": "Cet article sera supprimé de la liste du voyage. Cette action est irréversible.",
        "deleteConfirm": "Supprimer l'article",
        "catCount": "{{done}} / {{total}} articles",
        "toastDeleted": "Supprimé :",
        "statusEmpty": "Aucun article à préparer.",
        "statusRemaining": "Il reste {{remaining}} articles à préparer.",
        "itemNameLabel": "Nom de l'article *",
        "addItem": "Ajouter un article",
        "emptyStateDetailed": "Aucun article. Obtenez des suggestions pour commencer !",
        "editItem": "Modifier l'article",
        "itemPlaceholder": "Ex : Brosse à dents électrique"
    },
    "de": {
        "deleteTitle": "Diesen Artikel löschen?",
        "deleteDesc": "Dieser Artikel wird von der Packliste entfernt. Diese Aktion kann nicht rückgängig gemacht werden.",
        "deleteConfirm": "Artikel löschen",
        "catCount": "{{done}} / {{total}} Artikel",
        "toastDeleted": "Gelöscht:",
        "statusEmpty": "Noch keine Artikel vorzubereiten.",
        "statusRemaining": "Noch {{remaining}} Artikel vorzubereiten.",
        "itemNameLabel": "Artikelname *",
        "addItem": "Artikel hinzufügen",
        "emptyStateDetailed": "Keine Artikel. Holen Sie sich Vorschläge zum Starten!",
        "editItem": "Artikel bearbeiten",
        "itemPlaceholder": "Z.B. Elektrische Zahnbürste"
    },
    "it": {
        "deleteTitle": "Eliminare questo articolo?",
        "deleteDesc": "Questo articolo verrà rimosso dalla lista. Questa azione non può essere annullata.",
        "deleteConfirm": "Elimina articolo",
        "catCount": "{{done}} / {{total}} articoli",
        "toastDeleted": "Eliminato:",
        "statusEmpty": "Nessun articolo da preparare.",
        "statusRemaining": "{{remaining}} articoli rimasti da preparare.",
        "itemNameLabel": "Nome articolo *",
        "addItem": "Aggiungi articolo",
        "emptyStateDetailed": "Nessun articolo. Ottieni suggerimenti per iniziare!",
        "editItem": "Modifica articolo",
        "itemPlaceholder": "Es: Spazzolino elettrico"
    },
    "pt": {
        "deleteTitle": "Excluir este item?",
        "deleteDesc": "Este item será removido da lista da viagem. Esta ação não pode ser desfeita.",
        "deleteConfirm": "Excluir item",
        "catCount": "{{done}} / {{total}} itens",
        "toastDeleted": "Excluído:",
        "statusEmpty": "Nenhum item a preparar.",
        "statusRemaining": "Faltam {{remaining}} itens a preparar.",
        "itemNameLabel": "Nome do item *",
        "addItem": "Adicionar item",
        "emptyStateDetailed": "Nenhum item. Obtenha sugestões para começar!",
        "editItem": "Editar item",
        "itemPlaceholder": "Ex: Escova elétrica"
    },
    "th": {
        "deleteTitle": "ลบรายการนี้หรือไม่?",
        "deleteDesc": "รายการนี้จะถูกลบออกจากรายการเดินทาง การดำเนินการนี้ไม่สามารถย้อนกลับได้",
        "deleteConfirm": "ลบรายการ",
        "catCount": "{{done}} / {{total}} รายการ",
        "toastDeleted": "ลบแล้ว:",
        "statusEmpty": "ยังไม่มีรายการที่ต้องเตรียม",
        "statusRemaining": "เหลืออีก {{remaining}} รายการที่ต้องเตรียม",
        "itemNameLabel": "ชื่อสิ่งของ *",
        "addItem": "เพิ่มสิ่งของ",
        "emptyStateDetailed": "ยังไม่มีสิ่งของ รับคำแนะนำเพื่อเริ่มจัดกระเป๋า!",
        "editItem": "แก้ไขสิ่งของ",
        "itemPlaceholder": "เช่น แปรงสีฟันไฟฟ้า"
    },
    "id": {
        "deleteTitle": "Hapus barang ini?",
        "deleteDesc": "Barang ini akan dihapus dari daftar. Tindakan ini tidak dapat dibatalkan.",
        "deleteConfirm": "Hapus barang",
        "catCount": "{{done}} / {{total}} barang",
        "toastDeleted": "Dihapus:",
        "statusEmpty": "Belum ada barang untuk disiapkan.",
        "statusRemaining": "Sisa {{remaining}} barang untuk disiapkan.",
        "itemNameLabel": "Nama Barang *",
        "addItem": "Tambah barang",
        "emptyStateDetailed": "Belum ada barang. Dapatkan saran untuk mulai berkemas!",
        "editItem": "Edit barang",
        "itemPlaceholder": "Contoh: Sikat gigi elektrik"
    },
    "vi": {
        "deleteTitle": "Xóa món chuẩn bị này?",
        "deleteDesc": "Món chuẩn bị này sẽ bị xóa khỏi danh sách của chuyến đi. Sau khi xóa, không thể hoàn tác.",
        "deleteConfirm": "Xóa món",
        "catCount": "{{done}} / {{total}} món",
        "toastDeleted": "Đã xóa:",
        "statusEmpty": "Chưa có món cần chuẩn bị.",
        "statusRemaining": "Còn {{remaining}} món cần chuẩn bị.",
        "itemNameLabel": "Tên món cần mang *",
        "addItem": "Thêm món chuẩn bị",
        "emptyStateDetailed": "Chưa có món đồ nào. Nhận gợi ý để bắt đầu chuẩn bị nhé!",
        "editItem": "Sửa món đồ",
        "itemPlaceholder": "VD: Bàn chải điện"
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
