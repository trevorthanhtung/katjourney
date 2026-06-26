import re

def replace_journal_moods():
    filepath = "src/features/journal/JournalSection.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Modify the moodOptionList
    # const moodOptionList: Array<{ value: JournalMood; label: string }> = [
    #   { value: "good", label: "Vui" }, ...
    # We can't use hardcoded labels here anymore if we want it to be dynamic, or we can just translate it in the component.
    # Instead of defining moodOptionList outside, let's keep it outside without labels, or just translate inside the component.
    
    # Actually, moodOptionList has `label: string`. We can keep it but we map it inside JournalForm.
    # Look at JournalForm:
    # {opt.label} -> {t(`journal.mood_${opt.value}`)}
    content = content.replace('{opt.label}', '{t(`journal.mood_${opt.value}`)}')

    # For lastMood:
    # lastMood = moodLabels[sortedDesc[0].mood] || "Đáng nhớ";
    content = content.replace(
        'lastMood = moodLabels[sortedDesc[0].mood] || "Đáng nhớ";',
        'lastMood = t(`journal.mood_${sortedDesc[0].mood}`);'
    )

    # For entry.mood display inside the list:
    # <span className="text-[10px] font-black uppercase tracking-wider">{moodLabels[entry.mood]}</span>
    content = content.replace(
        '{moodLabels[entry.mood]}',
        '{t(`journal.mood_${entry.mood}`)}'
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    replace_journal_moods()
