const fs = require("fs");
const path = require("path");
const https = require("https");

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

function translate(text, targetLang) {
  return new Promise((resolve, reject) => {
    // Protect {{var}} by replacing it with a non-translatable placeholder
    // We use a zero-width space or similar if needed, but let's try a safe string
    // e.g. {{name}} -> 12345NAME54321
    const vars = [];
    let protectedText = text.replace(/\{\{(.*?)\}\}/g, (match, p1) => {
      vars.push(p1);
      return `_VAR${vars.length - 1}_`;
    });

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=${targetLang}&dt=t&q=${encodeURIComponent(protectedText)}`;
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            let result = "";
            if (json && json[0]) {
              json[0].forEach((item) => {
                if (item[0]) result += item[0];
              });
            }
            // Restore variables
            result = result.replace(/_VAR(\d+)_/gi, (match, p1) => {
              return `{{${vars[parseInt(p1, 10)]}}}`;
            });
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function run() {
  const viData = JSON.parse(fs.readFileSync(path.join(localesDir, "vi.json"), "utf8"));
  const flatVi = flattenObj(viData);
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json") && f !== "vi.json");

  for (const file of files) {
    const lang = file.replace(".json", "");
    // Google translate language codes mapping
    let targetLang = lang;
    if (lang === "zh") targetLang = "zh-CN"; // simplified chinese

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
          await delay(50); // slight delay to avoid rate limit
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
