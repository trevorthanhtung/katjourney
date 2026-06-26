import re

path = 'src/features/expenses/ExpensesScreen.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# BreakdownSection
content = re.sub(
    r'export function BreakdownSection\(\{\s*items,\s*total,\s*emptyText\s*\}\s*:\s*\{\s*items:\s*Record<string,\s*number>;\s*total:\s*number;\s*emptyText:\s*string\s*\}\) \{',
    r'export function BreakdownSection({ items, total, emptyText, baseCurrency }: { items: Record<string, number>; total: number; emptyText: string; baseCurrency: string }) {',
    content
)
content = content.replace(
    '<BreakdownSection items={paidByMember} total={totalExpense} emptyText={t("expenses.noPayer")} />',
    '<BreakdownSection items={paidByMember} total={totalExpense} emptyText={t("expenses.noPayer")} baseCurrency={trip?.defaultCurrency || "VND"} />'
)
content = content.replace(
    '<BreakdownSection items={expensesByCategory} total={totalExpense} emptyText={t("expenses.noCategory")} />',
    '<BreakdownSection items={expensesByCategory} total={totalExpense} emptyText={t("expenses.noCategory")} baseCurrency={trip?.defaultCurrency || "VND"} />'
)

# SettlementSection
content = re.sub(
    r'export function SettlementSection\(\{\s*suggestions\s*\}\s*:\s*\{\s*suggestions:\s*Array<\{\s*from:\s*string;\s*to:\s*string;\s*amount:\s*number\s*\}>\s*\}\) \{',
    r'export function SettlementSection({ suggestions, baseCurrency }: { suggestions: Array<{ from: string; to: string; amount: number }>; baseCurrency: string }) {',
    content
)
content = content.replace(
    '<SettlementSection suggestions={suggestions} />',
    '<SettlementSection suggestions={suggestions} baseCurrency={trip?.defaultCurrency || "VND"} />'
)

# ExpenseItemCard
content = re.sub(
    r'export function ExpenseItemCard\(\{\s*item,\s*onClick\s*\}\s*:\s*\{\s*item:\s*Expense;\s*onClick:\s*\(\)\s*=>\s*void\s*\}\) \{',
    r'export function ExpenseItemCard({ item, onClick, baseCurrency }: { item: Expense; onClick: () => void; baseCurrency: string }) {',
    content
)
content = content.replace(
    '<ExpenseItemCard key={item.id} item={item} onClick={() =>',
    '<ExpenseItemCard key={item.id} item={item} baseCurrency={trip?.defaultCurrency || "VND"} onClick={() =>'
)

# ExpenseFormModal
content = re.sub(
    r'export function ExpenseFormModal\(\{(.*?)\}:\s*\{(.*?)\}\)\s*\{',
    r'export function ExpenseFormModal({\1, baseCurrency}: {\2; baseCurrency: string}) {',
    content,
    flags=re.DOTALL
)
content = content.replace(
    '<ExpenseFormModal\n        isOpen={isAddingExpense}',
    '<ExpenseFormModal\n        isOpen={isAddingExpense}\n        baseCurrency={trip?.defaultCurrency || "VND"}'
)
content = content.replace(
    '<ExpenseFormModal\n        isOpen={!!editingExpense}',
    '<ExpenseFormModal\n        isOpen={!!editingExpense}\n        baseCurrency={trip?.defaultCurrency || "VND"}'
)


# formatMoney replacements inside components
# We must replace formatMoney(amount) with formatMoney(amount, baseCurrency) 
# ONLY inside the components we just modified, or everywhere and then fix the main component.
# Actually, we can just replace ALL formatMoney(X) -> formatMoney(X, baseCurrency) 
# AND in the main component define `baseCurrency = trip?.defaultCurrency || "VND"`
content = re.sub(r'formatMoney\((amount|totalExpense|totalSharedExpense|totalPersonalExpense|s\.amount|item\.amount|(Math\.round[^)]+\))|hasGroups \? perGroup : perPerson)\)', r'formatMoney(\1, baseCurrency)', content)

# But wait, in the main component `ExpensesScreen`, `baseCurrency` needs to be defined!
# Main component:
content = content.replace(
    '  const trip = useLiveQuery(async () => await db.trips.get(tripId), [tripId]);\n',
    '  const trip = useLiveQuery(async () => await db.trips.get(tripId), [tripId]);\n  const baseCurrency = trip?.defaultCurrency || "VND";\n'
)

# Now, fix `form.currency === "VND"` inside `ExpenseFormModal` which uses `baseCurrency`
content = content.replace('currency: "VND"', 'currency: baseCurrency')
content = content.replace('editing.currency || "VND"', 'editing.currency || baseCurrency')
content = content.replace('form.currency === "VND"', 'form.currency === baseCurrency')
content = content.replace('form.currency !== "VND"', 'form.currency !== baseCurrency')
content = content.replace('currency === "VND"', 'currency === baseCurrency')
content = content.replace('if (trip?.defaultCurrency && trip.defaultCurrency !== "VND") {', 'if (false) {')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

# 3. TripSearchModal.tsx
path_modal = 'src/components/TripSearchModal.tsx'
with open(path_modal, 'r', encoding='utf-8') as f:
    content_modal = f.read()

# We already have `const trip = useLiveQuery...`
# Wait, did we keep it? Yes, we restored files. So it's NOT there.
content_modal = content_modal.replace(
    '  const events = useLiveQuery',
    '  const trip = useLiveQuery(async () => await db.trips.get(tripId), [tripId]);\n  const events = useLiveQuery'
)
content_modal = content_modal.replace(
    '{formatMoney(item.amount)}',
    '{formatMoney(item.amount, trip?.defaultCurrency || "VND")}'
)
with open(path_modal, 'w', encoding='utf-8') as f:
    f.write(content_modal)
    
# 4. exportPdf.ts
path_pdf = 'src/utils/exportPdf.ts'
with open(path_pdf, 'r', encoding='utf-8') as f:
    content_pdf = f.read()
content_pdf = content_pdf.replace('formatMoney(sharedTotal)', 'formatMoney(sharedTotal, trip.defaultCurrency)')
content_pdf = content_pdf.replace('formatMoney(personalTotal)', 'formatMoney(personalTotal, trip.defaultCurrency)')
content_pdf = content_pdf.replace('formatMoney(grandTotal)', 'formatMoney(grandTotal, trip.defaultCurrency)')
with open(path_pdf, 'w', encoding='utf-8') as f:
    f.write(content_pdf)

# 5. SharedExpensesSection.tsx
path_share = 'src/features/share/components/SharedExpensesSection.tsx'
if os.path.exists(path_share):
    with open(path_share, 'r', encoding='utf-8') as f:
        content_share = f.read()
    content_share = content_share.replace(
        '<BreakdownSection items={paidByMember} total={totalExpense} emptyText={t("expenses.noPayer")} />',
        '<BreakdownSection items={paidByMember} total={totalExpense} emptyText={t("expenses.noPayer")} baseCurrency={trip?.defaultCurrency || "VND"} />'
    )
    content_share = content_share.replace(
        '<BreakdownSection items={expensesByCategory} total={totalExpense} emptyText={t("expenses.noCategory")} />',
        '<BreakdownSection items={expensesByCategory} total={totalExpense} emptyText={t("expenses.noCategory")} baseCurrency={trip?.defaultCurrency || "VND"} />'
    )
    content_share = re.sub(r'formatMoney\(([^)]+)\)', r'formatMoney(\1, trip?.defaultCurrency || "VND")', content_share)
    with open(path_share, 'w', encoding='utf-8') as f:
        f.write(content_share)
