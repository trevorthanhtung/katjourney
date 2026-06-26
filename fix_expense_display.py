import os

path = 'src/features/expenses/ExpensesScreen.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix ExpenseCard amount display
old_card_amount = """      {/* Amount */}
      <div className="shrink-0 pl-2 text-right">
        <p className="font-bold text-kat-dark dark:text-white text-lg">
          {formatMoney(item.amount, currency)}
        </p>
        {item.originalAmount && item.currency && item.currency !== (currency || "VND") && (
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {new Intl.NumberFormat('en-US').format(item.originalAmount)} {item.currency}
          </p>
        )}
      </div>"""

new_card_amount = """      {/* Amount */}
      <div className="shrink-0 pl-2 text-right">
        <p className="font-bold text-kat-dark dark:text-white text-lg">
          {item.originalAmount && item.currency && item.currency !== (currency || "VND") 
            ? formatMoney(item.originalAmount, item.currency) 
            : formatMoney(item.amount, currency || "VND")}
        </p>
        {item.originalAmount && item.currency && item.currency !== (currency || "VND") && (
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            = {formatMoney(item.amount, currency || "VND")}
          </p>
        )}
      </div>"""

content = content.replace(old_card_amount, new_card_amount)


# 2. Fix vndAmount calculation to NOT round it heavily, but preserve exact float for splits.
# We will just do amountVal * form.exchangeRate
old_calc = 'const vndAmount = form.currency === (currency || "VND") ? amountVal : (Math.round(amountVal * form.exchangeRate * 100) / 100);'
new_calc = 'const vndAmount = form.currency === (currency || "VND") ? amountVal : (amountVal * form.exchangeRate);'

content = content.replace(old_calc, new_calc)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
