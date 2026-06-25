import json
import os

translations = {
    "ko": {
        "emptyStateTitle": "짐에 물건이 없습니다",
        "emptyStateDesc": "서류, 옷, 전자기기, 의약품을 추가하여 여행을 준비하세요.",
        "quickSuggestionsTitle": "빠른 준비물 추천",
        "quickSuggestions": "빠른 추천",
        "scrollRight": "가로로 스크롤 ›",
        "sugPassport": "여권 및 신분증",
        "sugClothes": "야외 활동복",
        "sugPowerBank": "보조 배터리 및 케이블",
        "sugMeds": "해열제 및 밴드",
        "sugToothbrush": "칫솔 및 치약",
        "sugMoney": "현금 및 카드",
        "sugTowel": "수건",
        "sugSnacks": "간식"
    },
    "zh": {
        "emptyStateTitle": "行李中暂无物品",
        "emptyStateDesc": "添加证件、衣物、电子产品或药品，为旅行做好准备。",
        "quickSuggestionsTitle": "快速行李建议",
        "quickSuggestions": "快速建议",
        "scrollRight": "向右滑动 ›",
        "sugPassport": "护照和身份证",
        "sugClothes": "户外衣物",
        "sugPowerBank": "充电宝和数据线",
        "sugMeds": "退烧药和创可贴",
        "sugToothbrush": "牙刷和牙膏",
        "sugMoney": "现金和银行卡",
        "sugTowel": "毛巾",
        "sugSnacks": "零食"
    },
    "ja": {
        "emptyStateTitle": "荷物にアイテムがありません",
        "emptyStateDesc": "書類、衣服、電子機器、薬などを追加して旅行に備えましょう。",
        "quickSuggestionsTitle": "荷物のクイック提案",
        "quickSuggestions": "クイック提案",
        "scrollRight": "横にスクロール ›",
        "sugPassport": "パスポートと身分証明書",
        "sugClothes": "アウトドア服",
        "sugPowerBank": "モバイルバッテリーとケーブル",
        "sugMeds": "解熱剤と絆創膏",
        "sugToothbrush": "歯ブラシと歯磨き粉",
        "sugMoney": "現金とカード",
        "sugTowel": "タオル",
        "sugSnacks": "軽食"
    },
    "en": {
        "emptyStateTitle": "No items in packing list",
        "emptyStateDesc": "Add documents, clothing, devices, or medicine to get ready for the trip.",
        "quickSuggestionsTitle": "Quick packing suggestions",
        "quickSuggestions": "Quick suggestions",
        "scrollRight": "Scroll right ›",
        "sugPassport": "Passport & ID",
        "sugClothes": "Outdoor clothing",
        "sugPowerBank": "Power bank & Cables",
        "sugMeds": "Fever meds & Band-Aids",
        "sugToothbrush": "Toothbrush & Paste",
        "sugMoney": "Cash & Cards",
        "sugTowel": "Towel",
        "sugSnacks": "Snacks"
    },
    "es": {
        "emptyStateTitle": "No hay artículos en el equipaje",
        "emptyStateDesc": "Añade documentos, ropa, dispositivos o medicinas para preparar el viaje.",
        "quickSuggestionsTitle": "Sugerencias rápidas",
        "quickSuggestions": "Sugerencias rápidas",
        "scrollRight": "Desplazar a la derecha ›",
        "sugPassport": "Pasaporte e ID",
        "sugClothes": "Ropa de exterior",
        "sugPowerBank": "Batería y cables",
        "sugMeds": "Medicinas y Tiritas",
        "sugToothbrush": "Cepillo y pasta",
        "sugMoney": "Efectivo y tarjetas",
        "sugTowel": "Toalla",
        "sugSnacks": "Snacks"
    },
    "fr": {
        "emptyStateTitle": "Aucun article dans les bagages",
        "emptyStateDesc": "Ajoutez des documents, vêtements, appareils ou médicaments pour préparer le voyage.",
        "quickSuggestionsTitle": "Suggestions rapides",
        "quickSuggestions": "Suggestions rapides",
        "scrollRight": "Faites défiler ›",
        "sugPassport": "Passeport et ID",
        "sugClothes": "Vêtements d'extérieur",
        "sugPowerBank": "Batterie et câbles",
        "sugMeds": "Médicaments et Pansements",
        "sugToothbrush": "Brosse et dentifrice",
        "sugMoney": "Espèces et cartes",
        "sugTowel": "Serviette",
        "sugSnacks": "Snacks"
    },
    "de": {
        "emptyStateTitle": "Keine Artikel im Gepäck",
        "emptyStateDesc": "Fügen Sie Dokumente, Kleidung, Geräte oder Medikamente hinzu.",
        "quickSuggestionsTitle": "Schnelle Vorschläge",
        "quickSuggestions": "Schnelle Vorschläge",
        "scrollRight": "Nach rechts scrollen ›",
        "sugPassport": "Reisepass & ID",
        "sugClothes": "Outdoor-Kleidung",
        "sugPowerBank": "Powerbank & Kabel",
        "sugMeds": "Fiebermittel & Pflaster",
        "sugToothbrush": "Zahnbürste & Pasta",
        "sugMoney": "Bargeld & Karten",
        "sugTowel": "Handtuch",
        "sugSnacks": "Snacks"
    },
    "it": {
        "emptyStateTitle": "Nessun articolo nei bagagli",
        "emptyStateDesc": "Aggiungi documenti, vestiti, dispositivi o medicine per prepararti.",
        "quickSuggestionsTitle": "Suggerimenti rapidi",
        "quickSuggestions": "Suggerimenti rapidi",
        "scrollRight": "Scorri a destra ›",
        "sugPassport": "Passaporto e ID",
        "sugClothes": "Abbigliamento outdoor",
        "sugPowerBank": "Power bank e Cavi",
        "sugMeds": "Medicine e Cerotti",
        "sugToothbrush": "Spazzolino e Dentifricio",
        "sugMoney": "Contanti e Carte",
        "sugTowel": "Asciugamano",
        "sugSnacks": "Snack"
    },
    "pt": {
        "emptyStateTitle": "Nenhum item na bagagem",
        "emptyStateDesc": "Adicione documentos, roupas, dispositivos ou remédios para se preparar.",
        "quickSuggestionsTitle": "Sugestões rápidas",
        "quickSuggestions": "Sugestões rápidas",
        "scrollRight": "Deslize para a direita ›",
        "sugPassport": "Passaporte e ID",
        "sugClothes": "Roupas para o exterior",
        "sugPowerBank": "Power bank e Cabos",
        "sugMeds": "Remédios e Curativos",
        "sugToothbrush": "Escova e Pasta",
        "sugMoney": "Dinheiro e Cartões",
        "sugTowel": "Toalha",
        "sugSnacks": "Lanches"
    },
    "th": {
        "emptyStateTitle": "ไม่มีสิ่งของในกระเป๋า",
        "emptyStateDesc": "เพิ่มเอกสาร เสื้อผ้า อุปกรณ์ หรือยาเพื่อเตรียมพร้อมสำหรับการเดินทาง",
        "quickSuggestionsTitle": "คำแนะนำจัดกระเป๋า",
        "quickSuggestions": "คำแนะนำรวดเร็ว",
        "scrollRight": "เลื่อนขวา ›",
        "sugPassport": "พาสปอร์ต & บัตรประชาชน",
        "sugClothes": "เสื้อผ้าสำหรับกิจกรรม",
        "sugPowerBank": "พาวเวอร์แบงค์ & สายชาร์จ",
        "sugMeds": "ยาลดไข้ & พลาสเตอร์",
        "sugToothbrush": "แปรงสีฟัน & ยาสีฟัน",
        "sugMoney": "เงินสด & บัตร",
        "sugTowel": "ผ้าเช็ดตัว",
        "sugSnacks": "ขนม"
    },
    "id": {
        "emptyStateTitle": "Tidak ada barang di koper",
        "emptyStateDesc": "Tambahkan dokumen, pakaian, perangkat, atau obat untuk bersiap.",
        "quickSuggestionsTitle": "Saran bawaan cepat",
        "quickSuggestions": "Saran cepat",
        "scrollRight": "Geser ke kanan ›",
        "sugPassport": "Paspor & ID",
        "sugClothes": "Pakaian luar ruangan",
        "sugPowerBank": "Power bank & Kabel",
        "sugMeds": "Obat demam & Plester",
        "sugToothbrush": "Sikat & Pasta gigi",
        "sugMoney": "Uang tunai & Kartu",
        "sugTowel": "Handuk",
        "sugSnacks": "Camilan"
    },
    "vi": {
        "emptyStateTitle": "Chưa có món đồ nào trong hành lý",
        "emptyStateDesc": "Thêm giấy tờ, quần áo, thiết bị hoặc thuốc men để chuyến đi sẵn sàng hơn.",
        "quickSuggestionsTitle": "Gợi ý nhanh cho hành lý",
        "quickSuggestions": "Gợi ý nhanh",
        "scrollRight": "Cuộn ngang ›",
        "sugPassport": "Hộ chiếu & CCCD",
        "sugClothes": "Quần áo dã ngoại",
        "sugPowerBank": "Sạc dự phòng, cáp sạc",
        "sugMeds": "Thuốc hạ sốt, băng cá nhân",
        "sugToothbrush": "Bàn chải & Kem đánh răng",
        "sugMoney": "Tiền mặt & thẻ",
        "sugTowel": "Khăn tắm",
        "sugSnacks": "Đồ ăn nhẹ"
    }
}

for lang, data_dict in translations.items():
    filepath = f"src/locales/{lang}.json"
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if "packing" not in data:
        data["packing"] = {}
        
    for k, v in data_dict.items():
        data["packing"][k] = v

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {filepath}")
