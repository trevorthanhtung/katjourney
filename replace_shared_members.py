import re

filepath = r"src\features\share\components\SharedMembersSection.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    (r'>Thành viên</span>',
     r'>{t("members.statMembers")}</span>'),
     
    (r'>Phân công</span>',
     r'>{t("members.statTasks")}</span>'),
     
    (r'>Đã chi trả</span>',
     r'>{t("members.statPaid")}</span>'),
     
    (r'>Chia chi phí</span>',
     r'>{t("members.statSplit")}</span>'),
     
    (r'\{members\.length >= 2 \? "Sẵn sàng" : "Cần ≥ 2"\}',
     r'{members.length >= 2 ? t("members.statReady") : t("members.statNeedMore")}'),
     
    (r'>Thành viên khác</h3',
     r'>{t("members.otherMembers")}</h3'),
     
    (r'Nhóm: <span className=',
     r'{t("members.groupPrefix")}<span className='),
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
