import json
import os

locales_dir = 'src/locales'
translations = {
    "vi": {
        "upcoming": "Sắp diễn ra",
        "ongoing": "Đang diễn ra",
        "past": "Đã kết thúc",
        "status": "Trạng thái",
        "journey": "Hành trình",
        "completed": "Hoàn thành"
    },
    "en": {
        "upcoming": "Upcoming",
        "ongoing": "Ongoing",
        "past": "Past trip",
        "status": "Status",
        "journey": "Journey",
        "completed": "Completed"
    },
    "fr": {
        "upcoming": "À venir",
        "ongoing": "En cours",
        "past": "Terminé",
        "status": "Statut",
        "journey": "Voyage",
        "completed": "Achevé"
    },
    "es": {
        "upcoming": "Próximo",
        "ongoing": "En curso",
        "past": "Pasado",
        "status": "Estado",
        "journey": "Viaje",
        "completed": "Completado"
    },
    "de": {
        "upcoming": "Bevorstehend",
        "ongoing": "Laufend",
        "past": "Vergangen",
        "status": "Status",
        "journey": "Reise",
        "completed": "Abgeschlossen"
    },
    "it": {
        "upcoming": "In arrivo",
        "ongoing": "In corso",
        "past": "Passato",
        "status": "Stato",
        "journey": "Viaggio",
        "completed": "Completato"
    },
    "pt": {
        "upcoming": "Próximo",
        "ongoing": "Em andamento",
        "past": "Passado",
        "status": "Status",
        "journey": "Jornada",
        "completed": "Concluído"
    },
    "id": {
        "upcoming": "Akan datang",
        "ongoing": "Berlangsung",
        "past": "Berlalu",
        "status": "Status",
        "journey": "Perjalanan",
        "completed": "Selesai"
    },
    "ja": {
        "upcoming": "予定",
        "ongoing": "進行中",
        "past": "過去",
        "status": "ステータス",
        "journey": "旅程",
        "completed": "完了"
    },
    "ko": {
        "upcoming": "예정",
        "ongoing": "진행 중",
        "past": "과거",
        "status": "상태",
        "journey": "여정",
        "completed": "완료"
    },
    "th": {
        "upcoming": "กำลังจะมาถึง",
        "ongoing": "กำลังดำเนินการ",
        "past": "ที่ผ่านมา",
        "status": "สถานะ",
        "journey": "การเดินทาง",
        "completed": "เสร็จสมบูรณ์"
    },
    "zh": {
        "upcoming": "即将到来",
        "ongoing": "进行中",
        "past": "过去",
        "status": "状态",
        "journey": "旅程",
        "completed": "已完成"
    }
}

for lang, trans in translations.items():
    filepath = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "trip" not in data:
            data["trip"] = {}
        data["trip"].update(trans)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
print("Successfully updated trip keys for all languages.")
