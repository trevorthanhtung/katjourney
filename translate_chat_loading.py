import json
import os

loading_translations = {
    "vi": {"loading": "Đang tải tin nhắn..."},
    "en": {"loading": "Loading messages..."},
    "zh": {"loading": "正在加载消息..."},
    "es": {"loading": "Cargando mensajes..."},
    "ja": {"loading": "メッセージを読み込んでいます..."},
    "pt": {"loading": "Carregando mensagens..."},
    "ko": {"loading": "메시지 불러오는 중..."},
    "th": {"loading": "กำลังโหลดข้อความ..."},
    "de": {"loading": "Nachrichten werden geladen..."},
    "fr": {"loading": "Chargement des messages..."},
    "ru": {"loading": "Загрузка сообщений..."},
    "ar": {"loading": "جاري تحميل الرسائل..."}
}

def translate_chat_loading():
    locales_dir = "src/locales"
    for lang, trans in loading_translations.items():
        filepath = os.path.join(locales_dir, f"{lang}.json")
        if not os.path.exists(filepath):
            trans = loading_translations["en"]
            
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
    translate_chat_loading()
