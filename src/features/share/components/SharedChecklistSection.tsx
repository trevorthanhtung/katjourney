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


export function SharedChecklistSection({ 
  tripId,
  token, 
  mode, 
  checklist, 
  changeRequests = [],
  members = [],
  guestName
}: { 
  tripId?: string | number;
  token: string; 
  mode: string; 
  checklist: ChecklistItem[]; 
  changeRequests?: any[];
  members?: Member[];
  guestName?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'shared' | 'private'>('shared');

  const localPrivateItems = useLiveQuery(async () => {
    if (!tripId) return [];
    const targetTripId = typeof tripId === 'number' ? tripId : (isNaN(Number(tripId)) ? tripId : Number(tripId));
    try {
      const items = await db.checklist.where('tripId').equals(targetTripId).toArray();
      return items.filter(c => c.isPrivate && !c.isDeleted);
    } catch (e) {
      console.error("Error loading local private checklist items:", e);
      return [];
    }
  }, [tripId, activeSubTab]) ?? [];

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
    category: 'Giấy tờ',
    quantity: 1,
    assignedTo: '',
    priority: 'normal' as 'normal' | 'important' | 'required',
    note: ''
  });
  const [showValidationError, setShowValidationError] = useState(false);
  
  const isRequestEdit = mode === 'request_edit' || mode === 'edit';
  const isDirectEdit = mode === 'edit';
  const canModifyPrivate = activeSubTab === 'private';
  const canAdd = isRequestEdit || canModifyPrivate;
  const canToggle = isRequestEdit || canModifyPrivate;

  useEffect(() => {
    if (isFormOpen) {
      setShowValidationError(false);
      if (editingId) {
        const item = activeSubTab === 'private'
          ? localPrivateItems.find(c => String(c.id) === editingId)
          : checklist.find(c => String(c.id) === editingId);
        if (item) {
          setForm({
            title: item.title,
            category: item.category || 'Khác',
            quantity: item.quantity || 1,
            assignedTo: item.assignedTo || '',
            priority: item.priority || 'normal',
            note: item.note || ''
          });
        }
      } else {
        setForm({
          title: '',
          category: 'Giấy tờ',
          quantity: 1,
          assignedTo: '',
          priority: 'normal',
          note: ''
        });
      }
    }
  }, [editingId, isFormOpen, checklist, localPrivateItems, activeSubTab]);

  function startAdd() { setEditingId(null); setIsFormOpen(true); }
  function startEdit(item: ChecklistItem) { setEditingId(String(item.id)); setIsFormOpen(true); }

  // Merge pending change requests into checklist for visual diffs
  const mergedChecklist = React.useMemo(() => {
    const list = checklist.filter((c: any) => !c.isDeleted).map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'checklist' && r.action === 'delete' && String(r.targetId) === String(item.id));
      const updateReq = changeRequests.find(r => r.section === 'checklist' && r.action === 'update' && String(r.targetId) === String(item.id));
      
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
          changeRequestId: changeRequests.find(r => r.section === 'checklist' && r.action === 'delete' && String(r.targetId) === String(item.id))?.id
        };
      }
      return item;
    });

    const pendingCreates = changeRequests.filter(r => r.section === 'checklist' && r.action === 'create' && r.status === 'pending');
    pendingCreates.forEach(r => {
      list.push({
        id: "pending-create-" + r.id,
        ...r.after,
        isPendingCreate: true,
        changeRequestId: r.id
      } as any);
    });

    return list;
  }, [checklist, changeRequests]);

  const displayedChecklist = activeSubTab === 'private' ? localPrivateItems : mergedChecklist;

  async function handleToggle(item: ChecklistItem) {
    if (activeSubTab === 'private') {
      try {
        await db.checklist.update(Number(item.id), { completed: !item.completed });
      } catch (e: any) {
        showToast("Lỗi: " + e.message, "error");
      }
      return;
    }
    if (!isRequestEdit) return;
    try {
      const status = isDirectEdit ? 'auto_approved' : undefined;
      await submitChangeRequest(token, { section: 'checklist', action: 'update', targetId: String(item.id), before: item as any, after: { completed: !item.completed }, status, requesterName: guestName });
      showToast(isDirectEdit ? 'Đã cập nhật trạng thái!' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
    } catch (e: any) { showToast('Lỗi: ' + e.message, 'error'); }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setShowValidationError(true);
      return;
    }
    
    if (activeSubTab === 'private') {
      if (!tripId) {
        showToast("Lỗi: Không xác định được chuyến đi", "error");
        return;
      }
      const targetTripId = typeof tripId === 'number' ? tripId : (isNaN(Number(tripId)) ? tripId : Number(tripId));
      try {
        if (editingId) {
          await db.checklist.update(Number(editingId), {
            title: form.title.trim(),
            category: form.category,
            quantity: form.quantity,
            priority: form.priority,
            note: form.note.trim() || undefined,
            updatedAt: new Date().toISOString()
          });
          showToast("Đã cập nhật chuẩn bị cá nhân!");
        } else {
          await db.checklist.add({
            tripId: targetTripId as any,
            section: 'Before Trip',
            title: form.title.trim(),
            completed: false,
            isPrivate: true,
            category: form.category,
            quantity: form.quantity,
            priority: form.priority,
            note: form.note.trim() || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          showToast("Đã thêm chuẩn bị cá nhân!");
        }
        setIsFormOpen(false);
        setEditingId(null);
      } catch (e: any) {
        showToast("Lỗi khi lưu: " + e.message, "error");
      }
      return;
    }

    const payload = {
      title: form.title.trim(),
      category: form.category,
      quantity: form.quantity,
      assignedTo: form.assignedTo || undefined,
      priority: form.priority,
      note: form.note.trim() || undefined,
      section: 'Before Trip' as const,
      completed: false
    };

    try {
      const status = isDirectEdit ? 'auto_approved' : undefined;
      const successMessage = isDirectEdit ? 'Đã cập nhật trực tiếp!' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.';
      if (!editingId) {
        await submitChangeRequest(token, { section: 'checklist', action: 'create', after: payload, status, requesterName: guestName });
        setIsFormOpen(false);
        showToast(successMessage);
      } else {
        const before = checklist.find(c => String(c.id) === editingId);
        await submitChangeRequest(token, { section: 'checklist', action: 'update', targetId: editingId, before: before as any, after: payload, status, requesterName: guestName });
        setEditingId(null);
        setIsFormOpen(false);
        showToast(successMessage);
      }
    } catch (e: any) { showToast((isDirectEdit ? 'Lỗi cập nhật: ' : 'Lỗi khi gửi đề xuất: ') + e.message, 'error'); }
  }

  async function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  async function executeDelete(id: string) {
    try {
      const before = checklist.find(c => String(c.id) === id);
      await submitChangeRequest(token, { 
        section: 'checklist', 
        action: 'delete', 
        targetId: id, 
        before: before as any, 
        status: isDirectEdit ? 'auto_approved' : undefined,
        requesterName: guestName 
      });
      showToast(isDirectEdit ? 'Đã xóa trực tiếp!' : 'Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
    } catch (e: any) { showToast((isDirectEdit ? 'Lỗi xóa: ' : 'Lỗi khi gửi đề xuất: ') + e.message, 'error'); }
  }

  return (
    <>
      <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-50 text-purple-600">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[16px] font-black text-kat-dark">Danh sách chuẩn bị</h3>
            <p className="text-[11px] text-slate-400 font-bold mt-0.5">
              Chuẩn bị hành lý và đồ dùng trước chuyến đi
            </p>
          </div>
        </div>
        {displayedChecklist.length > 0 && (
          <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100/50">
            Đã xong {displayedChecklist.filter(c => c.completed).length}/{displayedChecklist.length}
          </span>
        )}
      </div>

      {/* Switcher Tab Slider */}
      <div className="flex bg-slate-100/80 p-1 rounded-xl mb-4 relative z-0">
        <button
          type="button"
          onClick={() => setActiveSubTab('shared')}
          className={classNames(
            "flex-1 py-2 text-[13px] font-bold rounded-lg transition-all duration-300 text-center cursor-pointer",
            activeSubTab === 'shared'
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          Chung
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('private')}
          className={classNames(
            "flex-1 py-2 text-[13px] font-bold rounded-lg transition-all duration-300 text-center cursor-pointer flex items-center justify-center gap-1.5",
            activeSubTab === 'private'
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          Cá nhân
          {localPrivateItems.length > 0 && (
            <span className="flex items-center justify-center min-w-4.5 h-4.5 text-[9.5px] font-black px-1 rounded-full bg-purple-650 text-white">
              {localPrivateItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-2.5 mt-2">
        {displayedChecklist.map((c) => {
          const isPending = c.isPendingCreate || c.isPendingUpdate || c.isPendingDelete;
          return (
            <div 
              key={c.id} 
              onClick={() => handleToggle(c)}
              className={classNames(
                "flex justify-between items-center p-3.5 transition-all rounded-2xl border", 
                canToggle ? "cursor-pointer" : "cursor-default",
                c.completed 
                  ? "bg-slate-50/50 border-slate-100/80 opacity-80" 
                  : "bg-white border-slate-100 hover:border-slate-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]",
                c.isPendingCreate || c.isPendingUpdate ? "bg-sky-50/40 border-sky-100/50" : "",
                c.isPendingDelete ? "bg-slate-50/30 border-rose-100 opacity-70 pointer-events-none" : ""
              )}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                {/* Interactive Checkbox */}
                {canToggle ? (
                  <div className="flex-shrink-0 mt-0.5">
                    {c.completed ? (
                      <div className="w-5.5 h-5.5 rounded-lg bg-purple-600 text-white flex items-center justify-center transition-all scale-100 shadow-sm shadow-purple-200">
                        <HugeiconsIcon icon={CheckIcon} className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div className="w-5.5 h-5.5 rounded-lg border-2 border-slate-300 hover:border-purple-500 bg-white transition-all scale-100" />
                    )}
                  </div>
                ) : (
                  <div className="flex-shrink-0 mt-0.5">
                    {c.completed ? (
                      <div className="w-5.5 h-5.5 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center">
                        <HugeiconsIcon icon={CheckIcon} className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div className="w-5.5 h-5.5 rounded-lg border-2 border-slate-200 bg-slate-50" />
                    )}
                  </div>
                )}

                {/* Item Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={classNames(
                      "text-[14px] font-bold break-words leading-tight", 
                      c.completed ? 'text-slate-400 line-through font-medium' : 'text-kat-dark',
                      c.isPendingDelete ? 'line-through text-slate-400 opacity-60 font-medium' : ''
                    )}>
                      {c.title}
                    </span>
                    {c.quantity && c.quantity > 1 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-[11px] font-extrabold text-slate-500">
                        x{c.quantity}
                      </span>
                    )}

                    {/* Pending Request Status Badges */}
                    {c.isPendingDelete && (
                      <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 shrink-0 select-none animate-fadeIn">
                        {changeRequests.find(r => String(r.id) === String(c.changeRequestId))?.status === 'auto_approved' ? 'Đang xóa...' : 'Đề xuất xóa'}
                      </span>
                    )}
                    {c.isPendingCreate && (
                      <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600 shrink-0 select-none animate-fadeIn">
                        {changeRequests.find(r => String(r.id) === String(c.changeRequestId))?.status === 'auto_approved' ? 'Đang lưu...' : 'Đề xuất mới'}
                      </span>
                    )}
                    {c.isPendingUpdate && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 shrink-0 select-none animate-fadeIn">
                        {changeRequests.find(r => String(r.id) === String(c.changeRequestId))?.status === 'auto_approved' ? 'Đang lưu...' : 'Đề xuất sửa'}
                      </span>
                    )}
                  </div>

                  {/* Metadata and Badges */}
                  <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                    {c.category && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                        {(() => {
                          const CatIcon = CATEGORY_ICONS[c.category] || PackageIcon;
                          return <HugeiconsIcon icon={CatIcon} className="h-3 w-3 text-slate-400" />;
                        })()}
                        {c.category}
                      </span>
                    )}

                    {c.assignedTo && (
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold"
                        style={{
                          backgroundColor: `hsl(${c.assignedTo.charCodeAt(0) * 137.5 % 360}, 75%, 95%)`,
                          color: `hsl(${c.assignedTo.charCodeAt(0) * 137.5 % 360}, 70%, 35%)`,
                          border: `1px solid hsl(${c.assignedTo.charCodeAt(0) * 137.5 % 360}, 70%, 90%)`
                        }}
                      >
                        <HugeiconsIcon icon={UserIcon} className="h-2.5 w-2.5" />
                        {c.assignedTo}
                      </span>
                    )}

                    {c.priority && c.priority !== 'normal' && (
                      <span className={classNames(
                        "inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wide",
                        c.priority === 'required' ? "bg-rose-50 text-rose-600 border border-rose-100/50" : "bg-amber-50 text-amber-600 border border-amber-100/50"
                      )}>
                        {c.priority === 'required' ? 'Bắt buộc' : 'Quan trọng'}
                      </span>
                    )}
                  </div>

                  {/* Note */}
                  {c.note && (
                    <p className="text-[11.5px] text-slate-400 mt-1 pl-1.5 border-l-2 border-slate-200 italic font-medium">
                      {c.note}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Menu */}
              {((activeSubTab === 'private') || (isRequestEdit && !isPending)) && (
                <div className="shrink-0 ml-2">
                  <button 
                    onClick={(ev) => {
                      ev.stopPropagation();
                      const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                      if (activeMenuId === String(c.id)) {
                        setActiveMenuId(null);
                        setMenuPos(null);
                      } else {
                        setActiveMenuId(String(c.id));
                        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                      }
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 transition-all focus:outline-none"
                    title={activeSubTab === 'private' ? "Tùy chọn" : "Tùy chọn đề xuất"}
                  >
                    <HugeiconsIcon icon={MoreVerticalIcon} className="h-4.5 w-4.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {displayedChecklist.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60 my-2">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-400 mb-3">
            <HugeiconsIcon icon={Luggage01Icon} className="h-6 w-6" />
          </div>
          <h4 className="text-[14px] font-bold text-kat-dark">
            {activeSubTab === 'private' ? "Chưa có chuẩn bị cá nhân" : "Chưa có chuẩn bị nào"}
          </h4>
          <p className="text-[11.5px] text-slate-400 mt-1 font-bold max-w-[220px]">
            {activeSubTab === 'private' 
              ? "Thêm đồ dùng của riêng bạn (chỉ mình bạn thấy) tại đây"
              : "Hãy thêm các vật dụng cần thiết để chuẩn bị cho chuyến đi"}
          </p>
        </div>
      )}

      {activeMenuId && menuPos && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[998]" 
            onClick={() => {
              setActiveMenuId(null);
              setMenuPos(null);
            }}
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
                const item = activeSubTab === 'private' 
                  ? localPrivateItems.find(x => String(x.id) === id)
                  : checklist.find(x => String(x.id) === id);
                if (item) startEdit(item);
              }}
              className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {activeSubTab === 'private' ? "Sửa" : (isDirectEdit ? "Sửa" : "Đề xuất sửa")}
            </button>
            <button
              onClick={() => {
                const id = activeMenuId;
                setActiveMenuId(null);
                setMenuPos(null);
                handleDelete(id);
              }}
              className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              {activeSubTab === 'private' ? "Xóa" : (isDirectEdit ? "Xóa" : "Đề xuất xóa")}
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Add Button */}
      {canAdd && (
        <button 
          onClick={startAdd} 
          className={classNames(
            "mt-4 items-center justify-center gap-2 text-[13.5px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100/80 active:scale-[0.99] rounded-xl transition-all shadow-sm shadow-purple-100/30 h-11 w-full",
            displayedChecklist.length > 0 ? "hidden lg:flex" : "flex"
          )}
          title={activeSubTab === 'private' ? "Thêm chuẩn bị cá nhân" : (isDirectEdit ? "Thêm chuẩn bị" : "Đề xuất thêm")}
        >
          <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" /> 
          {activeSubTab === 'private' ? "Thêm chuẩn bị cá nhân" : (isDirectEdit ? "Thêm chuẩn bị" : "Đề xuất thêm")}
        </button>
      )}

      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingId(null);
        }}
        title={activeSubTab === 'private' 
          ? (editingId ? "Sửa chuẩn bị cá nhân" : "Thêm chuẩn bị cá nhân")
          : (isDirectEdit ? (editingId ? "Sửa chuẩn bị" : "Thêm chuẩn bị") : (editingId ? "Đề xuất sửa chuẩn bị" : "Đề xuất thêm chuẩn bị"))}
      >
        <div className="flex flex-col gap-3.5 py-1">
          {/* Item Name */}
          <div className="space-y-1">
            <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
              <HugeiconsIcon icon={TextFontIcon} className="h-3.5 w-3.5 text-slate-500" />
              Tên món cần mang *
            </label>
            <input
              className={`w-full rounded-[12px] border bg-slate-50 px-3.5 h-11 text-[14px] font-semibold text-slate-800 outline-none ring-1 ring-inset ring-slate-200/60 transition-shadow focus:bg-white focus:ring-2 focus:ring-kat-teal placeholder-slate-400 ${
                showValidationError ? "border-red-500 ring-2 ring-red-500" : "border-slate-200 focus:border-kat-teal"
              }`}
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                if (e.target.value.trim()) setShowValidationError(false);
              }}
              placeholder="VD: Sạc dự phòng"
            />
            {showValidationError && (
              <p className="text-rose-500 text-[11.5px] font-bold mt-1 pl-1 flex items-center gap-1">
                <span>Vui lòng nhập tên món cần mang.</span>
              </p>
            )}
          </div>

          {/* Category Segment Select (Grid of chips) */}
          <div className="space-y-2">
            <label className="text-[12.5px] font-bold text-slate-700 block flex items-center gap-1.5">
              <HugeiconsIcon icon={PackageIcon} className="h-3.5 w-3.5 text-slate-500" />
              Nhóm hành lý
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {CATEGORIES.map((cat) => {
                const IconComponent = CATEGORY_ICONS[cat] || PackageIcon;
                const isSelected = form.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`flex flex-col items-center justify-center min-h-[76px] p-2 rounded-[18px] border-2 transition-all duration-200 active:scale-95 cursor-pointer ${
                      isSelected
                        ? "bg-kat-dark/5 border-kat-dark text-kat-dark font-black shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8.5 h-8.5 rounded-[12px] mb-1 transition-all ${
                      isSelected
                        ? "bg-kat-dark/12 text-kat-dark"
                        : "bg-slate-100 text-slate-400"
                    }`}>
                       <HugeiconsIcon icon={IconComponent} className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[12px] font-bold tracking-tight">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Priority in side-by-side grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Quantity Counter */}
            <div className="flex flex-col gap-1">
              <label className="text-[12.5px] font-bold text-slate-700">Số lượng</label>
              <div className="flex items-center justify-between bg-slate-50 rounded-[12px] p-1 border border-slate-200/60 h-11">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, quantity: Math.max(1, form.quantity - 1) })}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white text-slate-800 border border-slate-200/60 shadow-sm active:scale-95 transition-all hover:bg-slate-50"
                >
                  <HugeiconsIcon icon={MinusSignIcon} className="h-3 w-3" />
                </button>
                <span className="text-[14px] font-black text-slate-800 w-8 text-center">{form.quantity}</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, quantity: form.quantity + 1 })}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white text-slate-800 border border-slate-200/60 shadow-sm active:scale-95 transition-all hover:bg-slate-50"
                >
                  <HugeiconsIcon icon={Add01Icon} className="h-3 w-3" strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Priority Segments */}
            <div className="flex flex-col gap-1">
              <label className="text-[12.5px] font-bold text-slate-700">Mức độ cần thiết</label>
              <div className="flex p-0.5 bg-slate-100 rounded-[12px] h-11 items-center">
                {(["normal", "important", "required"] as const).map((prio) => {
                  const isSelected = form.priority === prio;
                  const labels = { normal: "Thường", important: "Quan trọng", required: "Bắt buộc" };
                  return (
                    <button
                      key={prio}
                      type="button"
                      onClick={() => setForm({ ...form, priority: prio })}
                      className={`flex-1 py-1 rounded-[8px] text-[11.5px] font-bold transition-all h-full flex items-center justify-center ${
                        isSelected
                          ? "bg-white text-slate-800 shadow-sm border border-slate-200/30"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {labels[prio]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Assigned To */}
          <div className="space-y-1">
            <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
              <HugeiconsIcon icon={UserCheck01Icon} className="h-3.5 w-3.5 text-slate-500" />
              Người phụ trách
            </label>
            {members.length === 0 ? (
              <div className="rounded-[12px] bg-slate-50 border border-kat-border/60 p-2.5 flex items-start gap-2.5">
                <HugeiconsIcon icon={UserIcon} className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[12px] font-bold text-slate-800">Chưa có người đồng hành</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-bold">Người đồng hành chưa được chia sẻ để phân công hành lý.</p>
                </div>
              </div>
            ) : (
              <Select
                label=""
                value={form.assignedTo}
                onChange={(assignedTo) => setForm({ ...form, assignedTo })}
                options={[
                  "", 
                  ...(form.assignedTo && !members.some(m => m.name === form.assignedTo) ? [form.assignedTo] : []),
                  ...members.map(m => m.name)
                ]}
                placeholder="Chọn người đồng hành"
                buttonClassName="w-full flex items-center justify-between rounded-[12px] border-0 bg-slate-50 px-3.5 h-11 text-[14px] font-semibold text-kat-dark outline-none ring-1 ring-inset ring-slate-200/60 transition-shadow focus:bg-white focus:ring-2 focus:ring-kat-teal"
              />
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
              <HugeiconsIcon icon={StickyNoteIcon} className="h-3.5 w-3.5 text-slate-500" />
              Ghi chú
            </label>
            <textarea
              className="w-full h-14 rounded-[12px] border-0 bg-slate-50 px-3.5 py-2.5 text-[13.5px] font-semibold text-slate-800 outline-none ring-1 ring-inset ring-slate-200/60 transition-shadow focus:bg-white focus:ring-2 focus:ring-kat-teal resize-none placeholder-slate-400"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="VD: Để trong balo nhỏ, nhớ sạc đầy..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="mt-1 w-full h-11 rounded-[12px] bg-kat-dark font-black text-[14px] text-white hover:bg-[#0a1a5c] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activeSubTab === 'private' 
              ? (editingId ? "Lưu thay đổi" : "Thêm vào hành lý") 
              : (isDirectEdit ? (editingId ? "Lưu thay đổi" : "Thêm chuẩn bị") : (editingId ? "Gửi đề xuất sửa" : "Gửi đề xuất thêm"))}
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
        title={activeSubTab === 'private' ? "Xóa mục chuẩn bị cá nhân?" : "Đề xuất xóa mục này?"}
        description={activeSubTab === 'private' ? "Hành động này sẽ xóa vĩnh viễn mục chuẩn bị cá nhân của bạn và không thể hoàn tác." : "Bạn đang gửi đề xuất xóa mục chuẩn bị này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."}
        confirmLabel={activeSubTab === 'private' ? "Xóa" : "Đề xuất xóa"}
        itemName={
          activeSubTab === 'private' 
            ? localPrivateItems.find(c => String(c.id) === deleteTargetId)?.title
            : checklist.find(c => String(c.id) === deleteTargetId)?.title
        }
      />
      </section>

      {/* Mobile Floating Action Button (FAB) when checklist items exist */}
      {canAdd && displayedChecklist.length > 0 && (
        <button
          type="button"
          onClick={startAdd}
          className="lg:hidden fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-2xl border border-white/40 text-kat-dark shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] motion-press hover:scale-105 hover:bg-white/25 duration-200 cursor-pointer"
          style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
          aria-label={activeSubTab === 'private' ? "Thêm chuẩn bị cá nhân" : "Đề xuất thêm"}
          title={activeSubTab === 'private' ? "Thêm chuẩn bị cá nhân" : "Đề xuất thêm"}
        >
          <HugeiconsIcon icon={Add01Icon} className="h-6 w-6" />
        </button>
      )}
    </>
  );
}

