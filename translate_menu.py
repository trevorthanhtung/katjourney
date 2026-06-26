import json
import os

translations = {
    "vi": {
        "menuEdit": "Sửa",
        "menuDelete": "Xóa",
        "deleteConfirmTitle": "Xóa thành viên này?",
        "deleteConfirmWarning": "Thành viên này đang liên quan đến chi phí hoặc phân công. Hãy kiểm tra trước khi xóa.",
        "deleteConfirmDesc1": "sẽ không còn xuất hiện trong danh sách chuyến đi. Các dữ liệu liên quan như chi phí hoặc phân công có thể cần được kiểm tra lại.",
        "toastDeletedMember": "Đã xóa thành viên"
    },
    "en": {
        "menuEdit": "Edit",
        "menuDelete": "Delete",
        "deleteConfirmTitle": "Delete this member?",
        "deleteConfirmWarning": "This member is linked to expenses or tasks. Please verify before deleting.",
        "deleteConfirmDesc1": "will no longer appear in the trip. Related data like expenses or tasks may need to be checked.",
        "toastDeletedMember": "Member deleted"
    },
    "ja": {
        "menuEdit": "編集",
        "menuDelete": "削除",
        "deleteConfirmTitle": "このメンバーを削除しますか？",
        "deleteConfirmWarning": "このメンバーは費用またはタスクに関連付けられています。削除する前に確認してください。",
        "deleteConfirmDesc1": "は旅行に表示されなくなります。費用やタスクなどの関連データを確認する必要がある場合があります。",
        "toastDeletedMember": "メンバーを削除しました"
    },
    "ko": {
        "menuEdit": "편집",
        "menuDelete": "삭제",
        "deleteConfirmTitle": "이 멤버를 삭제하시겠습니까?",
        "deleteConfirmWarning": "이 멤버는 비용 또는 할 일과 연결되어 있습니다. 삭제하기 전에 확인하세요.",
        "deleteConfirmDesc1": "여행에서 더 이상 표시되지 않습니다. 비용 또는 할 일과 같은 관련 데이터를 확인해야 할 수 있습니다.",
        "toastDeletedMember": "멤버가 삭제되었습니다"
    },
    "zh": {
        "menuEdit": "编辑",
        "menuDelete": "删除",
        "deleteConfirmTitle": "删除此成员？",
        "deleteConfirmWarning": "此成员与费用或任务相关联。请在删除前进行验证。",
        "deleteConfirmDesc1": "将不再出现在行程中。可能需要检查费用或任务等相关数据。",
        "toastDeletedMember": "已删除成员"
    },
    "th": {
        "menuEdit": "แก้ไข",
        "menuDelete": "ลบ",
        "deleteConfirmTitle": "ลบสมาชิกนี้หรือไม่?",
        "deleteConfirmWarning": "สมาชิกนี้เชื่อมโยงกับค่าใช้จ่ายหรืองาน กรุณาตรวจสอบก่อนลบ",
        "deleteConfirmDesc1": "จะไม่ปรากฏในการเดินทางอีกต่อไป อาจต้องตรวจสอบข้อมูลที่เกี่ยวข้อง เช่น ค่าใช้จ่ายหรืองาน",
        "toastDeletedMember": "ลบสมาชิกแล้ว"
    },
    "fr": {
        "menuEdit": "Modifier",
        "menuDelete": "Supprimer",
        "deleteConfirmTitle": "Supprimer ce membre ?",
        "deleteConfirmWarning": "Ce membre est lié à des dépenses ou des tâches. Veuillez vérifier avant de supprimer.",
        "deleteConfirmDesc1": "n'apparaîtra plus dans le voyage. Les données liées comme les dépenses ou les tâches peuvent nécessiter une vérification.",
        "toastDeletedMember": "Membre supprimé"
    },
    "es": {
        "menuEdit": "Editar",
        "menuDelete": "Eliminar",
        "deleteConfirmTitle": "¿Eliminar este miembro?",
        "deleteConfirmWarning": "Este miembro está vinculado a gastos o tareas. Verifique antes de eliminar.",
        "deleteConfirmDesc1": "ya no aparecerá en el viaje. Puede ser necesario revisar datos relacionados como gastos o tareas.",
        "toastDeletedMember": "Miembro eliminado"
    },
    "de": {
        "menuEdit": "Bearbeiten",
        "menuDelete": "Löschen",
        "deleteConfirmTitle": "Dieses Mitglied löschen?",
        "deleteConfirmWarning": "Dieses Mitglied ist mit Ausgaben oder Aufgaben verknüpft. Bitte vor dem Löschen prüfen.",
        "deleteConfirmDesc1": "wird nicht mehr in der Reise angezeigt. Verknüpfte Daten wie Ausgaben oder Aufgaben müssen möglicherweise überprüft werden.",
        "toastDeletedMember": "Mitglied gelöscht"
    },
    "it": {
        "menuEdit": "Modifica",
        "menuDelete": "Elimina",
        "deleteConfirmTitle": "Eliminare questo membro?",
        "deleteConfirmWarning": "Questo membro è collegato a spese o compiti. Verifica prima di eliminare.",
        "deleteConfirmDesc1": "non apparirà più nel viaggio. Potrebbe essere necessario controllare dati correlati come spese o compiti.",
        "toastDeletedMember": "Membro eliminato"
    },
    "pt": {
        "menuEdit": "Editar",
        "menuDelete": "Excluir",
        "deleteConfirmTitle": "Excluir este membro?",
        "deleteConfirmWarning": "Este membro está vinculado a despesas ou tarefas. Verifique antes de excluir.",
        "deleteConfirmDesc1": "não aparecerá mais na viagem. Pode ser necessário verificar dados relacionados, como despesas ou tarefas.",
        "toastDeletedMember": "Membro excluído"
    },
    "id": {
        "menuEdit": "Edit",
        "menuDelete": "Hapus",
        "deleteConfirmTitle": "Hapus anggota ini?",
        "deleteConfirmWarning": "Anggota ini tertaut dengan pengeluaran atau tugas. Harap verifikasi sebelum menghapus.",
        "deleteConfirmDesc1": "tidak akan muncul lagi dalam perjalanan. Data terkait seperti pengeluaran atau tugas mungkin perlu diperiksa.",
        "toastDeletedMember": "Anggota dihapus"
    }
}

def update_locales():
    for lang, trans in translations.items():
        filepath = f"src/locales/{lang}.json"
        if not os.path.exists(filepath):
            continue
            
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        if "members" not in data:
            data["members"] = {}
            
        for key, val in trans.items():
            data["members"][key] = val
                
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Updated {filepath}")

if __name__ == "__main__":
    update_locales()
