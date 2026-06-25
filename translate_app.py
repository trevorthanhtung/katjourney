import json
import os

translations = {
    "vi": "Chuyến đi đã kết thúc — chỉ xem, không chỉnh sửa.",
    "en": "Trip has ended — read-only, no edits allowed.",
    "ja": "旅行は終了しました — 読み取り専用です。編集はできません。",
    "ko": "여행이 종료되었습니다 — 읽기 전용이며 편집할 수 없습니다.",
    "zh": "行程已结束 — 仅供查看，不可编辑。",
    "es": "El viaje ha terminado — solo lectura, no se permiten ediciones.",
    "fr": "Le voyage est terminé — lecture seule, aucune modification.",
    "de": "Reise ist beendet — schreibgeschützt, keine Änderungen.",
    "it": "Il viaggio è terminato — sola lettura, modifiche non consentite.",
    "pt": "A viagem terminou — somente leitura, sem edições.",
    "th": "การเดินทางสิ้นสุดแล้ว — อ่านอย่างเดียว ไม่สามารถแก้ไขได้",
    "id": "Perjalanan telah berakhir — hanya baca, tidak dapat diedit."
}

for lang, text in translations.items():
    filepath = f"src/locales/{lang}.json"
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if "common" not in data:
        data["common"] = {}
        
    data["common"]["archivedBanner"] = text

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {filepath}")
