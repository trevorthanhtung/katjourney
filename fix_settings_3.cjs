const fs = require("fs");
const path = "d:\\\\02_PROJECTS\\\\5_KAT JOURNEY\\\\APP\\\\src\\\\components\\\\SettingsSheet.tsx";
let code = fs.readFileSync(path, "utf8");

const colors = ["violet", "sky", "orange", "fuchsia"];
for (const color of colors) {
  const regex = new RegExp(
    "bg-" +
      color +
      "-100 text-" +
      color +
      "-600 dark:bg-" +
      color +
      "-900/40 dark:text-" +
      color +
      "-400",
    "g"
  );
  const depthClass =
    "bg-gradient-to-br from-" +
    color +
    "-100 to-" +
    color +
    "-50 text-" +
    color +
    "-600 shadow-inner dark:from-" +
    color +
    "-900/40 dark:to-" +
    color +
    "-800/20 dark:text-" +
    color +
    "-400 border border-" +
    color +
    "-200 dark:border-" +
    color +
    "-800/60 ring-1 ring-white/50 dark:ring-white/5";
  code = code.replace(regex, depthClass);
}

// And slate with /40
code = code.replace(
  /bg-slate-100 text-slate-600 dark:bg-slate-800\/40 dark:text-slate-400/g,
  "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 shadow-inner dark:from-slate-800/40 dark:to-slate-700/40 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 ring-1 ring-white/50 dark:ring-white/5"
);

fs.writeFileSync(path, code);
console.log("DONE");
