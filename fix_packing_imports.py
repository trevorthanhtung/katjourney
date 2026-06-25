import re

# 1. PackingSection.tsx
filepath = r"src\features\packing\PackingSection.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

if "useTranslation" not in content[:500]:
    content = 'import { useTranslation } from "react-i18next";\n' + content

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

# 2. SharedChecklistSection.tsx
filepath = r"src\features\share\components\SharedChecklistSection.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

if "useMemo" not in content[:500]:
    if "import React" in content:
        content = content.replace("import React", "import React, { useMemo }")
    else:
        content = 'import { useMemo } from "react";\n' + content
elif "import React" in content and "useMemo" not in content.split("from 'react'")[0] and "useMemo" not in content.split('from "react"')[0]:
    pass # we can just use React.useMemo in the code instead of useMemo to be safe

content = content.replace("useMemo(() =>", "React.useMemo(() =>")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Imports fixed")
