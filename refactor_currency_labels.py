import os
import re

# 1. Update MoreScreen.tsx
more_path = 'src/features/more/MoreScreen.tsx'
with open(more_path, 'r', encoding='utf-8') as f:
    more_content = f.read()

# Remove CURRENCY_OPTIONS and CURRENCY_LABELS from MoreScreen.tsx
more_content = re.sub(r'const CURRENCY_OPTIONS = \[.*?\];', '', more_content, flags=re.DOTALL)
more_content = re.sub(r'const CURRENCY_LABELS: Record<string, string> = \{.*?\};', '', more_content, flags=re.DOTALL)

# Add import
more_content = more_content.replace(
    'import { TripService } from "../../services/tripService";',
    'import { TripService } from "../../services/tripService";\nimport { CURRENCY_OPTIONS, CURRENCY_LABELS } from "../../constants/currencies";'
)

with open(more_path, 'w', encoding='utf-8') as f:
    f.write(more_content)


# 2. Update ExpensesScreen.tsx
exp_path = 'src/features/expenses/ExpensesScreen.tsx'
with open(exp_path, 'r', encoding='utf-8') as f:
    exp_content = f.read()

# Add import
exp_content = exp_content.replace(
    'import { formatMoney } from "../../utils/helpers";',
    'import { formatMoney } from "../../utils/helpers";\nimport { CURRENCY_LABELS } from "../../constants/currencies";'
)

# Replace Base Currency text
exp_content = exp_content.replace(
    '{currency || "VND"} (Đồng tiền gốc)',
    '{CURRENCY_LABELS[currency || "VND"] || (currency || "VND")} (Đồng tiền gốc)'
)

# Replace VND Option text
exp_content = exp_content.replace(
    'VND (Việt Nam Đồng)',
    '{CURRENCY_LABELS["VND"]}'
)

# Replace Foreign Currencies text
exp_content = exp_content.replace(
    '{r.currencyCode} {r.currencyName ? `(${r.currencyName})` : ""}',
    '{CURRENCY_LABELS[r.currencyCode] || `${r.currencyCode} ${r.currencyName ? `(${r.currencyName})` : ""}`}'
)

with open(exp_path, 'w', encoding='utf-8') as f:
    f.write(exp_content)

print("Refactored currency labels.")
