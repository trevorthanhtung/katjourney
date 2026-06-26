import re

def replace_journal_prompts():
    filepath = "src/features/journal/JournalSection.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Form prompts
    content = content.replace(
        '"Điều muốn nhớ nhất",',
        't("journal.promptSugg1"),'
    )
    content = content.replace(
        '"Món ăn đáng nhớ",',
        't("journal.promptSugg2"),'
    )
    content = content.replace(
        '"Người bạn đã gặp",',
        't("journal.promptSugg3"),'
    )
    content = content.replace(
        '"Khoảnh khắc vui",',
        't("journal.promptSugg4"),'
    )
    content = content.replace(
        '"Điều muốn nhớ mãi"',
        't("journal.promptSugg5")'
    )
    
    # Prefix
    content = content.replace(
        'setPrefilledContent(`Gợi ý: ${promptText}\\n\\n`);',
        'setPrefilledContent(`${t("journal.promptPrefix")}${promptText}\\n\\n`);'
    )

    # Empty State prompts
    content = content.replace(
        '"Hôm nay bạn muốn nhớ nhất điều gì?",',
        't("journal.promptEmpty1"),'
    )
    content = content.replace(
        '"Có khoảnh khắc nào bạn muốn lưu lại không?",',
        't("journal.promptEmpty2"),'
    )
    content = content.replace(
        '"Một món ăn, một điểm đến hoặc một người bạn đã gặp?",',
        't("journal.promptEmpty3"),'
    )
    content = content.replace(
        '"Điều gì làm hành trình này trở nên khác biệt?"',
        't("journal.promptEmpty4")'
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    replace_journal_prompts()
