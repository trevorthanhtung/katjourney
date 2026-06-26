import os

file_path = 'src/features/share/components/SharedActivitiesSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Line 417: {category.label}
# Wait, let's just replace '{category.label}' and '{cat.label}'
content = content.replace('{category.label}', '{t(`timeline.cat${category.id.charAt(0).toUpperCase() + category.id.slice(1)}`)}')
content = content.replace('{cat.label}', '{t(`timeline.cat${cat.id.charAt(0).toUpperCase() + cat.id.slice(1)}`)}')

# aria-label="Xem dạng lịch"
content = content.replace('aria-label="Xem dạng lịch"', 'aria-label={t("share.viewCalendar")}')
# I'll also add viewCalendar to vi.json and en.json just in case if it's missing, though we only need to fix what user reported.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully fixed activity type labels.")
