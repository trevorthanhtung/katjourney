import re

with open(r'src/features/expenses/ExpensesScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

jsx = re.findall(r'>([^<>{]*[\u00C0-\u024F\u1E00-\u1EFF][^<>{]*)<', text)
attrs = re.findall(r'=\s*["\']([^"\']*[\u00C0-\u024F\u1E00-\u1EFF][^"\']*)["\']', text)
all_strings = sorted(set([s.strip() for s in jsx + attrs if s.strip() and len(s.strip()) > 2]))
for s in all_strings:
    print(s)
