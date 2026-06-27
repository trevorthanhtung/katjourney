const fs = require('fs');
const path = require('path');

const filePath = path.join('d:/02_PROJECTS/5_KAT JOURNEY/APP/src/components/SettingsSheet.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const items = [
  { id: 'Install PWA', color: 'teal', icon: 'Download01Icon', title: "t('settings.menu.install.title')", desc: "t('settings.menu.install.desc')" },
  { id: 'Theme', color: 'violet', icon: 'ColorsIcon', title: "t('settings.menu.theme.title')", desc: "t('settings.menu.theme.desc')" },
  { id: 'Language', color: 'sky', icon: 'LanguageSkillIcon', title: "t('settings.menu.language.title')", desc: "t('settings.menu.language.desc')" },
  { id: 'Privacy', color: 'blue', icon: 'LockIcon', title: "t('settings.menu.privacy.title')", desc: "t('settings.menu.privacy.desc')" },
  { id: 'Exchange Rates', color: 'cyan', icon: 'Coins01Icon', title: "t('settings.menu.exchangeRates.title')", desc: "t('settings.menu.exchangeRates.desc')" },
  { id: 'About', color: 'fuchsia', icon: 'InformationCircleIcon', title: "t('settings.menu.about.title')", desc: "t('settings.menu.about.desc')" },
  { id: 'Donate', color: 'amber', icon: 'Coffee01Icon', title: "t('settings.menu.donate.title')", desc: "t('settings.menu.donate.desc')" },
  { id: 'Feedback', color: 'sky', icon: 'Mail01Icon', title: "t('settings.menu.feedback.title')", desc: "t('settings.menu.feedback.desc')" },
];

function generateGlassButton(onClick, color, icon, title, desc, rightElement) {
  return `className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-${color}-300 hover:shadow-md active:scale-[0.98] dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:border-${color}-500/50 focus:outline-none mb-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-${color}-500/10"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-${color}-100 to-${color}-50 text-${color}-600 shadow-inner dark:from-${color}-900/40 dark:to-${color}-800/20 dark:text-${color}-400">
                    <HugeiconsIcon icon={${icon}} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-${color}-600 dark:group-hover:text-${color}-400 transition-colors">{${title}}</h4>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{${desc}}</p>
                  </div>
                </div>
                ${rightElement || `<HugeiconsIcon icon={ChevronRightIcon} className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />`}`;
}

// Custom replacements for standard buttons
const replacements = [
  {
    regex: /className="flex items-center justify-between w-full p-4 rounded-\[20px\].*?\s*>\s*<div className="flex items-center gap-3\.5">\s*<div className="flex h-10 w-10 items-center justify-center rounded-full[^>]*>\s*<HugeiconsIcon icon={Download01Icon}[^>]*\/>\s*<\/div>\s*<div className="min-w-0 text-left">\s*<h4[^>]*>\{t\('settings\.menu\.install\.title'\)\}<\/h4>\s*<p[^>]*>\{t\('settings\.menu\.install\.desc'\)\}<\/p>\s*<\/div>\s*<\/div>\s*<HugeiconsIcon icon={ChevronRightIcon}[^>]*\/>/g,
    replace: generateGlassButton('handleInstallPWA', 'teal', 'Download01Icon', "t('settings.menu.install.title')", "t('settings.menu.install.desc')")
  },
  {
    regex: /className="flex items-center justify-between w-full p-4 rounded-\[20px\].*?\s*>\s*<div className="flex items-center gap-3\.5">\s*<div className="flex h-10 w-10 items-center justify-center rounded-full[^>]*>\s*<HugeiconsIcon icon={ColorsIcon}[^>]*\/>\s*<\/div>\s*<div[^>]*>\s*<h4[^>]*>\{t\('settings\.menu\.theme\.title'\)\}<\/h4>\s*<p[^>]*>\{t\('settings\.menu\.theme\.desc'\)\}<\/p>\s*<\/div>\s*<\/div>\s*<HugeiconsIcon icon={ChevronRightIcon}[^>]*\/>/g,
    replace: generateGlassButton('() => setView("theme")', 'violet', 'ColorsIcon', "t('settings.menu.theme.title')", "t('settings.menu.theme.desc')")
  },
  {
    regex: /className="flex items-center justify-between w-full p-4 rounded-\[20px\].*?\s*>\s*<div className="flex items-center gap-3\.5">\s*<div className="flex h-10 w-10 items-center justify-center rounded-full[^>]*>\s*<HugeiconsIcon icon={LanguageSkillIcon}[^>]*\/>\s*<\/div>\s*<div[^>]*>\s*<h4[^>]*>\{t\('settings\.menu\.language\.title'\)\}<\/h4>\s*<p[^>]*>\{t\('settings\.menu\.language\.desc'\)\}<\/p>\s*<\/div>\s*<\/div>\s*<HugeiconsIcon icon={ChevronRightIcon}[^>]*\/>/g,
    replace: generateGlassButton('() => setView("language")', 'sky', 'LanguageSkillIcon', "t('settings.menu.language.title')", "t('settings.menu.language.desc')")
  },
  {
    regex: /className="flex items-center justify-between w-full p-4 rounded-\[20px\].*?\s*>\s*<div className="flex items-center gap-3\.5">\s*<div className="flex h-10 w-10 items-center justify-center rounded-full[^>]*>\s*<HugeiconsIcon icon={LockIcon}[^>]*\/>\s*<\/div>\s*<div[^>]*>\s*<h4[^>]*>\{t\('settings\.menu\.privacy\.title'\)\}<\/h4>\s*<p[^>]*>\{t\('settings\.menu\.privacy\.desc'\)\}<\/p>\s*<\/div>\s*<\/div>\s*<HugeiconsIcon icon={ChevronRightIcon}[^>]*\/>/g,
    replace: generateGlassButton('() => setView("privacy")', 'blue', 'LockIcon', "t('settings.menu.privacy.title')", "t('settings.menu.privacy.desc')")
  },
  {
    regex: /className="flex items-center justify-between w-full p-4 rounded-\[20px\].*?\s*>\s*<div className="flex items-center gap-3\.5">\s*<div className="flex h-10 w-10 items-center justify-center rounded-full[^>]*>\s*<HugeiconsIcon icon={Coins01Icon}[^>]*\/>\s*<\/div>\s*<div className="min-w-0 text-left">\s*<h4[^>]*>\{t\('settings\.menu\.exchangeRates\.title'\)\}<\/h4>\s*<p[^>]*>\{t\('settings\.menu\.exchangeRates\.desc'\)\}<\/p>\s*<\/div>\s*<\/div>\s*<HugeiconsIcon icon={ChevronRightIcon}[^>]*\/>/g,
    replace: generateGlassButton('() => setView("exchangeRates")', 'cyan', 'Coins01Icon', "t('settings.menu.exchangeRates.title')", "t('settings.menu.exchangeRates.desc')")
  },
  {
    regex: /className="flex items-center justify-between w-full p-4 rounded-\[20px\].*?\s*>\s*<div className="flex items-center gap-3\.5">\s*<div className="flex h-10 w-10 items-center justify-center rounded-full[^>]*>\s*<HugeiconsIcon icon={InformationCircleIcon}[^>]*\/>\s*<\/div>\s*<div[^>]*>\s*<h4[^>]*>\{t\('settings\.menu\.about\.title'\)\}<\/h4>\s*<p[^>]*>\{t\('settings\.menu\.about\.desc'\)\}<\/p>\s*<\/div>\s*<\/div>\s*<HugeiconsIcon icon={ChevronRightIcon}[^>]*\/>/g,
    replace: generateGlassButton('() => setView("about")', 'fuchsia', 'InformationCircleIcon', "t('settings.menu.about.title')", "t('settings.menu.about.desc')")
  },
  {
    regex: /className="flex items-center justify-between w-full p-4 rounded-\[20px\].*?\s*>\s*<div className="flex items-center gap-3\.5">\s*<div className="flex h-10 w-10 items-center justify-center rounded-full[^>]*>\s*<HugeiconsIcon icon={Coffee01Icon}[^>]*\/>\s*<\/div>\s*<div className="min-w-0 text-left">\s*<h4[^>]*>\{t\('settings\.menu\.donate\.title'\)\}<\/h4>\s*<p[^>]*>\{t\('settings\.menu\.donate\.desc'\)\}<\/p>\s*<\/div>\s*<\/div>\s*<HugeiconsIcon icon={ChevronRightIcon}[^>]*\/>/g,
    replace: generateGlassButton('() => setView("donate")', 'amber', 'Coffee01Icon', "t('settings.menu.donate.title')", "t('settings.menu.donate.desc')")
  },
  {
    regex: /className="flex items-center justify-between w-full p-4 rounded-\[20px\].*?\s*>\s*<div className="flex items-center gap-3\.5">\s*<div className="flex h-10 w-10 items-center justify-center rounded-full[^>]*>\s*<HugeiconsIcon icon={Mail01Icon}[^>]*\/>\s*<\/div>\s*<div[^>]*>\s*<h4[^>]*>\{t\('settings\.menu\.feedback\.title'\)\}<\/h4>\s*<p[^>]*>\{t\('settings\.menu\.feedback\.desc'\)\}<\/p>\s*<\/div>\s*<\/div>\s*<HugeiconsIcon icon={ChevronRightIcon}[^>]*\/>/g,
    replace: generateGlassButton('mailto:...', 'sky', 'Mail01Icon', "t('settings.menu.feedback.title')", "t('settings.menu.feedback.desc')")
  }
];

// Special replacements for Notification and GPS because they have switches
const notificationRegex = /className="flex items-center justify-between w-full p-4 rounded-\[20px\].*?\s*>\s*<div className="flex items-center gap-3\.5 min-w-0">\s*<div className="flex h-10 w-10 items-center justify-center rounded-full[^>]*>\s*<HugeiconsIcon icon={Notification01Icon}[^>]*\/>\s*<\/div>\s*<div className="min-w-0 text-left">\s*<h4[^>]*>\{t\('settings\.menu\.notification\.title'\)\}<\/h4>\s*<p[^>]*>\{t\('settings\.menu\.notification\.desc'\)\}<\/p>\s*<\/div>\s*<\/div>/g;
const notificationReplacement = `className="group relative flex items-center justify-between w-full p-4 rounded-[24px] border border-slate-200/60 bg-white shadow-sm transition-all hover:border-emerald-300 hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:border-emerald-500/50 mb-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-emerald-500/10"></div>
                  <div className="flex items-center gap-4 relative z-10 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 shadow-inner dark:from-emerald-900/40 dark:to-emerald-800/20 dark:text-emerald-400">
                      <HugeiconsIcon icon={Notification01Icon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="min-w-0 text-left">
                      <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{t('settings.menu.notification.title')}</h4>
                      <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.notification.desc')}</p>
                    </div>
                  </div>`;

const gpsRegex = /className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800\/40 rounded-\[20px\] border border-slate-100 dark:border-kat-border\/40 shadow-soft mb-2">\s*<div className="flex items-center gap-3\.5 min-w-0">\s*<div className="flex h-10 w-10 items-center justify-center rounded-full[^>]*>\s*<HugeiconsIcon icon={Location01Icon}[^>]*\/>\s*<\/div>\s*<div className="min-w-0 text-left">\s*<h4[^>]*>\{t\('settings\.menu\.location\.title'\)\}<\/h4>\s*<p[^>]*>\{t\('settings\.menu\.location\.desc'\)\}<\/p>\s*<\/div>\s*<\/div>/g;
const gpsReplacement = `className="group relative flex items-center justify-between p-4 rounded-[24px] border border-slate-200/60 bg-white shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:border-indigo-500/50 mb-2">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-indigo-500/10"></div>
              <div className="flex items-center gap-4 relative z-10 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 shadow-inner dark:from-indigo-900/40 dark:to-indigo-800/20 dark:text-indigo-400">
                  <HugeiconsIcon icon={Location01Icon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                </div>
                <div className="min-w-0 text-left">
                  <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t('settings.menu.location.title')}</h4>
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.location.desc')}</p>
                </div>
              </div>`;

const versionRegex = /className="flex items-center justify-between w-full p-4 rounded-\[20px\].*?\s*>\s*<div className="flex items-center gap-3\.5">\s*<div className="flex h-10 w-10 items-center justify-center rounded-full[^>]*>\s*<HugeiconsIcon icon={PackageIcon}[^>]*\/>\s*<\/div>\s*<div[^>]*>\s*<h4[^>]*>\{t\('settings\.menu\.version\.title'\)\}<\/h4>\s*<p[^>]*>\{t\('settings\.menu\.version\.desc'\)\}<\/p>\s*<\/div>\s*<\/div>/g;
const versionReplacement = `className="group relative flex items-center justify-between w-full p-4 rounded-[24px] border border-slate-200/60 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:border-slate-500/50 mb-2">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-slate-500/10"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 shadow-inner dark:from-slate-800/40 dark:to-slate-700/20 dark:text-slate-400">
                  <HugeiconsIcon icon={PackageIcon} className="h-5.5 w-5.5 transition-transform group-hover:scale-110" />
                </div>
                <div className="text-left">
                  <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">{t('settings.menu.version.title')}</h4>
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.menu.version.desc')}</p>
                </div>
              </div>`;

for (const r of replacements) {
  content = content.replace(r.regex, r.replace);
}
content = content.replace(notificationRegex, notificationReplacement);
content = content.replace(gpsRegex, gpsReplacement);
content = content.replace(versionRegex, versionReplacement);

// Fix the switch components margin/padding if necessary
content = content.replace(/className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none \${/g, 'className={`relative z-10 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${');
content = content.replace(/<span className="text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-200\/70 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">/g, '<span className="relative z-10 text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">');

fs.writeFileSync(filePath, content);
console.log("Refactored SettingsSheet buttons!");
