import os

file_path = 'src/features/share/components/SharedMembersSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'SĐT: <span',
    '{t("members.phonePrefix")}<span'
)

content = content.replace(
    '{assignedTasksCount} việc',
    '{assignedTasksCount} {t("members.taskCount")}'
)

content = content.replace(
    'Đã chi: {formatMoney(totalSpent)} {paidExpensesCount > 0 && `(${paidExpensesCount} lần)`}',
    '{t("members.paidPrefix")}{formatMoney(totalSpent)} {paidExpensesCount > 0 && `(${paidExpensesCount} ${t("members.paidTimes")})`}'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed members section strings")
