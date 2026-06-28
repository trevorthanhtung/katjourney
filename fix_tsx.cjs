const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(srcDir, filePath);
  let content = fs.readFileSync(fullPath, "utf8");
  let changed = false;
  for (const r of replacements) {
    if (content.includes(r.from)) {
      content = content.split(r.from).join(r.to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath}`);
  }
}

// TimelineScreen
replaceInFile("features/timeline/TimelineScreen.tsx", [
  {
    from: "Chi tiết &rarr;",
    to: '{t("common.details", "Chi tiết")} &rarr;',
  },
]);

// WeatherDetailsModal
replaceInFile("features/timeline/WeatherDetailsModal.tsx", [
  {
    from: ">Đóng<",
    to: '>{t("common.close", "Đóng")}<',
  },
  {
    from: ">\n            Đóng\n          <",
    to: '>\n            {t("common.close", "Đóng")}\n          <',
  },
]);

// DashboardWidgets
replaceInFile("features/trips/components/DashboardWidgets.tsx", [
  {
    from: "Chưa có</span",
    to: '{t("dashboard.stats.none", "Chưa có")}</span',
  },
]);

// TripManagerScreen
replaceInFile("features/trips/TripManagerScreen.tsx", [
  {
    from: "Xem kỷ niệm chuyến đi ({archivedTripsCount})",
    to: '{t("dashboard.archivedTrips", "Xem kỷ niệm chuyến đi ({{count}})", { count: archivedTripsCount })}',
  },
  {
    from: "<h2>Chuyến đi</h2>",
    to: '<h2>{t("dashboard.trips", "Chuyến đi")}</h2>',
  },
  {
    from: ">Chuyến đi<",
    to: '>{t("dashboard.trips", "Chuyến đi")}<',
  },
  {
    from: "Không có chuyến đi nào được lưu trữ",
    to: '{t("dashboard.noArchivedTrips", "Không có chuyến đi nào được lưu trữ")}',
  },
  {
    from: "Chưa có chuyến đi nào hoàn thành",
    to: '{t("dashboard.noCompletedTrips", "Chưa có chuyến đi nào hoàn thành")}',
  },
  {
    from: '"Đã xóa chuyến đi khỏi thiết bị này."',
    to: 't("dashboard.tripDeletedFromDevice", "Đã xóa chuyến đi khỏi thiết bị này.")',
  },
]);

// SharedTripScreen
replaceInFile("features/share/SharedTripScreen.tsx", [
  {
    from: '|| "Chuyến đi không tên"',
    to: '|| t("share.unnamedTrip", "Chuyến đi không tên")',
  },
  {
    from: '|| "Khách"',
    to: '|| t("common.guest", "Khách")',
  },
]);
