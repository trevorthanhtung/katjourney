import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { formatDate, formatMoney, getChecklistStats, getPackingStats, getSettlementSuggestions, getWrappedStats, groupedByDate, safeFileName, sumBy, today, TripData } from "./helpers";
import { moodLabels, sectionLabels } from "./helpers";
import { RobotoRegular } from "./Roboto-Regular-normal";

function pdfSafeText(value: string | number) {
  return String(value);
}

export function exportTripPdf(data: TripData) {
  const { trip, members, events, expenses, checklist, journals, travelDocuments, backupPlans } = data;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
  
  doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegular);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto", "normal");

  const stats = getWrappedStats(data);
  let currentY = 22; // Start below the header area (which is at Y=15)

  function checkSpace(neededHeight: number) {
    if (currentY + neededHeight > 270) {
      doc.addPage();
      currentY = 25; // Reset Y on new page
    }
  }

  function drawSectionTitle(title: string) {
    checkSpace(20);
    currentY += 6;
    doc.setFillColor(0, 191, 183); // Teal
    doc.circle(22, currentY - 2, 1.8, "F");
    
    doc.setFontSize(11.5);
    doc.setTextColor(3, 13, 46); // Navy
    doc.text(title, 27, currentY + 0.5);
    currentY += 5;
    
    doc.setDrawColor(232, 225, 216);
    doc.setLineWidth(0.25);
    doc.line(20, currentY, 190, currentY);
    currentY += 6;
  }

  // Cover / Header on Page 1
  // Teal vertical accent bar
  doc.setFillColor(0, 191, 183); // Teal
  doc.rect(20, currentY, 4, 15, "F");
  
  doc.setTextColor(3, 13, 46); // Navy
  doc.setFontSize(20);
  doc.text(trip.title, 28, currentY + 11);
  currentY += 20;

  // Metadata block
  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  let durationText = "";
  if (isDayTrip) {
    durationText = "Đi trong ngày";
  } else {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const diffNights = diffDays > 1 ? diffDays - 1 : 0;
    durationText = `${diffDays} ngày ${diffNights} đêm`;
  }
  const locationText = trip.location ? `Địa điểm: ${trip.location}` : "Chưa xác định địa điểm";
  const dateText = isDayTrip ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`;
  
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139); // Slate
  doc.text(`Thời gian: ${dateText} (${durationText})   |   ${locationText}`, 20, currentY);
  currentY += 6;

  doc.setDrawColor(232, 225, 216);
  doc.setLineWidth(0.3);
  doc.line(20, currentY, 190, currentY);
  currentY += 8;

  // Stats Grid 2x2
  function drawStatBox(x: number, y: number, value: string, label: string) {
    doc.setFillColor(255, 253, 248); // Surface background
    doc.setDrawColor(232, 225, 216); // Border
    doc.setLineWidth(0.3);
    doc.rect(x, y, 82, 18, "FD");
    
    // Teal vertical line inside box
    doc.setFillColor(0, 191, 183);
    doc.rect(x, y, 2, 18, "F");
    
    // Value
    doc.setFontSize(15);
    doc.setTextColor(3, 13, 46); // Navy
    doc.text(value, x + 6, y + 12);
    
    // Label
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate
    doc.text(label, x + 30, y + 11);
  }

  drawStatBox(20, currentY, String(stats.totalDays), "Ngày hành trình");
  drawStatBox(108, currentY, String(stats.activityCount), "Mục lịch trình");
  currentY += 22;
  drawStatBox(20, currentY, stats.checklistPercent + "%", "Hành lý");
  drawStatBox(108, currentY, String(stats.journalCount), "Trang nhật ký");
  currentY += 26;

  // Members Section
  drawSectionTitle("Người đồng hành");
  if (members.length === 0) {
    checkSpace(12);
    doc.setFillColor(250, 247, 241);
    doc.rect(20, currentY, 170, 8, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Chưa có người đồng hành.", 24, currentY + 5);
    currentY += 12;
  } else {
    checkSpace(10);
    doc.setFillColor(250, 247, 241);
    doc.rect(20, currentY, 170, 7, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(3, 13, 46);
    doc.text("STT", 23, currentY + 4.5);
    doc.text("Họ tên", 38, currentY + 4.5);
    doc.text("Vai trò", 88, currentY + 4.5);
    doc.text("Số điện thoại", 138, currentY + 4.5);
    currentY += 7;

    members.forEach((member, index) => {
      checkSpace(9);
      doc.setDrawColor(232, 225, 216);
      doc.setLineWidth(0.2);
      doc.line(20, currentY + 7, 190, currentY + 7);
      
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(String(index + 1), 23, currentY + 4.5);
      doc.setTextColor(3, 13, 46);
      doc.text(member.name, 38, currentY + 4.5);
      doc.setTextColor(100, 116, 139);
      doc.text(member.role || "Bạn đồng hành", 88, currentY + 4.5);
      doc.text(member.phone || "—", 138, currentY + 4.5);
      currentY += 7;
    });
    currentY += 4;
  }

  // Timeline Section
  drawSectionTitle("Lịch trình & Hoạt động");
  const eventsByDate = groupedByDate(events);
  const sortedDates = Object.keys(eventsByDate).sort((a, b) => a.localeCompare(b));

  if (sortedDates.length === 0) {
    checkSpace(12);
    doc.setFillColor(250, 247, 241);
    doc.rect(20, currentY, 170, 8, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Chưa có hoạt động nào trong lịch trình.", 24, currentY + 5);
    currentY += 12;
  } else {
    sortedDates.forEach((date) => {
      const dayEvents = eventsByDate[date].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
      
      checkSpace(12);
      doc.setFontSize(9.5);
      doc.setTextColor(3, 13, 46);
      doc.text(formatDate(date), 20, currentY + 5);
      currentY += 8;
      
      dayEvents.forEach((event) => {
        const noteLines = event.notes ? (doc.splitTextToSize(event.notes, 140) as string[]) : [];
        const rowHeight = 7 + (noteLines.length * 4) + (event.location ? 4 : 0);
        checkSpace(rowHeight + 2);
        
        // Vertical connecting line for timeline
        doc.setDrawColor(232, 225, 216);
        doc.setLineWidth(0.4);
        doc.line(24, currentY, 24, currentY + rowHeight);
        
        // Node dot
        doc.setFillColor(0, 191, 183);
        doc.circle(24, currentY + 2.5, 1.5, "F");
        
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(event.time ? event.time : "—:—", 30, currentY + 4);
        
        doc.setTextColor(3, 13, 46);
        doc.text(event.title, 46, currentY + 4);
        
        let localY = currentY + 8;
        if (event.location) {
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(8);
          doc.text(`Địa điểm: ${event.location}`, 46, localY);
          localY += 4;
        }
        
        if (noteLines.length > 0) {
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(8);
          noteLines.forEach((line) => {
            doc.text(line, 46, localY);
            localY += 4;
          });
        }
        
        currentY = localY;
      });
      currentY += 2;
    });
    currentY += 4;
  }

  // Expenses Section
  drawSectionTitle("Chi phí & Quyết toán");
  const sharedExpenses = expenses.filter(e => e.splitType !== "personal");
  const personalExpenses = expenses.filter(e => e.splitType === "personal");
  const sharedTotal = sharedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const personalTotal = personalExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  checkSpace(18);
  doc.setFillColor(250, 247, 241);
  doc.rect(20, currentY, 170, 12, "F");
  
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Tổng chi tiêu", 24, currentY + 4);
  doc.text("Chi chung nhóm", 84, currentY + 4);
  doc.text("Tự trả riêng", 144, currentY + 4);
  
  doc.setFontSize(9.5);
  doc.setTextColor(3, 13, 46);
  doc.text(formatMoney(totalExpense), 24, currentY + 9);
  doc.text(formatMoney(sharedTotal), 84, currentY + 9);
  doc.text(formatMoney(personalTotal), 144, currentY + 9);
  currentY += 16;

  // Expense table
  checkSpace(10);
  doc.setFillColor(250, 247, 241);
  doc.rect(20, currentY, 170, 7, "F");
  doc.setFontSize(8.5);
  doc.setTextColor(3, 13, 46);
  doc.text("Khoản chi", 23, currentY + 4.5);
  doc.text("Người trả", 83, currentY + 4.5);
  doc.text("Phân loại", 123, currentY + 4.5);
  doc.text("Loại", 153, currentY + 4.5);
  doc.text("Số tiền", 168, currentY + 4.5);
  currentY += 7;

  if (expenses.length === 0) {
    checkSpace(12);
    doc.setFillColor(250, 247, 241);
    doc.rect(20, currentY, 170, 8, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Chưa có ghi chép chi phí nào.", 24, currentY + 5);
    currentY += 12;
  } else {
    expenses.forEach((expense) => {
      checkSpace(9);
      doc.setDrawColor(232, 225, 216);
      doc.setLineWidth(0.2);
      doc.line(20, currentY + 7, 190, currentY + 7);
      
      doc.setFontSize(8);
      doc.setTextColor(3, 13, 46);
      
      const descLines = doc.splitTextToSize(expense.description || "Chi tiêu", 58) as string[];
      doc.text(descLines[0], 23, currentY + 4.5);
      
      doc.setTextColor(100, 116, 139);
      doc.text(expense.payer, 83, currentY + 4.5);
      doc.text(expense.category, 123, currentY + 4.5);
      
      const isPersonal = expense.splitType === "personal";
      doc.text(isPersonal ? "Cá nhân" : "Chung", 153, currentY + 4.5);
      
      if (isPersonal) doc.setTextColor(120, 120, 120); else doc.setTextColor(3, 13, 46);
      doc.text(formatMoney(Number(expense.amount || 0)), 168, currentY + 4.5);
      currentY += 7;
    });
    currentY += 4;
  }

  // Debt settlement
  checkSpace(15);
  doc.setFontSize(9.5);
  doc.setTextColor(3, 13, 46);
  doc.text("Đề xuất chia tiền quyết toán nhóm (loại trừ tự trả riêng)", 20, currentY + 4);
  currentY += 6;

  const settlements = getSettlementSuggestions(members, expenses);
  if (settlements.length === 0) {
    checkSpace(12);
    doc.setFillColor(250, 247, 241);
    doc.rect(20, currentY, 170, 8, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Không có giao dịch quyết toán nào cần thực hiện.", 24, currentY + 5);
    currentY += 12;
  } else {
    settlements.forEach((item) => {
      checkSpace(9);
      doc.setDrawColor(232, 225, 216);
      doc.setLineWidth(0.2);
      doc.line(20, currentY + 7, 190, currentY + 7);
      
      doc.setFontSize(8.5);
      doc.setTextColor(3, 13, 46);
      doc.text(item.from, 23, currentY + 4.5);
      doc.setTextColor(100, 116, 139);
      doc.text("chuyển khoản quyết toán cho", 53, currentY + 4.5);
      doc.setTextColor(3, 13, 46);
      doc.text(item.to, 115, currentY + 4.5);
      doc.setTextColor(0, 191, 183); // Teal
      doc.text(formatMoney(item.amount), 168, currentY + 4.5);
      currentY += 7;
    });
    currentY += 4;
  }

  // Checklist Section
  drawSectionTitle("Chuẩn bị & Hành lý");
  const checklistStats = getChecklistStats(checklist);
  
  checkSpace(10);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Đã hoàn thành ${checklistStats.completed} trên tổng số ${checklistStats.total} mục cần làm (${checklistStats.percent}%).`, 20, currentY + 4);
  currentY += 7;

  if (checklist.length === 0) {
    checkSpace(12);
    doc.setFillColor(250, 247, 241);
    doc.rect(20, currentY, 170, 8, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Chưa có danh mục chuẩn bị nào.", 24, currentY + 5);
    currentY += 12;
  } else {
    checkSpace(8);
    doc.setFillColor(250, 247, 241);
    doc.rect(20, currentY, 170, 7, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(3, 13, 46);
    doc.text("Nhiệm vụ cần chuẩn bị", 23, currentY + 4.5);
    doc.text("Thời điểm", 113, currentY + 4.5);
    doc.text("Trạng thái", 153, currentY + 4.5);
    currentY += 7;

    checklist.forEach((item) => {
      checkSpace(9);
      doc.setDrawColor(232, 225, 216);
      doc.setLineWidth(0.2);
      doc.line(20, currentY + 7, 190, currentY + 7);
      
      doc.setFontSize(8);
      doc.setTextColor(3, 13, 46);
      doc.text(item.title, 23, currentY + 4.5);
      
      doc.setTextColor(100, 116, 139);
      doc.text(sectionLabels[item.section] || "Trước chuyến đi", 113, currentY + 4.5);
      
      if (item.completed) doc.setTextColor(0, 191, 183); else doc.setTextColor(100, 116, 139);
      doc.text(item.completed ? "Đã xong" : "Chưa", 153, currentY + 4.5);
      
      currentY += 7;
    });
    currentY += 4;
  }

  // Travel Documents Section
  drawSectionTitle("Giấy tờ & thông tin đặt chỗ");
  const docs = travelDocuments ?? [];
  if (docs.length === 0) {
    checkSpace(12);
    doc.setFillColor(250, 247, 241);
    doc.rect(20, currentY, 170, 8, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Chưa có giấy tờ hay thông tin đặt chỗ nào được lưu.", 24, currentY + 5);
    currentY += 12;
  } else {
    checkSpace(8);
    doc.setFillColor(250, 247, 241);
    doc.rect(20, currentY, 170, 7, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(3, 13, 46);
    doc.text("Tên giấy tờ", 23, currentY + 4.5);
    doc.text("Phân loại", 83, currentY + 4.5);
    doc.text("Mã xác nhận / Code", 123, currentY + 4.5);
    doc.text("Ngày liên quan", 163, currentY + 4.5);
    currentY += 7;

    const docTypeLabels: Record<string, string> = {
      ticket: "Vé xe/máy bay",
      hotel: "Khách sạn",
      booking: "Vé tham quan",
      document: "Giấy tờ cá nhân",
      contact: "Liên hệ khẩn",
      map: "Bản đồ",
      other: "Khác"
    };

    docs.forEach((d) => {
      const noteLines = d.note ? (doc.splitTextToSize(d.note, 140) as string[]) : [];
      const linkLines = d.link ? (doc.splitTextToSize(`Link: ${d.link}`, 140) as string[]) : [];
      const rowHeight = 7 + (noteLines.length * 4) + (linkLines.length * 4);
      checkSpace(rowHeight + 2);
      
      doc.setDrawColor(232, 225, 216);
      doc.setLineWidth(0.2);
      doc.line(20, currentY + rowHeight, 190, currentY + rowHeight);
      
      doc.setFontSize(8);
      doc.setTextColor(3, 13, 46);
      doc.text(pdfSafeText(d.title), 23, currentY + 4.5);
      
      doc.setTextColor(100, 116, 139);
      doc.text(pdfSafeText(docTypeLabels[d.type || "other"] || "Khác"), 83, currentY + 4.5);
      doc.text(pdfSafeText(d.code || "—"), 123, currentY + 4.5);
      doc.text(d.date ? formatDate(d.date) : "—", 163, currentY + 4.5);
      
      let localY = currentY + 8;
      if (noteLines.length > 0) {
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        noteLines.forEach((line) => {
          doc.text(`Ghi chú: ${line}`, 25, localY);
          localY += 3.5;
        });
      }
      if (linkLines.length > 0) {
        doc.setFontSize(7.5);
        doc.setTextColor(0, 120, 150);
        linkLines.forEach((line) => {
          doc.text(line, 25, localY);
          localY += 3.5;
        });
      }
      currentY = localY;
    });
    currentY += 4;
  }

  // Backup Plans Section
  drawSectionTitle("Phương án dự phòng");
  const plans = backupPlans ?? [];
  if (plans.length === 0) {
    checkSpace(12);
    doc.setFillColor(250, 247, 241);
    doc.rect(20, currentY, 170, 8, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Chưa có phương án dự phòng nào được lưu.", 24, currentY + 5);
    currentY += 12;
  } else {
    checkSpace(8);
    doc.setFillColor(250, 247, 241);
    doc.rect(20, currentY, 170, 7, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(3, 13, 46);
    doc.text("Tên phương án", 23, currentY + 4.5);
    doc.text("Trường hợp", 83, currentY + 4.5);
    doc.text("Địa điểm thay thế", 133, currentY + 4.5);
    currentY += 7;

    plans.forEach((p) => {
      const noteLines = p.note ? (doc.splitTextToSize(p.note, 140) as string[]) : [];
      const rowHeight = 7 + (noteLines.length * 4);
      checkSpace(rowHeight + 2);
      
      doc.setDrawColor(232, 225, 216);
      doc.setLineWidth(0.2);
      doc.line(20, currentY + rowHeight, 190, currentY + rowHeight);
      
      doc.setFontSize(8);
      doc.setTextColor(3, 13, 46);
      doc.text(pdfSafeText(p.title), 23, currentY + 4.5);
      
      doc.setTextColor(100, 116, 139);
      doc.text(pdfSafeText(p.reason || "—"), 83, currentY + 4.5);
      doc.text(pdfSafeText(p.location || "—"), 133, currentY + 4.5);
      
      let localY = currentY + 8;
      if (noteLines.length > 0) {
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        noteLines.forEach((line) => {
          doc.text(`Ghi chú: ${line}`, 25, localY);
          localY += 3.5;
        });
      }
      currentY = localY;
    });
    currentY += 4;
  }

  // Journals Section
  drawSectionTitle("Nhật ký & Kỷ niệm");
  if (journals.length === 0) {
    checkSpace(12);
    doc.setFillColor(250, 247, 241);
    doc.rect(20, currentY, 170, 8, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Chưa có ghi chép nhật ký nào.", 24, currentY + 5);
    currentY += 12;
  } else {
    journals.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach((entry) => {
      const contentLines = doc.splitTextToSize(entry.content || "", 158) as string[];
      const entryHeight = 11 + contentLines.length * 4.2;
      
      checkSpace(entryHeight + 4);
      
      doc.setFillColor(255, 253, 248); // Surface background
      doc.setDrawColor(232, 225, 216);
      doc.setLineWidth(0.25);
      doc.rect(20, currentY, 170, entryHeight, "FD");
      
      // Teal vertical line indicator
      doc.setFillColor(0, 191, 183);
      doc.rect(20, currentY, 2, 8, "F");
      
      doc.setFontSize(8.5);
      doc.setTextColor(3, 13, 46);
      
      const dateStr = formatDate(entry.date);
      const moodStr = moodLabels[entry.mood] ? `Cảm xúc: ${moodLabels[entry.mood]}` : "";
      const titleStr = entry.title ? `— "${entry.title}"` : "";
      doc.text(`${dateStr} ${titleStr}   |   ${moodStr}`, 25, currentY + 5.5);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      let lineY = currentY + 11;
      contentLines.forEach((line) => {
        doc.text(line, 25, lineY);
        lineY += 4.2;
      });
      
      currentY += entryHeight + 4;
    });
  }

  // Draw Header and Footer on all pages
  const totalPages = (doc as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Header
    doc.setDrawColor(232, 225, 216); // Border
    doc.setLineWidth(0.3);
    doc.line(20, 15, 190, 15);
    
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate
    doc.text("KAT Journey — Nhật ký & Tổng kết chuyến đi", 20, 12);
    
    // Footer
    doc.line(20, 280, 190, 280);
    doc.text("thực hiện bởi thanhtungg.", 20, 285);
    doc.text(`Trang ${i} / ${totalPages}`, 190, 285, { align: "right" });
  }

  doc.save(`KAT-Journey_${safeFileName(trip.title)}_${trip.startDate || today}.pdf`);
}

export function exportTripExcel(data: TripData) {
  const { trip, members, events, expenses, checklist, journals, packingItems, travelDocuments, backupPlans } = data;
  const workbook = XLSX.utils.book_new();
  const checklistStats = getChecklistStats(checklist);
  const packingStats = getPackingStats(packingItems);

  const safeTitleName = safeFileName(trip.title, "chuyen-di");
  const excelFileName = `KAT-Journey_${safeTitleName}_${trip.startDate || today}.xlsx`;

  // Helper to format cells
  function setCellFormat(ws: XLSX.WorkSheet, cellRef: string, format: string) {
    if (ws[cellRef]) {
      ws[cellRef].z = format;
    }
  }

  // Helper to set column widths dynamically
  function autofitColumns(ws: XLSX.WorkSheet) {
    const ref = ws['!ref'];
    if (!ref) return;
    const range = XLSX.utils.decode_range(ref);
    const cols = [];
    for (let C = range.s.c; C <= range.e.c; C++) {
      let maxLen = 10;
      for (let R = range.s.r; R <= range.e.r; R++) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellRef];
        if (cell && cell.v !== undefined) {
          const valStr = String(cell.v);
          maxLen = Math.max(maxLen, Math.min(valStr.length, 50));
        }
      }
      cols.push({ wch: maxLen + 3 });
    }
    ws['!cols'] = cols;
  }

  // Helper to setup views (freeze pane) and filters
  function setupViewsAndFilters(ws: XLSX.WorkSheet, headerRowIndex: number, numCols: number, numRows: number, hasData: boolean) {
    ws['!views'] = [
      {
        state: 'frozen',
        xSplit: 0,
        ySplit: headerRowIndex + 1,
        topLeftCell: XLSX.utils.encode_cell({ r: headerRowIndex + 1, c: 0 }),
        activePane: 'bottomLeft'
      }
    ];

    if (hasData) {
      ws['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: { r: headerRowIndex, c: 0 },
          e: { r: numRows - 1, c: numCols - 1 }
        })
      };
    }
  }

  // 1. SHEET: TỔNG QUAN
  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  let durationText = "";
  if (isDayTrip) {
    durationText = "Đi trong ngày";
  } else {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const diffNights = diffDays > 1 ? diffDays - 1 : 0;
    durationText = `${diffDays} ngày ${diffNights} đêm`;
  }
  const dateText = isDayTrip ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`;

  const sharedExpenses = expenses.filter(e => e.splitType !== "personal");
  const personalExpenses = expenses.filter(e => e.splitType === "personal");
  const sharedTotal = sharedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const personalTotal = personalExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const perPersonShare = members.length ? sharedTotal / members.length : sharedTotal;

  const summaryData: any[][] = [
    ["KAT Journey - Báo cáo tổng kết chuyến đi"],
    [],
    ["Thông tin chuyến đi", "", "Số liệu tài chính"],
    ["Tên chuyến đi", trip.title, "Tổng chi phí", totalExpense],
    ["Địa điểm", trip.location || "—", "Chi chung chuyến đi", sharedTotal],
    ["Thời gian", dateText, "Chi cá nhân", personalTotal],
    ["Loại chuyến", durationText, "Trung bình/người", perPersonShare],
    ["Người đồng hành", `${members.length} người`, "Số khoản chi", expenses.length],
    [],
    ["Thống kê hành trình"],
    ["Lịch trình", `${events.length} mục lịch trình`],
    ["Hành lý", `${checklistStats.completed}/${checklistStats.total} món (${checklistStats.percent}%)`],
    ["Nhật ký", `${journals.length} trang`],
    ["Giấy tờ & đặt chỗ", `${(travelDocuments ?? []).length} tài liệu`],
    ["Phương án dự phòng", `${(backupPlans ?? []).length} phương án`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  setCellFormat(wsSummary, "D4", '#,##0" ₫"');
  setCellFormat(wsSummary, "D5", '#,##0" ₫"');
  setCellFormat(wsSummary, "D6", '#,##0" ₫"');
  setCellFormat(wsSummary, "D7", '#,##0" ₫"');
  autofitColumns(wsSummary);
  XLSX.utils.book_append_sheet(workbook, wsSummary, "Tổng quan");

  // 2. SHEET: NGƯỜI ĐỒNG HÀNH
  const memberData: any[][] = [
    ["Danh sách người đồng hành"],
    ["STT", "Họ tên", "Vai trò", "Số điện thoại", "Ghi chú"]
  ];
  const hasMembers = members.length > 0;
  if (!hasMembers) {
    memberData.push(["—", "Chưa có người đồng hành nào", "—", "—", "—"]);
  } else {
    members.forEach((m, idx) => {
      memberData.push([
        idx + 1,
        m.name,
        m.role || "Bạn đồng hành",
        m.phone || "—",
        m.note || "—"
      ]);
    });
  }
  const wsMembers = XLSX.utils.aoa_to_sheet(memberData);
  autofitColumns(wsMembers);
  setupViewsAndFilters(wsMembers, 1, 5, memberData.length, hasMembers);
  XLSX.utils.book_append_sheet(workbook, wsMembers, "Người đồng hành");

  // 3. SHEET: LỊCH TRÌNH
  const eventData: any[][] = [
    ["Lịch trình chi tiết chuyến đi"],
    ["STT", "Ngày", "Giờ", "Mục lịch trình", "Địa điểm", "Link bản đồ", "Ghi chú", "Trạng thái"]
  ];
  const hasEvents = events.length > 0;
  if (!hasEvents) {
    eventData.push(["—", "—", "—", "Chưa có mục lịch trình nào.", "—", "—", "—", "—"]);
  } else {
    const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));
    sortedEvents.forEach((e, idx) => {
      eventData.push([
        idx + 1,
        formatDate(e.date),
        e.time || "—",
        e.title,
        e.location || "—",
        e.mapLink || "—",
        e.notes || "—",
        e.completed ? "Đã xong" : "Chưa xong"
      ]);
    });
  }
  const wsEvents = XLSX.utils.aoa_to_sheet(eventData);
  autofitColumns(wsEvents);
  setupViewsAndFilters(wsEvents, 1, 8, eventData.length, hasEvents);
  XLSX.utils.book_append_sheet(workbook, wsEvents, "Lịch trình");

  // 4. SHEET: CHI PHÍ
  const expenseData: any[][] = [
    ["Báo cáo chi tiết chi phí hành trình"],
    ["STT", "Số tiền", "Danh mục", "Mô tả / Ghi chú", "Phân loại", "Người chi trả / Của ai"]
  ];
  const hasExpenses = expenses.length > 0;
  if (!hasExpenses) {
    expenseData.push(["—", 0, "—", "Chưa có ghi chép chi phí nào.", "—", "—"]);
  } else {
    expenses.forEach((e, idx) => {
      const isPersonal = e.splitType === "personal";
      expenseData.push([
        idx + 1,
        Number(e.amount || 0),
        e.category,
        e.description || "—",
        isPersonal ? "Chi cá nhân" : "Chi chung chuyến đi",
        isPersonal ? (e.payer || "Khoản cá nhân") : (e.payer || "Chưa rõ người trả")
      ]);
    });
  }
  
  // Add summary rows at the bottom
  expenseData.push([]);
  expenseData.push(["Thống kê chi phí tổng hợp"]);
  expenseData.push(["Tổng chi phí", totalExpense]);
  expenseData.push(["Chi chung chuyến đi", sharedTotal]);
  expenseData.push(["Chi cá nhân", personalTotal]);
  expenseData.push(["Trung bình mỗi người", perPersonShare]);
  expenseData.push(["Số khoản chi", expenses.length]);

  const wsExpenses = XLSX.utils.aoa_to_sheet(expenseData);
  
  // Format table data cells
  if (hasExpenses) {
    for (let i = 3; i <= 2 + expenses.length; i++) {
      setCellFormat(wsExpenses, `B${i}`, '#,##0" ₫"');
    }
  } else {
    setCellFormat(wsExpenses, "B3", '#,##0" ₫"');
  }

  // Format summary cells
  const summaryStartRow = 2 + (hasExpenses ? expenses.length : 1) + 3;
  setCellFormat(wsExpenses, `B${summaryStartRow}`, '#,##0" ₫"');
  setCellFormat(wsExpenses, `B${summaryStartRow + 1}`, '#,##0" ₫"');
  setCellFormat(wsExpenses, `B${summaryStartRow + 2}`, '#,##0" ₫"');
  setCellFormat(wsExpenses, `B${summaryStartRow + 3}`, '#,##0" ₫"');

  autofitColumns(wsExpenses);
  setupViewsAndFilters(wsExpenses, 1, 6, 2 + (hasExpenses ? expenses.length : 1), hasExpenses);
  XLSX.utils.book_append_sheet(workbook, wsExpenses, "Chi phí");

  // 5. SHEET: CHUẨN BỊ
  const prepData: any[][] = [
    ["Danh sách chuẩn bị chuyến đi"],
    ["STT", "Nhiệm vụ cần chuẩn bị", "Phân loại", "Trạng thái"]
  ];
  const hasChecklist = checklist.length > 0;
  if (!hasChecklist) {
    prepData.push(["—", "Chưa có danh mục chuẩn bị nào.", "—", "—"]);
  } else {
    checklist.forEach((item, idx) => {
      prepData.push([
        idx + 1,
        item.title,
        sectionLabels[item.section] || "Trước chuyến đi",
        item.completed ? "Đã chuẩn bị" : "Chưa chuẩn bị"
      ]);
    });
  }

  prepData.push([]);
  prepData.push(["Thống kê tiến độ"]);
  prepData.push(["Tổng số món", checklistStats.total]);
  prepData.push(["Đã chuẩn bị", checklistStats.completed]);
  prepData.push(["Chưa chuẩn bị", checklistStats.total - checklistStats.completed]);
  prepData.push(["Tỷ lệ hoàn thành", checklistStats.percent / 100]);

  const wsPrep = XLSX.utils.aoa_to_sheet(prepData);
  const prepSummaryStart = 2 + (hasChecklist ? checklist.length : 1) + 3;
  setCellFormat(wsPrep, `B${prepSummaryStart + 3}`, '0%');

  autofitColumns(wsPrep);
  setupViewsAndFilters(wsPrep, 1, 4, 2 + (hasChecklist ? checklist.length : 1), hasChecklist);
  XLSX.utils.book_append_sheet(workbook, wsPrep, "Chuẩn bị");

  // 6. SHEET: NHẬT KÝ
  const journalData: any[][] = [
    ["Nhật ký ghi chép hành trình"],
    ["STT", "Ngày", "Cảm xúc", "Tiêu đề", "Nội dung"]
  ];
  const hasJournals = journals.length > 0;
  if (!hasJournals) {
    journalData.push(["—", "—", "—", "Chưa có trang nhật ký nào.", "—"]);
  } else {
    const sortedJournals = [...journals].sort((a, b) => a.date.localeCompare(b.date));
    sortedJournals.forEach((entry, idx) => {
      journalData.push([
        idx + 1,
        formatDate(entry.date),
        moodLabels[entry.mood] || "Đáng nhớ",
        entry.title || "Nhật ký chuyến đi",
        entry.content || "—"
      ]);
    });
  }
  const wsJournals = XLSX.utils.aoa_to_sheet(journalData);
  autofitColumns(wsJournals);
  setupViewsAndFilters(wsJournals, 1, 5, journalData.length, hasJournals);
  XLSX.utils.book_append_sheet(workbook, wsJournals, "Nhật ký");

  // 7. SHEET: HÀNH LÝ
  const luggageData: any[][] = [
    ["Danh sách hành lý cá nhân"],
    ["STT", "Món đồ", "Phân loại chuyến đi", "Trạng thái"]
  ];
  const hasLuggage = packingItems.length > 0;
  if (!hasLuggage) {
    luggageData.push(["—", "Chưa có món đồ nào.", "—", "—"]);
  } else {
    packingItems.forEach((item, idx) => {
      luggageData.push([
        idx + 1,
        item.title,
        item.tripType || "Thành phố",
        item.completed ? "Đã xếp" : "Chưa xếp"
      ]);
    });
  }

  luggageData.push([]);
  luggageData.push(["Thống kê hành lý"]);
  luggageData.push(["Tổng số món", packingStats.total]);
  luggageData.push(["Đã xếp", packingStats.completed]);
  luggageData.push(["Chưa xếp", packingStats.total - packingStats.completed]);
  luggageData.push(["Tỷ lệ hoàn thành", packingStats.percent / 100]);

  const wsLuggage = XLSX.utils.aoa_to_sheet(luggageData);
  const luggageSummaryStart = 2 + (hasLuggage ? packingItems.length : 1) + 3;
  setCellFormat(wsLuggage, `B${luggageSummaryStart + 3}`, '0%');

  autofitColumns(wsLuggage);
  setupViewsAndFilters(wsLuggage, 1, 4, 2 + (hasLuggage ? packingItems.length : 1), hasLuggage);
  XLSX.utils.book_append_sheet(workbook, wsLuggage, "Hành lý");

  // 8. SHEET: GIẤY TỜ & ĐẶT CHỖ
  const docTypeLabels: Record<string, string> = {
    ticket: "Vé máy bay / tàu xe",
    hotel: "Khách sạn / lưu trú",
    booking: "Vé tham quan / đặt chỗ",
    document: "Giấy tờ cá nhân / hộ chiếu",
    contact: "Liên hệ khẩn cấp",
    map: "Bản đồ / địa chỉ",
    other: "Khác"
  };
  const docData: any[][] = [
    ["Danh sách giấy tờ & đặt chỗ du lịch"],
    ["STT", "Loại", "Tên mục", "Mã / thông tin", "Ngày liên quan", "Link", "Ghi chú"]
  ];
  const docsList = travelDocuments ?? [];
  const hasDocs = docsList.length > 0;
  if (!hasDocs) {
    docData.push(["—", "—", "Chưa có thông tin giấy tờ nào được lưu.", "—", "—", "—", "—"]);
  } else {
    docsList.forEach((d, idx) => {
      docData.push([
        idx + 1,
        docTypeLabels[d.type || "other"] || "Khác",
        d.title,
        d.code || "—",
        d.date ? formatDate(d.date) : "—",
        d.link || "—",
        d.note || "—"
      ]);
    });
  }
  const wsDocs = XLSX.utils.aoa_to_sheet(docData);
  autofitColumns(wsDocs);
  setupViewsAndFilters(wsDocs, 1, 7, docData.length, hasDocs);
  XLSX.utils.book_append_sheet(workbook, wsDocs, "Giấy tờ & Đặt chỗ");

  // 9. SHEET: PHƯƠNG ÁN DỰ PHÒNG
  const planData: any[][] = [
    ["Danh sách phương án dự phòng"],
    ["STT", "Tên phương án", "Trường hợp áp dụng", "Loại", "Địa điểm thay thế", "Ngày", "Ghi chú"]
  ];
  const plansList = backupPlans ?? [];
  const hasPlans = plansList.length > 0;
  if (!hasPlans) {
    planData.push(["—", "Chưa có phương án dự phòng nào.", "—", "—", "—", "—", "—"]);
  } else {
    plansList.forEach((p, idx) => {
      planData.push([
        idx + 1,
        p.title,
        p.reason || "—",
        p.type === "food" ? "Ăn uống" : p.type === "place" ? "Địa điểm" : p.type === "transport" ? "Di chuyển" : "Khác",
        p.location || "—",
        p.date ? formatDate(p.date) : "—",
        p.note || "—"
      ]);
    });
  }
  const wsPlans = XLSX.utils.aoa_to_sheet(planData);
  autofitColumns(wsPlans);
  setupViewsAndFilters(wsPlans, 1, 7, planData.length, hasPlans);
  XLSX.utils.book_append_sheet(workbook, wsPlans, "Phương án dự phòng");

  XLSX.writeFile(workbook, excelFileName);
}
