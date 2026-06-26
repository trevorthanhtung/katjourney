import json
import os
import re

locales_dir = 'src/locales'
translations = {
    "vi": {
        "tripInfo": "Thông tin hành trình",
        "location": "Địa điểm",
        "time": "Thời gian",
        "roadmapItems": "Mục lịch trình",
        "itemsCount": "mục",
        "generalBackup": "Dự phòng chung",
        "applyToWholeTrip": "Áp dụng cho toàn bộ chuyến đi",
        "view": "Xem",
        "details": "Chi tiết",
        "noBackupPlans": "Chưa có dự phòng chung",
        "backupPlansDesc": "Các phương án áp dụng cho toàn bộ chuyến đi.",
        "addPlan": "Thêm phương án",
        "suggestPlan": "Đề xuất phương án",
        "travelRoadmap": "Lộ trình di chuyển",
        "viewingDay": "Ngày đang xem",
        "selectDay": "Chọn ngày",
        "day": "Ngày",
        "edit": "Sửa",
        "add": "Thêm",
        "roadmapLinkExist": "Đã có link lộ trình cho ngày này.",
        "mapLinked": "Đã liên kết bản đồ cho ngày này.",
        "fromTimeline": "Từ lịch trình",
        "openRoadmap": "Mở lộ trình",
        "noRoadmap": "Chưa có lộ trình ngày này",
        "attachRoadmap": "Gắn link lộ trình"
    },
    "en": {
        "tripInfo": "Trip info",
        "location": "Location",
        "time": "Time",
        "roadmapItems": "Roadmap items",
        "itemsCount": "items",
        "generalBackup": "General backup",
        "applyToWholeTrip": "Applies to the whole trip",
        "view": "View",
        "details": "Details",
        "noBackupPlans": "No general backup plans",
        "backupPlansDesc": "Plans applied to the entire trip.",
        "addPlan": "Add plan",
        "suggestPlan": "Suggest plan",
        "travelRoadmap": "Travel roadmap",
        "viewingDay": "Viewing day",
        "selectDay": "Select day",
        "day": "Day",
        "edit": "Edit",
        "add": "Add",
        "roadmapLinkExist": "Roadmap link exists for this day.",
        "mapLinked": "Map linked for this day.",
        "fromTimeline": "From timeline",
        "openRoadmap": "Open roadmap",
        "noRoadmap": "No roadmap for this day",
        "attachRoadmap": "Attach roadmap link"
    },
    "fr": {
        "tripInfo": "Infos voyage",
        "location": "Lieu",
        "time": "Heure",
        "roadmapItems": "Éléments itinéraire",
        "itemsCount": "éléments",
        "generalBackup": "Secours général",
        "applyToWholeTrip": "S'applique à tout le voyage",
        "view": "Voir",
        "details": "Détails",
        "noBackupPlans": "Aucun plan de secours",
        "backupPlansDesc": "Plans appliqués à tout le voyage.",
        "addPlan": "Ajouter un plan",
        "suggestPlan": "Suggérer un plan",
        "travelRoadmap": "Feuille de route",
        "viewingDay": "Jour consulté",
        "selectDay": "Choisir le jour",
        "day": "Jour",
        "edit": "Modifier",
        "add": "Ajouter",
        "roadmapLinkExist": "Lien d'itinéraire existant pour ce jour.",
        "mapLinked": "Carte liée pour ce jour.",
        "fromTimeline": "De l'itinéraire",
        "openRoadmap": "Ouvrir l'itinéraire",
        "noRoadmap": "Aucun itinéraire pour ce jour",
        "attachRoadmap": "Lier l'itinéraire"
    },
    "es": {
        "tripInfo": "Info del viaje",
        "location": "Ubicación",
        "time": "Hora",
        "roadmapItems": "Elementos de ruta",
        "itemsCount": "elementos",
        "generalBackup": "Respaldo general",
        "applyToWholeTrip": "Se aplica a todo el viaje",
        "view": "Ver",
        "details": "Detalles",
        "noBackupPlans": "Sin planes de respaldo",
        "backupPlansDesc": "Planes aplicados a todo el viaje.",
        "addPlan": "Añadir plan",
        "suggestPlan": "Sugerir plan",
        "travelRoadmap": "Ruta de viaje",
        "viewingDay": "Día actual",
        "selectDay": "Seleccionar día",
        "day": "Día",
        "edit": "Editar",
        "add": "Añadir",
        "roadmapLinkExist": "Enlace de ruta existente para este día.",
        "mapLinked": "Mapa vinculado para este día.",
        "fromTimeline": "De la línea de tiempo",
        "openRoadmap": "Abrir ruta",
        "noRoadmap": "Sin ruta para este día",
        "attachRoadmap": "Vincular ruta"
    },
    "de": {
        "tripInfo": "Reiseinfo",
        "location": "Ort",
        "time": "Zeit",
        "roadmapItems": "Routenpunkte",
        "itemsCount": "Punkte",
        "generalBackup": "Allgemeines Backup",
        "applyToWholeTrip": "Gilt für die gesamte Reise",
        "view": "Ansehen",
        "details": "Details",
        "noBackupPlans": "Keine Backup-Pläne",
        "backupPlansDesc": "Pläne für die gesamte Reise.",
        "addPlan": "Plan hinzufügen",
        "suggestPlan": "Plan vorschlagen",
        "travelRoadmap": "Reiseroute",
        "viewingDay": "Aktueller Tag",
        "selectDay": "Tag auswählen",
        "day": "Tag",
        "edit": "Bearbeiten",
        "add": "Hinzufügen",
        "roadmapLinkExist": "Routen-Link existiert für diesen Tag.",
        "mapLinked": "Karte für diesen Tag verknüpft.",
        "fromTimeline": "Aus dem Reiseplan",
        "openRoadmap": "Route öffnen",
        "noRoadmap": "Keine Route für diesen Tag",
        "attachRoadmap": "Routen-Link anfügen"
    },
    "it": {
        "tripInfo": "Info viaggio",
        "location": "Luogo",
        "time": "Orario",
        "roadmapItems": "Elementi itinerario",
        "itemsCount": "elementi",
        "generalBackup": "Backup generale",
        "applyToWholeTrip": "Si applica a tutto il viaggio",
        "view": "Vedi",
        "details": "Dettagli",
        "noBackupPlans": "Nessun piano di backup",
        "backupPlansDesc": "Piani applicati all'intero viaggio.",
        "addPlan": "Aggiungi piano",
        "suggestPlan": "Suggerisci piano",
        "travelRoadmap": "Mappa viaggio",
        "viewingDay": "Giorno in visione",
        "selectDay": "Seleziona giorno",
        "day": "Giorno",
        "edit": "Modifica",
        "add": "Aggiungi",
        "roadmapLinkExist": "Link itinerario esistente per oggi.",
        "mapLinked": "Mappa collegata per oggi.",
        "fromTimeline": "Dalla cronologia",
        "openRoadmap": "Apri itinerario",
        "noRoadmap": "Nessun itinerario per oggi",
        "attachRoadmap": "Allega link itinerario"
    },
    "pt": {
        "tripInfo": "Info da viagem",
        "location": "Local",
        "time": "Hora",
        "roadmapItems": "Itens do roteiro",
        "itemsCount": "itens",
        "generalBackup": "Backup geral",
        "applyToWholeTrip": "Aplica-se a toda a viagem",
        "view": "Ver",
        "details": "Detalhes",
        "noBackupPlans": "Sem planos de backup",
        "backupPlansDesc": "Planos aplicados a toda a viagem.",
        "addPlan": "Adicionar plano",
        "suggestPlan": "Sugerir plano",
        "travelRoadmap": "Roteiro de viagem",
        "viewingDay": "Dia atual",
        "selectDay": "Selecionar dia",
        "day": "Dia",
        "edit": "Editar",
        "add": "Adicionar",
        "roadmapLinkExist": "Link de roteiro existe para este dia.",
        "mapLinked": "Mapa vinculado para este dia.",
        "fromTimeline": "Da linha do tempo",
        "openRoadmap": "Abrir roteiro",
        "noRoadmap": "Sem roteiro para este dia",
        "attachRoadmap": "Anexar link do roteiro"
    },
    "id": {
        "tripInfo": "Info perjalanan",
        "location": "Lokasi",
        "time": "Waktu",
        "roadmapItems": "Item peta jalan",
        "itemsCount": "item",
        "generalBackup": "Cadangan umum",
        "applyToWholeTrip": "Berlaku untuk seluruh perjalanan",
        "view": "Lihat",
        "details": "Detail",
        "noBackupPlans": "Tidak ada rencana cadangan",
        "backupPlansDesc": "Rencana berlaku untuk seluruh perjalanan.",
        "addPlan": "Tambah rencana",
        "suggestPlan": "Sarankan rencana",
        "travelRoadmap": "Peta jalan",
        "viewingDay": "Melihat hari",
        "selectDay": "Pilih hari",
        "day": "Hari",
        "edit": "Edit",
        "add": "Tambah",
        "roadmapLinkExist": "Tautan peta jalan ada untuk hari ini.",
        "mapLinked": "Peta ditautkan untuk hari ini.",
        "fromTimeline": "Dari jadwal",
        "openRoadmap": "Buka peta jalan",
        "noRoadmap": "Tidak ada peta jalan untuk hari ini",
        "attachRoadmap": "Lampirkan tautan peta jalan"
    },
    "ja": {
        "tripInfo": "旅行情報",
        "location": "場所",
        "time": "時間",
        "roadmapItems": "ロードマップの項目",
        "itemsCount": "件",
        "generalBackup": "一般的なバックアップ",
        "applyToWholeTrip": "旅行全体に適用",
        "view": "見る",
        "details": "詳細",
        "noBackupPlans": "バックアッププランなし",
        "backupPlansDesc": "旅行全体に適用されるプラン。",
        "addPlan": "プランを追加",
        "suggestPlan": "プランを提案",
        "travelRoadmap": "旅行のロードマップ",
        "viewingDay": "表示中の日",
        "selectDay": "日を選択",
        "day": "日",
        "edit": "編集",
        "add": "追加",
        "roadmapLinkExist": "この日のロードマップリンクがあります。",
        "mapLinked": "この日のマップがリンクされています。",
        "fromTimeline": "タイムラインから",
        "openRoadmap": "ロードマップを開く",
        "noRoadmap": "この日のロードマップはありません",
        "attachRoadmap": "ロードマップリンクを添付"
    },
    "ko": {
        "tripInfo": "여행 정보",
        "location": "위치",
        "time": "시간",
        "roadmapItems": "로드맵 항목",
        "itemsCount": "개",
        "generalBackup": "일반 백업",
        "applyToWholeTrip": "전체 여행에 적용",
        "view": "보기",
        "details": "세부 정보",
        "noBackupPlans": "백업 플랜 없음",
        "backupPlansDesc": "전체 여행에 적용되는 플랜.",
        "addPlan": "플랜 추가",
        "suggestPlan": "플랜 제안",
        "travelRoadmap": "여행 로드맵",
        "viewingDay": "보는 날짜",
        "selectDay": "날짜 선택",
        "day": "일",
        "edit": "편집",
        "add": "추가",
        "roadmapLinkExist": "이 날의 로드맵 링크가 있습니다.",
        "mapLinked": "이 날의 지도가 연결되었습니다.",
        "fromTimeline": "타임라인에서",
        "openRoadmap": "로드맵 열기",
        "noRoadmap": "이 날의 로드맵이 없습니다",
        "attachRoadmap": "로드맵 링크 첨부"
    },
    "th": {
        "tripInfo": "ข้อมูลการเดินทาง",
        "location": "สถานที่",
        "time": "เวลา",
        "roadmapItems": "รายการแผนการเดินทาง",
        "itemsCount": "รายการ",
        "generalBackup": "แผนสำรองทั่วไป",
        "applyToWholeTrip": "ใช้กับการเดินทางทั้งหมด",
        "view": "ดู",
        "details": "รายละเอียด",
        "noBackupPlans": "ไม่มีแผนสำรอง",
        "backupPlansDesc": "แผนที่ใช้กับการเดินทางทั้งหมด",
        "addPlan": "เพิ่มแผน",
        "suggestPlan": "เสนอแผน",
        "travelRoadmap": "แผนการเดินทาง",
        "viewingDay": "วันที่กำลังดู",
        "selectDay": "เลือกวันที่",
        "day": "วัน",
        "edit": "แก้ไข",
        "add": "เพิ่ม",
        "roadmapLinkExist": "มีลิงก์แผนการเดินทางสำหรับวันนี้",
        "mapLinked": "เชื่อมโยงแผนที่สำหรับวันนี้แล้ว",
        "fromTimeline": "จากกำหนดการ",
        "openRoadmap": "เปิดแผนการเดินทาง",
        "noRoadmap": "ไม่มีแผนการเดินทางสำหรับวันนี้",
        "attachRoadmap": "แนบลิงก์แผนการเดินทาง"
    },
    "zh": {
        "tripInfo": "旅行信息",
        "location": "地点",
        "time": "时间",
        "roadmapItems": "路线项目",
        "itemsCount": "项",
        "generalBackup": "通用备用",
        "applyToWholeTrip": "适用于整个旅行",
        "view": "查看",
        "details": "详情",
        "noBackupPlans": "没有备用计划",
        "backupPlansDesc": "适用于整个旅行的计划。",
        "addPlan": "添加计划",
        "suggestPlan": "建议计划",
        "travelRoadmap": "旅行路线图",
        "viewingDay": "当前查看天数",
        "selectDay": "选择日期",
        "day": "天",
        "edit": "编辑",
        "add": "添加",
        "roadmapLinkExist": "此日期已有路线图链接。",
        "mapLinked": "已关联此日期的地图。",
        "fromTimeline": "来自时间线",
        "openRoadmap": "打开路线图",
        "noRoadmap": "此日期没有路线图",
        "attachRoadmap": "附加路线图链接"
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

file_path = 'src/features/share/SharedTripScreen.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure to replace specific occurrences precisely.
content = content.replace('Thông tin hành trình', '{t("share.tripInfo")}')
# For location, time etc, which might appear inside HTML tags or as JS strings:
content = re.sub(r'>\s*Địa điểm\s*<', '>{t("share.location")}<', content)
content = content.replace('"Địa điểm"', 't("share.location")')
content = re.sub(r'>\s*Thời gian\s*<', '>{t("share.time")}<', content)
content = re.sub(r'>\s*Mục lịch trình\s*<', '>{t("share.roadmapItems")}<', content)
content = content.replace('{activities.length} mục', '{activities.length} {t("share.itemsCount")}')
content = content.replace('>Dự phòng chung<', '>{t("share.generalBackup")}<')
content = content.replace('Áp dụng cho toàn bộ chuyến đi', '{t("share.applyToWholeTrip")}')
content = content.replace('Xem (', '{t("share.view")} (')
content = content.replace('Chi tiết &rarr;', '{t("share.details")} &rarr;')
content = content.replace('Chưa có dự phòng chung', '{t("share.noBackupPlans")}')
content = content.replace('Các phương án áp dụng cho toàn bộ chuyến đi.', '{t("share.backupPlansDesc")}')
content = content.replace("'Thêm phương án'", 't("share.addPlan")')
content = content.replace("'Đề xuất phương án'", 't("share.suggestPlan")')
content = content.replace('>Lộ trình di chuyển<', '>{t("share.travelRoadmap")}<')
content = content.replace('Lộ trình di chuyển - Ngày', '${t("share.travelRoadmap")} - ${t("share.day")}')
content = content.replace('Ngày đang xem', '{t("share.viewingDay")}')
content = content.replace('Ngày ${days.indexOf(selectedRoadmapDay) + 1}', '${t("share.day")} ${days.indexOf(selectedRoadmapDay) + 1}')
content = content.replace('Ngày ${dayIndex + 1}', '${t("share.day")} ${dayIndex + 1}')
content = content.replace('"Chọn ngày"', 't("share.selectDay")')
content = content.replace('"Sửa"', 't("share.edit")')
content = content.replace('"Thêm"', 't("share.add")')
content = content.replace('"Đã có link lộ trình cho ngày này."', 't("share.roadmapLinkExist")')
content = content.replace('"Đã liên kết bản đồ cho ngày này."', 't("share.mapLinked")')
content = content.replace('Từ lịch trình', '{t("share.fromTimeline")}')
content = content.replace('Mở lộ trình &rarr;', '{t("share.openRoadmap")} &rarr;')
content = content.replace('Chưa có lộ trình ngày này', '{t("share.noRoadmap")}')
content = content.replace('Gắn link lộ trình', '{t("share.attachRoadmap")}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated shared strings for all languages and replaced in SharedTripScreen.tsx.")
