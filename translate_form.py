import json
import os

translations = {
    "vi": {
        "isGroupLeader": "Là đại diện nhóm",
        "roleHelpDesc": "Vai trò giúp chia chi phí, chuẩn bị hành lý và ghi chú rõ ràng hơn.",
        "noteLabelShort": "Ghi chú",
        "notePlaceholderDetailed": "VD: Ăn chay, dễ say xe, phụ trách đặt phòng...",
        "willReplace": "Sẽ thay thế {name} làm đại diện",
        "currentLeaderIs": "Đại diện hiện tại là {name}"
    },
    "en": {
        "isGroupLeader": "Is group representative",
        "roleHelpDesc": "Roles help divide costs, manage luggage, and keep clear notes.",
        "noteLabelShort": "Notes",
        "notePlaceholderDetailed": "e.g., Vegetarian, prone to motion sickness...",
        "willReplace": "Will replace {name} as representative",
        "currentLeaderIs": "Current representative is {name}"
    },
    "ja": {
        "isGroupLeader": "グループ代表者",
        "roleHelpDesc": "役割を設定すると費用の分割や荷物の管理がスムーズになります。",
        "noteLabelShort": "メモ",
        "notePlaceholderDetailed": "例：ベジタリアン、乗り物酔いしやすい...",
        "willReplace": "代表者を {name} から変更します",
        "currentLeaderIs": "現在の代表者は {name} です"
    },
    "ko": {
        "isGroupLeader": "그룹 대표",
        "roleHelpDesc": "역할을 지정하면 비용을 나누고 수하물을 관리하는 데 도움이 됩니다.",
        "noteLabelShort": "메모",
        "notePlaceholderDetailed": "예: 채식주의자, 멀미가 심함...",
        "willReplace": "대표를 {name}에서 변경합니다",
        "currentLeaderIs": "현재 대표는 {name}입니다"
    },
    "zh": {
        "isGroupLeader": "是群组代表",
        "roleHelpDesc": "角色有助于分摊费用、管理行李和记录清晰的备注。",
        "noteLabelShort": "备注",
        "notePlaceholderDetailed": "例如：素食主义者，容易晕车...",
        "willReplace": "将取代 {name} 成为代表",
        "currentLeaderIs": "当前代表是 {name}"
    },
    "th": {
        "isGroupLeader": "เป็นตัวแทนกลุ่ม",
        "roleHelpDesc": "บทบาทช่วยแบ่งค่าใช้จ่าย จัดการสัมภาระ และบันทึกย่อให้ชัดเจน",
        "noteLabelShort": "หมายเหตุ",
        "notePlaceholderDetailed": "เช่น ทานมังสวิรัติ, เมารถง่าย...",
        "willReplace": "จะแทนที่ {name} เป็นตัวแทน",
        "currentLeaderIs": "ตัวแทนปัจจุบันคือ {name}"
    },
    "fr": {
        "isGroupLeader": "Est le représentant",
        "roleHelpDesc": "Les rôles aident à partager les coûts et gérer les bagages.",
        "noteLabelShort": "Notes",
        "notePlaceholderDetailed": "Ex: Végétarien, mal des transports...",
        "willReplace": "Remplacera {name} en tant que représentant",
        "currentLeaderIs": "Le représentant actuel est {name}"
    },
    "es": {
        "isGroupLeader": "Es representante",
        "roleHelpDesc": "Los roles ayudan a dividir los gastos y gestionar el equipaje.",
        "noteLabelShort": "Notas",
        "notePlaceholderDetailed": "Ej: Vegetariano, mareos...",
        "willReplace": "Reemplazará a {name} como representante",
        "currentLeaderIs": "El representante actual es {name}"
    },
    "de": {
        "isGroupLeader": "Ist Gruppenvertreter",
        "roleHelpDesc": "Rollen helfen bei der Kostenteilung und Gepäckverwaltung.",
        "noteLabelShort": "Notizen",
        "notePlaceholderDetailed": "z.B. Vegetarier, wird reisekrank...",
        "willReplace": "Ersetzt {name} als Vertreter",
        "currentLeaderIs": "Aktueller Vertreter ist {name}"
    },
    "it": {
        "isGroupLeader": "È il rappresentante",
        "roleHelpDesc": "I ruoli aiutano a dividere le spese e gestire i bagagli.",
        "noteLabelShort": "Note",
        "notePlaceholderDetailed": "Es: Vegetariano, soffre di mal d'auto...",
        "willReplace": "Sostituirà {name} come rappresentante",
        "currentLeaderIs": "L'attuale rappresentante è {name}"
    },
    "pt": {
        "isGroupLeader": "É representante",
        "roleHelpDesc": "As funções ajudam a dividir os custos e gerenciar a bagagem.",
        "noteLabelShort": "Notas",
        "notePlaceholderDetailed": "Ex: Vegetariano, enjoo em viagens...",
        "willReplace": "Substituirá {name} como representante",
        "currentLeaderIs": "O representante atual é {name}"
    },
    "id": {
        "isGroupLeader": "Adalah perwakilan grup",
        "roleHelpDesc": "Peran membantu membagi biaya, mengelola bagasi, dan menjaga catatan tetap jelas.",
        "noteLabelShort": "Catatan",
        "notePlaceholderDetailed": "Cth: Vegetarian, mabuk perjalanan...",
        "willReplace": "Akan menggantikan {name} sebagai perwakilan",
        "currentLeaderIs": "Perwakilan saat ini adalah {name}"
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
