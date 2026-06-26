import os
import re

path = 'src/features/expenses/ExpensesScreen.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix ExpenseCard display
# Search for {formatMoney(item.amount)} and replace with {formatMoney(item.amount, currency)}
# Wait, it's safer to just replace `{formatMoney(item.amount)}`
content = content.replace(
    '{formatMoney(item.amount)}',
    '{formatMoney(item.amount, currency)}'
)

# 2. Fix ExpenseForm currency selector and exchange rate logic
# First, find the getExchangeRateToVnd function or similar, or just calculate it inline.
# Let's replace the dropdown rendering in ExpenseForm.

old_dropdown = '''<button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, currency: currency || "VND", exchangeRate: 1 });
                      setIsCurrencyDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 motion-press ${
                      form.currency === (currency || "VND")
                        ? "bg-kat-primary-soft text-kat-primary dark:bg-kat-primary/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-kat-dark dark:text-slate-200"
                    }`}
                  >
                    <span className={`text-[15px] ${form.currency === (currency || "VND") ? 'font-extrabold' : 'font-semibold'}`}>
                      {t("expenses.vnd")}
                    </span>
                    {form.currency === (currency || "VND") && <HugeiconsIcon icon={CheckIcon} size={20} className="text-kat-primary" />}
                  </button>
                  {exchangeRates.map((r) => {
                    const isSelected = form.currency === r.currencyCode;
                    return (
                      <button
                        key={r.currencyCode}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, currency: r.currencyCode, exchangeRate: r.transfer });
                          setIsCurrencyDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 motion-press ${
                          isSelected
                            ? "bg-kat-primary-soft text-kat-primary dark:bg-kat-primary/10"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-kat-dark dark:text-slate-200"
                        }`}
                      >
                        <span className={`text-[15px] ${isSelected ? 'font-extrabold' : 'font-semibold'}`}>
                          {r.currencyCode} {r.currencyName ? `(${r.currencyName})` : ""}
                        </span>
                        {isSelected && <HugeiconsIcon icon={CheckIcon} size={20} className="text-kat-primary" />}
                      </button>
                    );
                  })}'''

new_dropdown = '''
                  {/* --- Base Currency Option --- */}
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, currency: currency || "VND", exchangeRate: 1 });
                      setIsCurrencyDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 motion-press ${
                      form.currency === (currency || "VND")
                        ? "bg-kat-primary-soft text-kat-primary dark:bg-kat-primary/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-kat-dark dark:text-slate-200"
                    }`}
                  >
                    <span className={`text-[15px] ${form.currency === (currency || "VND") ? 'font-extrabold' : 'font-semibold'}`}>
                      {currency || "VND"} (Đồng tiền gốc)
                    </span>
                    {form.currency === (currency || "VND") && <HugeiconsIcon icon={CheckIcon} size={20} className="text-kat-primary" />}
                  </button>
                  
                  {/* --- VND Option (if base is not VND) --- */}
                  {(currency || "VND") !== "VND" && (
                    <button
                      type="button"
                      onClick={() => {
                        const baseRate = exchangeRates.find(x => x.currencyCode === currency)?.transfer || 1;
                        setForm({ ...form, currency: "VND", exchangeRate: 1 / baseRate });
                        setIsCurrencyDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 motion-press ${
                        form.currency === "VND"
                          ? "bg-kat-primary-soft text-kat-primary dark:bg-kat-primary/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800 text-kat-dark dark:text-slate-200"
                      }`}
                    >
                      <span className={`text-[15px] ${form.currency === "VND" ? 'font-extrabold' : 'font-semibold'}`}>
                        VND (Việt Nam Đồng)
                      </span>
                      {form.currency === "VND" && <HugeiconsIcon icon={CheckIcon} size={20} className="text-kat-primary" />}
                    </button>
                  )}

                  {/* --- Foreign Currencies Option --- */}
                  {exchangeRates.filter(r => r.currencyCode !== (currency || "VND")).map((r) => {
                    const isSelected = form.currency === r.currencyCode;
                    return (
                      <button
                        key={r.currencyCode}
                        type="button"
                        onClick={() => {
                          const baseRate = currency !== "VND" ? (exchangeRates.find(x => x.currencyCode === currency)?.transfer || 1) : 1;
                          const toBaseExchangeRate = r.transfer / baseRate;
                          setForm({ ...form, currency: r.currencyCode, exchangeRate: toBaseExchangeRate });
                          setIsCurrencyDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 motion-press ${
                          isSelected
                            ? "bg-kat-primary-soft text-kat-primary dark:bg-kat-primary/10"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-kat-dark dark:text-slate-200"
                        }`}
                      >
                        <span className={`text-[15px] ${isSelected ? 'font-extrabold' : 'font-semibold'}`}>
                          {r.currencyCode} {r.currencyName ? `(${r.currencyName})` : ""}
                        </span>
                        {isSelected && <HugeiconsIcon icon={CheckIcon} size={20} className="text-kat-primary" />}
                      </button>
                    );
                  })}
'''

content = content.replace(old_dropdown, new_dropdown)


# 3. Fix the vndAmount to use form.exchangeRate but we also need to allow decimal calculation
# Math.round might truncate decimals for currencies like AUD or EUR which use cents.
# But `amount` is stored as `Math.round`. 
# Actually, if we use Math.round, 22.50 AUD becomes 23 AUD!
# We should not round it here if the base currency supports decimals. 
# We can round it to 2 decimal places. `Math.round(val * 100) / 100`.
old_calc = 'const vndAmount = form.currency === (currency || "VND") ? amountVal : Math.round(amountVal * form.exchangeRate);'
new_calc = 'const vndAmount = form.currency === (currency || "VND") ? amountVal : (Math.round(amountVal * form.exchangeRate * 100) / 100);'
content = content.replace(old_calc, new_calc)


# 4. Make sure exchangeRate input displays up to 4 decimal places instead of being formatted blindly
# {formatMoney(Math.round(Number(form.amount) * form.exchangeRate), currency || "VND")}
# Should be {formatMoney(Number(form.amount) * form.exchangeRate, currency || "VND")}
content = content.replace(
    '{formatMoney(Math.round(Number(form.amount) * form.exchangeRate), currency || "VND")}',
    '{formatMoney(Number(form.amount) * form.exchangeRate, currency || "VND")}'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed ExpensesScreen.tsx")
