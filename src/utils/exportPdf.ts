import { jsPDF } from "jspdf";
import i18n from "../i18n";
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
  const PAGE_H = 297;
  const MARGIN_L = 20;
  const MARGIN_R = 20;
  const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R; // 170mm
  const PAGE_BOTTOM = 275;

  // Color constants - Modern Palette
  const C_KAT_TEAL: [number, number, number] = [0, 191, 183];
  const C_NAVY: [number, number, number] = [15, 23, 42]; // slate-900
  const C_SLATE: [number, number, number] = [100, 116, 139]; // slate-500
  const C_SLATE_LIGHT: [number, number, number] = [226, 232, 240]; // slate-200
  const C_WHITE: [number, number, number] = [255, 255, 255];
  const C_BG_LIGHT: [number, number, number] = [248, 250, 252]; // slate-50
  const C_RED: [number, number, number] = [239, 68, 68];

  let Y = 35;

  function checkSpace(needed: number) {
    if (Y + needed > PAGE_BOTTOM) {
      doc.addPage();
      Y = 25;
      return true;
    }
    return false;
  }

  function hLine(y: number) {
    doc.setDrawColor(...C_SLATE_LIGHT);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
  }

  function sectionLabel(title: string) {
    checkSpace(16);
    Y += 6;
    // Teal accent
    doc.setFillColor(...C_KAT_TEAL);
    doc.rect(MARGIN_L, Y - 4, 3, 5, "F");

    doc.setFontSize(11);
    doc.setTextColor(...C_NAVY);
    doc.setFont("Roboto", "normal");
    doc.text(title.toUpperCase(), MARGIN_L + 6, Y);
    Y += 4;
    hLine(Y);
    Y += 6;
  }

  // Header Design
  doc.setFillColor(...C_KAT_TEAL);
  doc.rect(0, 0, PAGE_W, 20, "F");

  doc.setFontSize(18);
  doc.setTextColor(...C_WHITE);
  doc.setFont("Roboto", "normal");
  doc.text(i18n.t("export.reportTitle"), MARGIN_L, 13);

  doc.setFontSize(10);
  doc.text("KAT Journey", PAGE_W - MARGIN_R, 13, { align: "right" });

  // ── PAGE FOOTER ──
  function drawFooter() {
    const totalPages = (doc as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("Roboto", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...C_SLATE);
      doc.setDrawColor(...C_SLATE_LIGHT);
      doc.setLineWidth(0.3);
      doc.line(MARGIN_L, 282, PAGE_W - MARGIN_R, 282);
      doc.text("KAT Journey", MARGIN_L, 287);
      doc.text(`Trang ${i} / ${totalPages}`, PAGE_W - MARGIN_R, 287, { align: "right" });
    }
  }

  // ═══════════════════════════════════════
  // PHẦN 1 — Thông tin khái quát (2×2 grid)
  // ═══════════════════════════════════════
  sectionLabel(i18n.t("export.part1"));

  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  const dateText = isDayTrip
    ? formatDate(trip.startDate)
    : `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`;
  const typeText = isDayTrip
    ? i18n.t("export.dayTrip")
    : (() => {
        const d =
          Math.ceil(
            Math.abs(new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
              86400000
          ) + 1;
        return `${d} ${i18n.t("export.days")} ${d > 1 ? d - 1 : 0} ${i18n.t("export.nights")}`;
      })();

  const infoItems: [string, string][] = [
    [i18n.t("export.tripName"), trip.title || "—"],
    [i18n.t("export.location"), trip.location || i18n.t("export.unknownLocation")],
    [i18n.t("export.duration"), dateText],
    [i18n.t("export.tripType"), typeText],
  ];

  const colW = CONTENT_W / 2;
  const rowH = 14;
  for (let i = 0; i < infoItems.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = MARGIN_L + col * colW;
    const y = Y + row * rowH;

    checkSpace(rowH + 2);

    // Cell bg
    doc.setFillColor(...C_BG_LIGHT);
    doc.rect(x, y, colW, rowH, "F");

    // Cell border
    doc.setDrawColor(...C_SLATE_LIGHT);
    doc.setLineWidth(0.2);
    doc.rect(x, y, colW, rowH, "S");

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
  sectionLabel(i18n.t("export.part2"));

  const sortedEvents = [...events]
    .filter((e) => !e.isDeleted)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));

  if (sortedEvents.length === 0) {
    checkSpace(10);
    doc.setFontSize(9);
    doc.setTextColor(...C_SLATE);
    doc.text(i18n.t("export.noTimeline"), MARGIN_L, Y);
    Y += 10;
  } else {
    const tCols = [
      { label: i18n.t("export.colTime"), x: 0, w: 18 },
      { label: i18n.t("export.colActivityNotes"), x: 18, w: 76 },
      { label: i18n.t("export.colLocation"), x: 94, w: 64 },
      { label: "Check", x: 158, w: 12 },
    ];

    let currentDate = "";

    sortedEvents.forEach((event) => {
      // Draw Day Header if date changes
      if (event.date !== currentDate) {
        currentDate = event.date;

        checkSpace(25);
        Y += 6;

        // Day Header Banner
        doc.setFillColor(...C_NAVY);
        doc.roundedRect(MARGIN_L, Y, CONTENT_W, 10, 2, 2, "F");

        doc.setFontSize(11);
        doc.setTextColor(...C_WHITE);
        doc.setFont("Roboto", "normal");
        doc.text(formatDate(event.date), MARGIN_L + 4, Y + 6.5);
        Y += 10;

        // Table Header
        doc.setFillColor(...C_BG_LIGHT);
        doc.rect(MARGIN_L, Y, CONTENT_W, 8, "F");
        doc.setDrawColor(...C_SLATE_LIGHT);
        doc.setLineWidth(0.3);
        doc.line(MARGIN_L, Y + 8, PAGE_W - MARGIN_R, Y + 8);

        doc.setFontSize(9);
        doc.setTextColor(...C_SLATE);
        tCols.forEach((col) => {
          doc.text(col.label, MARGIN_L + col.x + 2, Y + 5.5);
        });
        Y += 8;
      }

      // Calculate row height
      doc.setFontSize(9);
      const titleWrap = doc.splitTextToSize(event.title, tCols[1].w - 4) as string[];
      doc.setFontSize(8);
      const noteWrap = event.notes
        ? (doc.splitTextToSize(event.notes, tCols[1].w - 4) as string[])
        : [];
      const locWrap = doc.splitTextToSize(event.location || "—", tCols[2].w - 4) as string[];

      const titleH = titleWrap.length * 4.5;
      const noteH = noteWrap.length > 0 ? 2 + noteWrap.length * 3.5 : 0;
      const col2H = titleH + noteH;
      const col3H = locWrap.length * 4.5;

      const contentH = Math.max(col2H, col3H);
      const rowH = Math.max(10, contentH + 6);

      if (checkSpace(rowH)) {
        // Redraw table header
        doc.setFillColor(...C_BG_LIGHT);
        doc.rect(MARGIN_L, Y, CONTENT_W, 8, "F");
        doc.setDrawColor(...C_SLATE_LIGHT);
        doc.setLineWidth(0.3);
        doc.line(MARGIN_L, Y + 8, PAGE_W - MARGIN_R, Y + 8);

        doc.setFontSize(9);
        doc.setTextColor(...C_SLATE);
        tCols.forEach((col) => {
          doc.text(col.label, MARGIN_L + col.x + 2, Y + 5.5);
        });
        Y += 8;
      }

      // Draw Row Bottom Border
      doc.setDrawColor(...C_SLATE_LIGHT);
      doc.setLineWidth(0.2);
      doc.line(MARGIN_L, Y + rowH, PAGE_W - MARGIN_R, Y + rowH);

      const textY = Y + 5;

      // Time
      doc.setFontSize(9);
      doc.setTextColor(...C_NAVY);
      doc.text(event.time || "—", MARGIN_L + tCols[0].x + 2, textY);

      // Title & Notes
      doc.setTextColor(...C_NAVY);
      doc.text(titleWrap, MARGIN_L + tCols[1].x + 2, textY);
      if (noteWrap.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(...C_SLATE);
        doc.text(noteWrap, MARGIN_L + tCols[1].x + 2, textY + titleH + 1);
      }

      // Location
      doc.setFontSize(9);
      doc.setTextColor(...C_SLATE);
      doc.text(locWrap, MARGIN_L + tCols[2].x + 2, textY);

      // Checkbox
      doc.setTextColor(...C_SLATE_LIGHT);
      doc.text("[  ]", MARGIN_L + tCols[3].x + 2, textY);

      Y += rowH;
    });
    Y += 6;
  }

  // ═══════════════════════════════════════
  // PHẦN 3 — Tổng kết tài chính
  // ═══════════════════════════════════════
  sectionLabel(i18n.t("export.part3"));

  const sharedExpenses = (expenses || []).filter((e) => e.splitType !== "personal" && !e.isDeleted);
  const personalExpenses = (expenses || []).filter(
    (e) => e.splitType === "personal" && !e.isDeleted
  );
  const sharedTotal = sharedExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const personalTotal = personalExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const grandTotal = sharedTotal + personalTotal;

  const finRows = [
    { label: i18n.t("export.sharedGroup"), amount: formatMoney(sharedTotal, trip.defaultCurrency) },
    {
      label: i18n.t("export.personalExp"),
      amount: formatMoney(personalTotal, trip.defaultCurrency),
    },
    {
      label: i18n.t("export.totalLabel"),
      amount: formatMoney(grandTotal, trip.defaultCurrency),
      isTotal: true,
    },
  ];

  // Table Header
  doc.setFillColor(...C_BG_LIGHT);
  doc.rect(MARGIN_L, Y, CONTENT_W, 8, "F");
  doc.setDrawColor(...C_SLATE_LIGHT);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, Y + 8, PAGE_W - MARGIN_R, Y + 8);

  doc.setFontSize(9);
  doc.setTextColor(...C_SLATE);
  doc.text(i18n.t("export.colCategory"), MARGIN_L + 4, Y + 5.5);
  doc.text(i18n.t("export.colAmount"), MARGIN_L + CONTENT_W / 2 + 4, Y + 5.5);
  Y += 8;

  finRows.forEach((row) => {
    checkSpace(10);
    doc.setDrawColor(...C_SLATE_LIGHT);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_L, Y + 10, PAGE_W - MARGIN_R, Y + 10);

    doc.setFontSize(row.isTotal ? 11 : 9);
    doc.setTextColor(
      row.isTotal ? C_KAT_TEAL[0] : C_NAVY[0],
      row.isTotal ? C_KAT_TEAL[1] : C_NAVY[1],
      row.isTotal ? C_KAT_TEAL[2] : C_NAVY[2]
    );
    doc.text(row.label, MARGIN_L + 4, Y + 6.5);
    doc.text(row.amount, MARGIN_L + CONTENT_W / 2 + 4, Y + 6.5);
    Y += 10;
  });
  Y += 10;

  // ═══════════════════════════════════════
  // PHẦN 4 — Thông tin khẩn cấp & Dự phòng
  // ═══════════════════════════════════════
  sectionLabel(i18n.t("export.part4"));

  const validBackups = [...(backupPlans || [])].filter((b) => !b.isDeleted);

  if (validBackups.length === 0) {
    checkSpace(10);
    doc.setFontSize(9);
    doc.setTextColor(...C_SLATE);
    doc.text(i18n.t("export.noBackupPlans"), MARGIN_L, Y);
    Y += 10;
  } else {
    validBackups.forEach((b) => {
      checkSpace(20);

      doc.setFillColor(...C_BG_LIGHT);
      doc.roundedRect(MARGIN_L, Y, CONTENT_W, 16, 2, 2, "F");

      doc.setFontSize(9);
      doc.setTextColor(...C_NAVY);
      doc.text(
        `[${(b.type || "other").toUpperCase()}] ${pdfSafeText(b.title)}`,
        MARGIN_L + 4,
        Y + 6
      );

      doc.setFontSize(8);
      doc.setTextColor(...C_SLATE);
      const noteWrap = doc.splitTextToSize(pdfSafeText(b.note || b.reason || "—"), CONTENT_W - 8);
      doc.text(noteWrap, MARGIN_L + 4, Y + 12);

      Y += 16 + (noteWrap.length - 1) * 4 + 4;
    });
  }

  // Thông tin đặt chỗ (Booking ID)
  const validDocs = (travelDocuments ?? []).filter((d) => !d.isDeleted);
  if (validDocs.length > 0) {
    checkSpace(14);
    Y += 6;
    doc.setFontSize(10);
    doc.setTextColor(...C_NAVY);
    doc.text(i18n.t("export.docBookingInfo"), MARGIN_L, Y);
    Y += 6;
    validDocs.forEach((d) => {
      checkSpace(12);
      doc.setFillColor(...C_BG_LIGHT);
      doc.roundedRect(MARGIN_L, Y, CONTENT_W, 10, 2, 2, "F");
      doc.setFontSize(9);
      doc.setTextColor(...C_NAVY);
      const code = d.code ? ` [${d.code}]` : "";
      doc.text(`${pdfSafeText(d.title)}${code}`, MARGIN_L + 4, Y + 6.5);
      Y += 12;
    });
  }

  // Draw Header/Footer for all pages
  drawFooter();

  // ═══════════════════════════════════════
  // XUẤT FILE
  // ═══════════════════════════════════════
  const safeTitle = (trip.title || "ChuyenDi").replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `KAT-Journey_BaoCao_${safeTitle}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

export function exportItineraryPdf(data: TripData) {
  const { trip, events } = data;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegular);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto", "normal");

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN_L = 20;
  const MARGIN_R = 20;
  const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R; // 170mm
  const PAGE_BOTTOM = 275;

  // Color constants - Modern Palette
  const C_KAT_TEAL: [number, number, number] = [0, 191, 183];
  const C_NAVY: [number, number, number] = [15, 23, 42]; // slate-900
  const C_SLATE: [number, number, number] = [100, 116, 139]; // slate-500
  const C_SLATE_LIGHT: [number, number, number] = [226, 232, 240]; // slate-200
  const C_WHITE: [number, number, number] = [255, 255, 255];
  const C_BG_LIGHT: [number, number, number] = [248, 250, 252]; // slate-50

  let Y = 35;

  function checkSpace(needed: number) {
    if (Y + needed > PAGE_BOTTOM) {
      doc.addPage();
      Y = 25;
      return true;
    }
    return false;
  }

  // Header Design
  doc.setFillColor(...C_KAT_TEAL);
  doc.rect(0, 0, PAGE_W, 20, "F");

  doc.setFontSize(18);
  doc.setTextColor(...C_WHITE);
  doc.setFont("Roboto", "normal");
  doc.text(i18n.t("export.itineraryTitle", "TRIP ITINERARY"), MARGIN_L, 13);

  doc.setFontSize(10);
  doc.setFont("Roboto", "normal");
  doc.text("KAT Journey", PAGE_W - MARGIN_R, 13, { align: "right" });

  // Trip Title
  doc.setFontSize(22);
  doc.setTextColor(...C_NAVY);
  doc.setFont("Roboto", "normal");
  const titleLines = doc.splitTextToSize(
    trip.title || i18n.t("export.untitledTrip", "Untitled trip"),
    CONTENT_W
  );
  doc.text(titleLines, MARGIN_L, Y);
  Y += titleLines.length * 8;

  // Trip Location & Date
  doc.setFontSize(11);
  doc.setTextColor(...C_SLATE);
  doc.setFont("Roboto", "normal");

  const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
  const dateText = isDayTrip
    ? formatDate(trip.startDate)
    : `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`;

  doc.text(`📍 ${trip.location || i18n.t("export.unknownLocation")}`, MARGIN_L, Y);
  Y += 6;
  doc.text(`📅 ${dateText}`, MARGIN_L, Y);
  Y += 12;

  // Group events by date
  const sortedEvents = [...events]
    .filter((e) => !e.isDeleted)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""));

  if (sortedEvents.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(...C_SLATE);
    doc.text(i18n.t("export.noTimeline"), MARGIN_L, Y);
  } else {
    // Columns: [Giờ, Hoạt động, Địa điểm, Check]
    const tCols = [
      { label: i18n.t("export.colTime"), x: 0, w: 18 },
      { label: i18n.t("export.colActivityNotes"), x: 18, w: 76 },
      { label: i18n.t("export.colLocation"), x: 94, w: 64 },
      { label: "Check", x: 158, w: 12 },
    ];

    let currentDate = "";

    sortedEvents.forEach((event) => {
      // Draw Day Header if date changes
      if (event.date !== currentDate) {
        currentDate = event.date;

        checkSpace(25);
        Y += 6;

        // Day Header Banner
        doc.setFillColor(...C_NAVY);
        doc.roundedRect(MARGIN_L, Y, CONTENT_W, 10, 2, 2, "F");

        doc.setFontSize(11);
        doc.setTextColor(...C_WHITE);
        doc.setFont("Roboto", "normal");
        doc.text(formatDate(event.date), MARGIN_L + 4, Y + 6.5);
        Y += 10;

        // Table Header
        doc.setFillColor(...C_BG_LIGHT);
        doc.rect(MARGIN_L, Y, CONTENT_W, 8, "F");
        doc.setDrawColor(...C_SLATE_LIGHT);
        doc.setLineWidth(0.3);
        doc.line(MARGIN_L, Y + 8, PAGE_W - MARGIN_R, Y + 8);

        doc.setFontSize(9);
        doc.setTextColor(...C_SLATE);
        doc.setFont("Roboto", "normal");
        tCols.forEach((col) => {
          doc.text(col.label, MARGIN_L + col.x + 2, Y + 5.5);
        });
        Y += 8;
        doc.setFont("Roboto", "normal");
      }

      // Calculate row height based on text wrapping
      doc.setFontSize(9);
      const titleWrap = doc.splitTextToSize(event.title, tCols[1].w - 4) as string[];
      doc.setFontSize(8);
      const noteWrap = event.notes
        ? (doc.splitTextToSize(event.notes, tCols[1].w - 4) as string[])
        : [];
      const locWrap = doc.splitTextToSize(event.location || "—", tCols[2].w - 4) as string[];

      const titleH = titleWrap.length * 4.5;
      const noteH = noteWrap.length > 0 ? 2 + noteWrap.length * 3.5 : 0;
      const col2H = titleH + noteH;
      const col3H = locWrap.length * 4.5;

      const contentH = Math.max(col2H, col3H);
      const rowH = Math.max(10, contentH + 6); // Add 6mm padding (3 top, 3 bottom)

      // Add page if needed, but redraw headers? For simplicity, just add page.
      if (checkSpace(rowH)) {
        // Redraw table header if we jumped to a new page
        doc.setFillColor(...C_BG_LIGHT);
        doc.rect(MARGIN_L, Y, CONTENT_W, 8, "F");
        doc.setDrawColor(...C_SLATE_LIGHT);
        doc.setLineWidth(0.3);
        doc.line(MARGIN_L, Y + 8, PAGE_W - MARGIN_R, Y + 8);

        doc.setFontSize(9);
        doc.setTextColor(...C_SLATE);
        doc.setFont("Roboto", "normal");
        tCols.forEach((col) => {
          doc.text(col.label, MARGIN_L + col.x + 2, Y + 5.5);
        });
        Y += 8;
        doc.setFont("Roboto", "normal");
      }

      // Draw Row Bottom Border
      doc.setDrawColor(...C_SLATE_LIGHT);
      doc.setLineWidth(0.2);
      doc.line(MARGIN_L, Y + rowH, PAGE_W - MARGIN_R, Y + rowH);

      const textY = Y + 4.5;

      // Time
      doc.setFontSize(9);
      doc.setTextColor(...C_NAVY);
      doc.setFont("Roboto", "normal");
      doc.text(event.time || "—", MARGIN_L + tCols[0].x + 2, textY);
      doc.setFont("Roboto", "normal");

      // Activity
      doc.setTextColor(...C_NAVY);
      titleWrap.forEach((line, li) => {
        doc.text(line, MARGIN_L + tCols[1].x + 2, textY + li * 4.5);
      });
      if (noteWrap.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(...C_SLATE);
        noteWrap.forEach((line, li) => {
          doc.text(line, MARGIN_L + tCols[1].x + 2, textY + titleH + 1 + li * 3.5);
        });
      }

      // Location
      doc.setFontSize(8);
      doc.setTextColor(...C_SLATE);
      locWrap.forEach((line, li) => {
        doc.text(line, MARGIN_L + tCols[2].x + 2, textY + li * 4.5);
      });

      // Status
      doc.setTextColor(...C_SLATE);
      doc.text(event.completed ? "[ x ]" : "[   ]", MARGIN_L + tCols[3].x + 2, textY);

      Y += rowH;
    });
  }

  // Footer for all pages
  const totalPages = (doc as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...C_SLATE);

    // Top-right banner text if needed? Already handled by the header rect.

    // Footer line
    doc.setDrawColor(...C_SLATE_LIGHT);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_L, PAGE_BOTTOM + 5, PAGE_W - MARGIN_R, PAGE_BOTTOM + 5);

    doc.text(
      i18n.t("export.itineraryFooter", "Itinerary created by KAT Journey"),
      MARGIN_L,
      PAGE_BOTTOM + 10
    );
    doc.text(`Trang ${i} / ${totalPages}`, PAGE_W - MARGIN_R, PAGE_BOTTOM + 10, { align: "right" });
  }

  doc.save(`KAT-Journey_LichTrinh_${safeFileName(trip.title)}_${trip.startDate || today}.pdf`);
}
