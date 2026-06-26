import re

def replace_shared_screen():
    filepath = "src/features/share/SharedTripScreen.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace(
        '/> Chia sẻ',
        '/> {t("sharedScreen.headerShare")}'
    )
    content = content.replace(
        'title="Chọn lại người dùng"',
        'title={t("sharedScreen.switchUser")}'
    )
    content = content.replace(
        '>\n              Thoát\n            </button>',
        '>\n              {t("sharedScreen.exit")}\n            </button>'
    )
    content = content.replace(
        '>Dữ liệu được chia sẻ an toàn qua KAT Journey.</p>',
        '>{t("sharedScreen.secureData")}</p>'
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)


def replace_share_requests():
    filepath = "src/features/share/components/ShareChangeRequestsSheet.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace(
        '"Người được chia sẻ"',
        't("sharedScreen.sharedUser")'
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    replace_shared_screen()
    replace_share_requests()
