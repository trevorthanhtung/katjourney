import os

file_path = 'src/features/share/components/SharedBackupPlansSheet.tsx'
if os.path.exists(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace('Đề xuất sửa', '{t("share.suggestEdit")}')
    content = content.replace('Đề xuất xóa', '{t("share.suggestDelete")}')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed SharedBackupPlansSheet.tsx")
