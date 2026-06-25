import json
import os

cat_translations = {
    "en": {
        "catTransport": "Transport",
        "catFlights": "Flights",
        "catFood": "Food & Dining",
        "catAccommodation": "Accommodation",
        "catTickets": "Tickets & Tours",
        "catShopping": "Shopping",
        "catEntertainment": "Entertainment",
        "catPreparation": "Preparation",
        "catOther": "Other",
        "catCustom": "Custom..."
    },
    "es": {
        "catTransport": "Transporte",
        "catFlights": "Vuelos",
        "catFood": "Comida",
        "catAccommodation": "Alojamiento",
        "catTickets": "Entradas",
        "catShopping": "Compras",
        "catEntertainment": "Entretenimiento",
        "catPreparation": "Preparativos",
        "catOther": "Otro",
        "catCustom": "Otro..."
    },
    "vi": {
        "catTransport": "Di chuyển",
        "catFlights": "Vé máy bay",
        "catFood": "Ăn uống",
        "catAccommodation": "Lưu trú",
        "catTickets": "Vé tham quan",
        "catShopping": "Mua sắm",
        "catEntertainment": "Vui chơi & Giải trí",
        "catPreparation": "Chuẩn bị hành lý",
        "catOther": "Khác",
        "catCustom": "Khác..."
    }
}

langs = ["vi", "en", "ko", "ja", "zh", "es", "fr", "de", "it", "pt", "th", "id"]

for lang in langs:
    filepath = f"src/locales/{lang}.json"
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if "expenses" not in data:
        data["expenses"] = {}
        
    # use Vietnamese as fallback for others
    trans = cat_translations.get(lang, cat_translations["vi"])
    for k, v in trans.items():
        data["expenses"][k] = v

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {filepath}")
