const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "src", "locales");
const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));

const destTranslations = {
  en: "{{location}} & {{count}} others",
  vi: "{{location}} & {{count}} điểm khác",
  ja: "{{location}} ほか{{count}}件",
  ko: "{{location}} 및 {{count}}곳",
  zh: "{{location}} 及其他 {{count}} 个地点",
  th: "{{location}} และอีก {{count}} แห่ง",
  es: "{{location}} y {{count}} más",
  fr: "{{location}} et {{count}} autres",
  de: "{{location}} & {{count}} weitere",
  it: "{{location}} e altri {{count}}",
  pt: "{{location}} e mais {{count}}",
  id: "{{location}} & {{count}} lainnya",
};

for (const file of files) {
  const lang = file.replace(".json", "");
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!data.trip) data.trip = {};
  data.trip.locationAndOthers = destTranslations[lang] || destTranslations["en"];

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Updated ${file} with trip.locationAndOthers: ${data.trip.locationAndOthers}`);
}
