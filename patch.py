import os

path = 'src/features/expenses/ExpensesScreen.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add `currency` prop to BreakdownSection
content = content.replace(
    '  emptyText: string \n  }) {',
    '  emptyText: string;\n  currency?: string\n  }) {'
)
content = content.replace(
    '<p className="text-kat-dark dark:text-white">{formatMoney(amount)}</p>',
    '<p className="text-kat-dark dark:text-white">{formatMoney(amount, currency)}</p>'
)

# 2. Add `currency` prop to SettlementSection
content = content.replace(
    'export function SettlementSection({ suggestions }: { suggestions: Array<{ from: string; to: string; amount: number }> }) {',
    'export function SettlementSection({ suggestions, currency }: { suggestions: Array<{ from: string; to: string; amount: number }>; currency?: string }) {'
)
content = content.replace(
    '{formatMoney(s.amount)}',
    '{formatMoney(s.amount, currency)}'
)

# 3. Add `currency` prop to ExpenseItemCard
content = content.replace(
    'export function ExpenseItemCard({ item, onClick }: { item: Expense; onClick: () => void }) {',
    'export function ExpenseItemCard({ item, onClick, currency }: { item: Expense; onClick: () => void; currency?: string }) {'
)
content = content.replace(
    '{formatMoney(item.amount)}',
    '{formatMoney(item.amount, currency)}'
)
# Fix ExpenseItemCard UI where it shows VND original amount if different from VND
content = content.replace(
    'item.currency !== "VND" &&',
    'item.currency !== (currency || "VND") &&'
)

# 4. Add `currency` prop to ExpenseFormModal
content = content.replace(
    '  members,\n  onSaved\n}: {',
    '  members,\n  currency,\n  onSaved\n}: {'
)
content = content.replace(
    '  members: Member[];\n  onSaved: () => void;\n}) {',
    '  members: Member[];\n  currency?: string;\n  onSaved: () => void;\n}) {'
)

# Fix logic inside ExpenseFormModal
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
content = content.replace(
    '{formatMoney(Math.round(Number(form.amount) * form.exchangeRate))}',
    '{formatMoney(Math.round(Number(form.amount) * form.exchangeRate), currency || "VND")}'
)

# 5. Fix ExpensesScreen component usages
if 'useLiveQuery' not in content:
    content = content.replace(
        'import React, { useEffect, useRef, useState } from "react";',
        'import React, { useEffect, useRef, useState } from "react";\nimport { useLiveQuery } from "dexie-react-hooks";'
    )

content = content.replace(
    'export function ExpensesScreen({\n  expenses,',
    'export function ExpensesScreen({\n  expenses,'
)
content = content.replace(
    'isReadOnly?: boolean;\n}) {\n  const { t } = useTranslation();',
    'isReadOnly?: boolean;\n}) {\n  const { t } = useTranslation();\n  const trip = useLiveQuery(async () => await db.trips.get(tripId), [tripId]);\n  const baseCurrency = trip?.defaultCurrency || "VND";'
)

# Pass `currency={baseCurrency}` to BreakdownSection
content = content.replace(
    '<BreakdownSection items={paidByMember} total={totalExpense} emptyText={t("expenses.noPayer")} />',
    '<BreakdownSection items={paidByMember} total={totalExpense} emptyText={t("expenses.noPayer")} currency={baseCurrency} />'
)
content = content.replace(
    '<BreakdownSection items={expensesByCategory} total={totalExpense} emptyText={t("expenses.noCategory")} />',
    '<BreakdownSection items={expensesByCategory} total={totalExpense} emptyText={t("expenses.noCategory")} currency={baseCurrency} />'
)

# Pass `currency={baseCurrency}` to SettlementSection
content = content.replace(
    '<SettlementSection suggestions={suggestions} />',
    '<SettlementSection suggestions={suggestions} currency={baseCurrency} />'
)

# Pass `currency={baseCurrency}` to ExpenseItemCard
content = content.replace(
    '<ExpenseItemCard key={item.id} item={item} onClick={() =>',
    '<ExpenseItemCard key={item.id} item={item} currency={baseCurrency} onClick={() =>'
)

# Pass `currency={baseCurrency}` to ExpenseFormModal
content = content.replace(
    '<ExpenseFormModal\n        isOpen={isAddingExpense}',
    '<ExpenseFormModal\n        isOpen={isAddingExpense}\n        currency={baseCurrency}'
)
content = content.replace(
    '<ExpenseFormModal\n        isOpen={!!editingExpense}',
    '<ExpenseFormModal\n        isOpen={!!editingExpense}\n        currency={baseCurrency}'
)

# Update remaining formatMoney inside ExpensesScreen main body
content = content.replace(
    '{formatMoney(totalExpense)}',
    '{formatMoney(totalExpense, baseCurrency)}'
)
content = content.replace(
    '{formatMoney(totalSharedExpense)}',
    '{formatMoney(totalSharedExpense, baseCurrency)}'
)
content = content.replace(
    '{formatMoney(totalPersonalExpense)}',
    '{formatMoney(totalPersonalExpense, baseCurrency)}'
)
content = content.replace(
    '{formatMoney(hasGroups ? perGroup : perPerson)}',
    '{formatMoney(hasGroups ? perGroup : perPerson, baseCurrency)}'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

# 6. Fix SharedExpensesSection.tsx
share_path = 'src/features/share/components/SharedExpensesSection.tsx'
if os.path.exists(share_path):
    with open(share_path, 'r', encoding='utf-8') as f:
        share = f.read()
    
    # We need to get `baseCurrency` in SharedExpensesSection.
    # It receives `tripId`, so we can do `const trip = useLiveQuery(async () => await db.trips.get(tripId), [tripId]);`
    # Wait, it actually takes `expenses`, `members`. Does it take `tripId`?
    # Let's check if we can just pass currency from SharedTripScreen.
    # Let's just pass `currency: string` to it?
    pass

# 7. Fix TripSearchModal.tsx
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
