import re

def replace_journal_section():
    filepath = "src/features/journal/JournalSection.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Ensure useTranslation is imported
    if "useTranslation" not in content:
        content = content.replace(
            'import { useLiveQuery } from "dexie-react-hooks";',
            'import { useLiveQuery } from "dexie-react-hooks";\nimport { useTranslation } from "react-i18next";'
        )
    
    # Insert hooks safely
    content = content.replace(
        '  const [form, setForm] = useState({ ',
        '  const { t } = useTranslation();\n  const [form, setForm] = useState({ '
    )
    content = content.replace(
        '  const [isMenuOpen, setIsMenuOpen] = useState(false);',
        '  const { t } = useTranslation();\n  const [isMenuOpen, setIsMenuOpen] = useState(false);'
    )
    content = content.replace(
        '  return (\n    <DeleteConfirmModal',
        '  const { t } = useTranslation();\n  return (\n    <DeleteConfirmModal'
    )
    content = content.replace(
        '  const prompts = [\n    "Hôm nay bạn muốn nhớ nhất điều gì?",',
        '  const { t } = useTranslation();\n  const prompts = [\n    "Hôm nay bạn muốn nhớ nhất điều gì?",'
    )
    content = content.replace(
        '  const members = useLiveQuery(async () => {',
        '  const { t } = useTranslation();\n  const members = useLiveQuery(async () => {'
    )

    # Now replace the strings
    
    # form component
    content = content.replace('title={editing ? "Sửa bài viết bản tin" : "Đăng bài viết bản tin"}', 'title={editing ? t("journal.formTitleEdit") : t("journal.formTitleAdd")}')
    content = content.replace('Hủy\n          </button>', '{t("journal.cancel")}\n          </button>')
    content = content.replace('Đăng bài viết\n          </button>', '{t("journal.submit")}\n          </button>')
    content = content.replace('Ngày ghi lại\n                </span>', '{t("journal.dateLabel")}\n                </span>')
    content = content.replace('Tiêu đề bài viết *\n              </span>', '{t("journal.titleLabel")}\n              </span>')
    content = content.replace('placeholder="VD: Một ngày đáng nhớ ở Vũng Tàu"', 'placeholder={t("journal.titlePlaceholder")}')
    content = content.replace('Đang lấy vị trí...</span>', '{t("journal.locLoading")}</span>')
    content = content.replace('<span>Đang ở <span', '<span>{t("journal.locCurrent")} <span')
    content = content.replace('title="Xóa vị trí"', 'title={t("journal.locRemove")}')
    content = content.replace('<span>Nhấn để đính kèm vị trí</span>', '<span>{t("journal.locAttach")}</span>')
    content = content.replace('Cảm xúc hôm nay\n          </span>', '{t("journal.moodLabel")}\n          </span>')
    content = content.replace('Câu chuyện của bạn *\n              </span>', '{t("journal.contentLabel")}\n              </span>')
    content = content.replace('placeholder="Ghi lại cảm xúc, câu chuyện, món ăn ngon hoặc khoảnh khắc đáng nhớ..."', 'placeholder={t("journal.contentPlaceholder")}')
    content = content.replace('Đang tải ảnh...</>', '{t("journal.imgUploading")}</>')
    content = content.replace('Đính kèm hình ảnh</>', '{t("journal.imgAttach")}</>')
    content = content.replace('Gợi ý viết nhanh\n          </span>', '{t("journal.promptTitle")}\n          </span>')

    # menu component
    content = content.replace('Sửa\n          </button>', '{t("journal.menuEdit")}\n          </button>')
    content = content.replace('Xóa\n          </button>', '{t("journal.menuDelete")}\n          </button>')

    # delete modal component
    content = content.replace('title="Xóa bài viết này?"', 'title={t("journal.delConfirmTitle")}')
    content = content.replace('description="Bài viết sẽ không còn xuất hiện trên bản tin. Sau khi xóa, không thể hoàn tác."', 'description={t("journal.delConfirmDesc")}')
    content = content.replace('confirmLabel="Xóa bài viết"', 'confirmLabel={t("journal.delConfirmBtn")}')

    # empty state component
    content = content.replace('>Chưa có bài viết nào</h3>', '>{t("journal.emptyTitle")}</h3>')
    content = content.replace('Bắt đầu bằng một cảm xúc, một nơi đã ghé qua hoặc một khoảnh khắc bạn muốn nhớ.', '{t("journal.emptySubtitle")}')
    content = content.replace('Gợi ý viết nhanh</p>', '{t("journal.promptTitle")}</p>')
    content = content.replace('Ghi lại ngay →\n                </span>', '{t("journal.writeNow")}\n                </span>')

    # section component
    content = content.replace('>Bản tin hành trình</h1>', '>{t("journal.title")}</h1>')
    content = content.replace('Lưu lại cảm xúc, câu chuyện và những khoảnh khắc đáng nhớ.</p>', '{t("journal.subtitle")}</p>')
    content = content.replace('Bản tin\n            </button>', '{t("journal.tabPosts")}\n            </button>')
    content = content.replace('Trò chuyện\n            </button>', '{t("journal.tabChat")}\n            </button>')
    content = content.replace('Đăng bài viết\n            </button>', '{t("journal.postBtn")}\n            </button>')
    content = content.replace('Bài viết đã đăng\n              </span>', '{t("journal.statPosts")}\n              </span>')
    content = content.replace('bài viết` : "Chưa có bài viết nào"}', '${t("journal.statPostsCount")}` : t("journal.statPostsEmpty")}')
    content = content.replace('Cảm xúc mới nhất\n              </span>', '{t("journal.statMood")}\n              </span>')
    content = content.replace('Lần ghi gần nhất\n              </span>', '{t("journal.statLastWrite")}\n              </span>')
    content = content.replace('Ghi lại một khoảnh khắc để chuyến đi có câu chuyện riêng.', '{t("journal.emptyDesc")}')
    content = content.replace('Thả cảm xúc\n                              </span>', '{t("journal.reactionBtn")}\n                              </span>')

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    replace_journal_section()
