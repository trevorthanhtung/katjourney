import os
file_path = 'src/features/share/components/SharedJournalsSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\n              Hủy\n', '\n              {t("journal.cancel")}\n')
content = content.replace('\n              Đăng bài viết\n', '\n              {t("journal.submit")}\n')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed remaining strings")
