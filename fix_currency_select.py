import os
import re

path = 'src/features/more/MoreScreen.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Select to imports
content = content.replace(
    'import { BottomSheet, FormActions, Input, ScreenTitle, TypedDeleteConfirmModal, classNames } from "../../components/ui";',
    'import { BottomSheet, FormActions, Input, ScreenTitle, Select, TypedDeleteConfirmModal, classNames } from "../../components/ui";'
)

# 2. Add currency options array and labels outside component
currency_data = """
const CURRENCY_OPTIONS = [
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
};
"""

if 'CURRENCY_OPTIONS' not in content:
    # insert before function MoreScreen()
    content = content.replace('export function MoreScreen() {', currency_data + '\nexport function MoreScreen() {')

# 3. Replace the native select with <Select>
old_ui = """          <div className="relative">
            <select
              value={form.defaultCurrency || "VND"}
              onChange={(e) => setForm(f => ({ ...f, defaultCurrency: e.target.value }))}
              className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-[15px] font-bold text-kat-dark outline-none transition-all focus:border-kat-primary focus:bg-white dark:border-slate-700/50 dark:bg-slate-800 dark:text-white dark:focus:border-kat-primary"
            >
              <option value="VND">VND - Việt Nam Đồng</option>
              <option value="USD">USD - Đô la Mỹ</option>
              <option value="EUR">EUR - Euro</option>
              <option value="JPY">JPY - Yên Nhật</option>
              <option value="KRW">KRW - Won Hàn Quốc</option>
              <option value="THB">THB - Baht Thái</option>
              <option value="SGD">SGD - Đô la Singapore</option>
              <option value="TWD">TWD - Đài tệ</option>
              <option value="CNY">CNY - Nhân dân tệ</option>
              <option value="GBP">GBP - Bảng Anh</option>
              <option value="AUD">AUD - Đô la Úc</option>
              <option value="CAD">CAD - Đô la Canada</option>
              <option value="MYR">MYR - Ringgit Malaysia</option>
              <option value="IDR">IDR - Rupiah Indonesia</option>
              <option value="PHP">PHP - Peso Philippines</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <HugeiconsIcon icon={ChevronDownIcon} size={18} />
            </div>
          </div>"""

new_ui = """          <Select
            value={form.defaultCurrency || "VND"}
            onChange={(val) => setForm(f => ({ ...f, defaultCurrency: val }))}
            options={CURRENCY_OPTIONS}
            labels={CURRENCY_LABELS}
            buttonClassName="!rounded-2xl !py-3.5 !border-2 !border-slate-200 dark:!border-slate-700/50"
          />"""

content = content.replace(old_ui, new_ui)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
