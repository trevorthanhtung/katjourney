import json
import os
import re

locales_dir = 'src/locales'
translations = {
    "vi": {
        "readyToExplore": "Sẵn sàng khám phá chuyến đi!",
        "exploreDesc": "Hãy chọn một danh mục ở thanh điều hướng hoặc nhấp vào các thẻ thống kê để xem chi tiết hành trình nhé.",
        "packing": "Chuẩn bị hành lý",
        "documents": "Giấy tờ du lịch",
        "pasteMapLink": "Dán link lộ trình Google Maps",
        "mapInstruction": "Vào Google Maps → chọn điểm đầu/cuối → nhấn <strong>Đường đi</strong> → sao chép link trên thanh địa chỉ.",
        "openLinkTest": "Mở link kiểm tra",
        "saveRoadmap": "Lưu lộ trình",
        "selectRoadmapDay": "Chọn ngày lộ trình"
    },
    "en": {
        "readyToExplore": "Ready to explore the trip!",
        "exploreDesc": "Select a category from the navigation bar or click on the statistic cards to view trip details.",
        "packing": "Packing list",
        "documents": "Travel documents",
        "pasteMapLink": "Paste Google Maps route link",
        "mapInstruction": "Go to Google Maps → select start/end points → click <strong>Directions</strong> → copy link from address bar.",
        "openLinkTest": "Test link",
        "saveRoadmap": "Save roadmap",
        "selectRoadmapDay": "Select roadmap day"
    },
    "fr": {
        "readyToExplore": "Prêt à explorer le voyage !",
        "exploreDesc": "Sélectionnez une catégorie dans la barre de navigation ou cliquez sur les cartes statistiques pour voir les détails.",
        "packing": "Liste de bagages",
        "documents": "Documents de voyage",
        "pasteMapLink": "Coller le lien de l'itinéraire Google Maps",
        "mapInstruction": "Allez sur Google Maps → sélectionnez les points de départ/arrivée → cliquez sur <strong>Itinéraires</strong> → copiez le lien.",
        "openLinkTest": "Tester le lien",
        "saveRoadmap": "Enregistrer l'itinéraire",
        "selectRoadmapDay": "Sélectionner le jour de l'itinéraire"
    },
    "es": {
        "readyToExplore": "¡Listo para explorar el viaje!",
        "exploreDesc": "Selecciona una categoría en la barra de navegación o haz clic en las tarjetas de estadísticas para ver los detalles.",
        "packing": "Lista de equipaje",
        "documents": "Documentos de viaje",
        "pasteMapLink": "Pegar enlace de ruta de Google Maps",
        "mapInstruction": "Ve a Google Maps → selecciona los puntos de inicio/fin → haz clic en <strong>Indicaciones</strong> → copia el enlace.",
        "openLinkTest": "Probar enlace",
        "saveRoadmap": "Guardar ruta",
        "selectRoadmapDay": "Seleccionar día de la ruta"
    },
    "de": {
        "readyToExplore": "Bereit, die Reise zu erkunden!",
        "exploreDesc": "Wählen Sie eine Kategorie in der Navigationsleiste oder klicken Sie auf die Statistikkarten, um Details anzuzeigen.",
        "packing": "Packliste",
        "documents": "Reisedokumente",
        "pasteMapLink": "Google Maps-Routenlink einfügen",
        "mapInstruction": "Gehen Sie zu Google Maps → Start/Ziel auswählen → auf <strong>Routen</strong> klicken → Link kopieren.",
        "openLinkTest": "Link testen",
        "saveRoadmap": "Route speichern",
        "selectRoadmapDay": "Routentag auswählen"
    },
    "it": {
        "readyToExplore": "Pronto a esplorare il viaggio!",
        "exploreDesc": "Seleziona una categoria dalla barra di navigazione o clicca sulle schede per i dettagli del viaggio.",
        "packing": "Lista bagagli",
        "documents": "Documenti di viaggio",
        "pasteMapLink": "Incolla link percorso Google Maps",
        "mapInstruction": "Vai su Google Maps → seleziona inizio/fine → clicca su <strong>Indicazioni stradali</strong> → copia il link.",
        "openLinkTest": "Testa link",
        "saveRoadmap": "Salva itinerario",
        "selectRoadmapDay": "Seleziona giorno itinerario"
    },
    "pt": {
        "readyToExplore": "Pronto para explorar a viagem!",
        "exploreDesc": "Selecione uma categoria na barra de navegação ou clique nos cartões estatísticos para ver detalhes.",
        "packing": "Lista de bagagem",
        "documents": "Documentos de viagem",
        "pasteMapLink": "Colar link da rota do Google Maps",
        "mapInstruction": "Vá ao Google Maps → selecione início/fim → clique em <strong>Rotas</strong> → copie o link.",
        "openLinkTest": "Testar link",
        "saveRoadmap": "Salvar roteiro",
        "selectRoadmapDay": "Selecionar dia do roteiro"
    },
    "id": {
        "readyToExplore": "Siap menjelajahi perjalanan!",
        "exploreDesc": "Pilih kategori dari bilah navigasi atau klik pada kartu statistik untuk melihat detail perjalanan.",
        "packing": "Daftar barang bawaan",
        "documents": "Dokumen perjalanan",
        "pasteMapLink": "Tempel tautan rute Google Maps",
        "mapInstruction": "Buka Google Maps → pilih titik awal/akhir → klik <strong>Rute</strong> → salin tautan.",
        "openLinkTest": "Uji tautan",
        "saveRoadmap": "Simpan peta jalan",
        "selectRoadmapDay": "Pilih hari peta jalan"
    },
    "ja": {
        "readyToExplore": "旅行を探索する準備ができました！",
        "exploreDesc": "ナビゲーションバーからカテゴリを選択するか、統計カードをクリックして旅行の詳細を表示します。",
        "packing": "持ち物リスト",
        "documents": "旅行書類",
        "pasteMapLink": "Googleマップのルートリンクを貼り付け",
        "mapInstruction": "Googleマップに移動 → 出発地/目的地を選択 → <strong>ルート</strong> をクリック → リンクをコピーします。",
        "openLinkTest": "リンクをテスト",
        "saveRoadmap": "ロードマップを保存",
        "selectRoadmapDay": "ロードマップの日を選択"
    },
    "ko": {
        "readyToExplore": "여행을 탐색할 준비가 되었습니다!",
        "exploreDesc": "내비게이션 바에서 카테고리를 선택하거나 통계 카드를 클릭하여 여행 세부 정보를 봅니다.",
        "packing": "짐 싸기 목록",
        "documents": "여행 서류",
        "pasteMapLink": "Google 지도 경로 링크 붙여넣기",
        "mapInstruction": "Google 지도로 이동 → 출발/도착 지점 선택 → <strong>길찾기</strong> 클릭 → 링크 복사.",
        "openLinkTest": "링크 테스트",
        "saveRoadmap": "로드맵 저장",
        "selectRoadmapDay": "로드맵 날짜 선택"
    },
    "th": {
        "readyToExplore": "พร้อมที่จะสำรวจการเดินทางแล้ว!",
        "exploreDesc": "เลือกหมวดหมู่จากแถบนำทางหรือคลิกที่การ์ดสถิติเพื่อดูรายละเอียดการเดินทาง",
        "packing": "รายการจัดกระเป๋า",
        "documents": "เอกสารการเดินทาง",
        "pasteMapLink": "วางลิงก์เส้นทาง Google Maps",
        "mapInstruction": "ไปที่ Google Maps → เลือกจุดเริ่มต้น/สิ้นสุด → คลิก <strong>เส้นทาง</strong> → คัดลอกลิงก์",
        "openLinkTest": "ทดสอบลิงก์",
        "saveRoadmap": "บันทึกแผนการเดินทาง",
        "selectRoadmapDay": "เลือกวันแผนการเดินทาง"
    },
    "zh": {
        "readyToExplore": "准备好探索旅行了！",
        "exploreDesc": "从导航栏中选择类别或单击统计卡片以查看旅行详情。",
        "packing": "行李清单",
        "documents": "旅行证件",
        "pasteMapLink": "粘贴 Google 地图路线链接",
        "mapInstruction": "转到 Google 地图 → 选择起点/终点 → 单击<strong>路线</strong> → 复制链接。",
        "openLinkTest": "测试链接",
        "saveRoadmap": "保存路线图",
        "selectRoadmapDay": "选择路线图日期"
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

content = content.replace('Ngày {dayIndex + 1}', '{t("share.day")} {dayIndex + 1}')
content = content.replace('Ngày {idx + 1}', '{t("share.day")} {idx + 1}')
content = content.replace('Sẵn sàng khám phá chuyến đi!', '{t("share.readyToExplore")}')
content = content.replace('Hãy chọn một danh mục ở thanh điều hướng hoặc nhấp vào các thẻ thống kê để xem chi tiết hành trình nhé.', '{t("share.exploreDesc")}')
content = content.replace('Chuẩn bị hành lý', '{t("share.packing")}')
content = content.replace('Giấy tờ du lịch', '{t("share.documents")}')
content = content.replace('Dán link lộ trình Google Maps', '{t("share.pasteMapLink")}')
content = content.replace('<p className="text-[12px] text-slate-500 font-medium mt-0.5 leading-relaxed">\n                Vào Google Maps → chọn điểm đầu/cuối → nhấn <strong>Đường đi</strong> → sao chép link trên thanh địa chỉ.\n              </p>', '<p className="text-[12px] text-slate-500 font-medium mt-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: t("share.mapInstruction") }} />')
content = content.replace('Mở link kiểm tra &rarr;', '{t("share.openLinkTest")} &rarr;')
content = content.replace('saveLabel="Lưu lộ trình"', 'saveLabel={t("share.saveRoadmap")}')
content = content.replace('title="Chọn ngày lộ trình"', 'title={t("share.selectRoadmapDay")}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated more shared strings.")
