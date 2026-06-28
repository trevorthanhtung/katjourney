const fs = require("fs");
const path = "d:\\\\02_PROJECTS\\\\5_KAT JOURNEY\\\\APP\\\\src\\\\components\\\\SettingsSheet.tsx";
let code = fs.readFileSync(path, "utf8");

// Add Map01Icon to imports
code = code.replace(/Location01Icon,/g, "Location01Icon,\n  Map01Icon,");

// Replace Location01Icon with Map01Icon in the Distance section
code = code.replace(
  /<HugeiconsIcon\s*\n*\s*icon=\{Location01Icon\}\s*\n*\s*className=\"h-5 w-5 transition-transform group-hover:scale-110\"\s*\n*\s*\/>\s*\n*\s*<\/div>\s*\n*\s*<div className=\"min-w-0 text-left\">\s*\n*\s*<h4 className=\"text-\[14px\] font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors\">\s*\n*\s*\{t\(\"settings.menu.distance.title\"/gm,
  '<HugeiconsIcon icon={Map01Icon} className=\"h-5 w-5 transition-transform group-hover:scale-110\" /></div><div className=\"min-w-0 text-left\"><h4 className=\"text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors\">{t(\"settings.menu.distance.title\"'
);

// Add depth to all colored backgrounds
const colors = ["teal", "indigo", "cyan", "amber", "rose", "emerald", "blue"];
for (const color of colors) {
  const regex = new RegExp(
    "bg-" +
      color +
      "-100 text-" +
      color +
      "-600 dark:bg-" +
      color +
      "-900\\\\/40 dark:text-" +
      color +
      "-400",
    "g"
  );
  const depthClass =
    "bg-gradient-to-b from-" +
    color +
    "-50 to-" +
    color +
    "-100/80 dark:from-" +
    color +
    "-900/50 dark:to-" +
    color +
    "-900/20 text-" +
    color +
    "-600 dark:text-" +
    color +
    "-400 shadow-[inset_0px_2px_4px_rgba(255,255,255,0.7),0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0px_1px_1px_rgba(255,255,255,0.05),0px_1px_3px_rgba(0,0,0,0.2)] ring-1 ring-" +
    color +
    "-200/50 dark:ring-" +
    color +
    "-800/60";
  code = code.replace(regex, depthClass);
}

// And slate
code = code.replace(
  /bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400/g,
  "bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-800/40 text-slate-600 dark:text-slate-400 shadow-[inset_0px_2px_4px_rgba(255,255,255,0.7),0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0px_1px_1px_rgba(255,255,255,0.05),0px_1px_3px_rgba(0,0,0,0.2)] ring-1 ring-slate-200/60 dark:ring-slate-700/60"
);

fs.writeFileSync(path, code);
console.log("DONE");
