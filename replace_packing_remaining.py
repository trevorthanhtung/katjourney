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
    '<h3 className="text-[16.5px] font-black text-kat-text">{catName}</h3>': '<h3 className="text-[16.5px] font-black text-kat-text">{catMap[catName] || catName}</h3>',
    '>\n                Sửa\n              </button>': '>\n                {t("packing.edit")}\n              </button>',
    '>\n                Xóa\n              </button>': '>\n                {t("packing.deleteAction")}\n              </button>',
    '>\n                  Tên món cần mang *\n                </label>': '>\n                  {t("packing.itemNameLabel")}\n                </label>',
    'aria-label="Thêm món chuẩn bị"': 'aria-label={t("packing.addItem")}',
    'let statusText = "Chưa có món cần chuẩn bị.";': 'let statusText = t("packing.statusEmpty");',
    'statusText = `Còn ${stats.total - stats.completed} món cần chuẩn bị.`;': 'statusText = t("packing.statusRemaining", { remaining: stats.total - stats.completed });',
    'showToastMessage(`Đã xóa: ${itemToDelete.title}`);': 'showToastMessage(`${t("packing.toastDeleted")} ${itemToDelete.title}`);'
}

multi_replace("src/features/checklist/ChecklistScreen.tsx", checklist_replacements)

# 2. PackingSection.tsx
packing_replacements = {
    '>\n              Sửa\n            </button>': '>\n              {t("packing.edit")}\n            </button>',
    '>\n              Xóa\n            </button>': '>\n              {t("packing.deleteAction")}\n            </button>',
    'text="Chưa có món đồ nào. Nhận gợi ý để bắt đầu chuẩn bị nhé!"': 'text={t("packing.emptyStateDetailed")}',
    'title={editing ? "Sửa món đồ" : "Thêm món đồ"}': 'title={editing ? t("packing.editItem") : t("packing.addItem")}',
    'label="Tên món đồ"': 'label={t("packing.itemNameLabel")}',
    'placeholder="VD: Bàn chải điện"': 'placeholder={t("packing.itemPlaceholder")}',
    'title="Xóa món hành lý này?"': 'title={t("packing.deletePrivateTitle")}',
    'description="Món hành lý này sẽ bị xóa khỏi danh sách chuẩn bị. Sau khi xóa, không thể hoàn tác."': 'description={t("packing.deletePrivateDesc")}',
    'confirmLabel="Xóa món"': 'confirmLabel={t("packing.deleteAction")}'
}

multi_replace("src/features/packing/PackingSection.tsx", packing_replacements)

# 3. SharedChecklistSection.tsx
shared_replacements = {
    '>\n              Tên món cần mang *\n            </label>': '>\n              {t("packing.itemNameLabel")}\n            </label>',
    '<span>Vui lòng nhập tên món cần mang.</span>': '<span>{t("packing.itemNameLabel")}</span>'
}
multi_replace("src/features/share/components/SharedChecklistSection.tsx", shared_replacements)

print("Replacement remaining complete")
