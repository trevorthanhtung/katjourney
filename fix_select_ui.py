import json
import os

def update_locale(path, key_path, new_key, new_val):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # key_path is like 'tripForm'
    if key_path in data:
        data[key_path][new_key] = new_val
        
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

update_locale('src/locales/vi.json', 'tripForm', 'currencyLabel', 'Đơn vị tiền tệ (Base Currency)')
update_locale('src/locales/en.json', 'tripForm', 'currencyLabel', 'Base Currency')

# Fix w-full in MoreScreen.tsx
more_path = 'src/features/more/MoreScreen.tsx'
with open(more_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'buttonClassName="!rounded-2xl !py-3.5 !border-2 !border-slate-200 dark:!border-slate-700/50"',
    'buttonClassName="w-full !rounded-2xl !py-3.5 !border-2 !border-slate-200 dark:!border-slate-700/50"'
)

with open(more_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed UI and translation")
