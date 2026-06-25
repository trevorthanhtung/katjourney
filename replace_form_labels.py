import re

def multi_replace(filepath, replacements):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    for k, v in replacements.items():
        content = content.replace(k, v)
        
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

# 1. ChecklistScreen.tsx
checklist_replacements = {
    '>\n                      Người phụ trách\n                    </label>': '>\n                      {t("packing.assigneeLabel")}\n                    </label>',
    '>\n                        Người phụ trách\n                      </span>': '>\n                        {t("packing.assigneeLabel")}\n                      </span>',
    '>\n                  Mức độ cần thiết\n                </label>': '>\n                  {t("packing.priorityLabel")}\n                </label>',
    '>\n                  Ghi chú\n                </label>': '>\n                  {t("packing.noteLabel")}\n                </label>',
    '>\n                Hủy\n              </button>': '>\n                {t("packing.cancel")}\n              </button>',
    '<h4 className="text-[12.5px] font-bold text-kat-text">{t("packing.noMembersTitle")}</h4>': '<h4 className="text-[12.5px] font-bold text-kat-text">{t("packing.noMembersTitle")}</h4>', # already correct
    '<p className="text-[11.5px] text-kat-muted mt-0.5 font-bold">{t("packing.noMembersDesc")}</p>': '<p className="text-[11.5px] text-kat-muted mt-0.5 font-bold">{t("packing.noMembersDesc")}</p>' # already correct
}

multi_replace("src/features/checklist/ChecklistScreen.tsx", checklist_replacements)

# 2. SharedChecklistSection.tsx
shared_replacements = {
    '<label className="text-[12.5px] font-bold text-slate-700 dark:text-slate-300">Mức độ cần thiết</label>': '<label className="text-[12.5px] font-bold text-slate-700 dark:text-slate-300">{t("packing.priorityLabel")}</label>',
    '>\n              Người phụ trách\n            </label>': '>\n              {t("packing.assigneeLabel")}\n            </label>',
    '>\n              Ghi chú\n            </label>': '>\n              {t("packing.noteLabel")}\n            </label>',
    'VD: Để trong balo nhỏ, nhớ sạc đầy...': '{t("packing.notePlaceholder")}',
    '<h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Chưa có người đồng hành</h4>': '<h4 className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{t("packing.noMembersTitle")}</h4>',
    '<p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">Người đồng hành chưa được chia sẻ để phân công hành lý.</p>': '<p className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5 font-bold">{t("packing.noMembersDesc")}</p>'
}

multi_replace("src/features/share/components/SharedChecklistSection.tsx", shared_replacements)

print("Replacement form labels complete")
