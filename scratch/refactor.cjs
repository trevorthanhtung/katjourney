const fs = require('fs');
const file = 'd:/02_PROJECTS/5_KAT JOURNEY/APP/src/features/share/components/SharedMembersSection.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add missing icons
if (!content.includes('CheckmarkBadge01Icon')) {
  content = content.replace('Wallet01Icon, ', 'Wallet01Icon, CheckmarkBadge01Icon, CheckmarkCircle01Icon, ');
}

// 2. Fix checklist.filter and expenses.filter
content = content.replace(/checklist\.filter\(c => c\.assignedTo === member\.name\)/g, 'checklist.filter(c => c.assignedTo === member.name && !c.isDeleted)');
content = content.replace(/expenses\.filter\(e => e\.payer === member\.name\)/g, 'expenses.filter(e => e.payer === member.name && !e.isDeleted)');

// 3. Add Nhóm
const nhomJSX = `                    {member.group && (
                      <p className="text-[13.5px] font-semibold text-slate-500">
                        Nhóm: <span className={member.isGroupLeader ? "text-kat-dark dark:text-kat-primary-usable" : "text-slate-700 dark:text-slate-300"}>
                          {member.group}
                        </span>
                      </p>
                    )}`;
if (!content.includes('Nhóm:')) {
  content = content.replace('{member.phone && (', nhomJSX + '\n                    {member.phone && (');
}

// 4. Update the Grid Mapping to group by member.group and include Overview Card
const newMappingLogic = `      {/* Overview Card */}
      <div className="mb-6">
        {filteredMembers.length ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-[20px] bg-white dark:bg-kat-surface border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mb-2">
                  <HugeiconsIcon icon={UserGroupIcon} className="w-5 h-5" />
                </div>
                <span className="text-[20px] font-black text-kat-dark leading-none">{filteredMembers.length}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Thành viên</span>
              </div>
              
              <div className="rounded-[20px] bg-white dark:bg-kat-surface border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center mb-2">
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} className="w-5 h-5" />
                </div>
                <span className="text-[20px] font-black text-kat-dark leading-none">{filteredMembers.filter(m => checklist.some(c => c.assignedTo === m.name && !c.isDeleted)).length}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Phân công</span>
              </div>

              <div className="rounded-[20px] bg-white dark:bg-kat-surface border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mb-2">
                  <HugeiconsIcon icon={Wallet01Icon} className="w-5 h-5" />
                </div>
                <span className="text-[20px] font-black text-kat-dark leading-none">{filteredMembers.filter(m => expenses.some(e => e.payer === m.name && !e.isDeleted)).length}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Đã chi trả</span>
              </div>

              <div className="rounded-[20px] bg-white dark:bg-kat-surface border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                <div className={classNames("h-10 w-10 rounded-full flex items-center justify-center mb-2", filteredMembers.length >= 2 ? "bg-teal-50 dark:bg-teal-900/20 text-teal-500" : "bg-slate-50 dark:bg-slate-800 text-slate-400")}>
                  <HugeiconsIcon icon={filteredMembers.length >= 2 ? CheckmarkCircle01Icon : AlertCircleIcon} className="w-5 h-5" />
                </div>
                <span className={classNames("text-[14px] font-black leading-none", filteredMembers.length >= 2 ? "text-kat-dark" : "text-slate-400")}>
                  {filteredMembers.length >= 2 ? "Sẵn sàng" : "Cần ≥ 2"}
                </span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Chia chi phí</span>
              </div>
            </div>
            {filteredMembers.length < 2 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-[13px] font-semibold text-slate-500">
                <HugeiconsIcon icon={UserGroupIcon} className="h-4.5 w-4.5 text-kat-teal shrink-0" />
                <p>Thêm thành viên để chia chi phí, phân công chuẩn bị và tổng kết chuyến đi rõ ràng hơn.</p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {filteredMembers.length > 0 ? (
        (() => {
          const groups = [];
          const noGroup = [];
          
          filteredMembers.forEach(m => {
            if (m.group) {
              let g = groups.find(x => x.name === m.group);
              if (!g) {
                g = { name: m.group, members: [] };
                groups.push(g);
              }
              g.members.push(m);
            } else {
              noGroup.push(m);
            }
          });

          return (
            <div className="flex flex-col gap-6">
              {groups.map(g => (
                <div key={g.name} className="animate-fadeIn">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <HugeiconsIcon icon={UserGroupIcon} className="w-5 h-5 text-kat-teal" />
                    <h3 className="text-[14px] font-bold text-slate-700 dark:text-slate-300">{g.name}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {g.members.map((member) => {`;

if (content.includes('{filteredMembers.length > 0 ? (\n        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n          {filteredMembers.map((member) => {')) {
  content = content.replace('{filteredMembers.length > 0 ? (\n        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n          {filteredMembers.map((member) => {', newMappingLogic);
  
  const endLogic = `          );
                    })}
                  </div>
                </div>
              ))}
              
              {noGroup.length > 0 && (
                <div className={groups.length > 0 ? "animate-fadeIn" : "animate-fadeIn"}>
                  {groups.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <HugeiconsIcon icon={UserGroupIcon} className="w-5 h-5 text-slate-400" />
                      <h3 className="text-[14px] font-bold text-slate-700 dark:text-slate-300">Thành viên khác</h3>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {noGroup.map((member) => {
                      const isPending = member.isPendingCreate || member.isPendingDelete;
                      const initial = member.name.trim().charAt(0).toUpperCase() || "?";
                      
                      const assignedTasksCount = checklist.filter(c => c.assignedTo === member.name && !c.isDeleted).length;
                      const memberExpenses = expenses.filter(e => e.payer === member.name && !e.isDeleted);
                      const paidExpensesCount = memberExpenses.length;
                      const totalSpent = memberExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
                      const roleLower = (member.role || "").trim().toLowerCase();
                      const isLeader = roleLower.includes("trưởng nhóm") || roleLower.includes("trưởng đoàn") || roleLower.includes("leader");
                      const isCost = roleLower.includes("quản lý chi phí");
                      const isDriver = roleLower.includes("tài xế");
                      const isGuide = roleLower.includes("dẫn đường");
                      const isLuggage = roleLower.includes("hành lý") || roleLower.includes("phụ trách hành lý");
                      
                      let cardBg = "bg-gradient-to-br from-slate-50/20 via-white to-white border-slate-200/60 dark:from-slate-800/10 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
                      let borderAccent = "border-l-4 border-l-slate-400";
                      
                      if (member.isPendingCreate) {
                        cardBg = "bg-gradient-to-br from-sky-50/40 via-white to-white border-sky-200/80 dark:from-sky-950/15 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
                        borderAccent = "border-l-4 border-l-sky-500";
                      } else if (member.isPendingDelete) {
                        cardBg = "bg-gradient-to-br from-rose-50/40 via-white to-white border-rose-200/80 opacity-80 dark:from-rose-950/15 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
                        borderAccent = "border-l-4 border-l-rose-500";
                      } else if (isLeader) {
                        cardBg = "bg-gradient-to-br from-amber-50/30 via-white to-white border-slate-200/60 dark:from-amber-950/15 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
                        borderAccent = "border-l-4 border-l-amber-500";
                      } else if (isCost) {
                        cardBg = "bg-gradient-to-br from-emerald-50/30 via-white to-white border-slate-200/60 dark:from-emerald-950/15 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
                        borderAccent = "border-l-4 border-l-emerald-500";
                      } else if (isDriver) {
                        cardBg = "bg-gradient-to-br from-blue-50/30 via-white to-white border-slate-200/60 dark:from-blue-950/15 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
                        borderAccent = "border-l-4 border-l-blue-500";
                      } else if (isGuide) {
                        cardBg = "bg-gradient-to-br from-sky-50/30 via-white to-white border-slate-200/60 dark:from-sky-950/15 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
                        borderAccent = "border-l-4 border-l-sky-500";
                      } else if (isLuggage) {
                        cardBg = "bg-gradient-to-br from-indigo-50/30 via-white to-white border-slate-200/60 dark:from-indigo-950/15 dark:via-kat-surface dark:to-kat-surface dark:border-kat-border";
                        borderAccent = "border-l-4 border-l-indigo-500";
                      }

                      const renderRoleBadge = (roleStr) => {
                        const roles = (roleStr || "Người đồng hành").split(",").map(r => r.trim()).filter(Boolean);
                        if (roles.length === 0) roles.push("Người đồng hành");
                        return (
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            {roles.map((r, idx) => {
                              const rLower = r.toLowerCase();
                              if (rLower.includes("trưởng nhóm") || rLower.includes("trưởng đoàn") || rLower.includes("leader")) {
                                return (
                                  <span key={idx} title="Trưởng nhóm" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                                    <HugeiconsIcon icon={CrownIcon} className="w-4 h-4 text-amber-500 fill-amber-500/10" />
                                  </span>
                                );
                              }
                              if (rLower.includes("quản lý chi phí")) {
                                return (
                                  <span key={idx} title="Quản lý chi phí" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                                    <HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4 text-emerald-500" />
                                  </span>
                                );
                              }
                              if (rLower.includes("tài xế")) {
                                return (
                                  <span key={idx} title="Tài xế" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                                    <HugeiconsIcon icon={Car01Icon} className="w-4 h-4 text-blue-500" />
                                  </span>
                                );
                              }
                              if (rLower.includes("dẫn đường")) {
                                return (
                                  <span key={idx} title="Dẫn đường" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-200/50 dark:border-sky-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                                    <HugeiconsIcon icon={CompassIcon} className="w-4 h-4 text-sky-500" />
                                  </span>
                                );
                              }
                              if (rLower.includes("phụ trách hành lý") || rLower.includes("hành lý")) {
                                return (
                                  <span key={idx} title="Hành lý" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                                    <HugeiconsIcon icon={Luggage01Icon} className="w-4 h-4 text-indigo-500" />
                                  </span>
                                );
                              }
                              return (
                                <span key={idx} title="Bạn đồng hành" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border border-slate-200/60 dark:border-slate-700/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                                  <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4 text-slate-400" />
                                </span>
                              );
                            })}
                          </div>
                        );
                      };
                      
                      return (
                        <div 
                          key={member.id || member.name} 
                          className={classNames(
                            "relative rounded-3xl border transition-all flex flex-col justify-between gap-4.5 p-5 shadow-[0_4px_15px_rgba(3,13,46,0.015)] hover:shadow-[0_8px_25px_rgba(3,13,46,0.04)] hover:scale-[1.005] duration-200",
                            cardBg,
                            borderAccent
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                {member.avatar ? (
                                  getAvatarSvg(member.avatar, "w-full h-full")
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-slate-300 text-[18px] font-black">
                                    {initial}
                                  </div>
                                )}
                              </div>
            
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 min-w-0">
                                  <h4 className={classNames(
                                    "text-[16.5px] font-extrabold text-kat-dark truncate leading-tight min-w-0",
                                    member.isPendingDelete ? "line-through text-slate-400 dark:text-slate-500" : ""
                                  )}>
                                    {member.name}
                                  </h4>
                                  {renderRoleBadge(member.role || "Người đồng hành")}
                                  {member.isPendingCreate && (
                                    <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400 shrink-0 select-none animate-pulse">
                                      Đề xuất mới
                                    </span>
                                  )}
                                  {member.isPendingUpdate && (
                                    <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0 select-none">
                                      Đề xuất đổi vai trò
                                    </span>
                                  )}
                                  {member.isPendingDelete && (
                                    <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 shrink-0 select-none">
                                      Đề xuất xóa
                                    </span>
                                  )}
                                </div>
                                {member.group && (
                                  <p className="text-[13.5px] font-semibold text-slate-500">
                                    Nhóm: <span className={member.isGroupLeader ? "text-kat-dark dark:text-kat-primary-usable" : "text-slate-700 dark:text-slate-300"}>
                                      {member.group}
                                    </span>
                                  </p>
                                )}
                                {member.phone && (
                                  <p className="text-[13.5px] font-semibold text-slate-500 dark:text-slate-400">
                                    SĐT: <span className="text-kat-dark dark:text-slate-300">{member.phone}</span>
                                  </p>
                                )}
                                {member.note && (
                                  <p className="text-[13px] font-medium text-slate-400 dark:text-slate-400 italic mt-1 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-700/30 break-words">
                                    "{member.note}"
                                  </p>
                                )}
                              </div>
                            </div>
            
                            {isRequestEdit && !isPending && member.name === guestName && !(() => {
                              const r = (member.role || "").toLowerCase();
                              return r.includes("trưởng đoàn") || r.includes("trưởng nhóm") || r.includes("người đại diện") || r.includes("leader");
                            })() && (
                              <div className="shrink-0">
                                <button 
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                                    if (activeMenuId === String(member.id)) {
                                      setActiveMenuId(null);
                                      setMenuPos(null);
                                    } else {
                                      setActiveMenuId(String(member.id));
                                      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                    }
                                  }}
                                  className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-kat-teal/40"
                                  title="Tùy chọn đề xuất"
                                >
                                  <HugeiconsIcon icon={MoreVerticalIcon} className="h-5 w-5" />
                                </button>
                              </div>
                            )}
                          </div>
            
                          <div className="pt-3 border-t border-slate-100/60 dark:border-slate-700/40 flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex flex-wrap gap-2 text-[12px]">
                              <span className={classNames(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] border transition-colors",
                                assignedTasksCount === 0 
                                  ? "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-700/30 text-slate-400 dark:text-slate-500 font-semibold" 
                                  : "bg-sky-50/50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/30 text-sky-700 dark:text-sky-400 font-bold"
                              )}>
                                <HugeiconsIcon icon={Luggage01Icon} className="h-3.5 w-3.5 shrink-0" />
                                {assignedTasksCount} việc
                              </span>
                              <span className={classNames(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] border transition-colors",
                                totalSpent === 0 
                                  ? "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-700/30 text-slate-400 dark:text-slate-500 font-semibold" 
                                  : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold"
                              )}>
                                <HugeiconsIcon icon={Wallet01Icon} className="h-3.5 w-3.5 shrink-0" />
                                Đã chi: {formatMoney(totalSpent)} {paidExpensesCount > 0 && \`(\${paidExpensesCount} lần)\`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()
      ) : (`;

  content = content.replace(`          );
        })}
        </div>
      ) : (`, endLogic);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Done refactoring SharedMembersSection.tsx');
