import json
import os

offline_translations = {
    "vi": {
        "title": "Bạn đang offline",
        "subtitle": " - Một số tính năng cần kết nối mạng"
    },
    "en": {
        "title": "You are offline",
        "subtitle": " - Some features require an internet connection"
    },
    "zh": {
        "title": "您已离线",
        "subtitle": " - 部分功能需要网络连接"
    },
    "es": {
        "title": "Estás desconectado",
        "subtitle": " - Algunas funciones requieren conexión a internet"
    },
    "ja": {
        "title": "オフラインです",
        "subtitle": " - 一部の機能はインターネット接続が必要です"
    },
    "pt": {
        "title": "Você está offline",
        "subtitle": " - Alguns recursos requerem conexão com a internet"
    },
    "ko": {
        "title": "오프라인 상태입니다",
        "subtitle": " - 일부 기능은 인터넷 연결이 필요합니다"
    },
    "th": {
        "title": "คุณออฟไลน์",
        "subtitle": " - คุณสมบัติบางอย่างต้องใช้การเชื่อมต่ออินเทอร์เน็ต"
    },
    "de": {
        "title": "Sie sind offline",
        "subtitle": " - Einige Funktionen erfordern eine Internetverbindung"
    },
    "fr": {
        "title": "Vous êtes hors ligne",
        "subtitle": " - Certaines fonctionnalités nécessitent une connexion internet"
    },
    "ru": {
        "title": "Вы в автономном режиме",
        "subtitle": " - Для некоторых функций требуется подключение к интернету"
    },
    "ar": {
        "title": "أنت غير متصل",
        "subtitle": " - بعض الميزات تتطلب اتصالاً بالإنترنت"
    }
}

def translate_offline():
    locales_dir = "src/locales"
    for lang, trans in offline_translations.items():
        filepath = os.path.join(locales_dir, f"{lang}.json")
        if not os.path.exists(filepath):
            trans = offline_translations["en"]
            
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            if "offline" not in data:
                data["offline"] = {}
                
            for k, v in trans.items():
                data["offline"][k] = v
                
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            pass

if __name__ == "__main__":
    translate_offline()
