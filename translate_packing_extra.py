import json
import os

translations = {
    "ko": {
        "progressRemaining": "완벽한 여행을 위해 {{remaining}}개 더 필요합니다.",
        "sharedItemsTitle": "공용 준비물"
    },
    "zh": {
        "progressRemaining": "还差 {{remaining}} 件物品即可完美出行。",
        "sharedItemsTitle": "共用物品"
    },
    "ja": {
        "progressRemaining": "完璧な旅行のためにあと {{remaining}} 個必要です。",
        "sharedItemsTitle": "共有アイテム"
    },
    "en": {
        "progressRemaining": "{{remaining}} more items needed for a perfect trip.",
        "sharedItemsTitle": "Shared Items"
    },
    "es": {
        "progressRemaining": "Faltan {{remaining}} artículos para un viaje perfecto.",
        "sharedItemsTitle": "Artículos Compartidos"
    },
    "fr": {
        "progressRemaining": "Il reste {{remaining}} articles pour un voyage parfait.",
        "sharedItemsTitle": "Articles Partagés"
    },
    "de": {
        "progressRemaining": "Noch {{remaining}} Artikel für eine perfekte Reise.",
        "sharedItemsTitle": "Geteilte Artikel"
    },
    "it": {
        "progressRemaining": "Mancano {{remaining}} articoli per un viaggio perfetto.",
        "sharedItemsTitle": "Articoli Condivisi"
    },
    "pt": {
        "progressRemaining": "Faltam {{remaining}} itens para uma viagem perfeita.",
        "sharedItemsTitle": "Itens Compartilhados"
    },
    "th": {
        "progressRemaining": "ต้องการอีก {{remaining}} ชิ้นเพื่อการเดินทางที่สมบูรณ์แบบ",
        "sharedItemsTitle": "สิ่งของที่ใช้ร่วมกัน"
    },
    "id": {
        "progressRemaining": "{{remaining}} barang lagi untuk perjalanan yang sempurna.",
        "sharedItemsTitle": "Barang Bersama"
    },
    "vi": {
        "progressRemaining": "Còn {{remaining}} món nữa để chuyến đi hoàn hảo.",
        "sharedItemsTitle": "Món đồ cần chuẩn bị chung"
    }
}

for lang, data_dict in translations.items():
    filepath = f"src/locales/{lang}.json"
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for k, v in data_dict.items():
        data["packing"][k] = v

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {filepath}")
