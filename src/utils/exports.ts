import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { formatDate, formatMoney, getChecklistStats, getSettlementSuggestions, getWrappedStats, groupedByDate, safeFileName, sumBy, TripData } from "./helpers";
import { moodLabels, sectionLabels } from "./helpers";
import { RobotoRegular } from "./Roboto-Regular-normal";

function pdfSafeText(value: string | number) {
  return String(value);
}

export function exportTripPdf(data: TripData) {
  const { trip, members, events, expenses, checklist, journals } = data;
  const doc = new jsPDF();
  
  doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegular);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto", "normal");

  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const perPerson = members.length ? totalExpense / members.length : totalExpense;
  const checklistStats = getChecklistStats(checklist);
  const settlements = getSettlementSuggestions(members, expenses);
  let y = 16;

  function addLine(text: string, size = 10, bold = false) {
    if (y > 280) {
      doc.addPage();
      y = 16;
    }
    doc.setFont("Roboto", "normal"); // bold is not supported unless we add bold font, sticking to normal but varying size
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(pdfSafeText(text), 180) as string[];
    doc.text(lines, 14, y);
    y += lines.length * (size > 12 ? 7 : 5) + 2;
  }

  function addSection(title: string) {
    y += 3;
    addLine(title, 13, true);
  }

  addLine("KAT Journey - Báo cáo chuyến đi", 16, true);
  addLine(trip.title, 14, true);
  addLine(`${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`);
  if (trip.location) addLine(`Địa điểm: ${trip.location}`);

  addSection("Thành viên");
  members.length
    ? members.forEach((member) => addLine(`- ${member.name}${member.role ? ` (${member.role})` : ""}${member.phone ? ` - ${member.phone}` : ""}`))
    : addLine("Chưa có thành viên.");

  addSection("Lịch trình");
  const eventsByDate = groupedByDate(events);
  Object.keys(eventsByDate).length
    ? Object.entries(eventsByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, items]) => {
          addLine(formatDate(date), 11, true);
          items.forEach((item) => addLine(`- ${item.time ? `${item.time} ` : ""}${item.title}${item.completed ? " [xong]" : ""}`));
        })
    : addLine("Chưa có lịch trình.");

  addSection("Chi phí");
  addLine(`Tổng chi phí: ${formatMoney(totalExpense)}`);
  addLine(`Trung bình mỗi người: ${formatMoney(perPerson)}`);
  Object.entries(sumBy(expenses, (item) => item.category, (item) => Number(item.amount || 0))).forEach(([category, amount]) =>
    addLine(`- ${category}: ${formatMoney(amount)}`)
  );

  addSection("Gợi ý chia tiền");
  settlements.length
    ? settlements.forEach((item) => addLine(`- ${item.from} trả ${item.to}: ${formatMoney(item.amount)}`))
    : addLine("Chưa có gợi ý chia tiền.");

  addSection("Hành lý & Chuẩn bị");
  addLine(`${checklistStats.completed}/${checklistStats.total} mục đã xong (${checklistStats.percent}%).`);

  addSection("Nhật ký");
  journals.length
    ? journals
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .forEach((entry) => addLine(`- ${formatDate(entry.date)}: ${entry.title || "Nhật ký"} (${moodLabels[entry.mood]})`))
    : addLine("Chưa có nhật ký.");

  doc.save(`${safeFileName(trip.title)}.pdf`);
}

export function exportTripExcel(data: TripData) {
  const { trip, members, events, expenses, checklist, journals, packingItems } = data;
  const workbook = XLSX.utils.book_new();
  const wrapped = getWrappedStats(data);

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      {
        "Tên chuyến đi": trip.title,
        "Địa điểm": trip.location || "",
        "Ngày đi": trip.startDate,
        "Ngày về": trip.endDate,
        "Tổng số ngày": wrapped.totalDays,
        "Tổng chi phí": wrapped.totalExpense,
        "Trung bình mỗi người": wrapped.averageCost
      }
    ]),
    "Tổng quan"
  );

  XLSX.utils.book_append_sheet(
    workbook, 
    XLSX.utils.json_to_sheet(members.map(m => ({ "Tên": m.name, "Vai trò": m.role || "", "Số điện thoại": m.phone || "" }))), 
    "Thành viên"
  );
  
  XLSX.utils.book_append_sheet(
    workbook, 
    XLSX.utils.json_to_sheet(events.map(e => ({ "Ngày": e.date, "Giờ": e.time || "", "Tiêu đề": e.title, "Địa điểm": e.location || "", "Ghi chú": e.notes || "", "Hoàn thành": e.completed ? "Xong" : "Chưa" }))), 
    "Lịch trình"
  );

  XLSX.utils.book_append_sheet(
    workbook, 
    XLSX.utils.json_to_sheet(expenses.map(e => ({ "Số tiền": Number(e.amount), "Danh mục": e.category, "Người trả": e.payer, "Loại chia": e.splitType || "shared", "Ghi chú": e.description || "" }))), 
    "Chi phí"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(checklist.map((item) => ({ "Phân loại": sectionLabels[item.section], "Mục cần làm": item.title, "Hoàn thành": item.completed ? "Xong" : "Chưa" }))),
    "Chuẩn bị"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(journals.map((entry) => ({ "Ngày": entry.date, "Tiêu đề": entry.title || "", "Cảm xúc": moodLabels[entry.mood], "Nội dung": entry.content }))),
    "Nhật ký"
  );

  XLSX.utils.book_append_sheet(
    workbook, 
    XLSX.utils.json_to_sheet(packingItems.map(p => ({ "Món đồ": p.title, "Loại chuyến đi": p.tripType, "Hoàn thành": p.completed ? "Xong" : "Chưa" }))), 
    "Hành lý"
  );

  XLSX.writeFile(workbook, `${safeFileName(trip.title)}.xlsx`);
}
