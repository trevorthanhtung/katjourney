import os

more_path = 'src/features/more/MoreScreen.tsx'
with open(more_path, 'r', encoding='utf-8') as f:
    more = f.read()

if 'Coins01Icon' not in more:
    more = more.replace('Location01Icon,', 'Location01Icon, Coins01Icon,')
    more = more.replace('Location01Icon }', 'Location01Icon, Coins01Icon }')

if 'defaultCurrency: trip?.defaultCurrency' not in more:
    more = more.replace(
        'tripType: trip?.tripType ?? (trip?.startDate === trip?.endDate ? "dayTrip" : "multiDay"),\n        startDate: trip?.startDate ?? today',
        'defaultCurrency: trip?.defaultCurrency,\n        tripType: trip?.tripType ?? (trip?.startDate === trip?.endDate ? "dayTrip" : "multiDay"),\n        startDate: trip?.startDate ?? today'
    )

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
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <HugeiconsIcon icon={ChevronDownIcon} size={18} />
            </div>
          </div>
        </div>
"""

if 'CURRENCY SECTION' not in more:
    more = more.replace('        {/* === DATE SECTION replaced with CalendarRangePicker === */}', currency_ui + '\n        {/* === DATE SECTION replaced with CalendarRangePicker === */}')

with open(more_path, 'w', encoding='utf-8') as f:
    f.write(more)

# Update exportPdf.ts
pdf_path = 'src/utils/exportPdf.ts'
with open(pdf_path, 'r', encoding='utf-8') as f:
    pdf = f.read()

pdf = pdf.replace('formatMoney(sharedTotal)', 'formatMoney(sharedTotal, trip.defaultCurrency)')
pdf = pdf.replace('formatMoney(personalTotal)', 'formatMoney(personalTotal, trip.defaultCurrency)')
pdf = pdf.replace('formatMoney(grandTotal)', 'formatMoney(grandTotal, trip.defaultCurrency)')

with open(pdf_path, 'w', encoding='utf-8') as f:
    f.write(pdf)
