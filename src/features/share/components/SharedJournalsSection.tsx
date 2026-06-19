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
import { Expense, ChecklistItem, JournalEntry, TravelDocument, BackupPlan, Member, EventItem, JournalMood } from '../../../db';
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



const moodOptionList: Array<{ value: "good" | "okay" | "great" | "very_bad" | "bad"; label: string }> = [
  { value: "good", label: "Vui" },
  { value: "okay", label: "Bình yên" },
  { value: "great", label: "Hào hứng" },
  { value: "very_bad", label: "Mệt" },
  { value: "bad", label: "Bất ngờ" }
];

const moodBadgeClasses: Record<string, string> = {
  good: "bg-amber-50 text-amber-800 border-amber-200",
  okay: "bg-emerald-50 text-emerald-800 border-emerald-200",
  great: "bg-rose-50 text-rose-800 border-rose-200",
  very_bad: "bg-slate-100 text-slate-700 border-slate-300",
  bad: "bg-blue-50 text-blue-800 border-blue-200"
};

const moodColorClasses: Record<string, string> = {
  good: "bg-amber-500",
  okay: "bg-emerald-500",
  great: "bg-rose-500",
  very_bad: "bg-slate-400",
  bad: "bg-blue-500"
};

const promptSuggestions = [
  "Điều muốn nhớ nhất",
  "Món ăn đáng nhớ",
  "Người bạn đã gặp",
  "Khoảnh khắc vui",
  "Điều muốn nhớ mãi"
];
export function SharedJournalsSection({ 
  tripId,
  token, 
  mode, 
  journals, 
  changeRequests = [],
  guestName,
  members = [],
  renderChatBox
}: { 
  tripId: string | number;
  token: string; 
  mode: string; 
  journals: JournalEntry[]; 
  changeRequests?: any[];
  guestName?: string;
  members?: Member[];
  renderChatBox?: () => React.ReactNode;
}) {
  const isRequestEdit = mode === 'request_edit' || mode === 'edit';
  const isDirectEdit = mode === 'edit';
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [deleteTargetId, setDeleteTargetId] = React.useState<JournalEntry | null>(null);
  const [journalMode, setJournalMode] = React.useState<"posts" | "chat">("posts");

  const [activeReactionPopover, setActiveReactionPopover] = React.useState<string | number | null>(null);
  const resolvedGuestName = guestName || "Khách";

  async function handleToggleReaction(entry: JournalEntry, emoji: string) {
    const reactions = { ...(entry.reactions || {}) };
    const currentUsers = [...(reactions[emoji] || [])];
    
    if (currentUsers.includes(resolvedGuestName)) {
      reactions[emoji] = currentUsers.filter(u => u !== resolvedGuestName);
    } else {
      reactions[emoji] = [...currentUsers, resolvedGuestName];
    }
    
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
    
    try {
      await submitChangeRequest(token, {
        section: 'journals',
        action: 'update',
        targetId: String(entry.id),
        before: entry as any,
        after: { ...entry, reactions } as any,
        status: 'auto_approved',
        requesterName: resolvedGuestName
      });
    } catch (e: any) {
      showToast("Lỗi: " + e.message, "error");
    }
  }
  const [form, setForm] = React.useState({ 
    date: new Date().toISOString().split('T')[0], 
    title: "", 
    content: "", 
    mood: "good" as "good" | "okay" | "great" | "very_bad" | "bad", 
    imageUrl: "",
    locationName: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  });
  const [uploading, setUploading] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadJournalImage(file, tripId); 
      setForm(prev => ({ ...prev, imageUrl: url }));
      setDirty(true);
    } catch (err) {
      showToast("Lỗi tải ảnh lên. Vui lòng thử lại.", "error");
    } finally {
      setUploading(false);
    }
  };

  const fetchLocation = React.useCallback(async () => {
    setIsLocating(true);
    try {
      const pos = await getCurrentPosition();
      const geo = await reverseGeocode(pos.latitude, pos.longitude);
      setForm(prev => ({...prev, locationName: geo.displayName, latitude: pos.latitude, longitude: pos.longitude}));
    } catch (err: any) {
      if (err.message !== "GPS is disabled by user setting") {
        showToast(err.message || "Không thể lấy vị trí.", "error");
      }
    } finally {
      setIsLocating(false);
    }
  }, []);

  React.useEffect(() => {
    if (isFormOpen && !form.locationName && !form.latitude) {
      fetchLocation();
    }
  }, [isFormOpen, fetchLocation]);

  const mergedJournals = React.useMemo(() => {
    const list = [...journals].filter((j: any) => !j.isDeleted);
    const creations = changeRequests.filter(r => r.section === 'journals' && r.action === 'create' && r.status === 'pending');
    creations.forEach(r => {
      list.push({ id: r.id, ...(r.after as any) });
    });

    // sort descending by postedAt (ISO timestamp) → ngày mới nhất + giờ mới nhất lên đầu
    list.sort((a, b) => {
      const ta = a.postedAt || `${a.date}T00:00:00`;
      const tb = b.postedAt || `${b.date}T00:00:00`;
      return tb.localeCompare(ta);
    });

    return list.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'journals' && r.action === 'delete' && String(r.targetId) === String(item.id) && (!r.status || r.status === 'pending'));
      const autoApprovedDelete = changeRequests.some(r => r.section === 'journals' && r.action === 'delete' && String(r.targetId) === String(item.id) && r.status === 'auto_approved');
      
      if (autoApprovedDelete) return null;

      const latestUpdate = changeRequests.filter(r => r.section === 'journals' && r.action === 'update' && String(r.targetId) === String(item.id) && (r.status === 'pending' || r.status === 'auto_approved')).pop();
      const mergedItem = latestUpdate ? { ...item, ...latestUpdate.after } : item;
      return { ...mergedItem, isPendingDelete: pendingDelete };
    }).filter(Boolean) as any[];
  }, [journals, changeRequests]);

  const titleError = !form.title.trim() ? "Vui lòng nhập tiêu đề." : "";
  const contentError = !form.content.trim() ? "Vui lòng nhập nội dung bài viết." : "";
  const hasError = !!titleError || !!contentError;

  async function handleCreate() {
    setSubmitAttempted(true);
    if (hasError) return;
    try {
      const identity = getIdentity('any');
      const now = new Date().toISOString();
      const payload = {
        date: form.date,
        title: form.title.trim(),
        content: form.content.trim(),
        mood: form.mood,
        imageUrl: form.imageUrl || undefined,
        locationName: form.locationName || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
        authorId: identity?.id || "guest",
        authorName: guestName || identity?.name || "Khách",
        postedAt: now,
      };
      await submitChangeRequest(token, { section: 'journals', action: 'create', after: payload, status: 'auto_approved', requesterName: guestName });
      setForm({ date: new Date().toISOString().split('T')[0], title: "", content: "", mood: "good", imageUrl: "", locationName: "", latitude: undefined, longitude: undefined });
      setSubmitAttempted(false);
      setDirty(false);
      setIsFormOpen(false);
    } catch (e: any) { showToast('Lỗi: ' + e.message, 'error'); }
  }

  function handlePromptClick(prompt: string) {
    setForm(prev => ({
      ...prev,
      content: prev.content + (prev.content.trim() ? "\n\n" : "") + `- ${prompt}: `
    }));
    setDirty(true);
  }

  async function handleDelete(j: JournalEntry) {
    setDeleteTargetId(j);
  }

  async function executeDelete(j: JournalEntry) {
    try {
      const autoApprove = isDirectEdit || j.authorName === resolvedGuestName;
      await submitChangeRequest(token, { 
        section: 'journals', 
        action: 'delete', 
        targetId: String(j.id), 
        before: j as any, 
        requesterName: guestName,
        status: autoApprove ? 'auto_approved' : undefined
      });
      showToast(autoApprove ? 'Đã xóa bài viết.' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
    } catch (e: any) { showToast('Lỗi: ' + e.message, 'error'); }
  }

  return (
    <>
      <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={GlobeIcon} className="h-5 w-5 text-sky-500" />
          <h3 className="text-[16px] font-black text-[#030D2E]">Bản tin chuyến đi</h3>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        {renderChatBox ? (
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:max-w-[320px] shadow-inner">
            <button
              onClick={() => setJournalMode("posts")}
              className={`flex-1 py-2.5 text-[14px] font-bold rounded-[12px] transition-all duration-200 flex items-center justify-center gap-2 ${
                journalMode === "posts" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <HugeiconsIcon icon={GlobeIcon} className="w-4 h-4" /> Bản tin
            </button>
            <button
              onClick={() => setJournalMode("chat")}
              className={`flex-1 py-2.5 text-[14px] font-bold rounded-[12px] transition-all duration-200 flex items-center justify-center gap-2 ${
                journalMode === "chat" ? "bg-white text-[#00BFB7] shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <HugeiconsIcon icon={BubbleChatIcon} className="w-4 h-4" /> Trò chuyện
            </button>
          </div>
        ) : (
          <div />
        )}

        {isRequestEdit && journalMode === "posts" && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className={classNames(
              "items-center justify-center gap-1.5 px-4 py-2 bg-[#030D2E] text-white font-bold rounded-[14px] text-[13px] hover:bg-[#030D2E]/90 transition-all shadow-sm shrink-0 motion-press",
              mergedJournals.length > 0 ? "hidden lg:flex" : "flex"
            )}
          >
            <HugeiconsIcon icon={PenTool01Icon} className="h-4 w-4" /> Đăng bài viết
          </button>
        )}
      </div>

      {journalMode === "posts" ? (
        mergedJournals.length > 0 ? (
          <div className="space-y-6 md:space-y-8">
            {Object.entries(
              mergedJournals.reduce<Record<string, any[]>>((result, entry) => {
                result[entry.date] = [...(result[entry.date] ?? []), entry];
                return result;
              }, {})
            )
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, entries]) => (
              <section key={date} className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <HugeiconsIcon icon={Calendar01Icon} className="h-4.5 w-4.5 text-slate-400" />
                  <h3 className="text-[15px] font-extrabold text-[#030D2E]">{formatDate(date)}</h3>
                </div>
                
                <div className="columns-1 md:columns-2 gap-4">
                  {entries.map((j: any, idx) => {
                    const moodBadge = moodBadgeClasses[j.mood] || "bg-slate-50 text-slate-700 border-slate-200";
                    return (
                      <article 
                        key={j.id} 
                        className={classNames(
                          "break-inside-avoid mb-4 group rounded-[24px] border border-slate-200 bg-white shadow-soft hover:shadow-md transition-all flex flex-col overflow-hidden",
                          j.isPendingDelete ? "border-rose-100 bg-slate-50/50 opacity-70" : ""
                        )}
                      >
                        <div className="flex items-center justify-between gap-4 p-4 pb-3">
                          <div className="flex items-center gap-2.5">
                            {(() => {
                              let authorMember = members.find(m => 
                                (j.authorName || "").trim().toLowerCase() === m.name.trim().toLowerCase()
                              );
                              if (!authorMember && (
                                (j.authorName || "").trim().toLowerCase() === "trưởng nhóm" ||
                                (j.authorName || "").trim().toLowerCase() === "trường nhóm"
                              )) {
                                authorMember = members.find(m => {
                                  const r = (m.role || "").toLowerCase();
                                  return r.includes("trưởng nhóm") || r.includes("trưởng đoàn") || r.includes("người đại diện");
                                });
                              }
                              let avatar = authorMember?.avatar;
                              if (!avatar) {
                                const authorName = j.authorName || "Trường nhóm";
                                let hash = 0;
                                for (let i = 0; i < authorName.length; i++) {
                                  hash = authorName.charCodeAt(i) + ((hash << 5) - hash);
                                }
                                const genderChar = (authorName.toLowerCase().includes("nữ") || 
                                                    authorName.toLowerCase().includes("chị") || 
                                                    authorName.toLowerCase().includes("mẹ") || 
                                                    authorName.toLowerCase().includes("cô") || 
                                                    authorName.toLowerCase().includes("bà")) ? "f" : "m";
                                const num = (Math.abs(hash) % 10) + 1;
                                avatar = `${genderChar}${num}`;
                              }
                              return (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden bg-slate-200 text-slate-700 font-black text-[15px]">
                                  {getAvatarSvg(avatar, "w-full h-full")}
                                </div>
                              );
                            })()}
                            <div className="flex flex-col">
                              <span className="text-[14px] font-extrabold text-slate-800">{j.authorName || "Trưởng nhóm"}</span>
                              {j.isPendingDelete ? (
                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Đề xuất xóa</span>
                              ) : (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider border ${moodBadge}`}>
                                    {moodLabels[j.mood as keyof typeof moodLabels] || "Đáng nhớ"}
                                  </span>
                                  {j.postedAt && (
                                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                                      <HugeiconsIcon icon={Clock01Icon} className="h-2.5 w-2.5" />
                                      {new Date(j.postedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isRequestEdit && !j.isPendingDelete && (isDirectEdit || j.authorName === resolvedGuestName) && (
                            <button 
                              onClick={() => handleDelete(j as JournalEntry)} 
                              className="flex h-8 w-8 items-center justify-center rounded-full text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all motion-press"
                              title={isDirectEdit || j.authorName === resolvedGuestName ? "Xóa bài viết" : "Đề xuất xóa bài viết"}
                            >
                              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {j.imageUrl && (
                          <div className="w-full bg-[#F3F4F6] border-y border-slate-100/50 flex justify-center">
                            <img src={j.imageUrl} alt="Journal" className="w-full h-auto max-h-[500px] object-contain" />
                          </div>
                        )}

                        <div className="p-4 pt-3">
                          <h4 className="text-[17px] font-black text-[#030D2E] leading-snug break-words">
                            {j.title || "Bản tin chuyến đi"}
                          </h4>
                          {j.locationName && (
                            <div className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-slate-500">
                              <HugeiconsIcon icon={Location01Icon} className="h-3.5 w-3.5 text-kat-primary" />
                              <span>{j.locationName}</span>
                            </div>
                          )}
                          <p className={classNames(
                            "mt-1.5 whitespace-pre-wrap text-[14.5px] leading-relaxed text-slate-600",
                            j.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
                          )}>
                            {j.content}
                          </p>
                        </div>

                        {/* Reactions bar */}
                        <div className="px-4 pb-3.5 pt-2.5 border-t border-slate-100/60 flex flex-wrap items-center justify-between gap-2 bg-slate-50/20">
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(j.reactions || {}).map(([emoji, usersVal]) => {
                              const users = usersVal as string[];
                              if (!users || users.length === 0) return null;
                              const hasReacted = users.includes(resolvedGuestName);
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => handleToggleReaction(j, emoji)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12.5px] border transition-all active:scale-95 ${
                                    hasReacted
                                      ? "bg-indigo-50/70 border-indigo-200 text-indigo-700 font-bold"
                                      : "bg-slate-50/80 border-slate-205 text-slate-500 hover:bg-slate-100"
                                  }`}
                                  title={users.join(", ")}
                                >
                                  <span className="text-[14px]">{emoji}</span>
                                  <span className="text-[11.5px] font-black">{users.length}</span>
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Reaction Selector Trigger */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveReactionPopover(activeReactionPopover === j.id ? null : (j.id || null))}
                              className="flex h-7 px-2.5 items-center justify-center gap-1 rounded-full border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-650 transition-colors text-[11.5px] font-bold"
                            >
                              <span>+ Thả cảm xúc</span>
                            </button>
                            
                            {activeReactionPopover === j.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveReactionPopover(null)} />
                                <div className="absolute right-0 bottom-full mb-2 z-50 flex gap-1 bg-white border border-slate-200/80 p-1 rounded-full shadow-floating animate-scaleIn">
                                  {["❤️", "👍", "😂", "😮", "😢"].map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => {
                                        handleToggleReaction(j, emoji);
                                        setActiveReactionPopover(null);
                                      }}
                                      className="w-8 h-8 flex items-center justify-center text-[18px] hover:bg-slate-50 active:scale-125 transition-transform rounded-full"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
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
        )
      ) : (
        <div className="mt-4">
          {renderChatBox?.()}
        </div>
      )}

      <BottomSheet 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
        }} 
        title="Đăng bài viết bản tin"
        footer={
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
              }}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={hasError}
              onClick={handleCreate}
              className="flex-[2] inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-[#030D2E] text-white px-6 font-black hover:bg-[#030D2E]/90 active:scale-[0.98] transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-100 shadow-sm"
            >
              <HugeiconsIcon icon={SaveIcon} className="h-4.5 w-4.5" strokeWidth={2.5} />
              Đăng bài viết
            </button>
          </div>
        }
      >
        <div className="space-y-4 md:space-y-5">
          {/* Date Field */}
          <div>
            <DatePicker 
              label={
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-500" />
                  Ngày ghi lại
                </span>
              } 
              value={form.date} 
              onChange={(date) => { setForm({ ...form, date }); setDirty(true); }} 
            />
          </div>
  
          {/* Title Field */}
          <div>
            <Input 
              label={
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={TextFontIcon} className="h-4 w-4 text-slate-500" />
                  Tiêu đề bài viết *
                </span>
              } 
              value={form.title} 
              onChange={(title) => { setForm({ ...form, title }); setDirty(true); }} 
              placeholder="VD: Một ngày đáng nhớ ở Vũng Tàu" 
            />
            {(dirty || submitAttempted) && titleError && (
              <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{titleError}</p>
            )}

            {isLocating ? (
              <div className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 px-1 animate-fadeIn">
                <HugeiconsIcon icon={Location01Icon} className="h-3.5 w-3.5" />
                <span className="flex items-center gap-1.5 text-slate-400"><HugeiconsIcon icon={Loading01Icon} className="h-3.5 w-3.5 animate-spin" /> Đang lấy vị trí...</span>
              </div>
            ) : form.locationName ? (
              <div className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 px-1 animate-fadeIn">
                <HugeiconsIcon icon={Location01Icon} className="h-3.5 w-3.5 text-kat-primary" />
                <span>Đang ở <span className="font-bold text-kat-primary">{form.locationName}</span></span>
                <button type="button" onClick={() => setForm({...form, locationName: "", latitude: undefined, longitude: undefined})} className="ml-1 px-1 text-slate-300 hover:text-rose-500 transition-colors font-bold text-[14px] leading-none" title="Xóa vị trí">×</button>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-1.5 px-1 animate-fadeIn">
                <button type="button" onClick={fetchLocation} className="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-400 hover:text-kat-primary transition-colors focus:outline-none">
                  <HugeiconsIcon icon={LocationOfflineIcon} className="h-3.5 w-3.5" />
                  <span>Nhấn để đính kèm vị trí</span>
                </button>
              </div>
            )}
          </div>
  
          {/* Mood Chips */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-600 flex items-center gap-1.5">
              <HugeiconsIcon icon={SmileIcon} className="h-4 w-4 text-slate-500" />
              Cảm xúc hôm nay
            </span>
            <div className="flex flex-wrap gap-2">
              {moodOptionList.map((opt) => {
                const isActive = form.mood === opt.value;
                const colorDot = moodColorClasses[opt.value];
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setForm({ ...form, mood: opt.value as any }); setDirty(true); }}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-bold border transition-all duration-200 active:scale-95 ${
                      isActive
                        ? "bg-[#00BFB7]/10 border-[#00BFB7] text-[#030D2E]"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${colorDot}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
  
          {/* Content Field */}
          <div>
            <Textarea 
              label={
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={NotebookIcon} className="h-4 w-4 text-slate-500" />
                  Câu chuyện của bạn *
                </span>
              } 
              value={form.content} 
              onChange={(content) => { setForm({ ...form, content }); setDirty(true); }} 
              placeholder="Ghi lại cảm xúc, câu chuyện, món ăn ngon hoặc khoảnh khắc đáng nhớ..." 
            />
            {(dirty || submitAttempted) && contentError && (
              <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{contentError}</p>
            )}
          </div>
  
          {/* Image Field */}
          <div>
            {form.imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <img src={form.imageUrl} alt="Uploaded" className="w-full aspect-[4/3] object-contain" />
                <button
                  onClick={() => { setForm({ ...form, imageUrl: "" }); setDirty(true); }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
                >
                  <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-12 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 font-bold text-[14px] hover:bg-slate-100 hover:text-[#00BFB7] transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <><HugeiconsIcon icon={Loading01Icon} className="h-5 w-5 animate-spin" /> Đang tải ảnh...</>
                  ) : (
                    <><HugeiconsIcon icon={Image01Icon} className="h-5 w-5" /> Đính kèm hình ảnh</>
                  )}
                </button>
              </div>
            )}
          </div>
  
          {/* Quick Prompts Section inside Modal */}
          <div className="pt-1">
            <span className="mb-2 block text-[12.5px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HugeiconsIcon icon={SparklesIcon} className="h-4 w-4 text-slate-500" />
              Gợi ý viết nhanh
            </span>
            <div className="flex flex-wrap gap-1.5">
              {promptSuggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-[12.5px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  + {prompt}
                </button>
              ))}
            </div>
          </div>
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
        title={
          deleteTargetId && (isDirectEdit || deleteTargetId.authorName === resolvedGuestName)
            ? "Xóa bài viết?"
            : "Đề xuất xóa bài viết?"
        }
        description={
          deleteTargetId && (isDirectEdit || deleteTargetId.authorName === resolvedGuestName)
            ? "Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác."
            : "Bạn đang gửi đề xuất xóa bài viết này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."
        }
        confirmLabel={
          deleteTargetId && (isDirectEdit || deleteTargetId.authorName === resolvedGuestName)
            ? "Xóa"
            : "Đề xuất xóa"
        }
        itemName={deleteTargetId?.title}
      />
      </section>

      {/* Mobile Floating Action Button (FAB) when posts exist */}
      {isRequestEdit && journalMode === "posts" && mergedJournals.length > 0 && (
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="lg:hidden fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-2xl border border-white/40 text-[#030D2E] shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] motion-press hover:scale-105 hover:bg-white/25 duration-200 cursor-pointer"
          style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
          aria-label="Đăng bài viết"
          title="Đăng bài viết"
        >
          <HugeiconsIcon icon={PenTool01Icon} className="h-6 w-6" />
        </button>
      )}
    </>
  );
}


