const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "src");

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      getAllFiles(path.join(dir, file), fileList);
    } else if (file.endsWith(".tsx")) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const allFiles = getAllFiles(srcDir);
const vnRegex = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

for (const file of allFiles) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    // Ignore console.log, comments, and t("...") calls where Vietnamese is inside quotes
    if (
      line.includes("console.log") ||
      line.trim().startsWith("//") ||
      line.trim().startsWith("/*") ||
      line.trim().startsWith("*")
    )
      return;

    // Check if line has Vietnamese chars
    if (vnRegex.test(line)) {
      // Basic check: if it's inside t("...") or t('...') it's fine
      // Let's just print the line so we can manually review
      console.log(`\nFile: ${file.replace(srcDir, "")}:${index + 1}`);
      console.log(`Line: ${line.trim()}`);
    }
  });
}
