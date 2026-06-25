import re

filepath = "src/components/SettingsSheet.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    # Container
    '<div className="bg-white w-full max-w-md rounded-[28px] border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp">': 
    '<div className="bg-white dark:bg-kat-surface w-full max-w-md rounded-[28px] border border-slate-200 dark:border-kat-border/60 shadow-2xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden animate-scaleUp">',
    
    # Header
    '<div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">':
    '<div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-kat-border/40">',
    
    # Header icon
    '<div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">':
    '<div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">',
    
    # Header Title
    '<h3 className="text-[16px] font-black text-kat-dark">{t(\'settings.dialogs.importPreview.title\')}</h3>':
    '<h3 className="text-[16px] font-black text-kat-dark dark:text-slate-100">{t(\'settings.dialogs.importPreview.title\')}</h3>',

    # Trip Info Wrapper
    '<div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">':
    '<div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-4">',
    
    # Trip Info Title Text
    '<p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">{t(\'settings.dialogs.importPreview.tripName\')}</p>':
    '<p className="text-[11px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider mb-1">{t(\'settings.dialogs.importPreview.tripName\')}</p>',
    
    # Trip Info Name
    '<p className="text-[18px] font-black text-kat-dark leading-tight">{importPreview.tripName}</p>':
    '<p className="text-[18px] font-black text-kat-dark dark:text-slate-100 leading-tight">{importPreview.tripName}</p>',
    
    # Trip Info Exported At text
    '<p className="text-[11px] text-indigo-400 font-medium mt-1">':
    '<p className="text-[11px] text-indigo-400 dark:text-indigo-500 font-medium mt-1">',
    
    # Stats Grid Wrapper
    '<div key={item.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">':
    '<div key={item.label} className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 p-3 text-center">',
    
    # Stats Grid Value
    '<p className="text-[20px] font-black text-kat-dark">{item.value}</p>':
    '<p className="text-[20px] font-black text-kat-dark dark:text-slate-100">{item.value}</p>',
    
    # Stats Grid Label
    '<p className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</p>':
    '<p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{item.label}</p>',
    
    # Notice Text
    '<p className="text-[12px] text-slate-400 font-medium text-center leading-relaxed">':
    '<p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium text-center leading-relaxed">',
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement SettingsSheet dark mode complete")
