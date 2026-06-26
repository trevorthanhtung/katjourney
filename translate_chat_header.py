import json
import os

chat_header_translations = {
    "vi": {
        "yesterday": "Hôm qua"
    },
    "en": {
        "yesterday": "Yesterday"
    },
    "zh": {
        "yesterday": "昨天"
    },
    "es": {
        "yesterday": "Ayer"
    },
    "ja": {
        "yesterday": "昨日"
    },
    "pt": {
        "yesterday": "Ontem"
    },
    "ko": {
        "yesterday": "어제"
    },
    "th": {
        "yesterday": "เมื่อวาน"
    },
    "de": {
        "yesterday": "Gestern"
    },
    "fr": {
        "yesterday": "Hier"
    },
    "ru": {
        "yesterday": "Вчера"
    },
    "ar": {
        "yesterday": "أمس"
    }
}

def translate_chat_header():
    locales_dir = "src/locales"
    for lang, trans in chat_header_translations.items():
        filepath = os.path.join(locales_dir, f"{lang}.json")
        if not os.path.exists(filepath):
            trans = chat_header_translations["en"]
            
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            if "chat" not in data:
                data["chat"] = {}
                
            for k, v in trans.items():
                data["chat"][k] = v
                
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            pass

if __name__ == "__main__":
    translate_chat_header()
