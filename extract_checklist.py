import re

filepath = r"src\features\checklist\ChecklistScreen.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Find strings with Vietnamese characters
vi_regex = re.compile(r'[^a-zA-Z0-9_\-\{\}\(\)\[\]\.\,\!\?\;\:\s\'\"\`\=\+\*\/\\]+[a-zA-Z0-9_\-\{\}\(\)\[\]\.\,\!\?\;\:\s\'\"\`\=\+\*\/\\]*')
lines = content.split('\n')

for i, line in enumerate(lines):
    if vi_regex.search(line):
        print(f"Line {i+1}: {line.strip()}")
