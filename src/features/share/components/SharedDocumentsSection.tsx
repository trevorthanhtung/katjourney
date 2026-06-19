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


export function SharedDocumentsSection({ 
  tripId,
  token, 
  mode, 
  documents, 
  changeRequests = [],
  guestName
}: { 
  tripId?: string | number;
  token: string; 
  mode: string; 
  documents: TravelDocument[]; 
  changeRequests?: any[];
  guestName?: string;
}) {
  const [activeSubTab, setActiveSubTab] = React.useState<'shared' | 'private'>('shared');
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = React.useState<TravelDocument | null>(null);
  const isRequestEdit = mode === 'request_edit';

  // Local Private Documents
  const localPrivateDocs = useLiveQuery(async () => {
    if (!tripId) return [];
    const targetTripId = typeof tripId === 'number' ? tripId : (isNaN(Number(tripId)) ? tripId : Number(tripId));
    try {
      const items = await db.travelDocuments.where('tripId').equals(targetTripId).toArray();
      return items.filter(d => d.isPrivate && !d.isDeleted);
    } catch (e) {
      console.error("Error loading local private travel documents:", e);
      return [];
    }
  }, [tripId, activeSubTab]) ?? [];

  // Form states for private documents
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingDoc, setEditingDoc] = React.useState<TravelDocument | null>(null);
  const [form, setForm] = React.useState({
    title: "",
    type: "document" as TravelDocument["type"],
    code: "",
    date: "",
    link: "",
    note: "",
    attachmentUrl: ""
  });
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [showValidationError, setShowValidationError] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Context menu for private documents
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [menuPos, setMenuPos] = React.useState<{ top: number; right: number } | null>(null);

  React.useEffect(() => {
    if (!activeMenuId) return;
    const handleScroll = () => {
      setActiveMenuId(null);
      setMenuPos(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeMenuId]);

  React.useEffect(() => {
    if (isFormOpen) {
      setShowValidationError(false);
      setShowAdvanced(false);
      if (editingDoc) {
        setForm({
          title: editingDoc.title,
          type: editingDoc.type || "document",
          code: editingDoc.code || "",
          date: editingDoc.date || "",
          link: editingDoc.link || "",
          note: editingDoc.note || "",
          attachmentUrl: editingDoc.attachmentUrl || ""
        });
        setPreviewUrl(editingDoc.attachmentUrl || null);
      } else {
        setForm({
          title: "",
          type: "document",
          code: "",
          date: "",
          link: "",
          note: "",
          attachmentUrl: ""
        });
        setPreviewUrl(null);
      }
      setSelectedFile(null);
    }
  }, [isFormOpen, editingDoc]);

  const mergedDocuments = React.useMemo(() => {
    return documents.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'travelDocuments' && r.action === 'delete' && String(r.targetId) === String(item.id));
      return {
        ...item,
        isPendingDelete: pendingDelete
      };
    });
  }, [documents, changeRequests]);

  const displayedDocs = activeSubTab === 'private' ? localPrivateDocs : mergedDocuments;

  function startAdd() {
    setEditingDoc(null);
    setIsFormOpen(true);
  }

  function startEdit(d: TravelDocument) {
    setEditingDoc(d);
    setIsFormOpen(true);
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  async function save() {
    if (!form.title.trim()) {
      setShowValidationError(true);
      return;
    }
    setIsUploading(true);
    let finalAttachmentUrl = form.attachmentUrl;
    const targetTripId = typeof tripId === 'number' ? tripId : Number(tripId);

    try {
      if (selectedFile) {
        finalAttachmentUrl = await uploadDocumentImage(selectedFile, targetTripId);
      }

      if (editingDoc?.id) {
        await db.travelDocuments.update(editingDoc.id, {
          ...form,
          attachmentUrl: finalAttachmentUrl,
          updatedAt: new Date().toISOString()
        });
        showToast("Đã cập nhật tài liệu cá nhân");
      } else {
        await db.travelDocuments.add({
          ...form,
          tripId: targetTripId,
          isPrivate: true,
          attachmentUrl: finalAttachmentUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        showToast("Đã thêm tài liệu cá nhân");
      }
      setIsFormOpen(false);
    } catch (e: any) {
      showToast("Lỗi khi lưu: " + e.message, "error");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(d: TravelDocument) {
    setDeleteTargetId(d);
  }

  async function executeDelete(d: TravelDocument) {
    try {
      if (activeSubTab === 'private') {
        if (d.id) {
          await db.travelDocuments.update(d.id, { isDeleted: true });
          showToast("Đã xóa tài liệu cá nhân!");
        }
      } else {
        await submitChangeRequest(token, { section: 'travelDocuments', action: 'delete', targetId: String(d.id), before: d as any, requesterName: guestName });
        showToast('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      }
    } catch (e: any) { 
      showToast('Lỗi: ' + e.message, 'error'); 
    }
  }

  const isSaveDisabled = !form.title.trim() || isUploading;

  const headerAction = (
    <button
      type="button"
      onClick={save}
      disabled={isSaveDisabled}
      className="inline-flex h-9 items-center justify-center rounded-xl bg-[#030D2E] text-white hover:bg-[#030D2E]/90 px-4 text-[13.5px] font-bold shadow-sm transition-all active:scale-[0.97] disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed"
    >
      {isUploading ? <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin text-slate-400" /> : "Lưu"}
    </button>
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <HugeiconsIcon icon={File01Icon} className="h-5 w-5 text-rose-500" />
        <h3 className="text-[16px] font-black text-[#030D2E]">Giấy tờ & đặt chỗ</h3>
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-[#030D2E]/5 p-1 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('shared')}
          className={classNames(
            "flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all duration-300 text-center cursor-pointer",
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
            "flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all duration-300 text-center cursor-pointer flex items-center justify-center gap-1.5",
            activeSubTab === 'private'
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          Cá nhân
          {localPrivateDocs.length > 0 && (
            <span className="flex items-center justify-center min-w-4.5 h-4.5 text-[9.5px] font-black px-1 rounded-full bg-purple-650 text-white">
              {localPrivateDocs.length}
            </span>
          )}
        </button>
      </div>

      {/* Document cards grid */}
      {displayedDocs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(displayedDocs as any[]).map(d => (
            <div 
              key={d.id} 
              className={classNames(
                "flex flex-col gap-1 rounded-xl p-3 border transition-all relative",
                d.isPendingDelete ? "border-rose-100 bg-slate-50/50 opacity-70" : "bg-slate-50 border-slate-200"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className={classNames(
                    "text-[14px] font-bold text-slate-700",
                    d.isPendingDelete ? "line-through text-slate-400" : ""
                  )}>
                    {d.title}
                  </span>
                  {d.isPendingDelete && (
                    <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 select-none animate-fadeIn">
                      Đề xuất xóa
                    </span>
                  )}
                </div>
                
                {/* Options button */}
                {activeSubTab === 'private' ? (
                  <div className="shrink-0 ml-2">
                    <button 
                      onClick={(ev) => {
                        ev.stopPropagation();
                        const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                        if (activeMenuId === String(d.id)) {
                          setActiveMenuId(null);
                          setMenuPos(null);
                        } else {
                          setActiveMenuId(String(d.id));
                          setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                        }
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 active:scale-90 transition-all focus:outline-none"
                      title="Tùy chọn"
                    >
                      <HugeiconsIcon icon={MoreVerticalIcon} className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ) : (
                  isRequestEdit && !d.isPendingDelete && (
                    <button 
                      onClick={() => handleDelete(d)} 
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/60 transition-all active:scale-95 shadow-sm bg-white shrink-0"
                      title="Đề xuất xóa"
                    >
                      <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                    </button>
                  )
                )}
              </div>
              
              {d.code && (
                <div className="text-[12px] font-bold text-slate-400 mt-0.5">
                  Mã: <span className="text-slate-600">{d.code}</span>
                </div>
              )}
              {d.date && (
                <div className="text-[11.5px] font-semibold text-slate-400">
                  Ngày: <span className="text-slate-500">{formatDate(d.date)}</span>
                </div>
              )}
              {d.link && (
                <a 
                  href={d.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[11.5px] font-bold text-blue-500 hover:underline mt-0.5 w-fit"
                  onClick={(e) => e.stopPropagation()}
                >
                  Link liên kết
                </a>
              )}

              {d.note && (
                <span className={classNames(
                  "text-[13px] text-slate-500 mt-1",
                  d.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
                )}>
                  {d.note}
                </span>
              )}
              
              {/* Attachment Image Display */}
              {d.attachmentUrl && (
                <div className="mt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Ảnh đính kèm</p>
                  <div 
                    className={classNames(
                      "relative w-full rounded-xl overflow-hidden border border-slate-200 cursor-pointer group bg-[#F8F9FA] flex justify-center items-center",
                      d.isPendingDelete ? "opacity-60 grayscale" : ""
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!d.isPendingDelete) setPreviewImage(d.attachmentUrl || null);
                    }}
                  >
                    <img 
                      src={d.attachmentUrl} 
                      alt={d.title}
                      loading="lazy"
                      className="w-full h-auto max-h-[300px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    {!d.isPendingDelete && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <HugeiconsIcon icon={Maximize01Icon} className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60 my-2">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-450 mb-3">
            <HugeiconsIcon icon={File01Icon} className="h-6 w-6" />
          </div>
          <h4 className="text-[14px] font-bold text-[#030D2E]">
            {activeSubTab === 'private' ? "Chưa có giấy tờ cá nhân" : "Chưa có giấy tờ nào"}
          </h4>
          <p className="text-[11.5px] text-slate-400 mt-1 font-bold max-w-[240px]">
            {activeSubTab === 'private' 
              ? "Thêm các thông tin vé, đặt phòng của riêng bạn tại đây"
              : "Các thông tin vé, đặt phòng chung cho chuyến đi sẽ hiển thị ở đây"}
          </p>
        </div>
      )}

      {/* Add Button for Private Documents */}
      {activeSubTab === 'private' && (
        <button 
          onClick={startAdd} 
          className="mt-4 flex items-center justify-center gap-2 text-[13.5px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100/80 active:scale-[0.99] rounded-xl transition-all shadow-sm shadow-rose-100/30 h-11 w-full"
        >
          <HugeiconsIcon icon={Add01Icon} className="w-4.5 h-4.5" />
          Thêm giấy tờ cá nhân
        </button>
      )}

      {/* Form BottomSheet for Private Documents */}
      <BottomSheet 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={editingDoc ? "Sửa giấy tờ cá nhân" : "Thêm giấy tờ cá nhân"}
        headerAction={headerAction}
      >
        <div className="space-y-4">
          <div>
            <Input 
              label="Tên mục *" 
              value={form.title} 
              onChange={(title) => setForm({ ...form, title })} 
              placeholder="VD: Vé máy bay khứ hồi, đặt phòng..." 
            />
            {showValidationError && !form.title.trim() && (
              <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">Vui lòng nhập tiêu đề.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select 
              label="Phân loại" 
              value={form.type || "document"} 
              onChange={(type) => setForm({ ...form, type: type as any })}
              options={["ticket", "hotel", "booking", "contact", "map", "document", "other"]}
              labels={{
                ticket: "Vé máy bay/tàu/xe",
                hotel: "Khách sạn/Nơi ở",
                booking: "Đặt chỗ/Vé tham quan",
                contact: "Liên hệ khẩn cấp",
                map: "Bản đồ/Lịch trình",
                document: "Giấy tờ tùy thân",
                other: "Khác"
              }}
            />
            <Input 
              label="Mã / thông tin đặt chỗ" 
              value={form.code} 
              onChange={(code) => setForm({ ...form, code })} 
              placeholder="VD: PNR ABC123..." 
            />
          </div>

          {/* Advanced Info Toggle */}
          <div className="pt-2 border-t border-slate-100/80">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between py-2 text-sm font-bold text-slate-500 hover:text-[#030D2E] transition-colors focus:outline-none"
            >
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Add01Icon} className="h-4 w-4 text-slate-400" />
                Thông tin bổ sung
              </span>
              <HugeiconsIcon icon={ChevronRightIcon} className={classNames("h-4 w-4 transition-transform duration-200 text-slate-400", showAdvanced ? "rotate-90" : "")} />
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DatePicker 
                    label="Ngày liên quan" 
                    value={form.date} 
                    onChange={(date) => setForm({ ...form, date })} 
                  />
                  <Input 
                    label="Đường dẫn liên quan" 
                    value={form.link} 
                    onChange={(link) => setForm({ ...form, link })} 
                    placeholder="VD: Link vé điện tử, bản đồ..." 
                  />
                </div>
                <div>
                  <Textarea 
                    label="Ghi chú" 
                    value={form.note} 
                    onChange={(note) => setForm({ ...form, note })} 
                    placeholder="VD: Giờ nhận phòng, hành lý..." 
                  />
                </div>
                
                {/* Image Upload Area */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#030D2E]">Ảnh đính kèm</label>
                  {(previewUrl || form.attachmentUrl) ? (
                    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                      <img 
                        src={previewUrl || form.attachmentUrl} 
                        alt="Preview" 
                        className="w-full h-auto max-h-[300px] object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          setForm({...form, attachmentUrl: ""});
                        }}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-rose-500 transition-colors"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-slate-200 hover:border-slate-350 transition-colors rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50/50">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileSelect} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                      <HugeiconsIcon icon={Image01Icon} className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-650">Chọn ảnh từ thiết bị</span>
                      <span className="text-[10px] text-slate-400 mt-1 font-semibold">Chấp nhận PNG, JPG, WEBP</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Lightbox */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewImage(null);
          }}
        >
          <img 
            src={previewImage} 
            alt="Fullscreen preview" 
            className="max-w-full max-h-full object-contain"
          />
          <button 
            className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20 transition-colors"
            onClick={(e) => { 
              e.stopPropagation(); 
              setPreviewImage(null); 
            }}
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Context Menu Dropdown */}
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
                  ? localPrivateDocs.find(x => String(x.id) === id)
                  : mergedDocuments.find(x => String(x.id) === id);
                if (item) startEdit(item);
              }}
              className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Sửa
            </button>
            <button
              onClick={() => {
                const id = activeMenuId;
                setActiveMenuId(null);
                setMenuPos(null);
                const item = activeSubTab === 'private' 
                  ? localPrivateDocs.find(x => String(x.id) === id)
                  : mergedDocuments.find(x => String(x.id) === id);
                if (item) handleDelete(item);
              }}
              className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Xóa
            </button>
          </div>
        </>,
        document.body
      )}

      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (!deleteTargetId) return;
          await executeDelete(deleteTargetId);
          setDeleteTargetId(null);
        }}
        title={activeSubTab === 'private' ? "Xóa tài liệu?" : "Đề xuất xóa tài liệu?"}
        description={activeSubTab === 'private' ? "Hành động này sẽ xóa vĩnh viễn tài liệu cá nhân này khỏi thiết bị." : "Bạn đang gửi đề xuất xóa tài liệu này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất của bạn."}
        confirmLabel={activeSubTab === 'private' ? "Xóa" : "Đề xuất xóa"}
        itemName={deleteTargetId?.title}
      />
    </section>
  );
}
