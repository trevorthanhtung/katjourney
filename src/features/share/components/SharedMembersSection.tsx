import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon, CheckmarkCircle02Icon, BookOpen01Icon, File01Icon, AlertCircleIcon, Add01Icon, PenTool01Icon, Delete01Icon, MoreVerticalIcon,
  ReceiptTextIcon, UserCheck01Icon, Tag01Icon, ChevronRightIcon, BalanceScaleIcon, InformationCircleIcon, CheckIcon, Cancel01Icon, Clock01Icon,
  FileCheckIcon, ShirtIcon, Briefcase01Icon, PlugIcon, PillIcon, Bread01Icon, PackageIcon, BadgeCheckIcon, StickyNoteIcon, TextFontIcon, MinusSignIcon, UserIcon, Calendar01Icon, Maximize01Icon, Image01Icon, Loading01Icon, SmileIcon, NotebookIcon, SaveIcon, SparklesIcon, RouteIcon, HelpCircleIcon, UserGroupIcon, BubbleChatIcon, GlobeIcon,
  CrownIcon, Luggage01Icon, Car01Icon, CalculatorIcon, PieChartIcon, Search01Icon,
  Airplane01Icon, KitchenUtensilsIcon, HotelIcon, Ticket01Icon, ShoppingBag01Icon, Gamepad2Icon, CompassIcon, ChevronDownIcon, Location01Icon, LocationOfflineIcon
} from "@hugeicons/core-free-icons";
import { Expense, ChecklistItem, JournalEntry, TravelDocument, BackupPlan, Member, EventItem } from '../../../db';
import { formatMoney, expenseCategories, formatDate, moodLabels, sumBy, getSettlementSuggestions } from '../../../utils/helpers';
import { submitChangeRequest } from '../../../services/sharedTripRequestService';
import { showToast } from '../../../components/ui/ToastManager';
import { uploadJournalImage, uploadDocumentImage } from '../../../services/storageService';
import { getIdentity } from '../../../services/identityService';
import { getCurrentPosition, reverseGeocode, getCurrencyForCountry } from '../../../services/locationService';
import { BottomSheet, Input, Select, Textarea, DatePicker, DeleteConfirmModal } from '../../../components/ui';
import { getAvatarSvg, getRandomAvatarId } from '../../../utils/avatars';
import { BreakdownSection, CategoryBar, SettlementCard } from '../../expenses/ExpensesScreen';
import { fetchExchangeRates, ExchangeRate } from '../../../services/currencyService';

const classNames = (...classes: any[]) => classes.filter(Boolean).join(' ');

const CATEGORIES = ["Giấy tờ", "Quần áo", "Đồ cá nhân", "Thiết bị điện tử", "Thuốc & y tế", "Tiền & ví", "Đồ ăn nhẹ", "Khác"] as const;
const CATEGORY_ICONS: Record<string, any> = {
  "Giấy tờ": FileCheckIcon,
  "Quần áo": ShirtIcon,
  "Đồ cá nhân": Briefcase01Icon,
  "Thiết bị điện tử": PlugIcon,
  "Thuốc & y tế": PillIcon,
  "Tiền & ví": Wallet01Icon,
  "Đồ ăn nhẹ": Bread01Icon,
  "Khác": PackageIcon
};



interface LocalMember extends Member {
  isPendingDelete?: boolean;
  isPendingCreate?: boolean;
  isPendingUpdate?: boolean;
  isOwner?: boolean;
}
export function SharedMembersSection({ 
  token,
  mode,
  members = [],
  checklist = [],
  expenses = [],
  changeRequests = [],
  guestName
}: { 
  token: string; 
  mode: string; 
  members?: LocalMember[]; 
  checklist?: ChecklistItem[]; 
  expenses?: Expense[]; 
  changeRequests?: any[]; 
  guestName?: string; 
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  const [roleChangeMemberId, setRoleChangeMemberId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Người đồng hành']);

  useEffect(() => {
    if (!activeMenuId) return;
    const handleScroll = () => {
      setActiveMenuId(null);
      setMenuPos(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeMenuId]);

  const [form, setForm] = useState({
    name: '',
    role: 'Người đồng hành',
    gender: 'male'
  });
  const [showValidationError, setShowValidationError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isRequestEdit = mode === 'request_edit';

  const mergedMembers = React.useMemo(() => {
    const list: LocalMember[] = members.filter((m: any) => !m.isDeleted).map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'members' && r.action === 'delete' && String(r.targetId) === String(item.id) && (!r.status || r.status === 'pending'));
      const updateReq = changeRequests.find(r => r.section === 'members' && r.action === 'update' && String(r.targetId) === String(item.id) && (!r.status || r.status === 'pending'));
      
      if (updateReq) {
        return {
          ...item,
          role: updateReq.after?.role as string,
          isPendingUpdate: true,
          isPendingDelete: pendingDelete
        };
      }
      return {
        ...item,
        isPendingDelete: pendingDelete
      };
    });

    const pendingCreates = changeRequests.filter(r => r.section === 'members' && r.action === 'create' && r.status === 'pending');
    pendingCreates.forEach(r => {
      list.push({
        id: ("pending-create-" + r.id) as any,
        ...r.after,
        isPendingCreate: true
      } as any);
    });

    list.sort((a, b) => {
      const isLeader = (m: LocalMember) => {
        const roleLower = (m.role || "").trim().toLowerCase();
        return (
          roleLower.includes("trưởng nhóm") ||
          roleLower.includes("trưởng đoàn") ||
          roleLower.includes("người đại diện") ||
          roleLower.includes("leader")
        );
      };
      const aLeader = isLeader(a);
      const bLeader = isLeader(b);
      if (aLeader && !bLeader) return -1;
      if (!aLeader && bLeader) return 1;
      return 0;
    });

    return list;
  }, [members, changeRequests]);

  const filteredMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return mergedMembers;
    const q = searchQuery.toLowerCase().trim();
    return mergedMembers.filter(m => 
      m.name.toLowerCase().includes(q) || 
      (m.role && m.role.toLowerCase().includes(q))
    );
  }, [mergedMembers, searchQuery]);

  async function handleRoleChangeSubmit() {
    if (!roleChangeMemberId) return;
    const member = members.find(m => String(m.id) === roleChangeMemberId);
    if (!member) return;

    const finalRole = selectedRoles.join(", ");
    if (!finalRole) {
      showToast('Vui lòng chọn vai trò mới.', 'error');
      return;
    }

    const payload = {
      section: 'members' as const,
      action: 'update' as const,
      targetId: String(member.id),
      before: {
        id: member.id,
        name: member.name,
        role: member.role || 'Người đồng hành',
        avatar: member.avatar
      },
      after: {
        id: member.id,
        name: member.name,
        role: finalRole,
        avatar: member.avatar
      },
      requesterName: guestName
    };

    try {
      await submitChangeRequest(token, payload);
      setRoleChangeMemberId(null);
      showToast('Đã gửi đề xuất thay đổi vai trò. Chủ nhóm sẽ duyệt.');
    } catch (e: any) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  }

  async function handleAdd() {
    setForm({ name: '', role: 'Người đồng hành', gender: 'male' });
    setShowValidationError(false);
    setIsFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setShowValidationError(true);
      return;
    }

    const existingAvatars = mergedMembers.map(m => m.avatar).filter(Boolean) as string[];
    const randAvatar = getRandomAvatarId(form.gender, existingAvatars);

    const payload = {
      name: form.name.trim(),
      role: form.role.trim() || 'Người đồng hành',
      avatar: randAvatar,
      isOwner: false
    };

    try {
      await submitChangeRequest(token, {
        section: 'members',
        action: 'create',
        after: payload,
        requesterName: guestName
      });
      setIsFormOpen(false);
      showToast('Đã gửi đề xuất thêm thành viên. Chủ nhóm sẽ duyệt.');
    } catch (e: any) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  }

  async function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  async function executeDelete(id: string) {
    try {
      const before = members.find(m => String(m.id) === id);
      await submitChangeRequest(token, {
        section: 'members',
        action: 'delete',
        targetId: id,
        before: before as any,
        requesterName: guestName
      });
      showToast('Đã gửi đề xuất xóa thành viên.');
    } catch (e: any) {
      showToast('Lỗi: ' + e.message, 'error');
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={UserGroupIcon} className="h-5 w-5 text-blue-500" />
          <h3 className="text-[16px] font-black text-kat-dark">Thành viên</h3>
        </div>
      </div>

      {/* Search Input Bar */}
      {mergedMembers.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm thành viên hoặc vai trò..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-[13.5px] font-semibold text-slate-700 placeholder-slate-450 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
            <HugeiconsIcon icon={Search01Icon} className="h-4.5 w-4.5 text-slate-400" />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMembers.map((member) => {
          const isPending = member.isPendingCreate || member.isPendingDelete;
          const initial = member.name.trim().charAt(0).toUpperCase() || "?";
          
          // Helper computations
          const assignedTasksCount = checklist.filter(c => c.assignedTo === member.name).length;
          const memberExpenses = expenses.filter(e => e.payer === member.name);
          const paidExpensesCount = memberExpenses.length;
          const totalSpent = memberExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
          const roleLower = (member.role || "").trim().toLowerCase();
          const isLeader = roleLower.includes("trưởng nhóm") || roleLower.includes("trưởng đoàn") || roleLower.includes("leader");
          const isCost = roleLower.includes("quản lý chi phí");
          const isDriver = roleLower.includes("tài xế");
          const isGuide = roleLower.includes("dẫn đường");
          const isLuggage = roleLower.includes("hành lý") || roleLower.includes("phụ trách hành lý");
          
          let cardBg = "bg-gradient-to-br from-slate-50/20 via-white to-white border-slate-200/60";
          let borderAccent = "border-l-4 border-l-slate-400";
          
          if (member.isPendingCreate) {
            cardBg = "bg-gradient-to-br from-sky-55/40 via-white to-white border-sky-200/80";
            borderAccent = "border-l-4 border-l-sky-500";
          } else if (member.isPendingDelete) {
            cardBg = "bg-gradient-to-br from-rose-50/40 via-white to-white border-rose-200/80 opacity-80";
            borderAccent = "border-l-4 border-l-rose-450";
          } else if (isLeader) {
            cardBg = "bg-gradient-to-br from-amber-50/30 via-white to-white border-slate-200/60";
            borderAccent = "border-l-4 border-l-amber-500";
          } else if (isCost) {
            cardBg = "bg-gradient-to-br from-emerald-50/30 via-white to-white border-slate-200/60";
            borderAccent = "border-l-4 border-l-emerald-500";
          } else if (isDriver) {
            cardBg = "bg-gradient-to-br from-blue-50/30 via-white to-white border-slate-200/60";
            borderAccent = "border-l-4 border-l-blue-500";
          } else if (isGuide) {
            cardBg = "bg-gradient-to-br from-sky-50/30 via-white to-white border-slate-200/60";
            borderAccent = "border-l-4 border-l-sky-500";
          } else if (isLuggage) {
            cardBg = "bg-gradient-to-br from-indigo-50/30 via-white to-white border-slate-200/60";
            borderAccent = "border-l-4 border-l-indigo-500";
          }

          const renderRoleBadge = (roleStr: string) => {
            const roles = (roleStr || "Người đồng hành").split(",").map(r => r.trim()).filter(Boolean);
            if (roles.length === 0) roles.push("Người đồng hành");

            return (
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {roles.map((r, idx) => {
                  const rLower = r.toLowerCase();
                  if (rLower.includes("trưởng nhóm") || rLower.includes("trưởng đoàn") || rLower.includes("leader")) {
                    return (
                      <span key={idx} title="Trưởng nhóm" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                        <HugeiconsIcon icon={CrownIcon} className="w-4 h-4 text-amber-500 fill-amber-500/10" />
                      </span>
                    );
                  }
                  if (rLower.includes("quản lý chi phí")) {
                    return (
                      <span key={idx} title="Quản lý chi phí" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                        <HugeiconsIcon icon={Wallet01Icon} className="w-4 h-4 text-emerald-500" />
                      </span>
                    );
                  }
                  if (rLower.includes("tài xế")) {
                    return (
                      <span key={idx} title="Tài xế" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 border border-blue-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                        <HugeiconsIcon icon={Car01Icon} className="w-4 h-4 text-blue-500" />
                      </span>
                    );
                  }
                  if (rLower.includes("dẫn đường")) {
                    return (
                      <span key={idx} title="Dẫn đường" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sky-50 text-sky-700 border border-sky-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                        <HugeiconsIcon icon={CompassIcon} className="w-4 h-4 text-sky-500" />
                      </span>
                    );
                  }
                  if (rLower.includes("phụ trách hành lý") || rLower.includes("hành lý")) {
                    return (
                      <span key={idx} title="Hành lý" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
                        <HugeiconsIcon icon={Luggage01Icon} className="w-4 h-4 text-indigo-500" />
                      </span>
                    );
                  }
                  return (
                    <span key={idx} title="Bạn đồng hành" className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 text-slate-600 border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110">
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
                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    {member.avatar ? (
                      getAvatarSvg(member.avatar, "w-full h-full")
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-600 text-[18px] font-black">
                        {initial}
                      </div>
                    )}
                  </div>

                  {/* Member details */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 min-w-0">
                      <h4 className={classNames(
                        "text-[16.5px] font-extrabold text-kat-dark truncate leading-tight min-w-0",
                        member.isPendingDelete ? "line-through text-slate-400" : ""
                      )}>
                        {member.name}
                      </h4>
                      {renderRoleBadge(member.role || "Người đồng hành")}
                      {member.isPendingCreate && (
                        <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600 shrink-0 select-none animate-pulse">
                          Đề xuất mới
                        </span>
                      )}
                      {member.isPendingUpdate && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 shrink-0 select-none">
                          Đề xuất đổi vai trò
                        </span>
                      )}
                      {member.isPendingDelete && (
                        <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 shrink-0 select-none">
                          Đề xuất xóa
                        </span>
                      )}
                    </div>
                    {member.phone && (
                      <p className="text-[13.5px] font-semibold text-slate-500">
                        SĐT: <span className="text-kat-dark">{member.phone}</span>
                      </p>
                    )}
                    {member.note && (
                      <p className="text-[13px] font-medium text-slate-400 italic mt-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/50 break-words">
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
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-kat-teal/40"
                      title="Tùy chọn đề xuất"
                    >
                      <HugeiconsIcon icon={MoreVerticalIcon} className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Mini Stats Row */}
              <div className="pt-3 border-t border-slate-100/60 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-wrap gap-2 text-[12px]">
                  <span className={classNames(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] border transition-colors",
                    assignedTasksCount === 0 
                      ? "bg-slate-50/50 border-slate-100 text-slate-400 font-semibold" 
                      : "bg-sky-50/50 border-sky-100 text-sky-700 font-bold"
                  )}>
                    <HugeiconsIcon icon={Luggage01Icon} className="h-3.5 w-3.5 shrink-0" />
                    {assignedTasksCount} việc
                  </span>
                  <span className={classNames(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] border transition-colors",
                    totalSpent === 0 
                      ? "bg-slate-50/50 border-slate-100 text-slate-400 font-semibold" 
                      : "bg-emerald-50/50 border-emerald-100 text-emerald-700 font-bold"
                  )}>
                    <HugeiconsIcon icon={Wallet01Icon} className="h-3.5 w-3.5 shrink-0" />
                    Đã chi: {formatMoney(totalSpent)} {paidExpensesCount > 0 && `(${paidExpensesCount} lần)`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-[14px] font-semibold text-slate-450">
            {mergedMembers.length > 0 
              ? `Không tìm thấy thành viên nào khớp với từ khóa "${searchQuery}"`
              : "Chưa có thành viên nào trong chuyến đi."
            }
          </p>
        </div>
      )}

      {/* Fixed-position dropdown — renders above everything */}
      {activeMenuId && menuPos && createPortal(
        <>
          <div
            className="fixed inset-0 z-[998]"
            onClick={() => { setActiveMenuId(null); setMenuPos(null); }}
          />
          <div
            className="fixed z-[999] w-36 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 animate-fadeIn"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              onClick={() => {
                const id = activeMenuId;
                setActiveMenuId(null);
                setMenuPos(null);
                const mem = members.find(m => String(m.id) === id);
                if (mem) {
                  setRoleChangeMemberId(id);
                  const currentRole = mem.role || 'Người đồng hành';
                  const presets = ["Người đồng hành", "Quản lý chi phí", "Tài xế", "Dẫn đường"];
                  const existingRoles = currentRole.split(',').map((r: string) => r.trim()).filter((r: string) => presets.includes(r));
                  setSelectedRoles(existingRoles.length > 0 ? existingRoles : ['Người đồng hành']);
                }
              }}
              className="flex w-full items-center px-4 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
            >
              Đổi vai trò
            </button>
            <button
              onClick={() => {
                const id = activeMenuId;
                setActiveMenuId(null);
                setMenuPos(null);
                handleDelete(id);
              }}
              className="flex w-full items-center px-4 py-2 text-[13px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Đề xuất xóa
            </button>
          </div>
        </>,
        document.body
      )}

      {isRequestEdit && (
        <button 
          onClick={handleAdd} 
          className="flex h-12 w-full items-center justify-center gap-2 text-[14px] font-bold text-kat-dark/80 bg-white hover:bg-slate-50 border-2 border-dashed border-slate-200/80 hover:border-indigo-200 hover:text-indigo-700 rounded-2xl transition-all active:scale-[0.99] shadow-sm shadow-slate-100"
          title="Đề xuất thêm thành viên"
        >
          <HugeiconsIcon icon={Add01Icon} className="h-4.5 w-4.5" /> Đề xuất thêm thành viên
        </button>
      )}

      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Đề xuất thêm thành viên"
      >
        <div className="flex flex-col gap-5 py-2">
          <Input 
            label="Tên thành viên *" 
            value={form.name} 
            onChange={(name) => {
              setForm({ ...form, name });
              setShowValidationError(false);
            }} 
            placeholder="VD: Nguyễn Văn A" 
          />
          {showValidationError && (
            <p className="text-rose-500 text-[12.5px] font-bold -mt-3 pl-1">Vui lòng nhập tên thành viên.</p>
          )}

          <div className="space-y-2">
            <span className="text-[13.5px] font-semibold text-slate-600">Giới tính (để tạo ảnh đại diện ngẫu nhiên)</span>
            <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200/40">
              <button
                type="button"
                onClick={() => setForm({ ...form, gender: 'male' })}
                className={classNames(
                  "flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all",
                  form.gender === 'male' ? "bg-white text-kat-dark shadow-sm border" : "text-slate-500"
                )}
              >
                Nam
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, gender: 'female' })}
                className={classNames(
                  "flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all",
                  form.gender === 'female' ? "bg-white text-kat-dark shadow-sm border" : "text-slate-500"
                )}
              >
                Nữ
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="mt-2 w-full h-[50px] rounded-[16px] bg-kat-dark font-black text-white hover:bg-kat-dark bg-opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            Gửi đề xuất thêm
          </button>
        </div>
      </BottomSheet>

      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (!deleteTargetId) return;
          await executeDelete(deleteTargetId);
          setDeleteTargetId(null);
        }}
        title="Đề xuất xóa thành viên?"
        description="Bạn đang gửi đề xuất xóa thành viên này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất."
        confirmLabel="Đề xuất xóa"
        itemName={members.find(m => String(m.id) === deleteTargetId)?.name}
      />

      <BottomSheet
        isOpen={roleChangeMemberId !== null}
        onClose={() => setRoleChangeMemberId(null)}
        title="Đề xuất đổi vai trò"
      >
        <div className="flex flex-col gap-5 py-2">
          <div className="space-y-1">
            <p className="text-[13.5px] font-bold text-slate-500">
              Thành viên: <span className="font-extrabold text-kat-dark">{members.find(m => String(m.id) === roleChangeMemberId)?.name}</span>
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[13px] font-bold text-slate-700 block">Chọn vai trò mới</span>
            <div className="grid grid-cols-2 gap-2">
              {["Người đồng hành", "Quản lý chi phí", "Tài xế", "Dẫn đường"].map((r) => {
                const isSelected = selectedRoles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRoles(prev => {
                      if (r === 'Người đồng hành') return ['Người đồng hành'];
                      if (prev.includes(r)) {
                        const filtered = prev.filter(x => x !== r);
                        return filtered.length === 0 ? ['Người đồng hành'] : filtered;
                      }
                      return prev.filter(x => x !== 'Người đồng hành').concat(r);
                    })}
                    className={classNames(
                      "py-2.5 px-3 text-left text-[12.5px] font-bold rounded-xl transition-all border",
                      isSelected 
                        ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleRoleChangeSubmit}
            className="mt-2 w-full h-[50px] rounded-[16px] bg-kat-dark font-black text-white hover:bg-kat-dark bg-opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            Gửi đề xuất đổi vai trò
          </button>
        </div>
      </BottomSheet>
    </section>
  );
}

interface LocalMember extends Member {
  isPendingDelete?: boolean;
  isPendingCreate?: boolean;
  isPendingUpdate?: boolean;
  isOwner?: boolean;
}


