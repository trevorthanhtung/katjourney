import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Route01Icon,
  Clock01Icon,
  Location01Icon,
  MapsIcon,
  Add01Icon,
  MoreVerticalIcon,
  TextIcon,
  Calendar01Icon,
  StickyNoteIcon,
  Dish01Icon,
  Camera01Icon,
  HotelIcon,
  Coffee01Icon,
  ShoppingBag01Icon,
  MoreHorizontalCircle01Icon,
  GitBranchIcon,
  Wallet01Icon,
  UserIcon,
  UserCheck01Icon,
  Delete01Icon,
  CheckIcon
} from "@hugeicons/core-free-icons";
import { createPortal } from 'react-dom';

import { EventItem, Member, Expense, BackupPlan, Trip } from '../../../db';
import { classNames, formatDate, daysBetween } from '../../../utils/helpers';
import { getEmbedMapUrl, ensureAbsoluteUrl, getMapFilterClass } from '../../../utils/mapUtils';
import { submitChangeRequest } from '../../../services/sharedTripRequestService';
import { showToast } from '../../../components/ui/ToastManager';
import { BottomSheet, Input, Textarea, Select, DatePicker, TimePicker, DeleteConfirmModal } from '../../../components/ui';

import { SharedBackupPlansSheet } from './SharedBackupPlansSheet';
import { TimelineCalendarView } from '../../timeline/TimelineCalendarView';

const ACTIVITY_CATEGORIES = [
  { id: "transport", label: "Di chuyển", icon: Route01Icon, bgColor: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30", activeBg: "bg-blue-100 dark:bg-blue-950/40 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300" },
  { id: "dining", label: "Ăn uống", icon: Dish01Icon, bgColor: "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30", activeBg: "bg-rose-100 dark:bg-rose-950/40 border-rose-400 dark:border-rose-500 text-rose-700 dark:text-rose-300" },
  { id: "sightseeing", label: "Tham quan", icon: Camera01Icon, bgColor: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30", activeBg: "bg-amber-100 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500 text-amber-700 dark:text-amber-300" },
  { id: "accommodation", label: "Lưu trú", icon: HotelIcon, bgColor: "bg-slate-100 dark:bg-slate-800 text-kat-dark dark:text-slate-200 border-slate-200 dark:border-slate-700/50", activeBg: "bg-kat-dark/10 dark:bg-slate-800 border-kat-dark dark:border-slate-650 text-kat-dark dark:text-slate-200" },
  { id: "relaxation", label: "Nghỉ ngơi", icon: Coffee01Icon, bgColor: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30", activeBg: "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300" },
  { id: "shopping", label: "Mua sắm", icon: ShoppingBag01Icon, bgColor: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30", activeBg: "bg-purple-100 dark:bg-purple-950/40 border-purple-400 dark:border-purple-500 text-purple-700 dark:text-purple-300" },
  { id: "other", label: "Khác", icon: MoreHorizontalCircle01Icon, bgColor: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700/40", activeBg: "bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-350" }
];

function getCategory(id?: string) {
  return ACTIVITY_CATEGORIES.find(c => c.id === id) || ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1];
}

export function SharedActivitiesSection({ 
  token, 
  mode, 
  backupPlansMode,
  activities, 
  changeRequests = [],
  members = [],
  guestName,
  expenses = [],
  backupPlans = [],
  trip
}: { 
  token: string; 
  mode: string; 
  backupPlansMode?: string;
  activities: EventItem[];
  changeRequests?: any[];
  members?: Member[];
  guestName?: string;
  expenses?: Expense[];
  backupPlans?: BackupPlan[];
  trip?: Trip;
}) {
  const { t } = useTranslation();

  const tripDays = React.useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return [];
    return daysBetween(trip.startDate, trip.endDate);
  }, [trip]);

  const dateLabels = React.useMemo(() => {
    return tripDays.reduce((acc, date, idx) => {
      acc[date] = `${t("timeline.dayN", { n: idx + 1 })} (${formatDate(date)})`;
      return acc;
    }, {} as Record<string, string>);
  }, [tripDays]);

  const mergedBackupPlans = React.useMemo(() => {
    const list = backupPlans.filter((p: any) => !p.isDeleted).map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'backupPlans' && r.action === 'delete' && String(r.targetId) === String(item.id));
      const updateReq = changeRequests.find(r => r.section === 'backupPlans' && r.action === 'update' && String(r.targetId) === String(item.id));

      if (updateReq) {
        return {
          ...item,
          ...updateReq.after,
          isPendingUpdate: true,
          changeRequestId: updateReq.id
        };
      }

      return {
        ...item,
        isPendingDelete: pendingDelete
      };
    });

    const pendingCreates = changeRequests.filter(r => r.section === 'backupPlans' && r.action === 'create' && r.status === 'pending');
    pendingCreates.forEach(r => {
      list.push({
        id: "pending-create-" + r.id,
        ...r.after,
        isPendingCreate: true,
        changeRequestId: r.id
      } as any);
    });

    return list;
  }, [backupPlans, changeRequests]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [selectedBackupActivity, setSelectedBackupActivity] = useState<EventItem | null>(null);
  const [isBackupPlansSheetOpen, setIsBackupPlansSheetOpen] = useState(false);

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
    title: '', 
    date: '', 
    time: '', 
    location: '', 
    notes: '', 
    mapLink: '', 
    type: 'other'
  });

  const isRequestEdit = mode === 'request_edit' || mode === 'edit';
  const isDirectEdit = mode === 'edit';
  
  const isBackupPlansRequestEdit = (backupPlansMode || mode) === 'request_edit' || (backupPlansMode || mode) === 'edit';
  const isBackupPlansDirectEdit = (backupPlansMode || mode) === 'edit';

  const mergedActivities = React.useMemo(() => {
    const list = activities.filter((a: any) => !a.isDeleted).map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'activities' && r.action === 'delete' && String(r.targetId) === String(item.id));
      const updateReq = changeRequests.find(r => r.section === 'activities' && r.action === 'update' && String(r.targetId) === String(item.id));
      
      if (updateReq) {
        return {
          ...item,
          ...updateReq.after,
          isPendingUpdate: true,
          changeRequestId: updateReq.id
        };
      }
      if (pendingDelete) {
        return {
          ...item,
          isPendingDelete: true,
          changeRequestId: changeRequests.find(r => r.section === 'activities' && r.action === 'delete' && String(r.targetId) === String(item.id))?.id
        };
      }
      return item;
    });

    const pendingCreates = changeRequests.filter(r => r.section === 'activities' && r.action === 'create' && r.status === 'pending');
    pendingCreates.forEach(r => {
      list.push({
        id: `pending-create-${r.id}`,
        ...r.after,
        isPendingCreate: true,
        changeRequestId: r.id
      } as any);
    });

    list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || "").localeCompare(b.time || "");
    });

    return list;
  }, [activities, changeRequests]);

  const [filterDay, setFilterDay] = React.useState<string>("all");
  const [isDayPickerOpen, setIsDayPickerOpen] = React.useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const days = React.useMemo(() => {
    const dates = mergedActivities.map(e => e.date).filter(Boolean);
    return Array.from(new Set([...tripDays, ...dates])).filter(Boolean).sort();
  }, [mergedActivities, tripDays]);

  const displayedActivities = React.useMemo(() => {
    if (filterDay === "all") return mergedActivities;
    return mergedActivities.filter(a => a.date === filterDay);
  }, [mergedActivities, filterDay]);

  const hasMoreDays = days.length > 3;
  const visibleDays = days.slice(0, 3);
  const selectedIdx = days.indexOf(filterDay);
  if (filterDay !== "all" && selectedIdx >= 3) {
    if (!visibleDays.includes(filterDay)) {
      visibleDays.push(filterDay);
    }
  }

  function formatDateShort(dateStr: string) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  }

  function startAdd() {
    setForm({ 
      title: '', 
      date: tripDays[0] || '', 
      time: '', 
      location: '', 
      notes: '', 
      mapLink: '', 
      type: 'other'
    });
    setIsFormOpen(true);
    setEditingId(null);
  }

  const activeDays = React.useMemo(() => {
    // Collect all unique dates from activities
    const dates = Array.from(new Set(activities.map(a => a.date))).filter(Boolean).sort();
    return dates;
  }, [activities]);

  function startEdit(item: EventItem) {
    setForm({
      title: item.title,
      date: item.date,
      time: item.time || '',
      location: item.location || '',
      notes: item.notes || '',
      mapLink: item.mapLink || '',
      type: item.type || 'other'
    });
    setEditingId(String(item.id));
    setIsFormOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.date) {
      showToast(t("toast.activityRequireName"), 'error');
      return;
    }
    
    try {
      const status = isDirectEdit ? 'auto_approved' : undefined;
      const successMessage = isDirectEdit ? 'Đã cập nhật trực tiếp!' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.';
      const cleanForm = {
        ...form,
        mapLink: form.mapLink ? ensureAbsoluteUrl(form.mapLink) : ""
      };
      if (!editingId) {
        await submitChangeRequest(token, {
          section: 'activities',
          action: 'create',
          after: cleanForm,
          note: '',
          status,
          requesterName: guestName
        });
        setIsFormOpen(false);
        showToast(successMessage);
      } else {
        const currentItem = activities.find(a => String(a.id) === editingId);
        await submitChangeRequest(token, {
          section: 'activities',
          action: 'update',
          targetId: editingId,
          before: currentItem as any,
          after: cleanForm,
          status,
          requesterName: guestName
        });
        setEditingId(null);
        setIsFormOpen(false);
        showToast(successMessage);
      }
    } catch (e: any) {
      console.error(e);
      showToast(isDirectEdit ? t("toast.updateError", { message: e.message }) : t("toast.submitRequestError", { message: e.message }), 'error');
    }
  }

  async function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  async function executeDelete(id: string) {
    try {
      const currentItem = activities.find(a => String(a.id) === id);
      await submitChangeRequest(token, {
        section: 'activities',
        action: 'delete',
        targetId: id,
        before: currentItem as any,
        status: isDirectEdit ? 'auto_approved' : undefined,
        requesterName: guestName
      });
      showToast(isDirectEdit ? t("toast.directDelete") : t("toast.requestSent"));
    } catch (e: any) {
      showToast(isDirectEdit ? t("toast.deleteError", { message: e.message }) : t("toast.submitRequestError", { message: e.message }), 'error');
    }
  }

  const renderActivityCard = (item: any, idx: number) => {
    const isPending = item.isPendingCreate || item.isPendingUpdate || item.isPendingDelete;
    const category = getCategory(item.type);
    const CatIcon = category.icon;
    return (
      <div key={item.id} className="relative flex gap-4 pl-1 group">
        <div className="absolute bottom-0 left-[19px] top-8 w-0.5 bg-slate-100 dark:bg-slate-800 group-last:bg-transparent" />
        <div className="relative z-10 flex shrink-0 mt-1">
          <div className={classNames(
            "flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#0A1124] shadow-[0_2px_8px_rgba(3,13,46,0.06)] border border-slate-100 dark:border-kat-border/40",
            category.bgColor
          )}>
            <HugeiconsIcon icon={CatIcon} className="h-4.5 w-4.5" />
          </div>
        </div>
        
        <div 
          className={classNames(
            "flex flex-col w-full min-w-0 pt-0.5 pb-4 border-b border-slate-100/60 dark:border-slate-800/40 group-last:border-transparent transition-all rounded-2xl px-3",
            item.isPendingCreate || item.isPendingUpdate ? "bg-sky-50/40 dark:bg-sky-950/10 border border-sky-100/50 dark:border-sky-900/30 my-1 py-3" : "",
            item.isPendingDelete ? "bg-slate-50/30 dark:bg-slate-900/30 opacity-70" : ""
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <h4 className={classNames(
                "text-[15.5px] font-black text-kat-dark break-words tracking-tight",
                item.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
              )}>
                {item.title}
              </h4>
              
              {item.isPendingDelete && (
                <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 shrink-0 select-none animate-fadeIn">
                  {changeRequests.find(r => String(r.id) === String(item.changeRequestId))?.status === 'auto_approved' ? t('share.deleting') : t('share.suggestDelete')}
                </span>
              )}
              {item.isPendingCreate && (
                <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400 shrink-0 select-none animate-fadeIn">
                  {changeRequests.find(r => String(r.id) === String(item.changeRequestId))?.status === 'auto_approved' ? 'Đang lưu...' : 'Đề xuất mới'}
                </span>
              )}
              {item.isPendingUpdate && (
                <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0 select-none animate-fadeIn">
                  {changeRequests.find(r => String(r.id) === String(item.changeRequestId))?.status === 'auto_approved' ? t('share.saving') : t('share.suggestEdit')}
                </span>
              )}
            </div>

            {isRequestEdit && !isPending && (
              <div className="shrink-0">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    if (activeMenuId === String(item.id)) {
                      setActiveMenuId(null);
                      setMenuPos(null);
                    } else {
                      setActiveMenuId(String(item.id));
                      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                    }
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 transition-all focus:outline-none"
                  title="Tùy chọn đề xuất"
                >
                  <HugeiconsIcon icon={MoreVerticalIcon} className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>

          <div className={classNames(
            "mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] font-medium text-slate-500",
            item.isPendingDelete ? "opacity-60" : ""
          )}>
            {item.time && (
              <span className={classNames(
                "flex items-center gap-1 font-bold text-[#00AFA8] dark:text-teal-400 bg-indigo-50/50 dark:bg-teal-950/20 px-2 py-0.5 rounded-lg border border-indigo-100/40 dark:border-teal-900/30",
                item.isPendingDelete ? "line-through text-slate-400" : ""
              )}>
                <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5" />
                {item.time}
              </span>
            )}
            <span className={classNames("bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded-lg border border-slate-100/60 dark:border-slate-700/40 dark:text-slate-400", item.isPendingDelete ? "line-through" : "")}>{formatDate(item.date)}</span>
            
            <span className={classNames("text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-100", category.bgColor)}>
              {t(`timeline.cat${category.id.charAt(0).toUpperCase() + category.id.slice(1)}`)}
            </span>

            {item.assignee && (
              <span className={classNames(
                "flex items-center gap-1 font-bold text-slate-500",
                item.isPendingDelete ? "line-through" : ""
              )}>
                <span className="h-1 w-1 rounded-full bg-slate-300 mx-1"></span>
                <HugeiconsIcon icon={UserCheck01Icon} className="h-3.5 w-3.5" />
                {item.assignee}
              </span>
            )}
          </div>

          {item.location && (
            <p className={classNames(
              "mt-2 text-[13.5px] text-slate-600 dark:text-slate-350 flex items-start gap-1.5",
              item.isPendingDelete ? "line-through opacity-60" : ""
            )}>
              <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
              <span className="break-words font-medium">{item.location}</span>
            </p>
          )}

          {item.notes && (
            <div className={classNames(
              "mt-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 p-3 border border-slate-100 dark:border-kat-border/40",
              item.isPendingDelete ? "opacity-60" : ""
            )}>
              <p className={classNames("text-[13px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed", item.isPendingDelete ? "line-through" : "")}>{item.notes}</p>
            </div>
          )}

          {/* Google Maps Embed */}
          {(item.mapLink || item.location) && (
            <div className={classNames(
              "mt-3 space-y-2",
              item.isPendingDelete ? "opacity-60 grayscale" : ""
            )} onClick={(e) => e.stopPropagation()}>
              {getEmbedMapUrl(item.mapLink || item.location || "", item.location) && (
                <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-100 relative min-h-[160px]">
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    <span className="text-[12px] font-medium animate-pulse">Đang tải bản đồ...</span>
                  </div>
                  <iframe
                    title="Google Maps Embed"
                    width="100%"
                    height="160"
                    className={`border-0 relative z-10 ${getMapFilterClass(item.time)}`}
                    loading="lazy"
                    allowFullScreen
                    src={getEmbedMapUrl(item.mapLink || item.location || "", item.location)}
                  ></iframe>
                </div>
              )}
              {(() => {
                const isRoute = item.mapLink && (item.mapLink.includes("/maps/dir/") || item.mapLink.includes("maps/dir"));
                return (
                  <a 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-[13px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors" 
                    href={ensureAbsoluteUrl(item.mapLink) || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location || "")}`} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    {isRoute ? <HugeiconsIcon icon={Route01Icon} className="w-3.5 h-3.5" /> : <HugeiconsIcon icon={MapsIcon} className="w-3.5 h-3.5" />}
                    {isRoute ? t("timeline.viewRoute") + " " : t("share.openGoogleMaps") + " "}
                    &rarr;
                  </a>
                );
              })()}
            </div>
          )}

          {/* Expenses & Backup plans linked */}
          {(() => {
            const rawLinkedExpenses = expenses.filter(exp => String(exp.eventId) === String(item.id));
            const linkedExpenses = rawLinkedExpenses.filter((exp, index, self) => index === self.findIndex((t) => t.amount === exp.amount && t.description === exp.description));
            const backupCount = mergedBackupPlans.filter(p => p.activityId !== undefined && String(p.activityId) === String(item.id) && !p.isDeleted).length;
            return (
              <>
                {linkedExpenses.length > 0 && (
                  <div className="mt-3 border-t border-slate-100/40 dark:border-slate-800/40 pt-2 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {linkedExpenses.map(exp => (
                      <div key={exp.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-[11px] rounded-xl border border-rose-100 dark:border-rose-900/30 shadow-[0_1px_4px_rgba(229,10,98,0.03)] font-bold">
                        <HugeiconsIcon icon={Wallet01Icon} className="w-3 h-3 text-rose-500" />
                        <span>{new Intl.NumberFormat('vi-VN').format(exp.amount)}đ</span>
                        <span className="text-rose-500/80 dark:text-slate-400 font-medium truncate max-w-[110px]">&middot; {exp.description || exp.category}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(backupCount > 0 || isBackupPlansRequestEdit) && (
                  <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => { 
                        setSelectedBackupActivity(item);
                        setIsBackupPlansSheetOpen(true);
                      }}
                      className={classNames(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-bold border transition-colors motion-press cursor-pointer focus:outline-none",
                        backupCount > 0 
                          ? "bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/30 shadow-[0_1px_4px_rgba(79,70,229,0.03)]"
                          : "bg-slate-50/40 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/85 hover:text-slate-700 dark:hover:text-slate-200"
                      )}
                    >
                      <HugeiconsIcon icon={GitBranchIcon} className="w-3.5 h-3.5" />
                      <span>{backupCount > 0 ? t("timeline.backupPlansCount", { count: backupCount }) : (isBackupPlansDirectEdit ? t("timeline.addBackupPlan") : t("share.suggestAddBackupPlan"))}</span>
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="bg-white dark:bg-kat-surface rounded-3xl border border-slate-200/50 dark:border-kat-border/40 p-5 md:p-6 shadow-[0_2px_12px_rgba(3,13,46,0.02)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Route01Icon} className="w-5 h-5 text-[#00A19D]" />
          <h3 className="text-[18px] font-black text-kat-dark tracking-tight">{t("share.detailedSchedule")}</h3>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-2.5 shrink-0 select-none w-full sm:w-auto">
          <div className="flex bg-[#E2E8F0]/40 dark:bg-slate-900/60 border border-transparent dark:border-slate-800/40 p-1 rounded-xl">
            <button 
              type="button"
              onClick={() => setViewMode("list")}
              className={classNames(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all motion-press cursor-pointer",
                viewMode === "list" 
                  ? "bg-white dark:bg-slate-800 text-kat-dark dark:text-slate-200 shadow-sm animate-scaleIn" 
                  : "text-slate-500 hover:text-kat-dark dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              {t("timeline.listView")}
            </button>
            <button 
              type="button"
              onClick={() => setViewMode("calendar")}
              className={classNames(
                "flex items-center justify-center w-9 h-8 rounded-lg transition-all motion-press cursor-pointer",
                viewMode === "calendar" 
                  ? "bg-white dark:bg-slate-800 text-kat-dark dark:text-slate-200 shadow-sm animate-scaleIn" 
                  : "text-slate-500 hover:text-kat-dark dark:text-slate-400 dark:hover:text-slate-200"
              )}
              aria-label={t("share.viewCalendar")}
            >
              <HugeiconsIcon icon={Calendar01Icon} className="h-4.5 w-4.5" />
            </button>
          </div>

          {isRequestEdit && (
            <button 
              type="button"
              onClick={startAdd} 
              className="hidden lg:flex items-center justify-center gap-1.5 rounded-xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 px-3.5 py-2 text-[12.5px] font-extrabold shadow-sm hover:bg-kat-dark dark:hover:bg-kat-primary-light bg-opacity-90 active:scale-95 transition-all h-9 motion-press cursor-pointer border-transparent"
              title={isDirectEdit ? t("timeline.addActivity") : t("share.suggestAdd")}
            >
              <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
              <span className="hidden min-[380px]:inline">{isDirectEdit ? t("timeline.addBtn") : "Đề xuất"}</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-6">
          {(() => {
            const groups = days.map(day => ({
               id: day,
               index: days.indexOf(day),
               title: t("timeline.dayN", { n: days.indexOf(day) + 1 }),
               subtitle: formatDate(day),
               icon: days.indexOf(day) + 1 as string | number,
               activities: mergedActivities.filter(a => a.date === day)
            }));

            const undated = mergedActivities.filter(a => !a.date);
            if (undated.length > 0) {
              groups.push({
                id: "undated",
                index: -1,
                title: t("timeline.unscheduled"),
                subtitle: t("timeline.unscheduledDesc"),
                icon: "?",
                activities: undated
              });
            }

            return groups.map(group => (
              <div key={group.id} className="space-y-6 mt-6 first:mt-0 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className={classNames(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl font-black text-[13.5px] border shadow-sm",
                    group.id === "undated" 
                      ? "bg-slate-400 text-white border-transparent" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/50"
                  )}>
                    {group.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[15.5px] font-black text-kat-dark tracking-tight">{group.title}</h4>
                      {group.id !== "undated" && trip?.dayRoadmaps?.[group.id] && (
                        <a
                          href={ensureAbsoluteUrl(trip.dayRoadmaps[group.id])}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 text-[10px] font-extrabold tracking-wide transition-all active:scale-95 shadow-sm"
                          title="Mở bản đồ lộ trình"
                        >
                          <HugeiconsIcon icon={Location01Icon} className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Bản đồ</span>
                        </a>
                      )}
                    </div>
                    <p className="text-[11.5px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{group.subtitle}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {group.activities.length > 0 ? (
                    group.activities.map((item, idx) => renderActivityCard(item, idx))
                  ) : (
                    <div className="relative flex gap-4 pl-1 group">
                      <div className="absolute bottom-0 left-[19px] top-8 w-0.5 bg-slate-100 dark:bg-slate-800 group-last:bg-transparent" />
                      <div className="relative z-10 flex shrink-0 mt-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#0A1124] shadow-[0_2px_8px_rgba(3,13,46,0.06)] border border-dashed border-slate-200 dark:border-slate-800/40 text-slate-300 dark:text-slate-650 font-extrabold">
                          {group.icon}
                        </div>
                      </div>
                      <div className="flex-1 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 p-4 flex items-center justify-between">
                        <span className="text-[13px] font-bold text-slate-400 dark:text-slate-500">{t("share.noActivitiesThisDay")}</span>
                        {isRequestEdit && (
                          <button 
                            type="button"
                            onClick={() => {
                              setForm({ 
                                title: '', 
                                date: group.id, 
                                time: '', 
                                location: '', 
                                notes: '', 
                                mapLink: '', 
                                type: 'other'
                              });
                              setIsFormOpen(true);
                              setEditingId(null);
                            }}
                            className="text-[12.5px] font-extrabold text-[#00A19D] hover:underline cursor-pointer active:scale-95 transition-transform"
                          >
                            + Đề xuất thêm
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ));
          })()}
        </div>
      ) : (
        <TimelineCalendarView
          events={mergedActivities}
          trip={trip || {} as any}
          onOpenNewForm={(date) => {
            setForm({ 
              title: '', 
              date: date || tripDays[0] || '', 
              time: '', 
              location: '', 
              notes: '', 
              mapLink: '', 
              type: 'other'
            });
            setIsFormOpen(true);
            setEditingId(null);
          }}
          renderActivityCard={(item, idx) => renderActivityCard(item, idx)}
        />
      )}

      {/* Global Add FAB (Mobile only) */}
      {isRequestEdit && (
        <button
          type="button"
          onClick={startAdd}
          className="lg:hidden fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 text-kat-dark dark:text-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] motion-press hover:scale-105 hover:bg-white/25 dark:hover:bg-slate-800/60 duration-200 cursor-pointer"
          style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
          aria-label={isDirectEdit ? t("timeline.addActivity") : t("share.suggestAdd")}
          title={isDirectEdit ? t("timeline.addActivity") : t("share.suggestAdd")}
        >
          <HugeiconsIcon icon={Add01Icon} className="h-6 w-6" />
        </button>
      )}
    </section>

      {/* Fixed-position dropdown — renders above everything */}
      {activeMenuId && menuPos && createPortal(
        <>
          <div
            className="fixed inset-0 z-[998]"
            onClick={() => { setActiveMenuId(null); setMenuPos(null); }}
          />
          <div
            className="fixed z-[999] w-36 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1.5 animate-fadeIn"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              onClick={() => {
                const id = activeMenuId;
                setActiveMenuId(null);
                setMenuPos(null);
                startEdit(mergedActivities.find(a => String(a.id) === id)!);
              }}
              className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
            >
              {isDirectEdit ? t("timeline.editBtn") : t("share.suggestEdit")}
            </button>
            <button
              onClick={() => {
                const id = activeMenuId;
                setActiveMenuId(null);
                setMenuPos(null);
                handleDelete(id!);
              }}
              className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
            >
              {isDirectEdit ? t("share.delete") : t("share.suggestDelete")}
            </button>
          </div>
        </>,
        document.body
      )}

      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingId(null);
        }}
        title={isDirectEdit ? (editingId ? t("timeline.editActivity") : t("timeline.addActivity")) : (editingId ? t("share.suggestEditActivity") : t("share.suggestAddActivity"))}
        footer={
          <div className="flex items-center gap-2.5 w-full">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  const item = activities.find(a => String(a.id) === editingId);
                  if (item) handleDelete(editingId);
                }}
                title={t("timeline.deleteThisActivity")}
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 transition-all hover:bg-rose-100/50 dark:hover:bg-rose-900/30 active:scale-[0.96] motion-press"
              >
                <HugeiconsIcon icon={Delete01Icon} className="h-5 w-5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingId(null);
              }}
              className="flex h-[52px] shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 px-6 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.96] transition-all border border-transparent dark:border-slate-700 motion-press"
            >
              {t("timeline.cancel")}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!form.title.trim()}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 px-6 font-black shadow-sm hover:bg-kat-dark/95 dark:hover:bg-kat-primary-light active:scale-[0.98] transition-all border border-transparent disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/40 dark:disabled:text-slate-600 dark:disabled:border-transparent disabled:cursor-not-allowed motion-press"
            >
              <HugeiconsIcon icon={CheckIcon} className="h-5 w-5" />
              {isDirectEdit ? (editingId ? t("timeline.saveChanges") : t("timeline.addActivity")) : t("share.sendSuggestion")}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-5 py-2">
          {/* Item Name */}
          <Input
            label={
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={TextIcon} className="h-4 w-4 text-slate-500" />
                {t("timeline.titleLabel")}
              </span>
            }
            value={form.title}
            onChange={val => setForm({ ...form, title: val })}
            placeholder={t("timeline.titlePlaceholder")}
          />

          {/* Category Selector Grid */}
          <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t("timeline.activityType")}</span>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {ACTIVITY_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = form.type === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm({ ...form, type: cat.id })}
                    className={classNames(
                      "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all text-center h-[64px] cursor-pointer active:scale-95",
                      isSelected 
                        ? cat.activeBg 
                        : "border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/40"
                    )}
                  >
                    <HugeiconsIcon icon={Icon} className="h-5 w-5" />
                    <span className="text-[10px] font-bold leading-none">{t(`timeline.cat${cat.id.charAt(0).toUpperCase() + cat.id.slice(1)}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tripDays.length > 0 ? (
                <Select
                  label={
                    <span className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-500" />
                      {t("timeline.selectDate")} *
                    </span>
                  }
                  value={form.date}
                  onChange={val => setForm({ ...form, date: val })}
                  options={tripDays}
                  labels={dateLabels}
                />
              ) : (
                <DatePicker
                  label={
                    <span className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={Calendar01Icon} className="h-4 w-4 text-slate-500" />
                      {t("timeline.selectDate")} *
                    </span>
                  }
                  value={form.date}
                  onChange={val => setForm({ ...form, date: val })}
                />
              )}
            <TimePicker
              label={
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Clock01Icon} className="h-4 w-4 text-slate-500" />
                  {t("timeline.timeLabel")}
                </span>
              }
              value={form.time}
              onChange={val => setForm({ ...form, time: val })}
            />
          </div>

          {/* Location & Map Link */}
          <div className="flex flex-col gap-4">
            <Input
              label={
                <span className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 text-slate-500" />
                    {t("timeline.locationLabel")}
                  </span>
                  <span className="text-xs font-normal text-slate-400">
                    {t("timeline.locationHelper")}
                  </span>
                </span>
              }
              value={form.location}
              onChange={val => setForm({ ...form, location: val })}
              placeholder={t("timeline.locationPlaceholder")}
            />
            <Input
              label={
                <span className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={MapsIcon} className="h-4 w-4 text-slate-500" />
                    Google Maps
                  </span>
                  <span className="text-xs font-normal text-slate-400">
                    {t("share.pasteMapLink")}
                  </span>
                </span>
              }
              value={form.mapLink}
              onChange={val => setForm({ ...form, mapLink: val })}
              placeholder="https://maps.google.com/..."
            />
            {form.mapLink && (
              <div className="mt-1 flex justify-end">
                <a
                  href={ensureAbsoluteUrl(form.mapLink)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  <HugeiconsIcon icon={MapsIcon} className="w-3.5 h-3.5" />
                  Mở link kiểm tra &rarr;
                </a>
              </div>
            )}
          </div>

          {/* Notes */}
          <Textarea
            label={
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={StickyNoteIcon} className="h-4 w-4 text-slate-500" />
                {t("timeline.notesLabel")}
              </span>
            }
            value={form.notes}
            onChange={(notes) => setForm({ ...form, notes })}
            placeholder={t("timeline.notesPlaceholder")}
          />
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
        title={isDirectEdit ? t("timeline.deleteActivityTitle") : t("share.proposeDeleteActivityTitle")}
        description={isDirectEdit ? t("timeline.deleteActivityDesc") : t("share.proposeDeleteActivityDesc")}
        confirmLabel={isDirectEdit ? t("share.delete") : t("share.suggestDelete")}
        itemName={activities.find(a => String(a.id) === deleteTargetId)?.title}
      />

      <SharedBackupPlansSheet
        token={token}
        tripId={trip?.id || 0}
        activityId={selectedBackupActivity?.id}
        activityTitle={selectedBackupActivity?.title}
        date={selectedBackupActivity?.date}
        isOpen={isBackupPlansSheetOpen}
        onClose={() => {
          setIsBackupPlansSheetOpen(false);
          setSelectedBackupActivity(null);
        }}
        backupPlans={backupPlans}
        changeRequests={changeRequests}
        mode={backupPlansMode || mode}
        guestName={guestName || "Khách"}
      />
      <BottomSheet
        isOpen={isDayPickerOpen}
        onClose={() => setIsDayPickerOpen(false)}
        title={t("share.quickSelectDay")}
      >
        <div className="space-y-4">
          <p className="text-[13.5px] font-semibold text-slate-500 pb-1">
            Chọn một ngày cụ thể dưới đây để lọc xem chi tiết hoạt động hoặc chọn "{t("share.allDays")}".
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[60vh] overflow-y-auto pr-1 scrollbar-none pb-4">
            <button
              type="button"
              onClick={() => {
                setFilterDay("all");
                setIsDayPickerOpen(false);
              }}
              className={classNames(
                "flex flex-col items-center justify-center p-3 rounded-[16px] border text-center transition-all duration-200 active:scale-95 min-h-[72px] cursor-pointer",
                filterDay === "all"
                  ? "bg-kat-dark dark:bg-slate-800 text-white dark:text-slate-200 border-kat-dark dark:border-slate-700/55 shadow-sm"
                  : "bg-white dark:bg-kat-surface border-slate-200 dark:border-kat-border text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              )}
            >
              <span className="text-[13.5px] font-extrabold">{t("share.allDays")}</span>
              <span className={classNames(
                "text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-full",
                filterDay === "all" 
                  ? "bg-white/20 text-white" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              )}>
                {mergedActivities.length} mục
              </span>
            </button>

            {days.map((day, idx) => {
              const isActive = filterDay === day;
              const count = mergedActivities.filter(e => e.date === day).length;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setFilterDay(day);
                    setIsDayPickerOpen(false);
                  }}
                  className={classNames(
                    "flex flex-col items-center justify-center p-3 rounded-[16px] border text-center transition-all duration-200 active:scale-95 min-h-[72px] cursor-pointer",
                    isActive
                      ? "bg-kat-dark dark:bg-slate-800 text-white dark:text-slate-200 border-kat-dark dark:border-slate-700/55 shadow-sm"
                      : "bg-white dark:bg-kat-surface border-slate-200 dark:border-kat-border text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  )}
                >
                  <span className="text-[13.5px] font-extrabold">Ngày {idx + 1}</span>
                  <span className={classNames(
                    "text-[10.5px] font-medium mt-0.5",
                    isActive ? "text-slate-200 dark:text-slate-300" : "text-slate-400 dark:text-slate-550"
                  )}>
                    {formatDateShort(day)}
                  </span>
                  {count > 0 && (
                    <span className={classNames(
                      "text-[9px] font-black mt-1 px-1.5 py-0.2 rounded-full",
                      isActive ? "bg-white/20 text-white" : "bg-kat-primary/15 dark:bg-kat-primary-soft/30 text-kat-primary"
                    )}>
                      {count} mục
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

    </>
  );
}

