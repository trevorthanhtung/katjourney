import json
import os

mood_translations = {
    "vi": {
        "mood_good": "Vui",
        "mood_okay": "Bình yên",
        "mood_great": "Hào hứng",
        "mood_very_bad": "Mệt",
        "mood_bad": "Bất ngờ",
        "mood_default": "Đáng nhớ"
    },
    "en": {
        "mood_good": "Happy",
        "mood_okay": "Peaceful",
        "mood_great": "Excited",
        "mood_very_bad": "Tired",
        "mood_bad": "Surprised",
        "mood_default": "Memorable"
    },
    "zh": {
        "mood_good": "开心",
        "mood_okay": "平静",
        "mood_great": "激动",
        "mood_very_bad": "疲惫",
        "mood_bad": "惊讶",
        "mood_default": "难忘"
    },
    "es": {
        "mood_good": "Feliz",
        "mood_okay": "Pacífico",
        "mood_great": "Emocionado",
        "mood_very_bad": "Cansado",
        "mood_bad": "Sorprendido",
        "mood_default": "Memorable"
    },
    "ja": {
        "mood_good": "楽しい",
        "mood_okay": "穏やか",
        "mood_great": "ワクワク",
        "mood_very_bad": "疲れた",
        "mood_bad": "驚いた",
        "mood_default": "思い出に残る"
    },
    "pt": {
        "mood_good": "Feliz",
        "mood_okay": "Pacífico",
        "mood_great": "Animado",
        "mood_very_bad": "Cansado",
        "mood_bad": "Surpreso",
        "mood_default": "Memorável"
    },
    "ko": {
        "mood_good": "행복함",
        "mood_okay": "평화로움",
        "mood_great": "신남",
        "mood_very_bad": "피곤함",
        "mood_bad": "놀람",
        "mood_default": "기억에 남는"
    },
    "th": {
        "mood_good": "มีความสุข",
        "mood_okay": "สงบ",
        "mood_great": "ตื่นเต้น",
        "mood_very_bad": "เหนื่อย",
        "mood_bad": "ประหลาดใจ",
        "mood_default": "น่าจดจำ"
    },
    "de": {
        "mood_good": "Glücklich",
        "mood_okay": "Friedlich",
        "mood_great": "Aufgeregt",
        "mood_very_bad": "Müde",
        "mood_bad": "Überrascht",
        "mood_default": "Denkwürdig"
    },
    "fr": {
        "mood_good": "Heureux",
        "mood_okay": "Paisible",
        "mood_great": "Excité",
        "mood_very_bad": "Fatigué",
        "mood_bad": "Surpris",
        "mood_default": "Mémorable"
    },
    "ru": {
        "mood_good": "Радостно",
        "mood_okay": "Спокойно",
        "mood_great": "В восторге",
        "mood_very_bad": "Устал",
        "mood_bad": "Удивлен",
        "mood_default": "Незабываемо"
    },
    "ar": {
        "mood_good": "سعيد",
        "mood_okay": "هادئ",
        "mood_great": "متحمس",
        "mood_very_bad": "متعب",
        "mood_bad": "متفاجئ",
        "mood_default": "لا ينسى"
    }
}

def translate_journal_moods():
    locales_dir = "src/locales"
    for lang, trans in mood_translations.items():
        filepath = os.path.join(locales_dir, f"{lang}.json")
        if not os.path.exists(filepath):
            # Fallback to english if language doesn't exist
            trans = mood_translations["en"]
            
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
    translate_journal_moods()
