import re

filepath = "src/features/more/MoreScreen.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    '>Không gian chuyến đi</h2>': '>{t("more.workspaceTitle")}</h2>',
    '>Quản lý ứng dụng và cấu hình dữ liệu.</p>': '>{t("more.workspaceDescNoTrip")}</p>',
    '>\n            Tùy chỉnh thông tin, thành viên và dữ liệu cho hành trình của bạn.\n          </p>': '>\n            {t("more.workspaceDesc")}\n          </p>',
    '>Hành trình hiện tại</p>': '>{t("more.currentTrip")}</p>',
    '"Chưa có địa điểm"': 't("more.noLocation")',
    '{members.length} thành viên\n              </span>': '{members.length} {t("more.membersCount")}\n              </span>',
    '{events.length} lịch trình\n              </span>': '{events.length} {t("more.eventsCount")}\n              </span>',
    '{formatMoney(totalExpense)} chi phí\n              </span>': '{formatMoney(totalExpense)} {t("more.expensesCount")}\n              </span>',
    'Chuẩn bị {checklistPercent}%\n              </span>': '{t("more.packingProgress")} {checklistPercent}%\n              </span>',
    '>Tính năng</h3>': '>{t("more.sectionFeatures")}</h3>',
    'title="Thông tin chuyến đi"': 'title={t("more.featureTripInfo")}',
    'title="Thành viên"': 'title={t("more.featureMembers")}',
    'title="Tổng kết hành trình"': 'title={t("more.featureWrapped")}',
    'title="Bản tin hành trình"': 'title={t("more.featureJournal")}',
    'title="Vé, đặt chỗ & giấy tờ"': 'title={t("more.featureDocuments")}',
    'title="Chia sẻ chuyến đi"': 'title={t("more.featureShare")}',
    '>QUẢN LÝ DỮ LIỆU</h3>': '>{t("more.sectionData")}</h3>',
    'title="Dữ liệu chuyến đi"': 'title={t("more.dataTripData")}',
    'title="Sao lưu hành trình"': 'title={t("more.dataBackup")}',
    'title="Xuất báo cáo PDF"': 'title={t("more.dataExportPdf")}',
    'title="Xuất bảng tính Excel"': 'title={t("more.dataExportExcel")}',
    '>Vùng nguy hiểm</h3>': '>{t("more.sectionDanger")}</h3>',
    'title="Kết thúc chuyến đi"': 'title={t("more.actionEndTrip")}',
    'title="Khôi phục chuyến đi"': 'title={t("more.actionRestoreTrip")}',
    'title="Xóa vĩnh viễn chuyến đi"': 'title={t("more.actionDeleteTrip")}',
    'thực hiện bởi{" "}': '{t("more.madeBy")}{" "}',
}

for k, v in replacements.items():
    content = content.replace(k, v)

# Ensure useTranslation is imported and initialized at the top level of MoreScreen
if "useTranslation" not in content:
    content = content.replace('import { useTheme } from "../../contexts/ThemeContext";', 'import { useTheme } from "../../contexts/ThemeContext";\nimport { useTranslation } from "react-i18next";')

# Add const { t } = useTranslation(); to the MoreScreen component if not present
if "const { t } = useTranslation();" not in content:
    content = content.replace('export function MoreScreen() {', 'export function MoreScreen() {\n  const { t } = useTranslation();')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement MoreScreen complete")
