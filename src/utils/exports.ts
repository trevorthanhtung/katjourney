import { jsPDF } from "jspdf";
import ExcelJS from "exceljs";
import { formatDate, formatMoney, getChecklistStats, getPackingStats, getSettlementSuggestions, getWrappedStats, groupedByDate, safeFileName, sumBy, today, TripData } from "./helpers";
import { moodLabels, sectionLabels } from "./helpers";
import { RobotoRegular } from "./Roboto-Regular-normal";

function pdfSafeText(value: string | number) {
  return String(value);
}

// ─────────────────────────────────────────────
// PDF EXPORT — BÁO CÁO CHUYẾN ĐI (4 sections)
// ─────────────────────────────────────────────
export function exportTripPdf(data: TripData) {
  const { trip, members, events, expenses, checklist, travelDocuments, backupPlans } = data;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegular);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto", "normal");

  const PAGE_W = 210;
  const MARGIN_L = 20;
  const MARGIN_R = 20;
  const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R; // 170mm
  const PAGE_BOTTOM = 275;

  // Color constants
  const C_NAVY: [number, number, number] = [3, 13, 46];
  const C_SLATE: [number, number, number] = [100, 116, 139];
  const C_BORDER: [number, number, number] = [189, 195, 199]; // #BDC3C7
  const C_HEADER_BG: [number, number, number] = [236, 240, 241]; // #ECF0F1
  const C_TABLE_HEADER: [number, number, number] = [52, 73, 94]; // #34495E
  const C_RED: [number, number, number] = [192, 57, 43];
  const C_WHITE: [number, number, number] = [255, 255, 255];

  let Y = 30; // start after top margin

  // ── Helpers ─────────────────────────────────
  function checkSpace(needed: number) {
    if (Y + needed > PAGE_BOTTOM) {
      doc.addPage();
      Y = 25;
    }
  }

  function hLine(y: number) {
    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
  }

  function sectionLabel(title: string) {
    checkSpace(14);
    Y += 4;
    doc.setFontSize(10);
    doc.setTextColor(...C_NAVY);
    doc.text(title.toUpperCase(), MARGIN_L, Y);
    Y += 2;
    hLine(Y);
    Y += 6;
  }

  // ── PAGE HEADER / FOOTER (drawn after all pages) ──
  function drawHeaderFooter() {
    const totalPages = (doc as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("Roboto", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...C_SLATE);
      hLine(12);
      doc.text("KAT Journey — Bản tin & Tổng kết chuyến đi", MARGIN_L, 10);
      hLine(282);
      doc.text("thanhtungg.", MARGIN_L, 287);
      doc.text(`Trang ${i} / ${totalPages}`, PAGE_W - MARGIN_R, 287, { align: "right" });
    }
  }

  // ═══════════════════════════════════════
  // HEADER — Tiêu đề báo cáo
  // ═══════════════════════════════════════
  doc.setFontSize(16);
  doc.setTextColor(...C_NAVY);
  doc.text("BÁO CÁO CHUYẾN ĐI", PAGE_W / 2, Y, { align: "center" });
  Y += 5;
  hLine(Y);
  Y += 10;

  // ═══════════════════════════════════════
  // PHẦN 1 — Thông tin khái quát (2×2 grid)
  // ═══════════════════════════════════════
  sectionLabel("Phần 1 — Thông tin khái quát");

  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  const dateText = isDayTrip
    ? formatDate(trip.startDate)
    : `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`;
  const typeText = isDayTrip ? "Đi trong ngày" : (() => {
    const d = Math.ceil(Math.abs(new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000) + 1;
    return `${d} ngày ${d > 1 ? d - 1 : 0} đêm`;
  })();

  const infoItems: [string, string][] = [
    ["Tên chuyến đi", trip.title || "—"],
    ["Địa điểm", trip.location || "Chưa xác định"],
    ["Thời gian", dateText],
    ["Loại hình", typeText],
  ];

  const colW = CONTENT_W / 2;
  const rowH = 14;
  for (let i = 0; i < infoItems.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = MARGIN_L + col * colW;
    const y = Y + row * rowH;

    checkSpace(rowH + 2);

    // Cell border
    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(0.3);
    doc.setFillColor(...C_HEADER_BG);
    doc.rect(x, y, colW, rowH, "FD");

    // Label
    doc.setFontSize(7.5);
    doc.setTextColor(...C_SLATE);
    doc.text(infoItems[i][0].toUpperCase(), x + 3, y + 5);

    // Value
    doc.setFontSize(9.5);
    doc.setTextColor(...C_NAVY);
    doc.text(pdfSafeText(infoItems[i][1]), x + 3, y + 11);
  }

  Y += Math.ceil(infoItems.length / 2) * rowH + 10;

  // ═══════════════════════════════════════
  // PHẦN 2 — Lịch trình chi tiết (Grid table)
  // ═══════════════════════════════════════
  sectionLabel("Phần 2 — Lịch trình chi tiết");

  // Column definitions: [label, x-offset from MARGIN_L, width]
  const tCols: [string, number, number][] = [
    ["Ngày",          0,   28],
    ["Giờ",          28,   16],
    ["Hoạt động & Ghi chú", 44, 66],
    ["Địa điểm",    110,   42],
    ["Trạng thái [ ]", 152, 18],
  ];
  const tHeaderH = 8;

  checkSpace(tHeaderH + 2);

  // Draw header row
  doc.setFillColor(...C_TABLE_HEADER);
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN_L, Y, CONTENT_W, tHeaderH, "FD");

  doc.setFontSize(8);
  doc.setTextColor(...C_WHITE);
  tCols.forEach(([label, ox]) => {
    doc.text(label, MARGIN_L + ox + 2, Y + 5.5);
  });
  Y += tHeaderH;

  // Rows
  const sortedEvents = [...events]
    .filter(e => !e.isDeleted)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));

  if (sortedEvents.length === 0) {
    checkSpace(10);
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(...C_BORDER);
    doc.rect(MARGIN_L, Y, CONTENT_W, 10, "FD");
    doc.setFontSize(8.5);
    doc.setTextColor(...C_SLATE);
    doc.text("Chưa có hoạt động nào trong lịch trình.", MARGIN_L + 3, Y + 6.5);
    Y += 14;
  } else {
    sortedEvents.forEach((event, idx) => {
      const noteLines = event.notes
        ? (doc.splitTextToSize(event.notes, tCols[2][2] - 4) as string[])
        : [];
      const rowH2 = Math.max(9, 5 + noteLines.length * 4);

      checkSpace(rowH2 + 1);

      // Alternating row bg
      if (idx % 2 === 0) {
        doc.setFillColor(248, 249, 250);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.setDrawColor(...C_BORDER);
      doc.setLineWidth(0.2);
      doc.rect(MARGIN_L, Y, CONTENT_W, rowH2, "FD");

      // Draw vertical col dividers
      let runX = MARGIN_L;
      tCols.forEach(([, , w], ci) => {
        if (ci > 0) {
          doc.setDrawColor(...C_BORDER);
          doc.setLineWidth(0.2);
          doc.line(runX, Y, runX, Y + rowH2);
        }
        runX += w;
      });

      doc.setFontSize(8);
      doc.setTextColor(...C_NAVY);

      // Col 0: Date
      doc.text(formatDate(event.date), MARGIN_L + tCols[0][1] + 2, Y + 5.5);
      // Col 1: Time
      doc.setTextColor(...C_SLATE);
      doc.text(event.time || "—", MARGIN_L + tCols[1][1] + 2, Y + 5.5);
      // Col 2: Activity + notes
      doc.setTextColor(...C_NAVY);
      doc.text(event.title, MARGIN_L + tCols[2][1] + 2, Y + 5.5);
      if (noteLines.length > 0) {
        doc.setFontSize(7);
        doc.setTextColor(...C_SLATE);
        noteLines.forEach((line, li) => {
          doc.text(line, MARGIN_L + tCols[2][1] + 2, Y + 9.5 + li * 4);
        });
      }
      // Col 3: Location
      doc.setFontSize(8);
      doc.setTextColor(...C_SLATE);
      const locLines = doc.splitTextToSize(event.location || "—", tCols[3][2] - 4) as string[];
      locLines.forEach((line, li) => {
        doc.text(line, MARGIN_L + tCols[3][1] + 2, Y + 5.5 + li * 4);
      });
      // Col 4: Status checkbox
      doc.setTextColor(...C_NAVY);
      doc.text(event.completed ? "[x]" : "[ ]", MARGIN_L + tCols[4][1] + 4, Y + 5.5);

      Y += rowH2;
    });
    Y += 8;
  }

  // ═══════════════════════════════════════
  // PHẦN 3 — Tổng kết tài chính
  // ═══════════════════════════════════════
  sectionLabel("Phần 3 — Tổng kết tài chính");

  const sharedExpenses = expenses.filter(e => e.splitType !== "personal" && !e.isDeleted);
  const personalExpenses = expenses.filter(e => e.splitType === "personal" && !e.isDeleted);
  const sharedTotal = sharedExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const personalTotal = personalExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const grandTotal = sharedTotal + personalTotal;

  const finRows: [string, string, boolean, boolean][] = [
    ["Chi chung (nhóm)",   formatMoney(sharedTotal),   false, false],
    ["Chi cá nhân",        formatMoney(personalTotal), false, false],
    ["TỔNG CỘNG",          formatMoney(grandTotal),    true,  true],
  ];

  const finColW = [CONTENT_W * 0.55, CONTENT_W * 0.45];

  // Finance header
  checkSpace(10);
  doc.setFillColor(...C_TABLE_HEADER);
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN_L, Y, CONTENT_W, 8, "FD");
  doc.setFontSize(8);
  doc.setTextColor(...C_WHITE);
  doc.text("Hạng mục", MARGIN_L + 3, Y + 5.5);
  doc.text("Số tiền", MARGIN_L + finColW[0] + 3, Y + 5.5);
  Y += 8;

  finRows.forEach((row, idx) => {
    const [label, amount, isBold, isRed] = row;
    const rH = 9;
    checkSpace(rH + 1);

    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 249 : 255, idx % 2 === 0 ? 250 : 255);
    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN_L, Y, CONTENT_W, rH, "FD");
    doc.line(MARGIN_L + finColW[0], Y, MARGIN_L + finColW[0], Y + rH);

    doc.setFontSize(isBold ? 9.5 : 8.5);
    doc.setTextColor(isRed ? C_RED[0] : C_NAVY[0], isRed ? C_RED[1] : C_NAVY[1], isRed ? C_RED[2] : C_NAVY[2]);
    doc.text(label, MARGIN_L + 3, Y + 6);
    doc.text(amount, MARGIN_L + finColW[0] + 3, Y + 6);
    Y += rH;
  });
  Y += 10;

  // ═══════════════════════════════════════
  // PHẦN 4 — Thông tin khẩn cấp & Dự phòng
  // ═══════════════════════════════════════
  sectionLabel("Phần 4 — Thông tin khẩn cấp & Dự phòng");

  const docs = (travelDocuments ?? []).filter(d => !d.isDeleted);
  const plans = (backupPlans ?? []).filter(p => !p.isDeleted);

  // Kế hoạch B
  doc.setFontSize(9);
  doc.setTextColor(...C_NAVY);
  checkSpace(8);
  doc.text("Kế hoạch B (Phương án dự phòng):", MARGIN_L, Y);
  Y += 6;

  if (plans.length === 0) {
    checkSpace(7);
    doc.setFontSize(8.5);
    doc.setTextColor(...C_SLATE);
    doc.text("  • Chưa có phương án dự phòng nào.", MARGIN_L + 2, Y);
    Y += 6;
  } else {
    plans.forEach(p => {
      checkSpace(8);
      doc.setFontSize(8.5);
      doc.setTextColor(...C_NAVY);
      const planLines = doc.splitTextToSize(`  • ${p.title}${p.reason ? " — " + p.reason : ""}${p.location ? " (" + p.location + ")" : ""}`, CONTENT_W - 6) as string[];
      planLines.forEach((line, li) => {
        doc.text(line, MARGIN_L + 2, Y + li * 4.5);
      });
      Y += planLines.length * 4.5 + 1;
    });
  }
  Y += 4;

  // Thông tin đặt chỗ (Booking ID)
  doc.setFontSize(9);
  doc.setTextColor(...C_NAVY);
  checkSpace(8);
  doc.text("Thông tin đặt chỗ (Booking ID):", MARGIN_L, Y);
  Y += 6;

  if (docs.length === 0) {
    checkSpace(7);
    doc.setFontSize(8.5);
    doc.setTextColor(...C_SLATE);
    doc.text("  • Chưa có thông tin giấy tờ / đặt chỗ nào được lưu.", MARGIN_L + 2, Y);
    Y += 6;
  } else {
    docs.forEach(d => {
      checkSpace(8);
      doc.setFontSize(8.5);
      doc.setTextColor(...C_NAVY);
      const code = d.code ? ` [${d.code}]` : "";
      const link = d.link ? ` — ${d.link}` : "";
      const itemLine = `  • ${d.title}${code}${link}`;
      const itemLines = doc.splitTextToSize(itemLine, CONTENT_W - 6) as string[];
      itemLines.forEach((line, li) => {
        doc.text(line, MARGIN_L + 2, Y + li * 4.5);
      });
      Y += itemLines.length * 4.5 + 1;
    });
  }

  // ── Header / Footer trên tất cả trang ──
  drawHeaderFooter();

  doc.save(`KAT-Journey_BaoCao_${safeFileName(trip.title)}_${trip.startDate || today}.pdf`);
}

// ─────────────────────────────────────────────
// EXCEL EXPORT — 4 SHEETS với ExcelJS
// ─────────────────────────────────────────────
export async function exportTripExcel(data: TripData) {
  const { trip, members, events, expenses, checklist, packingItems, travelDocuments, backupPlans } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "KAT Journey";
  workbook.created = new Date();

  // ── Style helpers ────────────────────────────
  const HEADER_FILL: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2C3E50" }, // #2C3E50 dark navy
  };
  const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 10 };
  const LABEL_FILL: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFECF0F1" }, // #ECF0F1 light grey
  };
  const LABEL_FONT: Partial<ExcelJS.Font> = { bold: true, name: "Arial", size: 10, color: { argb: "FF2C3E50" } };
  const BODY_FONT: Partial<ExcelJS.Font> = { name: "Arial", size: 9 };
  const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top:    { style: "thin", color: { argb: "FFBDC3C7" } },
    left:   { style: "thin", color: { argb: "FFBDC3C7" } },
    bottom: { style: "thin", color: { argb: "FFBDC3C7" } },
    right:  { style: "thin", color: { argb: "FFBDC3C7" } },
  };
  const MONEY_FORMAT = '#,##0" ₫"';
  const PERCENT_FORMAT = "0%";

  function applyHeaderStyle(row: ExcelJS.Row) {
    row.eachCell(cell => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: "middle", wrapText: false };
    });
    row.height = 22;
  }

  function applyBodyRow(row: ExcelJS.Row, altIdx: number) {
    const bgColor = altIdx % 2 === 0 ? "FFF8F9FA" : "FFFFFFFF";
    row.eachCell({ includeEmpty: true }, cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.font = BODY_FONT;
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    row.height = 18;
  }

  function applyLabelCell(cell: ExcelJS.Cell) {
    cell.fill = LABEL_FILL;
    cell.font = LABEL_FONT;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle" };
  }

  function applyValueCell(cell: ExcelJS.Cell, isMoney = false) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
    cell.font = BODY_FONT;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle" };
    if (isMoney) cell.numFmt = MONEY_FORMAT;
  }

  function setColWidths(sheet: ExcelJS.Worksheet, widths: number[]) {
    widths.forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });
  }

  function freezeRow(sheet: ExcelJS.Worksheet, row: number) {
    sheet.views = [{ state: "frozen", ySplit: row }];
  }

  // Calc stats
  const checklistStats = getChecklistStats(checklist);
  const packingStats = getPackingStats(packingItems);
  const sharedExpenses = expenses.filter(e => e.splitType !== "personal" && !e.isDeleted);
  const personalExpenses = expenses.filter(e => e.splitType === "personal" && !e.isDeleted);
  const sharedTotal = sharedExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const personalTotal = personalExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const grandTotal = sharedTotal + personalTotal;
  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  const dateText = isDayTrip
    ? formatDate(trip.startDate)
    : `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`;

  // ════════════════════════════════════════════
  // SHEET 1 — TỔNG QUAN
  // ════════════════════════════════════════════
  const ws1 = workbook.addWorksheet("Tổng quan");
  setColWidths(ws1, [26, 36, 4, 26, 22]);

  // Title row
  ws1.mergeCells("A1:E1");
  const titleCell = ws1.getCell("A1");
  titleCell.value = "KAT JOURNEY — BÁO CÁO CHUYẾN ĐI";
  titleCell.font = { bold: true, size: 14, name: "Arial", color: { argb: "FF2C3E50" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = LABEL_FILL;
  ws1.getRow(1).height = 32;

  ws1.addRow([]); // spacer

  // Section: Thông tin chung
  const r3 = ws1.addRow(["THÔNG TIN CHUYẾN ĐI", "", "", "TIẾN ĐỘ CHUẨN BỊ", ""]);
  ws1.mergeCells("A3:B3");
  ws1.mergeCells("D3:E3");
  applyHeaderStyle(r3);

  const infoRows: [string, string | number, boolean, string, string | number, boolean][] = [
    ["Tên chuyến đi",    trip.title || "—",                          false, "Hành lý",    packingStats.percent / 100,   true],
    ["Địa điểm",         trip.location || "Chưa xác định",           false, "Checklist",  checklistStats.percent / 100, true],
    ["Thời gian",        dateText,                                    false, "Lịch trình", events.filter(e=>!e.isDeleted).filter(e=>e.completed).length + "/" + events.filter(e=>!e.isDeleted).length + " mục", false],
    ["Loại hình",        isDayTrip ? "Đi trong ngày" : "Nhiều ngày", false, "", "", false],
    ["Người đồng hành",  `${members.filter(m=>!m.isDeleted).length} người`, false, "", "", false],
    ["Ngân sách dự kiến","—",                                         false, "", "", false],
    ["Chi chung",        sharedTotal,                                 true,  "", "", false],
    ["Chi cá nhân",      personalTotal,                               true,  "", "", false],
    ["Tổng thực chi",    grandTotal,                                  true,  "", "", false],
  ];

  let altIdx = 0;
  infoRows.forEach(([lbl, val, isMoney, lbl2, val2, isMoney2]) => {
    const row = ws1.addRow([lbl, val, "", lbl2, val2]);
    applyLabelCell(row.getCell(1));
    applyValueCell(row.getCell(2), isMoney);
    if (isMoney && typeof val === "number") row.getCell(2).numFmt = MONEY_FORMAT;
    row.getCell(3).border = {};
    if (lbl2) {
      applyLabelCell(row.getCell(4));
      applyValueCell(row.getCell(5), isMoney2);
      if (isMoney2 && typeof val2 === "number") row.getCell(5).numFmt = PERCENT_FORMAT;
    }
    row.height = 18;
    altIdx++;
  });

  freezeRow(ws1, 3);

  // ════════════════════════════════════════════
  // SHEET 2 — LỊCH TRÌNH
  // ════════════════════════════════════════════
  const ws2 = workbook.addWorksheet("Lịch trình");
  setColWidths(ws2, [6, 16, 12, 44, 30, 16]);

  ws2.mergeCells("A1:F1");
  const t2 = ws2.getCell("A1");
  t2.value = "LỊCH TRÌNH CHI TIẾT";
  t2.font = { bold: true, size: 12, name: "Arial", color: { argb: "FF2C3E50" } };
  t2.alignment = { horizontal: "center", vertical: "middle" };
  t2.fill = LABEL_FILL;
  ws2.getRow(1).height = 28;

  const h2 = ws2.addRow(["STT", "Ngày", "Giờ", "Hoạt động / Ghi chú", "Địa điểm / Tọa độ", "Trạng thái"]);
  applyHeaderStyle(h2);
  freezeRow(ws2, 2);

  const sortedEvents = [...events]
    .filter(e => !e.isDeleted)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));

  if (sortedEvents.length === 0) {
    const r = ws2.addRow(["—", "—", "—", "Chưa có mục lịch trình nào", "—", "—"]);
    applyBodyRow(r, 0);
  } else {
    sortedEvents.forEach((e, i) => {
      const activity = e.notes ? `${e.title}\n${e.notes}` : e.title;
      const r = ws2.addRow([
        i + 1,
        formatDate(e.date),
        e.time || "—",
        activity,
        e.location || "—",
        e.completed ? "Hoàn thành" : "Chưa xong",
      ]);
      applyBodyRow(r, i);
      r.height = e.notes ? 30 : 18;
    });
  }

  // ════════════════════════════════════════════
  // SHEET 3 — TÀI CHÍNH
  // ════════════════════════════════════════════
  const ws3 = workbook.addWorksheet("Tài chính");
  setColWidths(ws3, [6, 14, 30, 22, 20, 20]);

  ws3.mergeCells("A1:F1");
  const t3 = ws3.getCell("A1");
  t3.value = "QUẢN LÝ TÀI CHÍNH CHUYẾN ĐI";
  t3.font = { bold: true, size: 12, name: "Arial", color: { argb: "FF2C3E50" } };
  t3.alignment = { horizontal: "center", vertical: "middle" };
  t3.fill = LABEL_FILL;
  ws3.getRow(1).height = 28;

  const h3 = ws3.addRow(["STT", "Ngày", "Hạng mục chi", "Số tiền", "Phân loại", "Người chi trả"]);
  applyHeaderStyle(h3);
  freezeRow(ws3, 2);

  const allExpenses = expenses.filter(e => !e.isDeleted);
  if (allExpenses.length === 0) {
    const r = ws3.addRow(["—", "—", "Chưa có ghi chép chi phí nào", 0, "—", "—"]);
    applyBodyRow(r, 0);
    r.getCell(4).numFmt = MONEY_FORMAT;
  } else {
    allExpenses.forEach((e, i) => {
      const r = ws3.addRow([
        i + 1,
        e.date ? formatDate(e.date) : "—",
        e.description || e.category || "—",
        Number(e.amount || 0),
        e.splitType === "personal" ? "Chi cá nhân" : "Chi chung",
        e.payer || "—",
      ]);
      applyBodyRow(r, i);
      r.getCell(4).numFmt = MONEY_FORMAT;
    });

    // Summary rows
    ws3.addRow([]);
    const sumRows: [string, number][] = [
      ["Chi chung",   sharedTotal],
      ["Chi cá nhân", personalTotal],
      ["TỔNG CỘNG",   grandTotal],
    ];
    sumRows.forEach(([lbl, val], si) => {
      const r = ws3.addRow(["", "", lbl, val, "", ""]);
      applyLabelCell(r.getCell(3));
      applyValueCell(r.getCell(4), true);
      r.getCell(4).numFmt = MONEY_FORMAT;
      if (si === 2) {
        r.getCell(3).font = { bold: true, size: 10, name: "Arial", color: { argb: "FFC0392B" } };
        r.getCell(4).font = { bold: true, size: 10, name: "Arial", color: { argb: "FFC0392B" } };
      }
      r.height = 20;
    });
  }

  // ════════════════════════════════════════════
  // SHEET 4 — HÀNH LÝ & GIẤY TỜ
  // ════════════════════════════════════════════
  const ws4 = workbook.addWorksheet("Hành lý & Giấy tờ");
  setColWidths(ws4, [6, 22, 34, 22, 20, 16]);

  ws4.mergeCells("A1:F1");
  const t4 = ws4.getCell("A1");
  t4.value = "HÀNH LÝ & GIẤY TỜ / ĐẶT CHỖ";
  t4.font = { bold: true, size: 12, name: "Arial", color: { argb: "FF2C3E50" } };
  t4.alignment = { horizontal: "center", vertical: "middle" };
  t4.fill = LABEL_FILL;
  ws4.getRow(1).height = 28;

  const h4 = ws4.addRow(["STT", "Phân loại", "Tên vật dụng / Giấy tờ", "Mã Booking", "Phụ trách", "Trạng thái"]);
  applyHeaderStyle(h4);
  freezeRow(ws4, 2);

  // Packing items
  const packings = packingItems.filter(p => !p.isDeleted);
  const docsList = (travelDocuments ?? []).filter(d => !d.isDeleted);

  const docTypeLabels: Record<string, string> = {
    ticket: "Vé máy bay / tàu xe",
    hotel: "Khách sạn / lưu trú",
    booking: "Vé tham quan / đặt chỗ",
    document: "Giấy tờ cá nhân",
    contact: "Liên hệ khẩn cấp",
    map: "Bản đồ / địa chỉ",
    other: "Khác",
  };

  let rowIdx4 = 0;

  if (packings.length === 0 && docsList.length === 0) {
    const r = ws4.addRow(["—", "—", "Chưa có dữ liệu hành lý / giấy tờ nào", "—", "—", "—"]);
    applyBodyRow(r, 0);
  } else {
    packings.forEach(p => {
      const r = ws4.addRow([
        rowIdx4 + 1,
        `Hành lý — ${p.tripType || "Chung"}`,
        p.title,
        "—",
        "—",
        p.completed ? "Đã xếp" : "Chưa xếp",
      ]);
      applyBodyRow(r, rowIdx4);
      rowIdx4++;
    });

    if (packings.length > 0 && docsList.length > 0) {
      ws4.addRow([]); // spacer
    }

    docsList.forEach(d => {
      const r = ws4.addRow([
        rowIdx4 + 1,
        docTypeLabels[d.type || "other"] || "Khác",
        d.title,
        d.code || "—",
        "—",
        d.date ? formatDate(d.date) : "—",
      ]);
      applyBodyRow(r, rowIdx4);
      rowIdx4++;
    });
  }

  // ── Save ────────────────────────────────────
  const safeName = safeFileName(trip.title, "chuyen-di");
  const fileName = `KAT-Journey_${safeName}_${trip.startDate || today}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
