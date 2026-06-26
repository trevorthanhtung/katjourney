import json
import os

locales_dir = 'src/locales'
translations = {
    "vi": {
        "share": {
            "suggestDeleteJournal": "Đề xuất xóa bài viết",
            "suggestDeleteJournalTitle": "Đề xuất xóa bài viết?",
            "suggestDeleteJournalDesc": "Bạn đang gửi đề xuất xóa bài viết này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."
        },
        "journal": {
            "titleError": "Vui lòng nhập tiêu đề.",
            "contentError": "Vui lòng nhập nội dung bài viết.",
            "defaultTitle": "Bản tin chuyến đi"
        }
    },
    "en": {
        "share": {
            "suggestDeleteJournal": "Suggest deleting post",
            "suggestDeleteJournalTitle": "Suggest deleting post?",
            "suggestDeleteJournalDesc": "You are proposing to delete this post. The trip owner will review your proposal."
        },
        "journal": {
            "titleError": "Please enter a title.",
            "contentError": "Please enter the content.",
            "defaultTitle": "Trip journal"
        }
    },
    "fr": {
        "share": {
            "suggestDeleteJournal": "Proposer la suppression",
            "suggestDeleteJournalTitle": "Proposer de supprimer l'article ?",
            "suggestDeleteJournalDesc": "Vous proposez de supprimer cet article. L'organisateur examinera votre proposition."
        },
        "journal": {
            "titleError": "Veuillez entrer un titre.",
            "contentError": "Veuillez entrer le contenu de l'article.",
            "defaultTitle": "Journal de voyage"
        }
    },
    "es": {
        "share": {
            "suggestDeleteJournal": "Sugerir eliminar publicación",
            "suggestDeleteJournalTitle": "¿Sugerir eliminar publicación?",
            "suggestDeleteJournalDesc": "Estás proponiendo eliminar esta publicación. El organizador revisará tu propuesta."
        },
        "journal": {
            "titleError": "Por favor, introduce un título.",
            "contentError": "Por favor, introduce el contenido.",
            "defaultTitle": "Diario de viaje"
        }
    },
    "de": {
        "share": {
            "suggestDeleteJournal": "Löschen vorschlagen",
            "suggestDeleteJournalTitle": "Löschen des Beitrags vorschlagen?",
            "suggestDeleteJournalDesc": "Sie schlagen vor, diesen Beitrag zu löschen. Der Reiseveranstalter wird Ihren Vorschlag prüfen."
        },
        "journal": {
            "titleError": "Bitte geben Sie einen Titel ein.",
            "contentError": "Bitte geben Sie den Inhalt ein.",
            "defaultTitle": "Reisetagebuch"
        }
    },
    "it": {
        "share": {
            "suggestDeleteJournal": "Suggerisci eliminazione",
            "suggestDeleteJournalTitle": "Suggerire eliminazione del post?",
            "suggestDeleteJournalDesc": "Stai proponendo di eliminare questo post. L'organizzatore esaminerà la tua proposta."
        },
        "journal": {
            "titleError": "Inserisci un titolo.",
            "contentError": "Inserisci il contenuto.",
            "defaultTitle": "Diario di viaggio"
        }
    },
    "pt": {
        "share": {
            "suggestDeleteJournal": "Sugerir exclusão",
            "suggestDeleteJournalTitle": "Sugerir exclusão da postagem?",
            "suggestDeleteJournalDesc": "Você está propondo excluir esta postagem. O organizador da viagem analisará sua proposta."
        },
        "journal": {
            "titleError": "Por favor, insira um título.",
            "contentError": "Por favor, insira o conteúdo.",
            "defaultTitle": "Diário de viagem"
        }
    },
    "id": {
        "share": {
            "suggestDeleteJournal": "Sarankan penghapusan",
            "suggestDeleteJournalTitle": "Sarankan penghapusan postingan?",
            "suggestDeleteJournalDesc": "Anda mengusulkan untuk menghapus postingan ini. Pemilik perjalanan akan meninjau usulan Anda."
        },
        "journal": {
            "titleError": "Silakan masukkan judul.",
            "contentError": "Silakan masukkan konten.",
            "defaultTitle": "Jurnal perjalanan"
        }
    },
    "ja": {
        "share": {
            "suggestDeleteJournal": "削除を提案",
            "suggestDeleteJournalTitle": "投稿の削除を提案しますか？",
            "suggestDeleteJournalDesc": "この投稿の削除を提案しています。旅行のオーナーがあなたの提案を確認します。"
        },
        "journal": {
            "titleError": "タイトルを入力してください。",
            "contentError": "内容を入力してください。",
            "defaultTitle": "旅行記"
        }
    },
    "ko": {
        "share": {
            "suggestDeleteJournal": "삭제 제안",
            "suggestDeleteJournalTitle": "게시물 삭제를 제안하시겠습니까?",
            "suggestDeleteJournalDesc": "이 게시물을 삭제하도록 제안하고 있습니다. 여행 주최자가 제안을 검토합니다."
        },
        "journal": {
            "titleError": "제목을 입력하세요.",
            "contentError": "내용을 입력하세요.",
            "defaultTitle": "여행 일지"
        }
    },
    "th": {
        "share": {
            "suggestDeleteJournal": "เสนอให้ลบโพสต์",
            "suggestDeleteJournalTitle": "เสนอให้ลบโพสต์?",
            "suggestDeleteJournalDesc": "คุณกำลังเสนอให้ลบโพสต์นี้ เจ้าของการเดินทางจะตรวจสอบข้อเสนอของคุณ"
        },
        "journal": {
            "titleError": "กรุณาใส่ชื่อเรื่อง",
            "contentError": "กรุณาใส่เนื้อหา",
            "defaultTitle": "บันทึกการเดินทาง"
        }
    },
    "zh": {
        "share": {
            "suggestDeleteJournal": "建议删除帖子",
            "suggestDeleteJournalTitle": "建议删除帖子？",
            "suggestDeleteJournalDesc": "您正在建议删除此帖子。行程创建者将审核您的建议。"
        },
        "journal": {
            "titleError": "请输入标题。",
            "contentError": "请输入内容。",
            "defaultTitle": "旅行日记"
        }
    }
}

for lang, trans in translations.items():
    filepath = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "share" not in data:
            data["share"] = {}
        data["share"].update(trans["share"])
        
        if "journal" not in data:
            data["journal"] = {}
        data["journal"].update(trans["journal"])
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

file_path = 'src/features/share/components/SharedJournalsSection.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# MOODS
content = content.replace('{ value: "good", label: "Vui" }', '{ value: "good", label: t("journal.mood_good") }')
content = content.replace('{ value: "okay", label: "Bình yên" }', '{ value: "okay", label: t("journal.mood_okay") }')
content = content.replace('{ value: "great", label: "Hào hứng" }', '{ value: "great", label: t("journal.mood_great") }')
content = content.replace('{ value: "very_bad", label: "Mệt" }', '{ value: "very_bad", label: t("journal.mood_very_bad") }')
content = content.replace('{ value: "bad", label: "Bất ngờ" }', '{ value: "bad", label: t("journal.mood_bad") }')

# Fix promptSuggestions moving inside component
if "const promptSuggestions =" in content:
    content = content.replace('const promptSuggestions = [\n  "Điều muốn nhớ nhất",\n  "Món ăn đáng nhớ",\n  "Người bạn đã gặp",\n  "Khoảnh khắc vui",\n  "Điều muốn nhớ mãi"\n];', '')

    # Insert inside the component
    search_str = 'export function SharedJournalsSection('
    idx = content.find(search_str)
    if idx != -1:
        # Find where it calls useTranslation
        t_idx = content.find('const { t } = useTranslation();', idx)
        if t_idx != -1:
            insert_pos = content.find('\n', t_idx) + 1
            replacement = '''  const promptSuggestions = [
    t("journal.promptSugg1"),
    t("journal.promptSugg2"),
    t("journal.promptSugg3"),
    t("journal.promptSugg4"),
    t("journal.promptSugg5")
  ];\n'''
            content = content[:insert_pos] + replacement + content[insert_pos:]

# Error strings
content = content.replace('"Vui lòng nhập tiêu đề."', 't("journal.titleError")')
content = content.replace('"Vui lòng nhập nội dung bài viết."', 't("journal.contentError")')

# Other strings
content = content.replace('>Bản tin chuyến đi<', '>{t("journal.title")}<')
content = content.replace('/> Bản tin', '/> {t("journal.tabPosts")}')
content = content.replace('Trò chuyện', '{t("journal.tabChat")}')
content = content.replace('/> Đăng bài viết', '/> {t("journal.postBtn")}')
content = content.replace('>Đăng bài viết<', '>{t("journal.postBtn")}<')
content = content.replace('title="Đăng bài viết"', 'title={t("journal.postBtn")}')
content = content.replace('aria-label="Đăng bài viết"', 'aria-label={t("journal.postBtn")}')
content = content.replace('title="Đăng bài viết bản tin"', 'title={t("journal.formTitleAdd")}')
content = content.replace('Ngày ghi lại', '{t("journal.dateLabel")}')
content = content.replace('Tiêu đề bài viết *', '{t("journal.titleLabel")}')
content = content.replace('placeholder="VD: Một ngày đáng nhớ ở Vũng Tàu"', 'placeholder={t("journal.titlePlaceholder")}')
content = content.replace('Đang lấy vị trí...', '{t("journal.locLoading")}')
content = content.replace('Cảm xúc hôm nay', '{t("journal.moodLabel")}')
content = content.replace('Câu chuyện của bạn *', '{t("journal.contentLabel")}')
content = content.replace('placeholder="Ghi lại cảm xúc, câu chuyện, món ăn ngon hoặc khoảnh khắc đáng nhớ..."', 'placeholder={t("journal.contentPlaceholder")}')
content = content.replace('Đính kèm hình ảnh', '{t("journal.imgAttach")}')
content = content.replace('>Hủy<', '>{t("journal.cancel")}<')
content = content.replace('<span>+ Thả cảm xúc</span>', '<span>+ {t("journal.reactionBtn")}</span>')
content = content.replace('title="Xóa vị trí"', 'title={t("journal.locRemove")}')

# "Đề xuất xóa" inline text
content = content.replace('>Đề xuất xóa<', '>{t("share.suggestDelete")}<')

content = content.replace('title={isDirectEdit || j.authorName === resolvedGuestName ? "Xóa bài viết" : "Đề xuất xóa bài viết"}', 'title={isDirectEdit || j.authorName === resolvedGuestName ? t("journal.menuDelete") : t("share.suggestDeleteJournal")}')
content = content.replace('{j.title || "Bản tin chuyến đi"}', '{j.title || t("journal.defaultTitle")}')

content = content.replace('title={isDirectEdit || j.authorName === resolvedGuestName \n            ? "Xóa bài viết?" \n            : "Đề xuất xóa bài viết?"}', 'title={isDirectEdit || j.authorName === resolvedGuestName ? t("journal.delConfirmTitle") : t("share.suggestDeleteJournalTitle")}')
content = content.replace('description={isDirectEdit || j.authorName === resolvedGuestName \n            ? "Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác." \n            : "Bạn đang gửi đề xuất xóa bài viết này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."}', 'description={isDirectEdit || j.authorName === resolvedGuestName ? t("journal.delConfirmDesc") : t("share.suggestDeleteJournalDesc")}')

# If format is slightly different due to multi-line:
content = content.replace('? "Xóa bài viết?"\n            : "Đề xuất xóa bài viết?"', '? t("journal.delConfirmTitle")\n            : t("share.suggestDeleteJournalTitle")')
content = content.replace('? "Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác."\n            : "Bạn đang gửi đề xuất xóa bài viết này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."', '? t("journal.delConfirmDesc")\n            : t("share.suggestDeleteJournalDesc")')

content = content.replace('confirmLabel={isDirectEdit || j.authorName === resolvedGuestName\n            ? "Xóa"\n            : "Đề xuất xóa"}', 'confirmLabel={isDirectEdit || j.authorName === resolvedGuestName\n            ? t("journal.delConfirmBtn")\n            : t("share.suggestDelete")}')

content = content.replace('? "Xóa"\n            : "Đề xuất xóa"', '? t("journal.delConfirmBtn")\n            : t("share.suggestDelete")')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated SharedJournalsSection")
