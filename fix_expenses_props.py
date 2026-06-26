import re

path = 'src/features/expenses/ExpensesScreen.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. BreakdownSection
content = content.replace(
    'emptyText: string \n  }) {',
    'emptyText: string;\n  baseCurrency: string\n}) {'
)
content = re.sub(
    r'(<BreakdownSection\s+[^>]*?items=\{paidByMember\}\s+total=\{totalExpense\}\s+emptyText=\{t\("expenses\.noPayer"\)\})',
    r'\1 baseCurrency={trip?.defaultCurrency || "VND"}',
    content
)
content = re.sub(
    r'(<BreakdownSection\s+[^>]*?items=\{expensesByCategory\}\s+total=\{totalExpense\}\s+emptyText=\{t\("expenses\.noCategory"\)\})',
    r'\1 baseCurrency={trip?.defaultCurrency || "VND"}',
    content
)
# Inside BreakdownSection: formatMoney(amount, trip?.defaultCurrency || "VND") -> formatMoney(amount, baseCurrency)
content = content.replace(
    'formatMoney(amount, trip?.defaultCurrency || "VND")',
    'formatMoney(amount, typeof baseCurrency !== "undefined" ? baseCurrency : "VND")' # Quick fix, but baseCurrency should be in scope for those components
)

# 2. SettlementSection
content = content.replace(
    'export function SettlementSection({ suggestions }: { suggestions: Array<{ from: string; to: string; amount: number }> }) {',
    'export function SettlementSection({ suggestions, baseCurrency }: { suggestions: Array<{ from: string; to: string; amount: number }>; baseCurrency: string }) {'
)
content = content.replace(
    '<SettlementSection suggestions={suggestions} />',
    '<SettlementSection suggestions={suggestions} baseCurrency={trip?.defaultCurrency || "VND"} />'
)
content = content.replace(
    'formatMoney(s.amount, trip?.defaultCurrency || "VND")',
    'formatMoney(s.amount, baseCurrency)'
)

# 3. ExpenseItemCard
content = content.replace(
    'export function ExpenseItemCard({ item, onClick }: { item: Expense; onClick: () => void }) {',
    'export function ExpenseItemCard({ item, onClick, baseCurrency }: { item: Expense; onClick: () => void; baseCurrency: string }) {'
)
content = content.replace(
    '<ExpenseItemCard key={item.id} item={item} onClick={() =>',
    '<ExpenseItemCard key={item.id} item={item} baseCurrency={trip?.defaultCurrency || "VND"} onClick={() =>'
)
content = content.replace(
    'formatMoney(item.amount, trip?.defaultCurrency || "VND")',
    'formatMoney(item.amount, baseCurrency)'
)

# 4. ExpenseFormModal
content = content.replace(
    '  members,\n  onSaved\n}: {',
    '  members,\n  baseCurrency,\n  onSaved\n}: {'
)
content = content.replace(
    '  members: Member[];\n  onSaved: () => void;\n}) {',
    '  members: Member[];\n  baseCurrency: string;\n  onSaved: () => void;\n}) {'
)
content = content.replace(
    '<ExpenseFormModal\n        isOpen={isAddingExpense}',
    '<ExpenseFormModal\n        isOpen={isAddingExpense}\n        baseCurrency={trip?.defaultCurrency || "VND"}'
)
content = content.replace(
    '<ExpenseFormModal\n        isOpen={!!editingExpense}',
    '<ExpenseFormModal\n        isOpen={!!editingExpense}\n        baseCurrency={trip?.defaultCurrency || "VND"}'
)

# Fix trip?.defaultCurrency in ExpenseFormModal
content = re.sub(r'trip\?\.defaultCurrency \|\| "VND"', 'baseCurrency', content)
# Restore the ones in ExpensesScreen that actually have `trip`
content = content.replace(
    '<ExpenseFormModal\n        isOpen={isAddingExpense}\n        baseCurrency={baseCurrency}',
    '<ExpenseFormModal\n        isOpen={isAddingExpense}\n        baseCurrency={trip?.defaultCurrency || "VND"}'
)
content = content.replace(
    '<ExpenseFormModal\n        isOpen={!!editingExpense}\n        baseCurrency={baseCurrency}',
    '<ExpenseFormModal\n        isOpen={!!editingExpense}\n        baseCurrency={trip?.defaultCurrency || "VND"}'
)
content = content.replace(
    'baseCurrency={baseCurrency}',
    'baseCurrency={trip?.defaultCurrency || "VND"}'
)
# Re-fix inside BreakdownSection
content = content.replace(
    'typeof baseCurrency !== "undefined" ? baseCurrency : "VND"',
    'baseCurrency'
)

# Remove `matchedRate` error: `matchedRate` could be undefined
content = content.replace(
    'exchangeRate: matchedRate.transfer',
    'exchangeRate: matchedRate?.transfer || 1'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
