import os

file_path = 'src/features/share/components/SharedActivitiesSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"{t(\"share.addBtn\")} phương án dự phòng"', '`${t("share.addBtn")} phương án dự phòng`')
content = content.replace('"{t(\"share.addBtn\")} hoạt động"', 't("share.addActivity")')
content = content.replace('"{t(\"share.addBtn\")}"', 't("share.addBtn")')
content = content.replace('placeholder="{t(\"share.titlePlaceholder\")}"', 'placeholder={t("share.titlePlaceholder")}')
content = content.replace('placeholder="{t(\"share.locationPlaceholder\")}"', 'placeholder={t("share.locationPlaceholder")}')
content = content.replace('placeholder="{t(\"share.notesPlaceholder\")}"', 'placeholder={t("share.notesPlaceholder")}')
content = content.replace('title="{t(\"share.quickSelectDay\")}"', 'title={t("share.quickSelectDay")}')

# Also fix `title={isDirectEdit ? "{t("share.addBtn")} hoạt động"` which is already fixed by replacing '"{t(\"share.addBtn\")} hoạt động"' with 't("share.addActivity")'

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully fixed syntax errors.")
