import { jsPDF } from "jspdf";
import { formatDate, formatMoney, safeFileName, today, TripData } from "./helpers";
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
    ["Chi chung (nhóm)",   formatMoney(sharedTotal, trip.defaultCurrency),   false, false],
    ["Chi cá nhân",        formatMoney(personalTotal, trip.defaultCurrency), false, false],
    ["TỔNG CỘNG",          formatMoney(grandTotal, trip.defaultCurrency),    true,  true],
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
