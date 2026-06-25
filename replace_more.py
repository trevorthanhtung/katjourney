import re

filepath = r"src\features\more\MoreScreen.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    (r'\{isGroupLeader \? \`\(Sẽ thay thế \$\{existingLeader\.name\}\)\` : \`\(Đang là: \$\{existingLeader\.name\}\)\`\}',
     r'{isGroupLeader ? t("members.willReplace", { name: existingLeader.name }) : t("members.currentLeaderIs", { name: existingLeader.name })}'),
    
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
     
    (r'>Nhóm: </span',
     r'>{t("members.groupPrefix")}</span'), # This is from my previous format, wait, let's see how user wrote it:
    # "Nhóm: <span className="
]

for old, new in replacements:
    content = re.sub(old, new, content)

# Check the exact "Nhóm:" format in the diff:
# `Nhóm: <span className={member.isGroupLeader ? "text-kat-dark dark:text-kat-primary-usable" : "text-slate-700 dark:text-slate-300"}>{member.group}</span>`
content = content.replace(
    'Nhóm: <span className=',
    '{t("members.groupPrefix")}<span className='
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
