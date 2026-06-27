const fs = require('fs');

const file = 'd:/02_PROJECTS/5_KAT JOURNEY/APP/src/components/SettingsSheet.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Refactor "Back to Menu" buttons
const backBtnRegex = /className="w-full inline-flex min-h-\[50px\] items-center justify-center rounded-\[18px\] bg-slate-100 dark:bg-slate-800\/80 border border-slate-200 dark:border-white\/\[0\.04\] text-slate-700 dark:text-slate-300 px-6 font-bold hover:bg-slate-200 dark:hover:bg-slate-700\/80 active:scale-\[0\.98\] transition-all duration-200"/g;
const newBackBtnClass = `className="group relative flex w-full min-h-[50px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200/60 bg-slate-50 font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-slate-500/50 dark:hover:bg-slate-800/80"`;
content = content.replace(backBtnRegex, newBackBtnClass);

// 2. Refactor Theme options
const themeActiveRegex = /"border-amber-500 bg-amber-500\/\[0\.02\] dark:bg-amber-500\/\[0\.01\] shadow-\[0_4px_20px_rgba\(245,158,11,0\.08\)\] scale-\[1\.02\]"/g;
const themeActiveVioletRegex = /"border-violet-500 bg-violet-500\/\[0\.02\] dark:bg-violet-500\/\[0\.01\] shadow-\[0_4px_20px_rgba\(139,92,246,0\.12\)\] scale-\[1\.02\]"/g;
const themeActiveTealRegex = /"border-teal-500 bg-teal-500\/\[0\.02\] dark:bg-teal-500\/\[0\.01\] shadow-\[0_4px_20px_rgba\(20,184,166,0\.08\)\] scale-\[1\.02\]"/g;
const themeInactiveRegex = /"bg-white dark:bg-slate-900\/40 border-slate-200\/80 dark:border-slate-800\/80 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-\[1\.01\] active:scale-\[0\.98\]"/g;

content = content.replace(themeActiveRegex, `"border-amber-400 bg-amber-50 shadow-[0_4px_20px_rgba(251,191,36,0.15)] scale-[1.02] dark:border-amber-500/50 dark:bg-amber-500/5 dark:shadow-[0_4px_20px_rgba(245,158,11,0.08)]"`);
content = content.replace(themeActiveVioletRegex, `"border-violet-400 bg-violet-50 shadow-[0_4px_20px_rgba(167,139,250,0.15)] scale-[1.02] dark:border-violet-500/50 dark:bg-violet-500/5 dark:shadow-[0_4px_20px_rgba(139,92,246,0.12)]"`);
content = content.replace(themeActiveTealRegex, `"border-teal-400 bg-teal-50 shadow-[0_4px_20px_rgba(45,212,191,0.15)] scale-[1.02] dark:border-teal-500/50 dark:bg-teal-500/5 dark:shadow-[0_4px_20px_rgba(20,184,166,0.08)]"`);
content = content.replace(themeInactiveRegex, `"bg-white border-slate-200/60 shadow-sm hover:border-slate-300 hover:shadow-md hover:scale-[1.01] active:scale-[0.98] dark:bg-slate-800/40 dark:border-white/[0.04] dark:hover:border-slate-600/50"`);

// 3. Refactor Language options
const langActiveRegex = /"border-kat-primary bg-kat-primary\/\[0\.03\] dark:bg-kat-primary\/\[0\.05\] shadow-sm scale-\[1\.02\]"/g;
const langInactiveRegex = /"border-slate-100 dark:border-slate-800\/80 bg-white dark:bg-slate-900\/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800\/60 hover:scale-\[1\.01\] active:scale-\[0\.98\]"/g;

content = content.replace(langActiveRegex, `"border-kat-primary bg-kat-primary/5 shadow-md scale-[1.02] dark:border-kat-primary/50 dark:bg-kat-primary/10"`);
content = content.replace(langInactiveRegex, `"border-slate-200/60 bg-white shadow-sm hover:border-kat-primary/40 hover:shadow-md hover:scale-[1.01] active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-kat-primary/40"`);

// 4. Refactor Google Sign In Button
const googleBtnRegex = /className="w-full flex items-center justify-center gap-3 min-h-\[50px\] rounded-\[16px\] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-\[15px\] text-kat-dark dark:text-slate-200 active:scale-\[0\.98\] shadow-sm disabled:opacity-60"/g;
const newGoogleBtn = `className="group relative flex w-full items-center justify-center gap-3 min-h-[50px] overflow-hidden rounded-[20px] border border-slate-200/60 bg-white font-bold text-[15px] text-kat-dark shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.98] disabled:opacity-60 dark:border-white/[0.04] dark:bg-slate-800/40 dark:text-slate-200 dark:hover:border-slate-500/50"`;
content = content.replace(googleBtnRegex, newGoogleBtn);

fs.writeFileSync(file, content);
console.log('Refactored inner components!');
