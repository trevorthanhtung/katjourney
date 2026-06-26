import os

more_path = 'src/features/more/MoreScreen.tsx'
with open(more_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_options = """const CURRENCY_OPTIONS = [
  "VND", "USD", "EUR", "JPY", "KRW", "THB", "SGD", 
  "TWD", "CNY", "GBP", "AUD", "CAD", "MYR", "IDR", "PHP"
];

const CURRENCY_LABELS: Record<string, string> = {
  VND: "VND - Việt Nam Đồng",
  USD: "USD - Đô la Mỹ",
  EUR: "EUR - Euro",
  JPY: "JPY - Yên Nhật",
  KRW: "KRW - Won Hàn Quốc",
  THB: "THB - Baht Thái",
  SGD: "SGD - Đô la Singapore",
  TWD: "TWD - Đài tệ",
  CNY: "CNY - Nhân dân tệ",
  GBP: "GBP - Bảng Anh",
  AUD: "AUD - Đô la Úc",
  CAD: "CAD - Đô la Canada",
  MYR: "MYR - Ringgit Malaysia",
  IDR: "IDR - Rupiah Indonesia",
  PHP: "PHP - Peso Philippines",
};"""

new_options = """const CURRENCY_OPTIONS = [
  "VND", "USD", "EUR", "GBP", "JPY", "AUD", "SGD", 
  "THB", "CAD", "CHF", "HKD", "NZD", "SEK", "NOK", 
  "DKK", "RUB", "KWD", "SAR", "INR", "KRW", "CNY", "MYR"
];

const CURRENCY_LABELS: Record<string, string> = {
  VND: "VND - Việt Nam Đồng",
  USD: "USD - Đô la Mỹ",
  EUR: "EUR - Euro",
  GBP: "GBP - Bảng Anh",
  JPY: "JPY - Yên Nhật",
  AUD: "AUD - Đô la Úc",
  SGD: "SGD - Đô la Singapore",
  THB: "THB - Baht Thái",
  CAD: "CAD - Đô la Canada",
  CHF: "CHF - Franc Thụy Sĩ",
  HKD: "HKD - Đô la Hồng Kông",
  NZD: "NZD - Đô la New Zealand",
  SEK: "SEK - Krona Thụy Điển",
  NOK: "NOK - Krone Na Uy",
  DKK: "DKK - Krone Đan Mạch",
  RUB: "RUB - Rúp Nga",
  KWD: "KWD - Dinar Kuwait",
  SAR: "SAR - Riyal Ả Rập Xê Út",
  INR: "INR - Rupee Ấn Độ",
  KRW: "KRW - Won Hàn Quốc",
  CNY: "CNY - Nhân dân tệ",
  MYR: "MYR - Ringgit Malaysia",
};"""

content = content.replace(old_options, new_options)

old_select = """          <Select
            value={form.defaultCurrency || "VND"}
            onChange={(val) => setForm(f => ({ ...f, defaultCurrency: val }))}
            options={CURRENCY_OPTIONS}
            labels={CURRENCY_LABELS}
            buttonClassName="w-full !rounded-2xl !py-3.5 !border-2 !border-slate-200 dark:!border-slate-700/50"
          />"""

new_select = """          <Select
            value={form.defaultCurrency || "VND"}
            onChange={(val) => setForm(f => ({ ...f, defaultCurrency: val }))}
            options={CURRENCY_OPTIONS}
            labels={CURRENCY_LABELS}
          />"""

content = content.replace(old_select, new_select)

with open(more_path, 'w', encoding='utf-8') as f:
    f.write(content)
