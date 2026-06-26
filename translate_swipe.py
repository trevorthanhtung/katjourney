import json
import os

swipe_translations = {
    "vi": {"swipe": "Vuốt ngang ›"},
    "en": {"swipe": "Swipe ›"},
    "zh": {"swipe": "滑动 ›"},
    "es": {"swipe": "Deslizar ›"},
    "ja": {"swipe": "スワイプ ›"},
    "pt": {"swipe": "Deslizar ›"},
    "ko": {"swipe": "스와이프 ›"},
    "th": {"swipe": "ปัด ›"},
    "de": {"swipe": "Wischen ›"},
    "fr": {"swipe": "Glisser ›"},
    "ru": {"swipe": "Свайп ›"},
    "ar": {"swipe": "اسحب ›"}
}

def translate_swipe():
    locales_dir = "src/locales"
    for lang, trans in swipe_translations.items():
        filepath = os.path.join(locales_dir, f"{lang}.json")
        if not os.path.exists(filepath):
            trans = swipe_translations["en"]
            
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            if "journal" not in data:
                data["journal"] = {}
                
            for k, v in trans.items():
                data["journal"][k] = v
                
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            pass

if __name__ == "__main__":
    translate_swipe()
