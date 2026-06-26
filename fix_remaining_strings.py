import json
import os

locales_dir = 'src/locales'
translations = {
    "vi": {
        "suggestAddBackupPlan": "Đề xuất phương án dự phòng",
        "openGoogleMaps": "Mở bằng ứng dụng Google Maps",
        "viewCalendar": "Xem dạng lịch"
    },
    "en": {
        "suggestAddBackupPlan": "Suggest add backup plan",
        "openGoogleMaps": "Open with Google Maps app",
        "viewCalendar": "View as calendar"
    },
    "fr": {
        "suggestAddBackupPlan": "Suggérer d'ajouter un plan de secours",
        "openGoogleMaps": "Ouvrir avec l'application Google Maps",
        "viewCalendar": "Afficher sous forme de calendrier"
    },
    "es": {
        "suggestAddBackupPlan": "Sugerir añadir plan de respaldo",
        "openGoogleMaps": "Abrir con la aplicación Google Maps",
        "viewCalendar": "Ver como calendario"
    },
    "de": {
        "suggestAddBackupPlan": "Notfallplan hinzufügen vorschlagen",
        "openGoogleMaps": "Mit Google Maps-App öffnen",
        "viewCalendar": "Als Kalender anzeigen"
    },
    "it": {
        "suggestAddBackupPlan": "Suggerisci aggiunta piano di riserva",
        "openGoogleMaps": "Apri con l'app Google Maps",
        "viewCalendar": "Visualizza come calendario"
    },
    "pt": {
        "suggestAddBackupPlan": "Sugerir adição de plano de backup",
        "openGoogleMaps": "Abrir com o aplicativo Google Maps",
        "viewCalendar": "Exibir como calendário"
    },
    "id": {
        "suggestAddBackupPlan": "Sarankan tambah rencana cadangan",
        "openGoogleMaps": "Buka dengan aplikasi Google Maps",
        "viewCalendar": "Lihat sebagai kalender"
    },
    "ja": {
        "suggestAddBackupPlan": "バックアッププランの追加を提案",
        "openGoogleMaps": "Googleマップアプリで開く",
        "viewCalendar": "カレンダーとして表示"
    },
    "ko": {
        "suggestAddBackupPlan": "백업 계획 추가 제안",
        "openGoogleMaps": "Google 지도 앱으로 열기",
        "viewCalendar": "달력으로 보기"
    },
    "th": {
        "suggestAddBackupPlan": "เสนอเพิ่มแผนสำรอง",
        "openGoogleMaps": "เปิดด้วยแอป Google Maps",
        "viewCalendar": "ดูเป็นปฏิทิน"
    },
    "zh": {
        "suggestAddBackupPlan": "建议添加备用计划",
        "openGoogleMaps": "使用 Google 地图应用打开",
        "viewCalendar": "以日历查看"
    }
}

for lang, trans in translations.items():
    filepath = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "share" not in data:
            data["share"] = {}
        data["share"].update(trans)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

file_path = 'src/features/share/components/SharedActivitiesSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('{isRoute ? "Xem lộ trình di chuyển " : "Mở bằng ứng dụng Google Maps "}', '{isRoute ? t("timeline.viewRoute") + " " : t("share.openGoogleMaps") + " "}')
content = content.replace('{backupCount > 0 ? `${backupCount} phương án dự phòng` : (isBackupPlansDirectEdit ? `${t("timeline.addBtn")} phương án dự phòng` : "Đề xuất phương án dự phòng")}', '{backupCount > 0 ? t("timeline.backupPlansCount", { count: backupCount }) : (isBackupPlansDirectEdit ? t("timeline.addBackupPlan") : t("share.suggestAddBackupPlan"))}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully fixed remaining hardcoded strings.")
