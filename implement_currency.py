import os
import re

# 1. Update helpers.ts formatMoney and formatMoneyCompact
helpers_path = 'src/utils/helpers.ts'
with open(helpers_path, 'r', encoding='utf-8') as f:
    helpers = f.read()

helpers = helpers.replace('export function formatMoney(value: number) {', 'export function formatMoney(value: number, currency: string = "VND") {')
helpers = helpers.replace(
    'return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })\n    .format(value)\n    .replace(/\\s+/g, "")\n    .replace(/[đĐVNDvnd]/g, "₫");',
    'if (currency === "VND") {\n    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })\n      .format(value)\n      .replace(/\\s+/g, "")\n      .replace(/[đĐVNDvnd]/g, "₫");\n  }\n  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);'
)

helpers = helpers.replace('export function formatMoneyCompact(value: number) {', 'export function formatMoneyCompact(value: number, currency: string = "VND") {')
helpers = helpers.replace(
    'if (value >= 1e9) {',
    'if (currency === "VND") {\n    if (value >= 1e9) {'
)
helpers = helpers.replace(
    'return formatMoney(value);\n}',
    'return formatMoney(value, currency);\n  }\n  return new Intl.NumberFormat(undefined, { style: "currency", currency, notation: "compact" }).format(value);\n}'
)

with open(helpers_path, 'w', encoding='utf-8') as f:
    f.write(helpers)


# 2. Update MoreScreen.tsx TripForm
more_path = 'src/features/more/MoreScreen.tsx'
with open(more_path, 'r', encoding='utf-8') as f:
    more = f.read()

# Add Coins01Icon
if 'Coins01Icon' not in more:
    more = more.replace('Location01Icon,', 'Location01Icon, Coins01Icon,')
    more = more.replace('Location01Icon }', 'Location01Icon, Coins01Icon }')

# Add missing defaultCurrency to useEffect
more = more.replace(
    'tripType: trip?.tripType ?? (trip?.startDate === trip?.endDate ? "dayTrip" : "multiDay"),\n        startDate: trip?.startDate ?? today',
    'defaultCurrency: trip?.defaultCurrency,\n        tripType: trip?.tripType ?? (trip?.startDate === trip?.endDate ? "dayTrip" : "multiDay"),\n        startDate: trip?.startDate ?? today'
)

# Add currency selector UI after Date section
currency_ui = """
        {/* === CURRENCY SECTION === */}
        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <HugeiconsIcon icon={Coins01Icon} size={16} className="text-slate-500" />
            {t("tripForm.currencyLabel") || "Đơn vị tiền tệ (Base Currency)"}
          </span>
          <div className="relative">
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
          </div>
        </div>
"""
if "CURRENCY SECTION" not in more:
    more = more.replace('        {/* === DATE SECTION replaced with CalendarRangePicker === */}', currency_ui + '\n        {/* === DATE SECTION replaced with CalendarRangePicker === */}')

with open(more_path, 'w', encoding='utf-8') as f:
    f.write(more)


# 3. Update ExpensesScreen.tsx
exp_path = 'src/features/expenses/ExpensesScreen.tsx'
with open(exp_path, 'r', encoding='utf-8') as f:
    exp = f.read()

# Replace formatMoney(X) with formatMoney(X, baseCurrency)
exp = exp.replace('formatMoney(amount)', 'formatMoney(amount, trip?.defaultCurrency || "VND")')
exp = exp.replace('formatMoney(s.amount)', 'formatMoney(s.amount, trip?.defaultCurrency || "VND")')
exp = exp.replace('formatMoney(item.amount)', 'formatMoney(item.amount, trip?.defaultCurrency || "VND")')
exp = exp.replace('formatMoney(Math.round(Number(form.amount) * form.exchangeRate))', 'formatMoney(Math.round(Number(form.amount) * form.exchangeRate), trip?.defaultCurrency || "VND")')
exp = exp.replace('formatMoney(totalExpense)', 'formatMoney(totalExpense, trip?.defaultCurrency || "VND")')
exp = exp.replace('formatMoney(totalSharedExpense)', 'formatMoney(totalSharedExpense, trip?.defaultCurrency || "VND")')
exp = exp.replace('formatMoney(totalPersonalExpense)', 'formatMoney(totalPersonalExpense, trip?.defaultCurrency || "VND")')
exp = exp.replace('formatMoney(hasGroups ? perGroup : perPerson)', 'formatMoney(hasGroups ? perGroup : perPerson, trip?.defaultCurrency || "VND")')

# Auto-detect currency logic when creating expense
# Currently it defaults to "VND". We should default to baseCurrency.
exp = exp.replace('currency: "VND",', 'currency: trip?.defaultCurrency || "VND",')
exp = exp.replace('currency: editing.currency || "VND",', 'currency: editing.currency || trip?.defaultCurrency || "VND",')
exp = exp.replace('form.currency === "VND"', 'form.currency === (trip?.defaultCurrency || "VND")')
exp = exp.replace('form.currency !== "VND"', 'form.currency !== (trip?.defaultCurrency || "VND")')
exp = exp.replace('currency === "VND"', 'currency === (trip?.defaultCurrency || "VND")')
exp = exp.replace('setForm({ ...form, currency: "VND", exchangeRate: 1 });', 'setForm({ ...form, currency: trip?.defaultCurrency || "VND", exchangeRate: 1 });')
# In ExpensesScreen line 485, it checks `if (trip?.defaultCurrency && trip.defaultCurrency !== "VND") {`
# We change that to skip it entirely because we initialize form.currency = trip.defaultCurrency.
# But if it's new expense, we want the default exchange rate to be 1 if it matches defaultCurrency.
exp = exp.replace(
    'if (trip?.defaultCurrency && trip.defaultCurrency !== "VND") {',
    'if (false) {' # disable this block because we are changing the base logic
)

with open(exp_path, 'w', encoding='utf-8') as f:
    f.write(exp)


# 4. Update TripSearchModal.tsx
tsm_path = 'src/components/TripSearchModal.tsx'
with open(tsm_path, 'r', encoding='utf-8') as f:
    tsm = f.read()

# Try to find the trip of the expense to pass its currency
tsm = tsm.replace('{formatMoney(item.amount)}', '{formatMoney(item.amount, item.tripId ? (trips.find(t => t.id === item.tripId)?.defaultCurrency || "VND") : "VND")}')
with open(tsm_path, 'w', encoding='utf-8') as f:
    f.write(tsm)


# 5. Update exportPdf.ts
pdf_path = 'src/utils/exportPdf.ts'
with open(pdf_path, 'r', encoding='utf-8') as f:
    pdf = f.read()

pdf = pdf.replace('formatMoney(sharedTotal)', 'formatMoney(sharedTotal, trip.defaultCurrency)')
pdf = pdf.replace('formatMoney(personalTotal)', 'formatMoney(personalTotal, trip.defaultCurrency)')
pdf = pdf.replace('formatMoney(grandTotal)', 'formatMoney(grandTotal, trip.defaultCurrency)')
with open(pdf_path, 'w', encoding='utf-8') as f:
    f.write(pdf)

print("Injected multi-currency support.")
