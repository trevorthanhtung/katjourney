const fs = require("fs");
const path = require("path");

const files = [
  "src/styles.css",
  "src/App.tsx",
  "src/components/ui/index.tsx",
  "src/features/checklist/ChecklistScreen.tsx",
  "src/features/share/components/SharedActivitiesSection.tsx",
  "src/features/share/components/SharedTripMobileNav.tsx",
  "src/features/share/components/SharedTripStickyHeader.tsx",
  "src/features/timeline/TimelineScreen.tsx",
  "src/features/timeline/WeatherDetailsModal.tsx",
  "src/features/trips/TripManagerScreen.tsx",
];

const basePath = "d:/02_PROJECTS/5_KAT JOURNEY/APP";

files.forEach((file) => {
  const absolutePath = path.join(basePath, file);
  if (!fs.existsSync(absolutePath)) {
    console.log(`File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(absolutePath, "utf8");

  // Perform replacements
  const original = content;
  content = content.replace(/env\(safe-area-inset-top\)/g, "var(--safe-top)");
  content = content.replace(/env\(safe-area-inset-bottom\)/g, "var(--safe-bottom)");
  content = content.replace(/env\(safe-area-inset-left\)/g, "var(--safe-left)");
  content = content.replace(/env\(safe-area-inset-right\)/g, "var(--safe-right)");

  if (content !== original) {
    fs.writeFileSync(absolutePath, content, "utf8");
    console.log(`Updated: ${file}`);
  } else {
    console.log(`No changes needed: ${file}`);
  }
});
