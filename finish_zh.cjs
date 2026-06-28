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

function unflattenObj(flatObj) {
  const result = {};
  for (const key in flatObj) {
    const keys = key.split(".");
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = flatObj[key];
  }
  return result;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translate(text, targetLang) {
  const vars = [];
  let protectedText = text.replace(/\{\{(.*?)\}\}/g, (match, p1) => {
    vars.push(p1);
    return `_VAR${vars.length - 1}_`;
  });

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=${targetLang}&dt=t&q=${encodeURIComponent(protectedText)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const json = await res.json();
    let result = "";
    if (json && json[0]) {
      json[0].forEach((item) => {
        if (item[0]) result += item[0];
      });
    }

    result = result.replace(/_VAR(\d+)_/gi, (match, p1) => {
      return `{{${vars[parseInt(p1, 10)]}}}`;
    });

    return result;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

async function run() {
  const viData = JSON.parse(fs.readFileSync(path.join(localesDir, "vi.json"), "utf8"));
  const flatVi = flattenObj(viData);
  const files = ["zh.json"]; // Just zh.json as it was the one remaining

  for (const file of files) {
    const lang = file.replace(".json", "");
    let targetLang = lang;
    if (lang === "zh") targetLang = "zh-CN";

    console.log(`\nProcessing ${file} (target: ${targetLang})...`);

    const filePath = path.join(localesDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const flatData = flattenObj(data);

    let missingCount = 0;

    for (const key in flatVi) {
      if (!(key in flatData)) {
        const textToTranslate = flatVi[key];
        try {
          const translated = await translate(textToTranslate, targetLang);
          flatData[key] = translated;
          missingCount++;
          if (missingCount % 10 === 0) {
            console.log(`Translated ${missingCount} keys for ${lang}...`);
          }
          await delay(100);
        } catch (e) {
          console.error(`Error translating key ${key} for ${lang}:`, e.message);
        }
      }
    }

    if (missingCount > 0) {
      const newData = unflattenObj(flatData);
      fs.writeFileSync(filePath, JSON.stringify(newData, null, 2) + "\n");
      console.log(`Successfully added ${missingCount} missing keys to ${file}`);
    } else {
      console.log(`${file} is already up to date.`);
    }
  }
}

run().catch(console.error);
