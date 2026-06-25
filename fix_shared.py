import re

filepath = r"src\features\share\components\SharedExpensesSection.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

replacements = {
    "                      Chi chung nhóm\n": '                      {t("expenses.splitGroupLabel")}\n',
    "                      Cá nhân tự trả\n": '                      {t("expenses.personalSelfLabel")}\n',
    "                              Chọn lại tất cả\n": '                              {t("expenses.reselectAll")}\n',
    "                              Sửa\n": '                              {t("expenses.edit")}\n',
    "                              Đóng\n": '                              {t("expenses.close")}\n',
    "                              Cá nhân\n": '                              {t("expenses.perPerson")}\n',
    "                              Gia đình\n": '                              {t("expenses.perGroup")}\n',
}

for i, line in enumerate(lines):
    for old, new in replacements.items():
        if line == old or line == old.replace("\n", "\r\n"):
            lines[i] = new.replace("\n", "\r\n") if "\r\n" in line else new
            break

# Also fix "Trả bởi:" and "Tùy chọn đề xuất" and "Chưa có khoản chi nào trong danh sách"
content = "".join(lines)

# Fix remaining strings using content-level replacements
content = content.replace('>Trả bởi:</span>', '>{t("expenses.paidBy")}</span>')
content = content.replace('>Tùy chọn đề xuất</label>', '>{t("expenses.suggestOption")}</label>')
content = content.replace('>Chưa có khoản chi nào trong danh sách</h3>', '>{t("expenses.noExpenseList")}</h3>')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done fixing SharedExpensesSection.tsx")
