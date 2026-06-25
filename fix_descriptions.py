import re

# 1. ExpensesScreen.tsx
filepath = r"src\features\expenses\ExpensesScreen.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Fix ExpenseCard rendering
old_expense_card_title = '{item.description || t("expenses.unnamed")}'
new_expense_card_title = '{(!item.description || item.description === item.category) ? (catMap[item.category] || item.category) : item.description}'
content = content.replace(old_expense_card_title, new_expense_card_title)

# Fix saving description
content = re.sub(
    r'(description:\s*form\.description\.trim\(\)\s*\|\|\s*`\$\{finalCategory\}`)',
    r'description: form.description.trim()',
    content
)

# Update the DeleteConfirmModal itemName to also fallback
content = re.sub(
    r'(itemName=\{expenseToDelete\?\.description \|\| expenseToDelete\?\.category\})',
    r'itemName={expenseToDelete?.description === expenseToDelete?.category ? (catMap[expenseToDelete?.category] || expenseToDelete?.category) : (expenseToDelete?.description || catMap[expenseToDelete?.category] || expenseToDelete?.category)}',
    content
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated ExpensesScreen.tsx")

# 2. SharedExpensesSection.tsx
filepath = r"src\features\share\components\SharedExpensesSection.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Fix SharedExpense rendering
old_shared_expense_title = '{e.description || e.category}'
new_shared_expense_title = '{(!e.description || e.description === e.category) ? (catMap[e.category] || e.category) : e.description}'
content = content.replace(old_shared_expense_title, new_shared_expense_title)

# Fix saving description
content = re.sub(
    r'(description:\s*form\.description\.trim\(\)\s*\|\|\s*\(""\s*\+\s*finalCategory\))',
    r'description: form.description.trim()',
    content
)

# Fix delete confirm
content = re.sub(
    r'(itemName=\{expenses\.find\(e => String\(e\.id\) === deleteTargetId\)\?\.description\})',
    r'itemName={(() => { const e = expenses.find(e => String(e.id) === deleteTargetId); return e ? ((!e.description || e.description === e.category) ? (catMap[e.category] || e.category) : e.description) : ""; })()}',
    content
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated SharedExpensesSection.tsx")
