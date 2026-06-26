import os

file_path = 'src/features/share/components/SharedActivitiesSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

keys_to_fix = [
    'addActivity', 'editActivity', 'saveChanges', 'titleLabel', 
    'titlePlaceholder', 'activityType', 'selectDate', 'timeLabel', 
    'locationLabel', 'locationHelper', 'locationPlaceholder', 'notesLabel', 
    'notesPlaceholder', 'addBtn', 'listView', 'unscheduled', 'unscheduledDesc',
    'cancel'
]

for key in keys_to_fix:
    content = content.replace(f't("share.{key}")', f't("timeline.{key}")')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully fixed timeline keys.")
