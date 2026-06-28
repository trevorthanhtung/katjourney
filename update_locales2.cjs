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

const highTranslations = {
  en: "High",
  vi: "Cao",
  ja: "最高",
  ko: "최고",
  zh: "最高",
  th: "สูงสุด",
  es: "Máx",
  fr: "Max",
  de: "Max",
  it: "Max",
  pt: "Máx",
  id: "Maks",
};

const lowTranslations = {
  en: "Low",
  vi: "Thấp",
  ja: "最低",
  ko: "최저",
  zh: "最低",
  th: "ต่ำสุด",
  es: "Mín",
  fr: "Min",
  de: "Min",
  it: "Min",
  pt: "Mín",
  id: "Min",
};

for (const file of files) {
  const lang = file.replace(".json", "");
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!data.home) data.home = {};
  if (!data.home.hero) data.home.hero = {};
  data.home.hero.destinations_other = destTranslations[lang] || destTranslations["en"];

  if (!data.weather) data.weather = {};
  data.weather.high = highTranslations[lang] || highTranslations["en"];
  data.weather.low = lowTranslations[lang] || lowTranslations["en"];

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Updated ${file}`);
}
