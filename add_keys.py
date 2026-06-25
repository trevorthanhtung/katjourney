import json
import os

langs = ["vi", "en", "ko", "ja", "zh", "es", "fr", "de", "it", "pt", "th", "id"]

new_keys = {
    "members": {
        "willReplace": "(Sẽ thay thế {{name}})",
        "currentLeaderIs": "(Đang là: {{name}})",
        "statMembers": "Thành viên",
        "statTasks": "Phân công",
        "statPaid": "Đã chi trả",
        "statSplit": "Chia chi phí",
        "statReady": "Sẵn sàng",
        "statNeedMore": "Cần ≥ 2",
        "otherMembers": "Thành viên khác",
        "groupPrefix": "Nhóm: "
    }
}

for lang in langs:
    filepath = f"src/locales/{lang}.json"
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if "members" not in data:
        data["members"] = {}
        
    for k, v in new_keys["members"].items():
        data["members"][k] = v

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {filepath}")
