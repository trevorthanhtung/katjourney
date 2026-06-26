import json
import os

shared_screen_translations = {
    "vi": {
        "headerShare": "Chia sẻ",
        "switchUser": "Chọn lại người dùng",
        "exit": "Thoát",
        "secureData": "Dữ liệu được chia sẻ an toàn qua KAT Journey.",
        "sharedUser": "Người được chia sẻ"
    },
    "en": {
        "headerShare": "Shared",
        "switchUser": "Switch user",
        "exit": "Exit",
        "secureData": "Data securely shared via KAT Journey.",
        "sharedUser": "Shared user"
    },
    "zh": {
        "headerShare": "已分享",
        "switchUser": "切换用户",
        "exit": "退出",
        "secureData": "数据通过 KAT Journey 安全共享。",
        "sharedUser": "被分享者"
    },
    "es": {
        "headerShare": "Compartido",
        "switchUser": "Cambiar usuario",
        "exit": "Salir",
        "secureData": "Datos compartidos de forma segura a través de KAT Journey.",
        "sharedUser": "Usuario compartido"
    },
    "ja": {
        "headerShare": "共有中",
        "switchUser": "ユーザーを切り替える",
        "exit": "終了",
        "secureData": "データはKAT Journeyを通じて安全に共有されています。",
        "sharedUser": "共有ユーザー"
    },
    "pt": {
        "headerShare": "Compartilhado",
        "switchUser": "Mudar de usuário",
        "exit": "Sair",
        "secureData": "Dados compartilhados com segurança via KAT Journey.",
        "sharedUser": "Usuário compartilhado"
    },
    "ko": {
        "headerShare": "공유됨",
        "switchUser": "사용자 전환",
        "exit": "종료",
        "secureData": "KAT Journey를 통해 안전하게 공유된 데이터.",
        "sharedUser": "공유 사용자"
    },
    "th": {
        "headerShare": "แชร์แล้ว",
        "switchUser": "เปลี่ยนผู้ใช้",
        "exit": "ออก",
        "secureData": "ข้อมูลถูกแชร์อย่างปลอดภัยผ่าน KAT Journey",
        "sharedUser": "ผู้ใช้ที่ได้รับการแชร์"
    },
    "de": {
        "headerShare": "Geteilt",
        "switchUser": "Benutzer wechseln",
        "exit": "Verlassen",
        "secureData": "Daten sicher geteilt über KAT Journey.",
        "sharedUser": "Geteilter Benutzer"
    },
    "fr": {
        "headerShare": "Partagé",
        "switchUser": "Changer d'utilisateur",
        "exit": "Quitter",
        "secureData": "Données partagées en toute sécurité via KAT Journey.",
        "sharedUser": "Utilisateur partagé"
    },
    "ru": {
        "headerShare": "Общий доступ",
        "switchUser": "Сменить пользователя",
        "exit": "Выйти",
        "secureData": "Данные безопасно передаются через KAT Journey.",
        "sharedUser": "Общий пользователь"
    },
    "ar": {
        "headerShare": "مشترك",
        "switchUser": "تبديل المستخدم",
        "exit": "خروج",
        "secureData": "تتم مشاركة البيانات بشكل آمن عبر KAT Journey.",
        "sharedUser": "المستخدم المشترك"
    }
}

def translate_shared_screen():
    locales_dir = "src/locales"
    for lang, trans in shared_screen_translations.items():
        filepath = os.path.join(locales_dir, f"{lang}.json")
        if not os.path.exists(filepath):
            trans = shared_screen_translations["en"]
            
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            if "sharedScreen" not in data:
                data["sharedScreen"] = {}
                
            for k, v in trans.items():
                data["sharedScreen"][k] = v
                
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            pass

if __name__ == "__main__":
    translate_shared_screen()
