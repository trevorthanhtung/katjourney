import json
import os

locales = {
  "vi": "Đơn vị tiền tệ",
  "en": "Base Currency",
  "de": "Basiswährung",
  "es": "Moneda base",
  "fr": "Devise de base",
  "id": "Mata Uang Dasar",
  "it": "Valuta di base",
  "ja": "基本通貨",
  "ko": "기본 통화",
  "pt": "Moeda base",
  "th": "สกุลเงินหลัก",
  "zh": "基础货币"
}

for lang, text in locales.items():
    filepath = f"src/locales/{lang}.json"
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "tripForm" not in data:
            data["tripForm"] = {}
        
        data["tripForm"]["currencyLabel"] = text
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

more_path = 'src/features/more/MoreScreen.tsx'
with open(more_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '{t("tripForm.currencyLabel") || "Đơn vị tiền tệ (Base Currency)"}',
    '{t("tripForm.currencyLabel")}'
)

with open(more_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated 12 locales and MoreScreen")
