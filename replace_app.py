import re

filepath = "src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the classes and text
# Original:
# <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-stone-100/80 border border-stone-200/70">
#   <HugeiconsIcon icon={LockIcon} className="w-3.5 h-3.5 text-stone-400 shrink-0" strokeWidth={2.5} />
#   <p className="text-[12.5px] text-stone-500 leading-snug">
#     Chuyến đi đã kết thúc &mdash; chỉ xem, không chỉnh sửa.
#   </p>
# </div>

target_block = """<div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-stone-100/80 border border-stone-200/70">
            <HugeiconsIcon icon={LockIcon} className="w-3.5 h-3.5 text-stone-400 shrink-0" strokeWidth={2.5} />
            <p className="text-[12.5px] text-stone-500 leading-snug">
              Chuyến đi đã kết thúc &mdash; chỉ xem, không chỉnh sửa.
            </p>
          </div>"""

replacement_block = """<div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-stone-100/80 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-700/50">
            <HugeiconsIcon icon={LockIcon} className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" strokeWidth={2.5} />
            <p className="text-[12.5px] text-stone-500 dark:text-stone-400 leading-snug">
              {t("common.archivedBanner")}
            </p>
          </div>"""

content = content.replace(target_block, replacement_block)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement App.tsx complete")
