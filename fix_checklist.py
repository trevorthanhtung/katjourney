import re

filepath = r"src\features\checklist\ChecklistScreen.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Remove useTranslation from react import
content = content.replace("  useTranslation,\n", "")

# Add useTranslation from react-i18next
if "import { useTranslation } from 'react-i18next';" not in content:
    content = content.replace('import { createPortal } from "react-dom";', 'import { createPortal } from "react-dom";\nimport { useTranslation } from "react-i18next";')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
