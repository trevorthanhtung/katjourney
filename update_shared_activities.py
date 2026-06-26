import json
import os
import re

locales_dir = 'src/locales'
translations = {
    "vi": {
        "detailedSchedule": "Lịch trình chi tiết",
        "allDays": "Tất cả các ngày",
        "quickSelectDay": "Chọn nhanh ngày lịch trình",
        "quickSelectDesc": "Chọn một ngày cụ thể dưới đây để lọc xem chi tiết hoạt động hoặc chọn \"Tất cả các ngày\".",
        "noActivitiesThisDay": "Không có hoạt động nào ngày này",
        "suggestAdd": "Đề xuất thêm",
        "suggestEdit": "Đề xuất sửa",
        "sendSuggestion": "Gửi đề xuất",
        "suggestAddActivity": "Đề xuất thêm hoạt động",
        "suggestEditActivity": "Đề xuất sửa hoạt động"
    },
    "en": {
        "detailedSchedule": "Detailed Schedule",
        "allDays": "All days",
        "quickSelectDay": "Quick select day",
        "quickSelectDesc": "Select a specific day below to filter activity details or select \"All days\".",
        "noActivitiesThisDay": "No activities on this day",
        "suggestAdd": "Suggest add",
        "suggestEdit": "Suggest edit",
        "sendSuggestion": "Send suggestion",
        "suggestAddActivity": "Suggest add activity",
        "suggestEditActivity": "Suggest edit activity"
    },
    "fr": {
        "detailedSchedule": "Calendrier détaillé",
        "allDays": "Tous les jours",
        "quickSelectDay": "Sélection rapide du jour",
        "quickSelectDesc": "Sélectionnez un jour spécifique ci-dessous pour filtrer les détails de l'activité ou sélectionnez \"Tous les jours\".",
        "noActivitiesThisDay": "Aucune activité ce jour-là",
        "suggestAdd": "Suggérer un ajout",
        "suggestEdit": "Suggérer une modification",
        "sendSuggestion": "Envoyer la suggestion",
        "suggestAddActivity": "Suggérer l'ajout d'une activité",
        "suggestEditActivity": "Suggérer la modification d'une activité"
    },
    "es": {
        "detailedSchedule": "Horario detallado",
        "allDays": "Todos los días",
        "quickSelectDay": "Selección rápida de día",
        "quickSelectDesc": "Seleccione un día específico a continuación para filtrar los detalles de la actividad o seleccione \"Todos los días\".",
        "noActivitiesThisDay": "No hay actividades este día",
        "suggestAdd": "Sugerir añadir",
        "suggestEdit": "Sugerir edición",
        "sendSuggestion": "Enviar sugerencia",
        "suggestAddActivity": "Sugerir añadir actividad",
        "suggestEditActivity": "Sugerir editar actividad"
    },
    "de": {
        "detailedSchedule": "Detaillierter Zeitplan",
        "allDays": "Alle Tage",
        "quickSelectDay": "Schnellauswahl Tag",
        "quickSelectDesc": "Wählen Sie unten einen bestimmten Tag aus, um Aktivitätsdetails zu filtern, oder wählen Sie \"Alle Tage\".",
        "noActivitiesThisDay": "Keine Aktivitäten an diesem Tag",
        "suggestAdd": "Hinzufügen vorschlagen",
        "suggestEdit": "Bearbeiten vorschlagen",
        "sendSuggestion": "Vorschlag senden",
        "suggestAddActivity": "Aktivität hinzufügen vorschlagen",
        "suggestEditActivity": "Aktivität bearbeiten vorschlagen"
    },
    "it": {
        "detailedSchedule": "Programma dettagliato",
        "allDays": "Tutti i giorni",
        "quickSelectDay": "Selezione rapida del giorno",
        "quickSelectDesc": "Seleziona un giorno specifico di seguito per filtrare i dettagli dell'attività o seleziona \"Tutti i giorni\".",
        "noActivitiesThisDay": "Nessuna attività in questo giorno",
        "suggestAdd": "Suggerisci aggiunta",
        "suggestEdit": "Suggerisci modifica",
        "sendSuggestion": "Invia suggerimento",
        "suggestAddActivity": "Suggerisci aggiunta attività",
        "suggestEditActivity": "Suggerisci modifica attività"
    },
    "pt": {
        "detailedSchedule": "Cronograma detalhado",
        "allDays": "Todos os dias",
        "quickSelectDay": "Seleção rápida de dia",
        "quickSelectDesc": "Selecione um dia específico abaixo para filtrar os detalhes da atividade ou selecione \"Todos os dias\".",
        "noActivitiesThisDay": "Nenhuma atividade neste dia",
        "suggestAdd": "Sugerir adição",
        "suggestEdit": "Sugerir edição",
        "sendSuggestion": "Enviar sugestão",
        "suggestAddActivity": "Sugerir adição de atividade",
        "suggestEditActivity": "Sugerir edição de atividade"
    },
    "id": {
        "detailedSchedule": "Jadwal Detail",
        "allDays": "Semua hari",
        "quickSelectDay": "Pilih hari cepat",
        "quickSelectDesc": "Pilih hari tertentu di bawah untuk memfilter detail aktivitas atau pilih \"Semua hari\".",
        "noActivitiesThisDay": "Tidak ada aktivitas pada hari ini",
        "suggestAdd": "Sarankan tambah",
        "suggestEdit": "Sarankan edit",
        "sendSuggestion": "Kirim saran",
        "suggestAddActivity": "Sarankan tambah aktivitas",
        "suggestEditActivity": "Sarankan edit aktivitas"
    },
    "ja": {
        "detailedSchedule": "詳細なスケジュール",
        "allDays": "すべての日",
        "quickSelectDay": "日付のクイック選択",
        "quickSelectDesc": "下から特定の日を選択してアクティビティの詳細をフィルタリングするか、「すべての日」を選択します。",
        "noActivitiesThisDay": "この日のアクティビティはありません",
        "suggestAdd": "追加を提案",
        "suggestEdit": "編集を提案",
        "sendSuggestion": "提案を送信",
        "suggestAddActivity": "アクティビティの追加を提案",
        "suggestEditActivity": "アクティビティの編集を提案"
    },
    "ko": {
        "detailedSchedule": "상세 일정",
        "allDays": "모든 날짜",
        "quickSelectDay": "날짜 빠른 선택",
        "quickSelectDesc": "아래에서 특정 날짜를 선택하여 활동 세부 정보를 필터링하거나 \"모든 날짜\"를 선택하세요.",
        "noActivitiesThisDay": "이 날에는 활동이 없습니다",
        "suggestAdd": "추가 제안",
        "suggestEdit": "편집 제안",
        "sendSuggestion": "제안 보내기",
        "suggestAddActivity": "활동 추가 제안",
        "suggestEditActivity": "활동 편집 제안"
    },
    "th": {
        "detailedSchedule": "ตารางรายละเอียด",
        "allDays": "ทุกวัน",
        "quickSelectDay": "เลือกวันอย่างรวดเร็ว",
        "quickSelectDesc": "เลือกวันที่ระบุด้านล่างเพื่อกรองรายละเอียดกิจกรรม หรือเลือก \"ทุกวัน\"",
        "noActivitiesThisDay": "ไม่มีกิจกรรมในวันนี้",
        "suggestAdd": "เสนอเพิ่ม",
        "suggestEdit": "เสนอแก้ไข",
        "sendSuggestion": "ส่งข้อเสนอ",
        "suggestAddActivity": "เสนอเพิ่มกิจกรรม",
        "suggestEditActivity": "เสนอแก้ไขกิจกรรม"
    },
    "zh": {
        "detailedSchedule": "详细时间表",
        "allDays": "所有日期",
        "quickSelectDay": "快速选择日期",
        "quickSelectDesc": "在下面选择特定日期以筛选活动详情，或选择“所有日期”。",
        "noActivitiesThisDay": "这一天没有活动",
        "suggestAdd": "建议添加",
        "suggestEdit": "建议编辑",
        "sendSuggestion": "发送建议",
        "suggestAddActivity": "建议添加活动",
        "suggestEditActivity": "建议编辑活动"
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

# Make sure t is used correctly
# Line 542: <h3 className="text-[18px] font-black text-kat-dark tracking-tight">Lịch trình chi tiết</h3>
content = content.replace('Lịch trình chi tiết', '{t("share.detailedSchedule")}')

# "Danh sách" -> {t("share.listView")}
content = content.replace('Danh sách', '{t("share.listView")}')

# "Thêm" -> {t("share.addBtn")}
content = content.replace('Thêm', '{t("share.addBtn")}')

# "Tất cả các ngày" -> {t("share.allDays")}
content = content.replace('Tất cả các ngày', '{t("share.allDays")}')
content = content.replace('"Tất cả các ngày"', 't("share.allDays")')

# "Chọn nhanh ngày lịch trình"
content = content.replace('Chọn nhanh ngày lịch trình', '{t("share.quickSelectDay")}')

# "Chọn một ngày cụ thể dưới đây để lọc xem chi tiết hoạt động hoặc chọn \"Tất cả các ngày\"."
content = content.replace('Chọn một ngày cụ thể dưới đây để lọc xem chi tiết hoạt động hoặc chọn "Tất cả các ngày".', '{t("share.quickSelectDesc")}')

# "Không có hoạt động nào ngày này"
content = content.replace('Không có hoạt động nào ngày này', '{t("share.noActivitiesThisDay")}')

# "Đề xuất thêm"
content = content.replace('"Đề xuất thêm"', 't("share.suggestAdd")')

# "Thêm hoạt động"
content = content.replace('"Thêm hoạt động"', 't("share.addActivity")')

# "Đề xuất sửa hoạt động"
content = content.replace('"Đề xuất sửa hoạt động"', 't("share.suggestEditActivity")')

# "Đề xuất thêm hoạt động"
content = content.replace('"Đề xuất thêm hoạt động"', 't("share.suggestAddActivity")')

# "Sửa hoạt động"
content = content.replace('"Sửa hoạt động"', 't("share.editActivity")')

# "Gửi đề xuất"
content = content.replace('"Gửi đề xuất"', 't("share.sendSuggestion")')

# "Lưu thay đổi"
content = content.replace('"Lưu thay đổi"', 't("share.saveChanges")')

# "Tiêu đề *"
content = content.replace('Tiêu đề *', '{t("share.titleLabel")}')

# "VD: Ăn trưa tại quán ngon..."
content = content.replace('VD: Ăn trưa tại quán ngon...', '{t("share.titlePlaceholder")}')

# "Loại hoạt động"
content = content.replace('Loại hoạt động', '{t("share.activityType")}')

# "Chọn ngày *"
content = content.replace('Chọn ngày *', '{t("share.selectDate")} *')
content = content.replace('Ngày thực hiện *', '{t("share.selectDate")} *')

# "Ngày 1 (03/07/2026)" -> this is probably generated code.
# Let's check `Ngày ${idx + 1}` inside the modal dropdown.
content = content.replace('`Ngày ${idx + 1}', '`${t("timeline.dayN", { n: idx + 1 })}')
content = content.replace('`Ngày ${days.indexOf(day) + 1}`', 't("timeline.dayN", { n: days.indexOf(day) + 1 })')
content = content.replace('Ngày ${idx + 1}', '${t("timeline.dayN", { n: idx + 1 })}')
content = content.replace('Ngày ${days.indexOf(day) + 1}', '${t("timeline.dayN", { n: days.indexOf(day) + 1 })}')

# "Chưa phân ngày" -> {t("share.unscheduled")}
content = content.replace('"Chưa phân ngày"', 't("share.unscheduled")')
content = content.replace('Chưa phân ngày', '{t("share.unscheduled")}')

# "Các hoạt động chưa có ngày" -> {t("share.unscheduledDesc")}
content = content.replace('"Các hoạt động chưa có ngày"', 't("share.unscheduledDesc")')
content = content.replace('Các hoạt động chưa xếp ngày cụ thể', '{t("share.unscheduledDesc")}')

# "Giờ (không bắt buộc)"
content = content.replace('Giờ (không bắt buộc)', '{t("share.timeLabel")}')

# "Địa điểm"
content = content.replace('Địa điểm', '{t("share.locationLabel")}')

# "Nhập tên địa điểm, hệ thống sẽ tự động tìm kiếm trên Google Maps."
content = content.replace('Nhập tên địa điểm, hệ thống sẽ tự động tìm kiếm trên Google Maps.', '{t("share.locationHelper")}')

# "Ví dụ: Bãi Trước, Vũng Tàu" or "VD: Bãi Trước, Vũng Tàu"
content = content.replace('Ví dụ: Bãi Trước, Vũng Tàu', '{t("share.locationPlaceholder")}')
content = content.replace('VD: Bãi Trước, Vũng Tàu', '{t("share.locationPlaceholder")}')

# "Link Google Maps"
content = content.replace('Link Google Maps', 'Google Maps')

# "Dán link địa điểm từ Google Maps. Dùng để hiển thị vị trí chính xác nếu tên địa điểm không tự tìm được."
content = content.replace('Dán link địa điểm từ Google Maps. Dùng để hiển thị vị trí chính xác nếu tên địa điểm không tự tìm được.', '{t("share.pasteMapLink")}')

# "Ghi chú thêm" or "Ghi chú, mã đặt chỗ"
content = content.replace('Ghi chú thêm', '{t("share.notesLabel")}')
content = content.replace('Ghi chú, mã đặt chỗ', '{t("share.notesLabel")}')

# "Mô tả chi tiết hoặc lưu ý cho hoạt động này..."
content = content.replace('Mô tả chi tiết hoặc lưu ý cho hoạt động này...', '{t("share.notesPlaceholder")}')
content = content.replace('Lưu ý quan trọng, mã phòng, số điện thoại liên hệ...', '{t("share.notesPlaceholder")}')

# "Hủy"
content = content.replace('"Hủy"', 't("share.cancel")')
content = content.replace('>Hủy<', '>{t("share.cancel")}<')
content = content.replace(' Hủy', ' {t("share.cancel")}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated shared activities strings.")
