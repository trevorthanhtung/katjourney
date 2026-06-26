import re

with open('src/features/share/components/SharedMembersSection.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

vietnamese_chars = re.compile(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹĐđ]')
matches = re.finditer(r'[\'\">]([^\'\"><]+)[\'\"<]', content)

res = set()
for m in matches:
    if vietnamese_chars.search(m.group(1)):
        res.add(m.group(1))

for r in res:
    print(r)
