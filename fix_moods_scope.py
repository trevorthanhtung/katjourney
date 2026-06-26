import os

file_path = 'src/features/share/components/SharedJournalsSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove moodOptionList from global scope
mood_list_str = """const moodOptionList: Array<{ value: "good" | "okay" | "great" | "very_bad" | "bad"; label: string }> = [
  { value: "good", label: t("journal.mood_good") },
  { value: "okay", label: t("journal.mood_okay") },
  { value: "great", label: t("journal.mood_great") },
  { value: "very_bad", label: t("journal.mood_very_bad") },
  { value: "bad", label: t("journal.mood_bad") }
];"""

if mood_list_str in content:
    content = content.replace(mood_list_str, "")
    
    # Insert moodOptionList inside SharedJournalsSection
    search_str = 'export function SharedJournalsSection('
    idx = content.find(search_str)
    if idx != -1:
        t_idx = content.find('const { t } = useTranslation();', idx)
        if t_idx != -1:
            insert_pos = content.find('\n', t_idx) + 1
            replacement = """  const moodOptionList: Array<{ value: "good" | "okay" | "great" | "very_bad" | "bad"; label: string }> = [
    { value: "good", label: t("journal.mood_good") },
    { value: "okay", label: t("journal.mood_okay") },
    { value: "great", label: t("journal.mood_great") },
    { value: "very_bad", label: t("journal.mood_very_bad") },
    { value: "bad", label: t("journal.mood_bad") }
  ];\n"""
            content = content[:insert_pos] + replacement + content[insert_pos:]
            
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed moodOptionList scope error")
else:
    print("Could not find moodOptionList to remove.")

