import os
import json

locales_dir = 'src/locales'
translations = {
    "vi": {
        "share": {
            "valueYes": "Có",
            "valueNo": "Không"
        }
    },
    "en": {
        "share": {
            "valueYes": "Yes",
            "valueNo": "No"
        }
    },
    "es": {
        "share": {
            "valueYes": "Sí",
            "valueNo": "No"
        }
    },
    "fr": {
        "share": {
            "valueYes": "Oui",
            "valueNo": "Non"
        }
    },
    "de": {
        "share": {
            "valueYes": "Ja",
            "valueNo": "Nein"
        }
    },
    "it": {
        "share": {
            "valueYes": "Sì",
            "valueNo": "No"
        }
    },
    "pt": {
        "share": {
            "valueYes": "Sim",
            "valueNo": "Não"
        }
    },
    "id": {
        "share": {
            "valueYes": "Ya",
            "valueNo": "Tidak"
        }
    },
    "ja": {
        "share": {
            "valueYes": "はい",
            "valueNo": "いいえ"
        }
    },
    "ko": {
        "share": {
            "valueYes": "예",
            "valueNo": "아니요"
        }
    },
    "th": {
        "share": {
            "valueYes": "ใช่",
            "valueNo": "ไม่"
        }
    },
    "zh": {
        "share": {
            "valueYes": "是",
            "valueNo": "否"
        }
    }
}

for lang, trans in translations.items():
    filepath = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "share" not in data:
            data["share"] = {}
        data["share"].update(trans["share"])
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

file_path = 'src/features/share/components/ShareChangeRequestsSheet.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("if (section === 'activities') sectionName = 'Lịch trình';", "if (section === 'activities') sectionName = t('share.activities');")
content = content.replace("if (section === 'expenses') sectionName = 'Chi phí';", "if (section === 'expenses') sectionName = t('share.expenses');")
content = content.replace("if (section === 'checklist') sectionName = 'Chuẩn bị';", "if (section === 'checklist') sectionName = t('share.checklist');")
content = content.replace("if (section === 'journals') sectionName = 'Bản tin';", "if (section === 'journals') sectionName = t('share.journals');")
content = content.replace("if (section === 'backupPlans') sectionName = 'Phương án dự phòng';", "if (section === 'backupPlans') sectionName = t('share.backupPlanTitle');")
content = content.replace("if (section === 'travelDocuments') sectionName = 'Giấy tờ';", "if (section === 'travelDocuments') sectionName = t('share.documents');")
content = content.replace("if (section === 'members') sectionName = 'Thành viên';", "if (section === 'members') sectionName = t('share.members');")

content = content.replace("let actionName = action === 'create' ? 'Thêm' : action === 'update' ? 'Sửa' : 'Xóa';", "let actionName = action === 'create' ? t('share.add') : action === 'update' ? t('share.edit') : t('share.delete');")

content = content.replace("if (typeof v === 'boolean') return v ? `${k}: Có` : `${k}: Không`;", "if (typeof v === 'boolean') return v ? `${k}: ${t('share.valueYes')}` : `${k}: ${t('share.valueNo')}`;")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed ShareChangeRequestsSheet section and action names")
