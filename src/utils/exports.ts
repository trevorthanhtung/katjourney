import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { formatDate, formatMoney, getChecklistStats, getSettlementSuggestions, getWrappedStats, groupedByDate, safeFileName, sumBy, TripData } from "./helpers";
import { moodLabels, sectionLabels } from "./helpers";

function pdfSafeText(value: string | number) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function exportTripPdf(data: TripData) {
  const { trip, members, events, expenses, checklist, journals } = data;
  const doc = new jsPDF();
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
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(pdfSafeText(text), 180) as string[];
    doc.text(lines, 14, y);
    y += lines.length * (size > 12 ? 7 : 5) + 2;
  }

  function addSection(title: string) {
    y += 3;
    addLine(title, 13, true);
  }

  addLine("KAT Journey - Bao cao chuyen di", 16, true);
  addLine(trip.title, 14, true);
  addLine(`${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`);
  if (trip.location) addLine(`Dia diem: ${trip.location}`);

  addSection("Thanh vien");
  members.length
    ? members.forEach((member) => addLine(`- ${member.name}${member.role ? ` (${member.role})` : ""}${member.phone ? ` - ${member.phone}` : ""}`))
    : addLine("Chua co thanh vien.");

  addSection("Lich trinh");
  const eventsByDate = groupedByDate(events);
  Object.keys(eventsByDate).length
    ? Object.entries(eventsByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, items]) => {
          addLine(formatDate(date), 11, true);
          items.forEach((item) => addLine(`- ${item.time ? `${item.time} ` : ""}${item.title}${item.completed ? " [xong]" : ""}`));
        })
    : addLine("Chua co lich trinh.");

  addSection("Chi phi");
  addLine(`Tong chi phi: ${formatMoney(totalExpense)}`);
  addLine(`Trung binh moi nguoi: ${formatMoney(perPerson)}`);
  Object.entries(sumBy(expenses, (item) => item.category, (item) => Number(item.amount || 0))).forEach(([category, amount]) =>
    addLine(`- ${category}: ${formatMoney(amount)}`)
  );

  addSection("Goi y chia tien");
  settlements.length
    ? settlements.forEach((item) => addLine(`- ${item.from} tra ${item.to}: ${formatMoney(item.amount)}`))
    : addLine("Chua co goi y chia tien.");

  addSection("Checklist");
  addLine(`${checklistStats.completed}/${checklistStats.total} muc da xong (${checklistStats.percent}%).`);

  addSection("Nhat ky");
  journals.length
    ? journals
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .forEach((entry) => addLine(`- ${formatDate(entry.date)}: ${entry.title || "Nhat ky"} (${moodLabels[entry.mood]})`))
    : addLine("Chua co nhat ky.");

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
        title: trip.title,
        location: trip.location,
        startDate: trip.startDate,
        endDate: trip.endDate,
        totalDays: wrapped.totalDays,
        totalExpenses: wrapped.totalExpense,
        averageCostPerMember: wrapped.averageCost
      }
    ]),
    "Trip"
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(members), "Members");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(events), "Timeline");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(expenses), "Expenses");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(checklist.map((item) => ({ ...item, sectionLabel: sectionLabels[item.section] }))),
    "Checklist"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(journals.map((entry) => ({ ...entry, moodLabel: moodLabels[entry.mood] }))),
    "Journal"
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(packingItems), "Packing");
  XLSX.writeFile(workbook, `${safeFileName(trip.title)}.xlsx`);
}
