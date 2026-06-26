import json
import os

locales_dir = 'src/locales'
translations = {
    "vi": {
        "itinerary": "Lịch trình",
        "expenses": "Chi phí",
        "members": "Thành viên"
    },
    "en": {
        "itinerary": "Itinerary",
        "expenses": "Expenses",
        "members": "Members"
    },
    "fr": {
        "itinerary": "Itinéraire",
        "expenses": "Dépenses",
        "members": "Membres"
    },
    "es": {
        "itinerary": "Itinerario",
        "expenses": "Gastos",
        "members": "Miembros"
    },
    "de": {
        "itinerary": "Reiseplan",
        "expenses": "Ausgaben",
        "members": "Mitglieder"
    },
    "it": {
        "itinerary": "Itinerario",
        "expenses": "Spese",
        "members": "Membri"
    },
    "pt": {
        "itinerary": "Itinerário",
        "expenses": "Despesas",
        "members": "Membros"
    },
    "id": {
        "itinerary": "Rencana Perjalanan",
        "expenses": "Pengeluaran",
        "members": "Anggota"
    },
    "ja": {
        "itinerary": "旅程",
        "expenses": "経費",
        "members": "メンバー"
    },
    "ko": {
        "itinerary": "일정",
        "expenses": "비용",
        "members": "멤버"
    },
    "th": {
        "itinerary": "กำหนดการ",
        "expenses": "ค่าใช้จ่าย",
        "members": "สมาชิก"
    },
    "zh": {
        "itinerary": "行程",
        "expenses": "费用",
        "members": "成员"
    }
}

for lang, trans in translations.items():
    filepath = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "dashboard" not in data:
            data["dashboard"] = {}
        data["dashboard"].update(trans)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
print("Successfully updated dashboard keys for all languages.")
