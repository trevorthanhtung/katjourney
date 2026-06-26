import os
import re

path = 'src/features/expenses/ExpensesScreen.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. BreakdownSection
content = re.sub(
    r'export function BreakdownSection\(\{([^}]+)\}\s*:\s*\{\s*items:\s*Record<string,\s*number>;\s*total:\s*number;\s*emptyText:\s*string\s*\}\)',
    r'export function BreakdownSection({\1, currency}: { items: Record<string, number>; total: number; emptyText: string; currency?: string })',
    content
)

# 2. SettlementCard
content = re.sub(
    r'export function SettlementCard\(\{([^}]+)\}\s*:\s*\{\s*members:\s*Member\[\];\s*expenses:\s*Expense\[\];\s*settlements:\s*Array<\{[^\}]+\}>\s*\}\)',
    r'export function SettlementCard({\1, currency}: { members: Member[]; expenses: Expense[]; settlements: Array<{ from: string; to: string; amount: number }>; currency?: string })',
    content
)

# 3. ExpenseCard
content = re.sub(
    r'const ExpenseCard = React\.memo\(function ExpenseCard\(\{([^}]+)\}\s*:\s*\{\s*item:\s*Expense;\s*onClick:\s*\(\)\s*=>\s*void\s*\}\)',
    r'const ExpenseCard = React.memo(function ExpenseCard({\1, currency}: { item: Expense; onClick: () => void; currency?: string })',
    content
)
content = content.replace(
    'item.currency !== "VND" &&',
    'item.currency !== (currency || "VND") &&'
)

# 4. ExpenseForm
content = re.sub(
    r'function ExpenseForm\(\{([^}]+)\}\s*:\s*\{\s*tripId:\s*number;\s*members:\s*Member\[\];([^}]+)\}\)',
    r'function ExpenseForm({\1, currency}: { tripId: number; members: Member[]; \2; currency?: string })',
    content
)
content = content.replace(
    'currency: "VND",',
    'currency: currency || "VND",'
)
content = content.replace(
    'currency: editing.currency || "VND",',
    'currency: editing.currency || currency || "VND",'
)
content = content.replace(
    'if (trip?.defaultCurrency && trip.defaultCurrency !== "VND") {',
    'if (false) {'
)
content = content.replace(
    'form.currency === "VND"',
    'form.currency === (currency || "VND")'
)
content = content.replace(
    'form.currency !== "VND"',
    'form.currency !== (currency || "VND")'
)
content = content.replace(
    'currency === "VND"',
    'currency === (currency || "VND")'
)
content = content.replace(
    'setForm({ ...form, currency: "VND", exchangeRate: 1 });',
    'setForm({ ...form, currency: currency || "VND", exchangeRate: 1 });'
)

# 5. Add useLiveQuery to ExpensesScreen
if 'useLiveQuery' not in content:
    content = content.replace(
        'import React, { useEffect, useRef, useState } from "react";',
        'import React, { useEffect, useRef, useState } from "react";\nimport { useLiveQuery } from "dexie-react-hooks";'
    )
content = content.replace(
    'isReadOnly?: boolean;\n}) {\n  const { t } = useTranslation();',
    'isReadOnly?: boolean;\n}) {\n  const { t } = useTranslation();\n  const trip = useLiveQuery(async () => await db.trips.get(tripId), [tripId]);\n  const baseCurrency = trip?.defaultCurrency || "VND";'
)

# 6. Inject currency={baseCurrency} into usages in ExpensesScreen
content = content.replace(
    '<BreakdownSection items={paidByMember} total={totalExpense} emptyText={t("expenses.noPayer")} />',
    '<BreakdownSection items={paidByMember} total={totalExpense} emptyText={t("expenses.noPayer")} currency={baseCurrency} />'
)
content = content.replace(
    '<BreakdownSection items={expensesByCategory} total={totalExpense} emptyText={t("expenses.noCategory")} />',
    '<BreakdownSection items={expensesByCategory} total={totalExpense} emptyText={t("expenses.noCategory")} currency={baseCurrency} />'
)
content = content.replace(
    '<SettlementCard members={members} expenses={expenses} settlements={settlements} />',
    '<SettlementCard members={members} expenses={expenses} settlements={settlements} currency={baseCurrency} />'
)
content = content.replace(
    '<ExpenseCard\n                  key={item.id}\n                  item={item}',
    '<ExpenseCard\n                  key={item.id}\n                  item={item}\n                  currency={baseCurrency}'
)
content = content.replace(
    '<ExpenseForm\n        isOpen={isAddingExpense}',
    '<ExpenseForm\n        isOpen={isAddingExpense}\n        currency={baseCurrency}'
)
content = content.replace(
    '<ExpenseForm\n        isOpen={!!editingExpense}',
    '<ExpenseForm\n        isOpen={!!editingExpense}\n        currency={baseCurrency}'
)

# 7. formatMoney replacements
# Find all formatMoney(...) inside ExpensesScreen and replace them.
# The safest way is to do targeted replaces instead of regex that catches everything.
content = content.replace(
    '<p className="text-kat-dark dark:text-white">{formatMoney(amount)}</p>',
    '<p className="text-kat-dark dark:text-white">{formatMoney(amount, currency)}</p>'
)
content = content.replace(
    '<span className="font-black text-rose-600 text-[14.5px] mb-1 whitespace-nowrap">{formatMoney(s.amount)}</span>',
    '<span className="font-black text-rose-600 text-[14.5px] mb-1 whitespace-nowrap">{formatMoney(s.amount, currency)}</span>'
)
content = content.replace(
    '<span className="font-black text-[15px]">{formatMoney(item.amount)}</span>',
    '<span className="font-black text-[15px]">{formatMoney(item.amount, currency)}</span>'
)
content = content.replace(
    '{formatMoney(Math.round(Number(form.amount) * form.exchangeRate))}',
    '{formatMoney(Math.round(Number(form.amount) * form.exchangeRate), currency || "VND")}'
)

content = content.replace('{formatMoney(totalExpense)}', '{formatMoney(totalExpense, baseCurrency)}')
content = content.replace('{formatMoney(totalSharedExpense)}', '{formatMoney(totalSharedExpense, baseCurrency)}')
content = content.replace('{formatMoney(totalPersonalExpense)}', '{formatMoney(totalPersonalExpense, baseCurrency)}')
content = content.replace('{formatMoney(hasGroups ? perGroup : perPerson)}', '{formatMoney(hasGroups ? perGroup : perPerson, baseCurrency)}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)


# --- 2. SharedExpensesSection.tsx
share_path = 'src/features/share/components/SharedExpensesSection.tsx'
if os.path.exists(share_path):
    with open(share_path, 'r', encoding='utf-8') as f:
        share = f.read()
    
    share = share.replace(
        '<BreakdownSection items={categoryBreakdown} total={totalExpense} emptyText={t("expenses.noExpenseAnalysis")} />',
        '<BreakdownSection items={categoryBreakdown} total={totalExpense} emptyText={t("expenses.noExpenseAnalysis")} currency={trip.defaultCurrency || "VND"} />'
    )
    share = share.replace(
        '<BreakdownSection items={exactSharesByMember} total={totalShared} emptyText={t("expenses.noSharedAnalysis")} />',
        '<BreakdownSection items={exactSharesByMember} total={totalShared} emptyText={t("expenses.noSharedAnalysis")} currency={trip.defaultCurrency || "VND"} />'
    )
    share = share.replace(
        '<SettlementCard members={members} expenses={activeExpenses} settlements={settlements} />',
        '<SettlementCard members={members} expenses={activeExpenses} settlements={settlements} currency={trip.defaultCurrency || "VND"} />'
    )
    
    with open(share_path, 'w', encoding='utf-8') as f:
        f.write(share)


# --- 3. TripSearchModal.tsx
tsm_path = 'src/components/TripSearchModal.tsx'
with open(tsm_path, 'r', encoding='utf-8') as f:
    tsm = f.read()

if 'const trip = useLiveQuery' not in tsm:
    tsm = tsm.replace(
        '  const events = useLiveQuery',
        '  const trip = useLiveQuery(async () => await db.trips.get(tripId), [tripId]);\n  const events = useLiveQuery'
    )
tsm = tsm.replace(
    '{formatMoney(item.amount)}',
    '{formatMoney(item.amount, trip?.defaultCurrency || "VND")}'
)

with open(tsm_path, 'w', encoding='utf-8') as f:
    f.write(tsm)

