const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");
const localesDir = path.join(srcDir, "locales");

// Recursive function to get all tsx files
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      getAllFiles(path.join(dir, file), fileList);
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const allFiles = getAllFiles(srcDir);
const keysInCode = new Set();
const regex = /t\(['"]([^'"]+)['"]/g;

for (const file of allFiles) {
  const content = fs.readFileSync(file, "utf8");
  let match;
  while ((match = regex.exec(content)) !== null) {
    keysInCode.add(match[1]);
  }
}

// Flatten JSON to dot notation
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

const localeFiles = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));

for (const localeFile of localeFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(localesDir, localeFile), "utf8"));
  const flatData = flattenObj(data);
  const keysInLocale = new Set(Object.keys(flatData));

  const missingKeys = [...keysInCode].filter((k) => !keysInLocale.has(k) && !k.includes("${"));
  if (missingKeys.length > 0) {
    console.log(`\n--- Missing keys in ${localeFile} ---`);
    console.log(missingKeys.join("\n"));
  }
}
