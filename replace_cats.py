import re

filepath = r"src\features\expenses\ExpensesScreen.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. In BreakdownSection, add translation map
breakdown_replacement = """  const { t } = useTranslation();
  const catMap: Record<string, string> = {
    "Di chuyển": t("expenses.catTransport"),
    "Vé máy bay": t("expenses.catFlights"),
    "Ăn uống": t("expenses.catFood"),
    "Lưu trú": t("expenses.catAccommodation"),
    "Vé tham quan": t("expenses.catTickets"),
    "Mua sắm": t("expenses.catShopping"),
    "Vui chơi & Giải trí": t("expenses.catEntertainment"),
    "Chuẩn bị hành lý": t("expenses.catPreparation"),
    "Khác": t("expenses.catOther"),
    "Khác...": t("expenses.catCustom"),
  };
  const rows = Object.entries(items)"""

content = re.sub(
    r'(export function BreakdownSection.*?\s*\{\s*items.*?\s*\}\s*\{\s*const rows = Object\.entries\(items\))',
    lambda m: m.group(1).replace("const rows = Object.entries(items)", breakdown_replacement),
    content,
    flags=re.DOTALL
)

# And use it for the label inside BreakdownSection
content = re.sub(
    r'(<p className="[^"]+">)(\{label\})',
    r'\1{catMap[label] || label}',
    content
)

# 2. In ExpenseCard
expensecard_replacement = """  const { t } = useTranslation();
  const catMap: Record<string, string> = {
    "Di chuyển": t("expenses.catTransport"),
    "Vé máy bay": t("expenses.catFlights"),
    "Ăn uống": t("expenses.catFood"),
    "Lưu trú": t("expenses.catAccommodation"),
    "Vé tham quan": t("expenses.catTickets"),
    "Mua sắm": t("expenses.catShopping"),
    "Vui chơi & Giải trí": t("expenses.catEntertainment"),
    "Chuẩn bị hành lý": t("expenses.catPreparation"),
    "Khác": t("expenses.catOther"),
    "Khác...": t("expenses.catCustom"),
  };
"""

content = re.sub(
    r'(const ExpenseCard = React\.memo\(function ExpenseCard.*?\s*\{\s*const \{ t \} = useTranslation\(\);\s*)',
    lambda m: m.group(0).replace("const { t } = useTranslation();\n", expensecard_replacement),
    content,
    flags=re.DOTALL
)

content = content.replace('{item.category}', '{catMap[item.category] || item.category}')

# 3. In ExpensesScreen -> ExpenseForm Category Select
expenseform_replacement = """  const { t } = useTranslation();
  const catMap: Record<string, string> = React.useMemo(() => ({
    "Di chuyển": t("expenses.catTransport"),
    "Vé máy bay": t("expenses.catFlights"),
    "Ăn uống": t("expenses.catFood"),
    "Lưu trú": t("expenses.catAccommodation"),
    "Vé tham quan": t("expenses.catTickets"),
    "Mua sắm": t("expenses.catShopping"),
    "Vui chơi & Giải trí": t("expenses.catEntertainment"),
    "Chuẩn bị hành lý": t("expenses.catPreparation"),
    "Khác": t("expenses.catOther"),
    "Khác...": t("expenses.catCustom"),
  }), [t]);
  
  const categoryLabels = React.useMemo(() => {
    const labels: Record<string, string> = { ...catMap };
    categoryOptions.forEach(c => { if (!labels[c]) labels[c] = c; });
    return labels;
  }, [categoryOptions, catMap]);
"""

content = re.sub(
    r'(function ExpenseForm.*?\s*\{\s*const \{ t \} = useTranslation\(\);\s*)',
    lambda m: m.group(0).replace("const { t } = useTranslation();\n", expenseform_replacement),
    content,
    flags=re.DOTALL
)

# And add the labels prop to the Select component for Category
content = re.sub(
    r'(<Select\s*\n\s*label=\{.*?\s*value=\{form\.category\}\s*\n\s*onChange=\{.*?\}\s*\n\s*options=\{categoryOptions\}\s*\n\s*)/>',
    r'\1labels={categoryLabels}\n                />',
    content,
    flags=re.DOTALL
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done ExpensesScreen.tsx")

# Now do SharedExpensesSection.tsx
filepath = r"src\features\share\components\SharedExpensesSection.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. ExpenseForm in SharedExpensesSection has same category Select
content = re.sub(
    r'(const \[form, setForm\] = useState.*?\s*const \{ t \} = useTranslation\(\);\s*)',
    lambda m: m.group(0).replace("const { t } = useTranslation();\n", expenseform_replacement.replace("  const categoryLabels", "const categoryLabels")),
    content,
    flags=re.DOTALL
)

# Add the labels prop to the Select component for Category in SharedExpensesSection
content = re.sub(
    r'(<Select\s*\n\s*label=\{.*?\s*value=\{form\.category\}\s*\n\s*onChange=\{.*?\}\s*\n\s*options=\{categoryOptions\}\s*\n\s*)/>',
    r'\1labels={categoryLabels}\n                          />',
    content,
    flags=re.DOTALL
)

# 2. In Expense items in SharedExpensesSection
shared_expense_cat_replacement = """  const catMap: Record<string, string> = {
    "Di chuyển": t("expenses.catTransport"),
    "Vé máy bay": t("expenses.catFlights"),
    "Ăn uống": t("expenses.catFood"),
    "Lưu trú": t("expenses.catAccommodation"),
    "Vé tham quan": t("expenses.catTickets"),
    "Mua sắm": t("expenses.catShopping"),
    "Vui chơi & Giải trí": t("expenses.catEntertainment"),
    "Chuẩn bị hành lý": t("expenses.catPreparation"),
    "Khác": t("expenses.catOther"),
    "Khác...": t("expenses.catCustom"),
  };"""

content = re.sub(
    r'(const byCategory = sumBy\(\s*mergedExpenses,\s*\(e\) => e\.category,\s*\(e\) => Number\(e\.amount\)\s*\);)',
    r'\1\n' + shared_expense_cat_replacement,
    content
)

content = content.replace('{e.category}', '{catMap[e.category] || e.category}')

# 3. Add useTranslation to BreakdownSection at the top of the file since it is used in both!
# Oh wait BreakdownSection is only defined in ExpensesScreen, it is imported by SharedExpensesSection.
# Wait, let me check BreakdownSection in helpers or imported!

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done SharedExpensesSection.tsx")
