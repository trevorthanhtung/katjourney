import os
import re

# 1. Update MoreScreen.tsx
more_path = 'src/features/more/MoreScreen.tsx'
with open(more_path, 'r', encoding='utf-8') as f:
    more_content = f.read()

# Make sure it's not already imported
if "from \"../../constants/currencies\"" not in more_content:
    more_content = more_content.replace(
        'import { useLiveQuery } from "dexie-react-hooks";',
        'import { useLiveQuery } from "dexie-react-hooks";\nimport { CURRENCY_OPTIONS, CURRENCY_LABELS } from "../../constants/currencies";'
    )
    with open(more_path, 'w', encoding='utf-8') as f:
        f.write(more_content)

# 2. Update ExpensesScreen.tsx
exp_path = 'src/features/expenses/ExpensesScreen.tsx'
with open(exp_path, 'r', encoding='utf-8') as f:
    exp_content = f.read()

if "from \"../../constants/currencies\"" not in exp_content:
    exp_content = exp_content.replace(
        'import { useLiveQuery } from "dexie-react-hooks";',
        'import { useLiveQuery } from "dexie-react-hooks";\nimport { CURRENCY_LABELS } from "../../constants/currencies";'
    )
    with open(exp_path, 'w', encoding='utf-8') as f:
        f.write(exp_content)

print("Fixed imports.")
