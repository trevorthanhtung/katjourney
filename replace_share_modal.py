import re

def replace_share_modal():
    filepath = "src/features/more/MoreScreen.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # subtitle="Tạo link để người khác xem lịch trình và thông tin chuyến đi."
    content = content.replace(
        'subtitle="Tạo link để người khác xem lịch trình và thông tin chuyến đi."',
        'subtitle={t("share.shareSubtitle")}'
    )

    content = content.replace(
        '>Bao gồm chi phí</span>',
        '>{t("share.includeExpenses")}</span>'
    )
    content = content.replace(
        '>Bao gồm bản tin</span>',
        '>{t("share.includeJournals")}</span>'
    )
    content = content.replace(
        '>Bao gồm danh sách chuẩn bị</span>',
        '>{t("share.includeChecklist")}</span>'
    )
    content = content.replace(
        '>Bao gồm phương án dự phòng</span>',
        '>{t("share.includeBackup")}</span>'
    )
    content = content.replace(
        '>Bao gồm giấy tờ & đặt chỗ</span>',
        '>{t("share.includeDocs")}</span>'
    )
    content = content.replace(
        '>Giấy tờ có thể chứa mã đặt chỗ, vé, số điện thoại hoặc liên kết riêng tư. Chỉ bật nếu bạn thực sự tin tưởng người nhận link.</span>',
        '>{t("share.docWarning")}</span>'
    )
    content = content.replace(
        '>Bảo vệ bằng mã PIN</span>',
        '>{t("share.pinProtect")}</span>'
    )
    content = content.replace(
        '>Người xem cần nhập đúng PIN để mở</p>',
        '>{t("share.pinDesc")}</p>'
    )
    content = content.replace(
        '>Nhập mã PIN 4 chữ số:</p>',
        '>{t("share.enterPin")}</p>'
    )
    content = content.replace(
        '> Mã PIN đã sẵn sàng',
        '> {t("share.pinReady")}'
    )
    content = content.replace(
        '>Vui lòng nhập đủ 4 chữ số</p>',
        '>{t("share.pinError")}</p>'
    )
    
    # Buttons and states
    content = content.replace(
        'Đóng\n                </button>',
        '{t("share.close")}\n                </button>'
    )
    content = content.replace(
        '{shareLoading ? "Đang tạo link..." : "Tạo link chia sẻ"}',
        '{shareLoading ? t("share.creatingLink") : t("share.createLink")}'
    )
    content = content.replace(
        '>Đã tạo link chia sẻ</span>',
        '>{t("share.linkCreated")}</span>'
    )
    content = content.replace(
        '`Tham gia chuyến đi "${trip?.title || \'\'}" cùng tôi trên KAT Journey!`',
        't("share.joinTrip", { trip: trip?.title || \'\' })'
    )
    content = content.replace(
        '>Đang tự động đồng bộ các thay đổi mới nhất...</span>',
        '>{t("share.syncingChanges")}</span>'
    )
    content = content.replace(
        'Tự động đồng bộ khi có thay đổi. Lần cuối:',
        '{t("share.autoSyncLast")}'
    )
    content = content.replace(
        ': \'Vừa xong\'}',
        ': t("share.justNow")}'
    )
    content = content.replace(
        '{syncLoading ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}',
        '{syncLoading ? t("share.syncing") : t("share.syncData")}'
    )
    content = content.replace(
        '{shareLoading ? "Đang tắt..." : "Tắt chia sẻ"}',
        '{shareLoading ? t("share.turningOff") : t("share.turnOff")}'
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    replace_share_modal()
