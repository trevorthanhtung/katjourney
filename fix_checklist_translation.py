import json
import os

locales_dir = 'src/locales'
translations = {
    "vi": {
        "packing": {
            "sharedTab": "Chung",
            "personalTab": "Cá nhân",
            "emptyPrivateDesc": "Thêm đồ dùng của riêng bạn (chỉ mình bạn thấy) tại đây"
        }
    },
    "en": {
        "packing": {
            "sharedTab": "Shared",
            "personalTab": "Personal",
            "emptyPrivateDesc": "Add your personal items (only you can see) here"
        }
    },
    "es": {
        "packing": {
            "sharedTab": "Compartido",
            "personalTab": "Personal",
            "emptyPrivateDesc": "Añade tus artículos personales (solo tú puedes verlos) aquí"
        }
    },
    "fr": {
        "packing": {
            "sharedTab": "Partagé",
            "personalTab": "Personnel",
            "emptyPrivateDesc": "Ajoutez vos articles personnels (seulement visibles par vous) ici"
        }
    },
    "de": {
        "packing": {
            "sharedTab": "Geteilt",
            "personalTab": "Persönlich",
            "emptyPrivateDesc": "Fügen Sie hier Ihre persönlichen Gegenstände (nur für Sie sichtbar) hinzu"
        }
    },
    "it": {
        "packing": {
            "sharedTab": "Condiviso",
            "personalTab": "Personale",
            "emptyPrivateDesc": "Aggiungi qui i tuoi articoli personali (visibili solo a te)"
        }
    },
    "pt": {
        "packing": {
            "sharedTab": "Compartilhado",
            "personalTab": "Pessoal",
            "emptyPrivateDesc": "Adicione seus itens pessoais (apenas você pode ver) aqui"
        }
    },
    "id": {
        "packing": {
            "sharedTab": "Bersama",
            "personalTab": "Pribadi",
            "emptyPrivateDesc": "Tambahkan barang pribadi Anda (hanya Anda yang dapat melihat) di sini"
        }
    },
    "ja": {
        "packing": {
            "sharedTab": "共有",
            "personalTab": "個人用",
            "emptyPrivateDesc": "個人の持ち物（自分のみ表示）をここに追加します"
        }
    },
    "ko": {
        "packing": {
            "sharedTab": "공유",
            "personalTab": "개인용",
            "emptyPrivateDesc": "개인 물품(본인만 볼 수 있음)을 여기에 추가하세요"
        }
    },
    "th": {
        "packing": {
            "sharedTab": "แชร์",
            "personalTab": "ส่วนตัว",
            "emptyPrivateDesc": "เพิ่มของใช้ส่วนตัวของคุณ (เห็นได้เฉพาะคุณ) ที่นี่"
        }
    },
    "zh": {
        "packing": {
            "sharedTab": "共享",
            "personalTab": "个人",
            "emptyPrivateDesc": "在此处添加您的个人物品（仅自己可见）"
        }
    }
}

for lang, trans in translations.items():
    filepath = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "packing" not in data:
            data["packing"] = {}
        data["packing"].update(trans["packing"])
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


file_path = 'src/features/share/components/SharedChecklistSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace hardcoded strings in SharedChecklistSection
content = content.replace('>Danh sách chuẩn bị<', '>{t("packing.pageTitle")}<')
content = content.replace('>Chuẩn bị hành lý và đồ dùng trước chuyến đi<', '>{t("packing.pageSubtitle")}<')
content = content.replace('Đã xong {displayedChecklist.filter(c => c.completed).length}/{displayedChecklist.length}', '{t("packing.progressStatus", { completed: displayedChecklist.filter(c => c.completed).length, total: displayedChecklist.length })}')

# There are multiple occurrences of 'Chung' and 'Cá nhân' maybe? Let's be careful.
# Usually they are inside a span or directly in JSX text.
# `          Chung` and `          Cá nhân`
content = content.replace('          Chung\n', '          {t("packing.sharedTab")}\n')
content = content.replace('          Cá nhân\n', '          {t("packing.personalTab")}\n')

content = content.replace('{c.category}', '{catMap[c.category] || c.category}')

content = content.replace('? "Thêm đồ dùng của riêng bạn (chỉ mình bạn thấy) tại đây"', '? t("packing.emptyPrivateDesc")')

# Replace the array CATEGORY_ICONS to use the right translation as well if needed.
# Oh, CATEGORY_ICONS is defined outside, we can't easily translate it there, but we map it in render anyway.

# Write the updated content back to the file
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed SharedChecklistSection")
