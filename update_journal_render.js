const fs = require('fs');

const file = 'd:\\02_PROJECTS\\5_KAT JOURNEY\\APP\\src\\features\\share\\components\\SharedSections.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  `import { formatMoney, expenseCategories } from '../../../utils/helpers';`,
  `import { formatMoney, expenseCategories, formatDate, moodLabels } from '../../../utils/helpers';`
);

// 2. Constants
if (!content.includes('const moodBadgeClasses')) {
  content = content.replace(
    `const moodColorClasses: Record<string, string> = {`,
    `const moodBadgeClasses: Record<string, string> = {
  good: "bg-amber-50 text-amber-800 border-amber-200",
  okay: "bg-emerald-50 text-emerald-800 border-emerald-200",
  great: "bg-rose-50 text-rose-800 border-rose-200",
  very_bad: "bg-slate-100 text-slate-700 border-slate-300",
  bad: "bg-blue-50 text-blue-800 border-blue-200"
};

const moodColorClasses: Record<string, string> = {`
  );
}

// 3. Render logic
const renderRegex = /<div className="space-y-4">\s*\{mergedJournals\.map\(\(j: any\) => \([\s\S]*?\{mergedJournals\.length === 0 && \([\s\S]*?<\/div>/;

const newRender = \`
        {mergedJournals.length > 0 ? (
          <div className="space-y-6 md:space-y-8">
            {Object.entries(
              mergedJournals.reduce<Record<string, any[]>>((result, entry) => {
                result[entry.date] = [...(result[entry.date] ?? []), entry];
                return result;
              }, {})
            )
            // Sort dates descending
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, entries]) => (
              <section key={date} className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <CalendarDays className="h-4.5 w-4.5 text-slate-400" />
                  <h3 className="text-[15px] font-extrabold text-[#030D2E]">{formatDate(date)}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entries.map((j: any, idx) => {
                    const moodBadge = moodBadgeClasses[j.mood] || "bg-slate-50 text-slate-700 border-slate-200";
                    return (
                      <article 
                        key={j.id} 
                        className={classNames(
                          "group rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] p-5 shadow-soft hover:shadow-md transition-all flex flex-col justify-between gap-4 overflow-hidden",
                          j.isPendingDelete ? "border-rose-100 bg-slate-50/50 opacity-70" : ""
                        )}
                      >
                        {j.imageUrl && (
                          <div className="-mx-5 -mt-5 mb-1">
                            <img src={j.imageUrl} alt="Journal" className="w-full aspect-[4/3] object-cover" />
                          </div>
                        )}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4 border-b border-slate-100/60 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-black text-[15px]">
                                {(j.authorName || "T").charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[14px] font-extrabold text-slate-800">{j.authorName || "Trưởng nhóm"}</span>
                                {j.isPendingDelete ? (
                                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Đề xuất xóa</span>
                                ) : (
                                  <span className={\`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider border \${moodBadge}\`}>
                                    {moodLabels[j.mood] || "Đáng nhớ"}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Delete Button */}
                            {isRequestEdit && !j.isPendingDelete && (
                              <button 
                                onClick={() => handleDelete(j as any)} 
                                className="flex h-8 w-8 items-center justify-center rounded-full text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                title="Đề xuất xóa nhật ký"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
  
                          <div className="pt-1">
                            <h4 className="text-[17px] font-black text-[#030D2E] leading-snug break-words">
                              {j.title || "Nhật ký chuyến đi"}
                            </h4>
                            <p className={classNames(
                              "mt-2 whitespace-pre-wrap text-[14.5px] leading-relaxed text-slate-600",
                              j.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
                            )}>
                              {j.content}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-slate-400 text-sm font-medium py-4">Chưa có bài viết nào.</p>
          </div>
        )}
\`;

content = content.replace(renderRegex, newRender);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated rendering format!');
