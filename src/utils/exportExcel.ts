import ExcelJS from "exceljs";
import { formatDate, getChecklistStats, getPackingStats, safeFileName, today, TripData } from "./helpers";

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

  // Spacer
  ws1.addRow([]);

  // Info grid
  const typeText = isDayTrip ? "Đi trong ngày" : (() => {
    const d = Math.ceil(Math.abs(new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000) + 1;
    return `${d} ngày ${d > 1 ? d - 1 : 0} đêm`;
  })();

  const infoRows: [string, string | number, string | undefined, string | number | undefined, boolean | undefined, boolean | undefined][] = [
    ["Tên chuyến đi", trip.title || "—",            "Địa điểm",       trip.location || "Chưa xác định", undefined, undefined],
    ["Thời gian",      dateText,                     "Loại hình",      typeText, undefined, undefined],
    ["Thành viên",     (members ?? []).length,        "Tổng chi phí",   grandTotal, false, true],
    ["Checklist",      `${checklistStats.completed}/${checklistStats.total} hoàn thành`, "Hành lý", `${packingStats.completed}/${packingStats.total} đã xếp`, undefined, undefined],
  ];

  let altIdx = 0;
  infoRows.forEach(([lbl, val, lbl2, val2, isMoney, isMoney2]) => {
    const row = ws1.addRow([lbl, val, "", lbl2 || "", val2 ?? ""]);
    applyLabelCell(row.getCell(1));
    applyValueCell(row.getCell(2), !!isMoney);
    if (isMoney && typeof val === "number") row.getCell(2).numFmt = MONEY_FORMAT;
    row.getCell(3).border = {};
    if (lbl2) {
      applyLabelCell(row.getCell(4));
      applyValueCell(row.getCell(5), !!isMoney2);
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
      let description = e.description || e.category || "—";
      if (e.originalAmount && e.currency && e.currency !== "VND") {
        description += ` (${new Intl.NumberFormat('en-US').format(e.originalAmount)} ${e.currency})`;
      }
      const r = ws3.addRow([
        i + 1,
        e.date ? formatDate(e.date) : "—",
        description,
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
