const fs = require('fs');

const excelPath = 'd:/02_PROJECTS/5_KAT JOURNEY/APP/src/utils/exportExcel.ts';
let excel = fs.readFileSync(excelPath, 'utf8');

// Import i18n
if (!excel.includes('import i18n')) {
  excel = excel.replace('import ExcelJS from "exceljs";', 'import ExcelJS from "exceljs";\nimport i18n from "../i18n";');
}

const replacementsExcel = [
  ['"Tổng quan"', 'i18n.t("export.overview")'],
  ['"KAT JOURNEY — BÁO CÁO CHUYẾN ĐI"', 'i18n.t("export.reportTitle")'],
  ['"Đi trong ngày"', 'i18n.t("export.dayTrip")'],
  ['`${d} ngày ${d > 1 ? d - 1 : 0} đêm`', '`${d} ${i18n.t("export.days")} ${d > 1 ? d - 1 : 0} ${i18n.t("export.nights")}`'],
  ['"Tên chuyến đi"', 'i18n.t("export.tripName")'],
  ['"Địa điểm"', 'i18n.t("export.location")'],
  ['"Chưa xác định"', '"—"'],
  ['"Thời gian"', 'i18n.t("export.duration")'],
  ['"Loại hình"', 'i18n.t("export.type")'],
  ['"Thành viên"', 'i18n.t("export.member")'],
  ['"Tổng chi phí"', 'i18n.t("export.totalExpense")'],
  ['`${checklistStats.completed}/${checklistStats.total} hoàn thành`', '`${checklistStats.completed}/${checklistStats.total} ${i18n.t("export.completed")}`'],
  ['"Hành lý"', 'i18n.t("export.luggage")'],
  ['`${packingStats.completed}/${packingStats.total} đã xếp`', '`${packingStats.completed}/${packingStats.total} ${i18n.t("export.completed")}`'],
  ['"Lịch trình"', 'i18n.t("export.itinerary")'],
  ['"LỊCH TRÌNH CHI TIẾT"', 'i18n.t("export.part2")'],
  ['"Ngày"', 'i18n.t("export.date")'],
  ['"Giờ"', 'i18n.t("export.time")'],
  ['"Hoạt động / Ghi chú"', 'i18n.t("export.activity")'],
  ['"Địa điểm / Tọa độ"', 'i18n.t("export.location")'],
  ['"Trạng thái"', 'i18n.t("export.status")'],
  ['"Chưa có hoạt động nào"', 'i18n.t("export.noActivity")'],
  ['"Hoàn thành"', 'i18n.t("export.completed")'],
  ['"Chưa xong"', 'i18n.t("export.notCompleted")'],
  ['"Tài chính"', 'i18n.t("export.expenses")'],
  ['"QUẢN LÝ TÀI CHÍNH CHUYẾN ĐI"', 'i18n.t("export.part3")'],
  ['"Hạng mục chi"', 'i18n.t("export.type")'],
  ['"Số tiền"', 'i18n.t("export.amount")'],
  ['"Phân loại"', 'i18n.t("export.type")'],
  ['"Người chi trả"', 'i18n.t("export.payer")'],
  ['"Chưa có ghi chép chi phí nào"', 'i18n.t("export.noExpense")'],
  ['"Chi cá nhân"', 'i18n.t("export.personalExpense")'],
  ['"Chi chung"', 'i18n.t("export.sharedExpense")'],
  ['"TỔNG CỘNG"', 'i18n.t("export.grandTotal")'],
  ['"Hành lý & Giấy tờ"', 'i18n.t("export.prepAndDocs")'],
  ['"HÀNH LÝ & GIẤY TỜ / ĐẶT CHỖ"', 'i18n.t("export.part4")'],
  ['"Tên vật dụng / Giấy tờ"', 'i18n.t("export.docType")'],
  ['"Mã Booking"', '"Booking Code"'],
  ['"Phụ trách"', 'i18n.t("export.role")'],
  ['"Chưa có dữ liệu hành lý / giấy tờ nào"', 'i18n.t("export.noActivity")'],
  ['"Đã xếp"', 'i18n.t("export.completed")'],
  ['"Chưa xếp"', 'i18n.t("export.notCompleted")'],
  ['"Vé máy bay / tàu xe"', '"Ticket"'],
  ['"Khách sạn / lưu trú"', '"Hotel"'],
  ['"Vé tham quan / đặt chỗ"', '"Booking"'],
  ['"Giấy tờ cá nhân"', '"Document"'],
  ['"Liên hệ khẩn cấp"', '"Contact"'],
  ['"Bản đồ / địa chỉ"', '"Map"'],
  ['"Khác"', '"Other"']
];

for (const [search, replace] of replacementsExcel) {
  excel = excel.replaceAll(search, replace);
}
fs.writeFileSync(excelPath, excel);

const pdfPath = 'd:/02_PROJECTS/5_KAT JOURNEY/APP/src/utils/exportPdf.ts';
let pdf = fs.readFileSync(pdfPath, 'utf8');

if (!pdf.includes('import i18n')) {
  pdf = pdf.replace('import { jsPDF } from "jspdf";', 'import { jsPDF } from "jspdf";\nimport i18n from "../i18n";');
}

const replacementsPdf = [
  ['"BÁO CÁO CHUYẾN ĐI"', 'i18n.t("export.reportTitle")'],
  ['"KAT Journey — Bản tin & Tổng kết chuyến đi"', 'i18n.t("export.footerNote")'],
  ['"Trang "', 'i18n.t("export.page") + " "'],
  ['"Phần 1 — Thông tin khái quát"', 'i18n.t("export.part1")'],
  ['"Đi trong ngày"', 'i18n.t("export.dayTrip")'],
  ['`${d} ngày ${d > 1 ? d - 1 : 0} đêm`', '`${d} ${i18n.t("export.days")} ${d > 1 ? d - 1 : 0} ${i18n.t("export.nights")}`'],
  ['"Tên chuyến đi"', 'i18n.t("export.tripName")'],
  ['"Thời gian"', 'i18n.t("export.duration")'],
  ['"Địa điểm"', 'i18n.t("export.location")'],
  ['"Trạng thái"', 'i18n.t("export.status")'],
  ['"Sắp diễn ra"', 'i18n.t("export.upcoming")'],
  ['"Đang diễn ra"', 'i18n.t("export.ongoing")'],
  ['"Đã kết thúc"', 'i18n.t("export.ended")'],
  ['"Mô tả"', 'i18n.t("export.description")'],
  ['"Không có mô tả cho chuyến đi này."', '"—"'],
  ['"Thành viên tham gia"', 'i18n.t("export.membersList")'],
  ['"Chưa có thông tin thành viên."', '"—"'],
  ['"Tiến độ chuẩn bị"', 'i18n.t("export.prepProgress")'],
  ['"Hành lý"', 'i18n.t("export.luggage")'],
  ['"hoàn thành"', 'i18n.t("export.completed")'],
  ['"Việc cần làm"', 'i18n.t("export.todo")'],
  ['"Tổng chi phí"', 'i18n.t("export.totalExpense")'],
  ['"Phần 2 — Lịch trình chi tiết"', 'i18n.t("export.part2")'],
  ['"Không có hoạt động nào trong lịch trình."', 'i18n.t("export.noActivity")'],
  ['"Ngày: "', 'i18n.t("export.date") + ": "'],
  ['"Giờ: "', 'i18n.t("export.time") + ": "'],
  ['"Phần 3 — Chi tiết chi phí"', 'i18n.t("export.part3")'],
  ['"Không có khoản chi phí nào được ghi nhận."', 'i18n.t("export.noExpense")'],
  ['"Người trả: "', 'i18n.t("export.payer") + ": "'],
  ['"Loại: "', 'i18n.t("export.type") + ": "'],
  ['"Ghi chú: "', 'i18n.t("export.note") + ": "'],
  ['"Chi tiêu cá nhân"', 'i18n.t("export.personalExpense")'],
  ['"Chi tiêu chung"', 'i18n.t("export.sharedExpense")'],
  ['"TỔNG CỘNG:"', 'i18n.t("export.grandTotal") + ":"'],
  ['"Phần 4 — Chuẩn bị & Tài liệu"', 'i18n.t("export.part4")'],
  ['"Không có thông tin chuẩn bị / tài liệu nào."', 'i18n.t("export.noActivity")'],
  ['"Đã chuẩn bị xong"', 'i18n.t("export.completed")'],
  ['"Chưa chuẩn bị"', 'i18n.t("export.notCompleted")'],
  ['"Số lượng: "', 'i18n.t("export.quantity") + ": "'],
  ['"Mã Booking: "', '"Booking Code: "'],
];

for (const [search, replace] of replacementsPdf) {
  pdf = pdf.replaceAll(search, replace);
}
fs.writeFileSync(pdfPath, pdf);

console.log("Done replacing.");
