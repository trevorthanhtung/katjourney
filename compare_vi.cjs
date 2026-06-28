const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "src", "locales");

function flattenObj(obj, prefix = "", res = {}) {
  for (const key in obj) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      flattenObj(val, newKey, res);
    } else {
      res[newKey] = val;
    }
  }
  return res;
}

const viData = JSON.parse(fs.readFileSync(path.join(localesDir, "vi.json"), "utf8"));
const flatVi = flattenObj(viData);
const viKeys = Object.keys(flatVi);

const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json") && f !== "vi.json");

let totalMissing = 0;
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(localesDir, file), "utf8"));
  const flatData = flattenObj(data);
  const dataKeys = new Set(Object.keys(flatData));

  const missing = viKeys.filter((k) => !dataKeys.has(k));
  if (missing.length > 0) {
    console.log(`\nFile ${file} is missing ${missing.length} keys.`);
    if (file === "en.json" || missing.length < 20) {
      console.log("Missing keys:", missing);
    }
    totalMissing += missing.length;
  }
}
console.log(`\nTotal missing keys across all files: ${totalMissing}`);
