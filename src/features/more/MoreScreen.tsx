import React, { useEffect, useState } from "react";
import { 
  MoreVertical,
  Backpack, 
  BookOpen, 
  ChevronRight, 
  Download, 
  Edit3, 
  FileText, 
  Settings, 
  Sparkles, 
  Table2, 
  Trash2, 
  Upload, 
  Users, 
  MapPin, 
  Calendar, 
  WalletCards, 
  Map, 
  Sun, 
  Camera, 
  Smile, 
  X, 
  ShieldAlert, 
  Check, 
  Plus, 
  User, 
  Edit2, 
  AlertCircle,
  Luggage,
  ArrowLeft,
  Coffee,
  Compass,
  FileCheck,
  CalendarDays,
  Clock3,
  UsersRound,
  Route,
  MapPinned,
  Trophy,
  BookOpenText,
  TicketCheck,
  DatabaseBackup,
  ArchiveRestore,
  BadgeInfo,
  UserPlus,
  UserRound,
  Crown,
  SunMedium,
  SmilePlus,
  Heart,
  Star,
  FileDown,
  Phone,
  Car,
  BadgeCheck,
  StickyNote,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Copy
} from "lucide-react";

function ShareSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-kat-primary focus:ring-offset-2 ${
        checked ? "bg-[#030D2E]" : "bg-slate-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
import { ChecklistItem, db, deleteTripCascade, EventItem, Expense, JournalEntry, Member, PackingItem, Trip } from "../../db";
import { ConfirmDeleteTripDialog } from "../../components/ConfirmDeleteTripDialog";
import { 
  checklistSections, 
  createTripExport, 
  formatDate, 
  formatMoney, 
  getWrappedStats, 
  moodLabels, 
  packingTripTypes, 
  safeFileName, 
  today, 
  TripData, 
  downloadBlob,
  getChecklistStats,
  getTripTiming
} from "../../utils/helpers";
import { exportTripExcel, exportTripPdf } from "../../utils/exports";
import { BottomSheet, FormActions, Input, ScreenTitle, TypedDeleteConfirmModal, classNames } from "../../components/ui";
import { JournalSection } from "../journal/JournalSection";
import { TravelDocumentsSection } from "./TravelDocumentsSection";

function TripForm({ trip, isOpen, onClose, onSaved }: { trip?: Trip; isOpen: boolean; onClose: () => void; onSaved: (id: number) => void }) {
  const [form, setForm] = useState<{
    title: string;
    location: string;
    tripType: "dayTrip" | "multiDay";
    startDate: string;
    endDate: string;
  }>({
    title: trip?.title ?? "",
    location: trip?.location ?? "",
    tripType: trip?.tripType ?? (trip?.startDate === trip?.endDate ? "dayTrip" : "multiDay"),
    startDate: trip?.startDate ?? today,
    endDate: trip?.endDate ?? today
  });

  const [dirty, setDirty] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        title: trip?.title ?? "",
        location: trip?.location ?? "",
        tripType: trip?.tripType ?? (trip?.startDate === trip?.endDate ? "dayTrip" : "multiDay"),
        startDate: trip?.startDate ?? today,
        endDate: trip?.endDate ?? today
      });
      setDirty(false);
      setSubmitAttempted(false);
    }
  }, [trip, isOpen]);

  const titleError = !form.title.trim() ? "Vui lòng nhập tên chuyến đi." : "";
  const startDateError = !form.startDate ? "Vui lòng chọn ngày bắt đầu." : "";
  const endDateError = form.tripType === "multiDay" && !form.endDate ? "Vui lòng chọn ngày kết thúc." : "";
  const dateCompareError = form.tripType === "multiDay" && form.endDate && form.startDate && form.endDate < form.startDate ? "Ngày kết thúc không thể trước ngày bắt đầu." : "";
  const hasError = !!titleError || !!startDateError || !!endDateError || !!dateCompareError;

  async function save() {
    setSubmitAttempted(true);
    if (hasError) return;

    const payload = { 
      ...form, 
      endDate: form.tripType === "dayTrip" ? form.startDate : form.endDate,
      createdAt: trip?.createdAt ?? new Date().toISOString() 
    };
    if (trip?.id) {
      await db.trips.update(trip.id, payload);
      onSaved(trip.id);
      onClose();
    } else {
      const id = await db.trips.add(payload);
      onSaved(id);
      onClose();
    }
  }

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose} 
      title={trip ? "Thông tin chuyến đi" : "Tạo chuyến đi"}
      subtitle={trip ? undefined : "Điền thông tin cơ bản trước, lịch trình và chi phí có thể thêm sau."}
      footer={
        <FormActions 
          onSave={save} 
          saveLabel={trip ? "Lưu thông tin" : "Tạo chuyến đi"} 
          disabled={hasError}
          onCancel={onClose}
        />
      }
    >
      <div className="space-y-4 md:space-y-5">
        <div>
          <Input 
            label={
              <span className="flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-slate-500" />
                Tên chuyến đi
              </span>
            } 
            value={form.title} 
            onChange={(title) => { setForm({ ...form, title }); setDirty(true); }} 
            placeholder="VD: Du lịch Đà Lạt" 
          />
          {(dirty || submitAttempted) && titleError && (
            <p className="mt-1.5 px-1 text-[13px] font-medium text-rose-500">{titleError}</p>
          )}
        </div>
        <Input 
          label={
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-500" />
              Điểm đến
            </span>
          } 
          value={form.location} 
          onChange={(location) => setForm({ ...form, location })} 
          placeholder="VD: Phú Quốc" 
        />
        
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <Clock3 className="h-4 w-4 text-slate-500" />
            Thời lượng chuyến đi
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, tripType: "dayTrip" })}
              className={classNames(
                "flex flex-col items-start justify-center rounded-[14px] px-4 py-3 text-left transition-all min-h-[64px]",
                form.tripType === "dayTrip"
                  ? "bg-kat-primary/10 ring-2 ring-inset ring-kat-primary"
                  : "bg-slate-50 ring-1 ring-inset ring-slate-200/60 hover:bg-slate-100"
              )}
            >
              <span className={classNames("text-[15px] font-bold", form.tripType === "dayTrip" ? "text-kat-primary" : "text-slate-700")}>Đi trong ngày</span>
              <span className={classNames("text-[12px] font-medium mt-0.5", form.tripType === "dayTrip" ? "text-kat-primary/80" : "text-slate-500")}>Đi và về trong cùng ngày</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, tripType: "multiDay" })}
              className={classNames(
                "flex flex-col items-start justify-center rounded-[14px] px-4 py-3 text-left transition-all min-h-[64px]",
                form.tripType === "multiDay"
                  ? "bg-kat-primary/10 ring-2 ring-inset ring-kat-primary"
                  : "bg-slate-50 ring-1 ring-inset ring-slate-200/60 hover:bg-slate-100"
              )}
            >
              <span className={classNames("text-[15px] font-bold", form.tripType === "multiDay" ? "text-kat-primary" : "text-slate-700")}>Nhiều ngày</span>
              <span className={classNames("text-[12px] font-medium mt-0.5", form.tripType === "multiDay" ? "text-kat-primary/80" : "text-slate-500")}>Có ngày khởi hành và ngày kết thúc</span>
            </button>
          </div>
        </div>

        {form.tripType === "dayTrip" ? (
          <div>
            <Input 
              label={
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  Ngày khởi hành
                </span>
              } 
              type="date" 
              value={form.startDate} 
              onChange={(startDate) => setForm({ ...form, startDate })} 
            />
            {(dirty || submitAttempted) && startDateError && (
              <p className="mt-1.5 px-1 text-[13px] font-medium text-rose-500">{startDateError}</p>
            )}
            <p className="mt-2 text-[13px] font-medium text-slate-500">Ngày kết thúc sẽ được tính cùng ngày bắt đầu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input 
                label={
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    Ngày khởi hành
                  </span>
                } 
                type="date" 
                value={form.startDate} 
                onChange={(startDate) => setForm({ ...form, startDate })} 
              />
              {(dirty || submitAttempted) && startDateError && (
                <p className="mt-1.5 px-1 text-[13px] font-medium text-rose-500">{startDateError}</p>
              )}
            </div>
            <div>
              <Input 
                label={
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    Ngày kết thúc
                  </span>
                } 
                type="date" 
                value={form.endDate} 
                onChange={(endDate) => setForm({ ...form, endDate })} 
              />
              {(dirty || submitAttempted) && (endDateError || dateCompareError) && (
                <p className="mt-1.5 px-1 text-[13px] font-medium text-rose-500">{endDateError || dateCompareError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

function MemberForm({ 
  tripId, 
  editing, 
  isOpen, 
  onClose,
  onShowToast
}: { 
  tripId: number; 
  editing: Member | null; 
  isOpen: boolean; 
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}) {
  const PRESETS = ["Người đồng hành", "Trưởng nhóm", "Quản lý chi phí", "Tài xế", "Phụ trách hành lý"];
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("Người đồng hành");
  const [customRole, setCustomRole] = useState("");
  const [note, setNote] = useState("");
  
  const [dirty, setDirty] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editing) {
        setName(editing.name ?? "");
        setPhone(editing.phone ?? "");
        setNote(editing.note ?? "");
        
        const currentRole = editing.role ?? "Người đồng hành";
        if (PRESETS.includes(currentRole)) {
          setSelectedPreset(currentRole);
          setCustomRole("");
        } else {
          setSelectedPreset("Khác");
          setCustomRole(currentRole);
        }
      } else {
        setName("");
        setPhone("");
        setSelectedPreset("Người đồng hành");
        setCustomRole("");
        setNote("");
      }
      setDirty(false);
      setSubmitAttempted(false);
    }
  }, [editing, isOpen]);

  const nameError = !name.trim() ? "Vui lòng nhập tên người đồng hành." : "";
  
  const phoneClean = phone.trim();
  const isPhoneInvalid = phoneClean !== "" && !/^(0[3|5|7|8|9])[0-9]{8}$/.test(phoneClean);
  const phoneError = isPhoneInvalid ? "Số điện thoại không đúng định dạng (VD: 0987654321)." : "";
  
  const customRoleError = selectedPreset === "Khác" && !customRole.trim() ? "Vui lòng nhập vai trò khác." : "";
  
  const hasError = !!nameError || !!phoneError || !!customRoleError;

  async function save() {
    setSubmitAttempted(true);
    if (hasError) return;

    const finalRole = selectedPreset === "Khác" ? customRole.trim() : selectedPreset;
    const payload = {
      tripId,
      name: name.trim(),
      phone: phone.trim(),
      role: finalRole,
      note: note.trim(),
      updatedAt: new Date().toISOString()
    };

    if (editing?.id) {
      await db.members.update(editing.id, payload);
      onShowToast?.("Đã cập nhật người đồng hành");
      onClose();
    } else {
      await db.members.add({
        ...payload,
        createdAt: new Date().toISOString()
      });
      onShowToast?.("Đã thêm người đồng hành");
      onClose();
    }
  }

  const getPresetIcon = (preset: string) => {
    switch (preset) {
      case "Người đồng hành": return <UsersRound className="h-3.5 w-3.5" />;
      case "Trưởng nhóm": return <Crown className="h-3.5 w-3.5 text-amber-500" />;
      case "Quản lý chi phí": return <WalletCards className="h-3.5 w-3.5 text-emerald-500" />;
      case "Tài xế": return <Car className="h-3.5 w-3.5 text-blue-500" />;
      case "Phụ trách hành lý": return <Luggage className="h-3.5 w-3.5 text-indigo-500" />;
      default: return null;
    }
  };

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editing ? "Sửa người đồng hành" : "Thêm người đồng hành"}
      footer={
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={hasError}
            onClick={save}
            className="flex-[2] inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-[#00BFB7] text-[#030D2E] px-6 font-black hover:brightness-105 active:scale-[0.98] transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-100 shadow-sm"
          >
            {editing ? (
              <Check className="h-4.5 w-4.5" strokeWidth={2.5} />
            ) : (
              <UserPlus className="h-4.5 w-4.5" strokeWidth={2.5} />
            )}
            {editing ? "Lưu thông tin" : "Thêm người đồng hành"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <Input 
            label={
              <span className="flex items-center gap-1.5">
                <UserRound className="h-4 w-4 text-slate-500" />
                Tên người đồng hành *
              </span>
            } 
            value={name} 
            onChange={(val) => { setName(val); setDirty(true); }} 
            placeholder="VD: Tùng" 
          />
          {(dirty || submitAttempted) && nameError && (
            <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{nameError}</p>
          )}
        </div>

        <div>
          <Input 
            label={
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-slate-500" />
                Số điện thoại
              </span>
            } 
            type="tel"
            value={phone} 
            onChange={(val) => { setPhone(val); setDirty(true); }} 
            placeholder="VD: 0987654321" 
          />
          {(dirty || submitAttempted) && phoneError ? (
            <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{phoneError}</p>
          ) : (
            <p className="mt-1.5 px-1 text-[12.5px] font-medium text-slate-400">Dùng để liên hệ nhanh trong chuyến đi khi cần.</p>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <BadgeCheck className="h-4 w-4 text-slate-500" />
            Vai trò trong chuyến đi
          </span>
          <div className="flex flex-wrap gap-2 mb-3">
            {[...PRESETS, "Khác"].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset);
                  setDirty(true);
                }}
                className={classNames(
                  "rounded-full px-4 py-2 text-[13.5px] font-extrabold transition-all duration-200 active:scale-95 border flex items-center gap-1.5",
                  selectedPreset === preset
                    ? "bg-[#00BFB7]/10 border-[#00BFB7] text-[#00BFB7]"
                    : "bg-[#FFFDF8] border-[#E8E1D8] text-slate-600 hover:bg-slate-50"
                )}
              >
                {getPresetIcon(preset)}
                <span>{preset}</span>
              </button>
            ))}
          </div>

          {selectedPreset === "Khác" && (
            <div className="mt-2.5 animate-fadeIn">
              <Input
                label="Vai trò khác *"
                value={customRole}
                onChange={(val) => { setCustomRole(val); setDirty(true); }}
                placeholder="VD: Nhiếp ảnh, Hậu cần..."
              />
              {(dirty || submitAttempted) && customRoleError && (
                <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{customRoleError}</p>
              )}
            </div>
          )}
          <p className="mt-1.5 px-1 text-[12.5px] font-medium text-slate-400">
            Vai trò giúp chia chi phí, chuẩn bị hành lý và ghi chú rõ ràng hơn.
          </p>
        </div>

        <div className="pt-1">
          <label className="block">
            <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
              <StickyNote className="h-4 w-4 text-slate-500" />
              Ghi chú
            </span>
            <textarea
              className="mt-1.5 min-h-[90px] w-full rounded-2xl border-0 bg-slate-50 px-4 py-3 text-[15px] font-medium outline-none ring-1 ring-inset ring-slate-200/60 transition-shadow focus:bg-white focus:ring-2 focus:ring-[#00BFB7] placeholder-slate-400"
              value={note}
              onChange={(event) => { setNote(event.target.value); setDirty(true); }}
              placeholder="VD: Ăn chay, dễ say xe, phụ trách đặt phòng..."
            />
          </label>
        </div>
      </div>
    </BottomSheet>
  );
}

function DeleteMemberConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  hasExpenses,
  hasChecklist
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  hasExpenses: boolean;
  hasChecklist: boolean;
}) {
  return (
    <TypedDeleteConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa người đồng hành này?"
      itemName={memberName}
      warning={
        hasExpenses || hasChecklist
          ? "Người đồng hành này đang liên quan đến chi phí hoặc checklist. Hãy kiểm tra trước khi xóa."
          : undefined
      }
      description={
        <>
          Người đồng hành <span className="font-extrabold text-[#030D2E]">{memberName}</span> sẽ không còn xuất hiện trong danh sách chuyến đi. Các dữ liệu liên quan như chi phí hoặc phân công có thể cần được kiểm tra lại.
        </>
      }
      confirmLabel="Xóa người đồng hành"
    />
  );
}

function DonateModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Ủng hộ tác giả">
      <div className="space-y-5 flex flex-col items-center text-center pb-4">
        {/* Coffee Icon */}
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
          <Coffee className="h-5 w-5" />
        </div>
        
        {/* Texts */}
        <div className="space-y-2 max-w-md">
          <h4 className="text-[18px] font-black text-[#030D2E]">Đồng hành cùng KAT Journey</h4>
          <p className="text-[14px] font-semibold leading-relaxed text-slate-500">
            Nếu KAT Journey hữu ích với bạn, bạn có thể gửi một ly cà phê nhỏ để ủng hộ tác giả tiếp tục phát triển ứng dụng.
          </p>
          <p className="text-[12px] font-medium text-slate-400">
            Ủng hộ là tùy chọn. Cảm ơn bạn đã sử dụng KAT Journey.
          </p>
        </div>

        {/* QR Code Card */}
        <div className="w-[85%] max-w-[280px] p-4 bg-[#FFFDF8] border border-[#E8E1D8] rounded-[24px] shadow-soft flex flex-col items-center transition-all hover:shadow-md">
          <img 
            src="/donates.webp" 
            alt="Donate QR Code" 
            className="w-full h-auto rounded-[16px] object-contain aspect-square" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="mt-3 text-[11px] font-extrabold text-[#030D2E] uppercase tracking-wider bg-slate-50/80 px-3 py-1 rounded-full border border-slate-100">
            Quét mã QR để chuyển khoản
          </span>
        </div>

        {/* Save QR action */}
        <a 
          href="/donates.webp" 
          download="kat-journey-donate-qr.webp"
          className="text-[13px] font-bold text-[#00BFB7] hover:underline flex items-center gap-1 active:scale-95 transition-all"
        >
          Lưu mã QR về máy
        </a>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full inline-flex min-h-[48px] items-center justify-center rounded-[16px] bg-[#FFFDF8] border border-[#E8E1D8] text-[#030D2E] px-6 font-bold hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
        >
          Đóng
        </button>
      </div>
    </BottomSheet>
  );
}

function WrappedSection({ data, setSection }: { data: TripData; setSection: (section: any) => void }) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const stats = getWrappedStats(data);
  const mood = stats.mostCommonMood ? moodLabels[stats.mostCommonMood] : undefined;

  // Derived Finance Data
  const sharedExpenses = data.expenses.filter(e => e.splitType !== "personal");
  const personalExpenses = data.expenses.filter(e => e.splitType === "personal");
  const sharedTotal = sharedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const personalTotal = personalExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Storytelling Logic
  const sortedEvents = [...data.events].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const sortedJournals = [...data.journals].sort((a, b) => a.date.localeCompare(b.date));
  
  let firstMomentText = "";
  if (sortedEvents.length > 0 && sortedJournals.length > 0) {
    if (sortedEvents[0].date <= sortedJournals[0].date) {
      firstMomentText = `Bạn đã bắt đầu với "${sortedEvents[0].title}" vào ngày ${formatDate(sortedEvents[0].date)}.`;
    } else {
      firstMomentText = `Kỷ niệm đầu tiên được ghi lại vào ngày ${formatDate(sortedJournals[0].date)}: "${sortedJournals[0].title}".`;
    }
  } else if (sortedEvents.length > 0) {
    firstMomentText = `Bạn đã bắt đầu với "${sortedEvents[0].title}" vào ngày ${formatDate(sortedEvents[0].date)}.`;
  } else if (sortedJournals.length > 0) {
    firstMomentText = `Kỷ niệm đầu tiên được ghi lại vào ngày ${formatDate(sortedJournals[0].date)}: "${sortedJournals[0].title}".`;
  }

  const eventsByDate = data.events.reduce<Record<string, import("../../db").EventItem[]>>((result, item) => {
    result[item.date] = [...(result[item.date] ?? []), item];
    return result;
  }, {});
  
  let maxEventsDate = "";
  let maxEventsCount = 0;
  Object.entries(eventsByDate).forEach(([date, evs]) => {
    if (evs.length > maxEventsCount) {
      maxEventsCount = evs.length;
      maxEventsDate = date;
    }
  });

  const uniqueLocations = Array.from(new Set(data.events.filter(e => e.location.trim() !== "").map(e => e.location.trim())));

  async function handleExportPdf() {
    setIsGeneratingPdf(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await exportTripPdf(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1120px] px-1 md:px-0 space-y-6 md:space-y-8 pb-24">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSection("overview")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent hover:bg-slate-100 text-slate-700 active:scale-95 transition-all shrink-0 motion-press"
            title="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[28px] md:text-[32px] font-extrabold tracking-tight text-[#030D2E]">Tổng kết hành trình</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-kat-primary/10 border border-kat-primary/20 px-2 py-0.5 text-[10px] font-black text-kat-primary uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                BẢN TỔNG KẾT
              </span>
            </div>
            <p className="mt-0.5 text-[14px] md:text-[15px] font-medium text-slate-500">Nhìn lại những dấu ấn đáng nhớ trong chuyến đi của bạn.</p>
          </div>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={isGeneratingPdf}
          className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-blue-50 border border-blue-200/60 text-blue-600 px-5 text-[13.5px] font-bold hover:bg-blue-100/60 active:scale-95 transition-all motion-press shadow-sm shrink-0 w-full sm:w-auto self-stretch sm:self-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileDown className={classNames("h-4 w-4 text-blue-500", !isGeneratingPdf && "animate-bounce")} />
          <span>{isGeneratingPdf ? "Đang xuất..." : "Xuất PDF"}</span>
        </button>
      </div>
      
      {/* Hero Recap Card */}
      <section className="relative overflow-hidden rounded-[32px] bg-[#FFFDF8] border border-[#E8E1D8] p-8 text-kat-text shadow-soft">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mb-4 ring-4 ring-kat-primary/5 border border-kat-primary/20">
            <Compass className="h-6 w-6" />
          </div>
          <h2 className="text-[30px] md:text-[36px] font-black leading-tight tracking-tight text-[#030D2E]">{data.trip.title}</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF7F1] border border-[#E8E1D8] px-4 py-2 text-[14px] font-bold text-slate-700">
              <MapPin className="h-4 w-4 text-kat-primary" />
              {data.trip.location || "Chưa có địa điểm"}
            </span>
            {data.trip.tripType === "dayTrip" || data.trip.startDate === data.trip.endDate ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF7F1] border border-[#E8E1D8] px-4 py-2 text-[14px] font-bold text-slate-700">
                  <CalendarDays className="h-4 w-4 text-[#0081BE]" />
                  {formatDate(data.trip.startDate)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-kat-primary-soft border border-kat-primary/15 px-3 py-1.5 text-[12.5px] font-extrabold text-kat-primary-usable">
                  <Clock3 className="h-3.5 w-3.5" />
                  Chuyến đi trong ngày
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF7F1] border border-[#E8E1D8] px-4 py-2 text-[14px] font-bold text-slate-700">
                <CalendarDays className="h-4 w-4 text-[#0081BE]" />
                {formatDate(data.trip.startDate)} – {formatDate(data.trip.endDate)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kat-primary/10 text-kat-primary border border-kat-primary/20">
            <SunMedium className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[28px] font-black text-[#030D2E] leading-none block">{stats.totalDays}</span>
            <span className="text-[12px] font-bold text-slate-500 mt-1 block">Ngày hành trình</span>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00BFB7]/10 text-[#00BFB7] border border-[#00BFB7]/20">
            <Route className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[28px] font-black text-[#030D2E] leading-none block">{stats.activityCount}</span>
            <span className="text-[12px] font-bold text-slate-500 mt-1 block">Mục lịch trình</span>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-kat-primary/10 text-kat-primary border border-kat-primary/20">
            <Luggage className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[28px] font-black text-[#030D2E] leading-none block">{stats.checklistPercent}%</span>
            <span className="text-[12px] font-bold text-slate-500 mt-1 block">Hành lý</span>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00BFB7]/10 text-[#00BFB7] border border-[#00BFB7]/20">
            <BookOpenText className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[28px] font-black text-[#030D2E] leading-none block">{stats.journalCount}</span>
            <span className="text-[12px] font-bold text-slate-500 mt-1 block">Trang nhật ký</span>
          </div>
        </div>
      </div>

      {/* Finance Recap */}
      <div className="rounded-[32px] bg-[#FFFDF8] border border-[#E8E1D8] p-8 text-kat-text shadow-soft relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-kat-primary" />
            CHI PHÍ CHUYẾN ĐI
          </h3>
          
          {data.expenses.length > 0 ? (
            <div className="space-y-6">
              <div>
                <p className="text-[14px] font-semibold text-slate-500">Tổng chi phí</p>
                <p className="mt-1 text-[36px] font-black text-[#030D2E] leading-none">{formatMoney(stats.totalExpense)}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#E8E1D8]/60 pt-6 max-w-md">
                <div>
                  <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Chi chung chuyến đi</p>
                  <p className="mt-1 text-[18px] font-black text-kat-primary-usable">{formatMoney(sharedTotal)}</p>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Chi cá nhân</p>
                  <p className="mt-1 text-[18px] font-black text-[#030D2E]">{formatMoney(personalTotal)}</p>
                </div>
              </div>
              
              {data.members.length === 0 ? (
                <div className="border-t border-[#E8E1D8]/60 pt-6">
                  <div className="rounded-2xl border border-[#E8E1D8] bg-[#FAF7F1]/50 px-4 py-3.5 text-[13.5px] text-slate-500 font-semibold leading-relaxed">
                    Chưa có người đồng hành để gợi ý cân đối chia tiền.
                  </div>
                </div>
              ) : (
                <>
                  {stats.topPayer && (
                    <div className="border-t border-[#E8E1D8]/60 pt-6">
                      <p className="text-[14px] font-semibold text-slate-500">Nhà tài trợ chính</p>
                      <p className="mt-1 text-[14.5px] font-medium leading-relaxed text-slate-600">
                        <span className="font-extrabold text-[#030D2E]">{stats.topPayer.name}</span> là người chi nhiều nhất với <span className="font-extrabold text-kat-primary-usable">{formatMoney(stats.topPayer.amount)}</span>.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-6 border border-[#E8E1D8]/60 rounded-2xl bg-[#FAF7F1]/40">
              <p className="text-[14.5px] font-semibold text-slate-500">Chưa có dữ liệu chi phí cho chuyến đi này.</p>
            </div>
          )}
        </div>
      </div>

      {/* Memory / Mood Section */}
      <div className="rounded-[32px] border border-[#E8E1D8] bg-[#FFFDF8] p-8 shadow-soft text-center flex flex-col items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 mb-4 ring-4 ring-amber-500/5">
          <SmilePlus className="h-6 w-6" />
        </div>
        <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-wider mb-2">DẤU ẤN CẢM XÚC</h3>
        {mood ? (
          <p className="mt-2 text-[26px] md:text-[30px] font-black text-[#030D2E]">{mood}</p>
        ) : (
          <div className="flex flex-col items-center mt-2">
            <p className="text-[16px] font-extrabold text-[#030D2E] mb-1.5">Chưa có đủ nhật ký để tổng kết cảm xúc chuyến đi.</p>
            <p className="text-[14px] font-semibold text-slate-500 mb-5 max-w-sm">Viết thêm nhật ký để lưu lại cảm xúc và khoảnh khắc đáng nhớ.</p>
            <button 
              onClick={() => setSection("journal")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-kat-primary/10 border border-kat-primary/30 px-5 py-2.5 text-[14px] font-extrabold text-kat-text hover:bg-kat-primary/20 active:scale-[0.98] transition-all"
            >
              <BookOpenText className="h-4.5 w-4.5 text-blue-500" />
              Ghi nhật ký đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Storytelling Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* First Moment */}
        <div className="rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-5 w-5 text-amber-500" />
            <h4 className="text-[12px] font-extrabold text-slate-400 uppercase tracking-widest">DẤU ẤN ĐẦU TIÊN</h4>
          </div>
          <p className="text-[14.5px] font-semibold text-slate-500 leading-relaxed">
            {firstMomentText || "Chưa có dấu ấn đầu tiên. Hãy thêm mục lịch trình hoặc ghi nhật ký để lưu lại khoảnh khắc mở đầu."}
          </p>
        </div>

        {/* Most Eventful Day */}
        <div className="rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-5 w-5 text-amber-500" />
            <h4 className="text-[12px] font-extrabold text-slate-400 uppercase tracking-widest">NGÀY NỔI BẬT NHẤT</h4>
          </div>
          <p className="text-[14.5px] font-semibold text-slate-500 leading-relaxed">
            {maxEventsDate ? (
              <>
                <span className="font-extrabold text-amber-600">{formatDate(maxEventsDate)}</span> là ngày bận rộn nhất với <span className="font-bold text-[#030D2E]">{maxEventsCount} mục lịch trình</span> được ghi nhận.
              </>
            ) : (
              "Chưa có ngày nào đủ dữ liệu để chọn làm ngày nổi bật."
            )}
          </p>
        </div>

        {/* Locations Visited */}
        <div className="rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] p-6 shadow-soft flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <MapPinned className="h-5 w-5 text-kat-primary" />
            <h4 className="text-[12px] font-extrabold text-slate-400 uppercase tracking-widest">ĐIỂM ĐẾN ĐÃ GHÉ QUA</h4>
          </div>
          <p className="text-[14.5px] font-semibold text-slate-500 leading-relaxed">
            {uniqueLocations.length > 0 ? uniqueLocations.join(", ") : "Chưa có điểm đến cụ thể nào trong lịch trình."}
          </p>
        </div>
      </div>
    </div>
  );
}



function MiniStatCard({ 
  label, 
  value, 
  colorClass 
}: { 
  label: string; 
  value: string | number; 
  colorClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100/60 bg-white p-3.5 shadow-inner flex flex-col justify-center min-h-[72px] transition-all hover:scale-[1.01]">
      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">{label}</span>
      <span className={classNames("text-[15.5px] font-black mt-1.5 truncate leading-none", colorClass)}>
        {value}
      </span>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  onClick,
  iconBgColor = "bg-[#00BFB7]/10",
  iconTextColor = "text-[#00BFB7]",
  className = "",
  titleClassName = "text-[#030D2E]",
  rightElement
}: {
  icon: React.ElementType;
  title: string;
  onClick?: () => void;
  iconBgColor?: string;
  iconTextColor?: string;
  className?: string;
  titleClassName?: string;
  rightElement?: React.ReactNode;
}) {
  const content = (
    <>
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className={classNames(
          "flex shrink-0 h-10 w-10 items-center justify-center rounded-xl border transition-colors",
          iconBgColor,
          iconTextColor
        )}>
          <Icon className="h-5.5 w-5.5" strokeWidth={2.2} />
        </div>
        <span className={classNames("text-base font-medium truncate leading-none", titleClassName)}>
          {title}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 pl-2">
        {rightElement !== undefined ? (
          rightElement
        ) : (
          onClick && <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={classNames(
          "group flex w-full items-center justify-between bg-[#FFFDF8] border border-[#E8E1D8] px-4 py-3 rounded-2xl min-h-[56px] text-left hover:bg-slate-50/60 transition-all focus:outline-none focus:ring-2 focus:ring-[#00BFB7]/50 motion-press md:motion-hover-lift",
          className
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={classNames(
        "flex w-full items-center justify-between bg-[#FFFDF8] border border-[#E8E1D8] px-4 py-3 rounded-2xl min-h-[56px]",
        className
      )}
    >
      {content}
    </div>
  );
}




function MemberCardRow({
  member,
  checklist,
  expenses,
  openEditMember,
  onDeleteMember
}: {
  member: Member;
  checklist: ChecklistItem[];
  expenses: Expense[];
  openEditMember: (member: Member) => void;
  onDeleteMember: (member: Member) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const initial = member.name.trim().charAt(0).toUpperCase() || "?";
                
  // Helper computations
  const assignedTasksCount = checklist.filter(c => c.assignedTo === member.name).length;
  const memberExpenses = expenses.filter(e => e.payer === member.name);
  const paidExpensesCount = memberExpenses.length;
  const totalSpent = memberExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="relative rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {/* Avatar Initials */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00BFB7]/10 text-[#00BFB7] text-[18px] font-black shadow-inner">
            {initial}
          </div>

          {/* Member details */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <UserRound className="h-4.5 w-4.5 text-[#030D2E]/60 shrink-0" />
                <h4 className="text-[17px] font-extrabold text-[#030D2E] truncate">{member.name}</h4>
              </div>
              {(() => {
                const isLeader = member.role === "Trưởng đoàn" || member.role === "Trưởng nhóm" || member.role === "Người đại diện";
                return (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#00BFB7]/10 border border-[#00BFB7]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#00BFB7]">
                    {isLeader && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                    {member.role || "Bạn đồng hành"}
                  </span>
                );
              })()}
            </div>
            {member.phone && (
              <p className="text-[13.5px] font-semibold text-slate-500">
                SĐT: <span className="text-[#030D2E]">{member.phone}</span>
              </p>
            )}
            {member.note && (
              <p className="text-[13px] font-medium text-slate-400 italic mt-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100/50 break-words">
                "{member.note}"
              </p>
            )}
          </div>
        </div>

        {/* Dropdown Menu Trigger (min 44x44px target) */}
        <div className="relative shrink-0">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00BFB7]/40"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            title="Tùy chọn"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30 cursor-default"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
              />
              <div className="absolute right-0 bottom-full mb-1 z-40 w-32 rounded-2xl border border-slate-150 bg-white p-1.5 shadow-lg text-left">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    openEditMember(member);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <Edit2 className="h-4 w-4 text-slate-500" />
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onDeleteMember(member);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mini Stats Row */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap gap-2 text-[12px]">
          <span className={classNames(
            "flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg",
            assignedTasksCount === 0 ? "text-slate-400 font-medium" : "text-slate-700 font-bold"
          )}>
            <Luggage className="h-3.5 w-3.5 text-current shrink-0" />
            {assignedTasksCount} việc
          </span>
          <span className={classNames(
            "flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg",
            totalSpent === 0 ? "text-slate-400 font-medium" : "text-slate-700 font-bold"
          )}>
            <WalletCards className="h-3.5 w-3.5 text-current shrink-0" />
            Đã chi: {formatMoney(totalSpent)} {paidExpensesCount > 0 && `(${paidExpensesCount} lần)`}
          </span>
        </div>
      </div>
    </div>
  );
}

import { ensureAnonymousUser, firebaseEnabled } from "../../lib/firebase";

export function MoreScreen({
  trip,
  members,
  events,
  expenses,
  checklist,
  journals,
  packingItems,
  travelDocuments,
  onTripDeleted,
  onTripSelected,
  onShowToast,
  section,
  setSection,
  onOpenInbox
}: {
  trip: Trip;
  members: Member[];
  events: EventItem[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  journals: JournalEntry[];
  packingItems: PackingItem[];
  travelDocuments?: import("../../db").TravelDocument[];
  onTripDeleted: () => void;
  onTripSelected: (id: number) => void;
  onShowToast?: (msg: string) => void;
  section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents";
  setSection: (section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents") => void;
  onOpenInbox?: () => void;
}) {
  const [editingTrip, setEditingTrip] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isDataSectionOpen, setIsDataSectionOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  // Modal confirmations states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [selectedFileForRestore, setSelectedFileForRestore] = useState<File | null>(null);
  const [isFactoryResetConfirmOpen, setIsFactoryResetConfirmOpen] = useState(false);

  // Delete Member Confirm Dialog states
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleteMemberConfirmOpen, setIsDeleteMemberConfirmOpen] = useState(false);

  // Cloud share states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareOptions, setShareOptions] = useState({
    includeExpenses: true,
    includeJournals: true,
    includeChecklist: true,
    includeBackupPlans: true,
    includeDocuments: false,
  });
  const [copiedLink, setCopiedLink] = useState(false);

  const activeShareLink = trip.shareToken ? {
    token: trip.shareToken,
    url: `${window.location.origin}/share/${trip.shareToken}`
  } : null;

  const tripData = { trip, members, events, expenses, checklist, journals, packingItems, travelDocuments };

  async function handleShareTrip() {
    if (!firebaseEnabled) {
      alert("Chưa cấu hình Firebase. Vui lòng kiểm tra môi trường (env).");
      return;
    }
    setShareLoading(true);
    try {
      await ensureAnonymousUser();
      setIsShareModalOpen(true);
    } catch (e: any) {
      alert("Không thể kết nối Firebase: " + e.message);
    } finally {
      setShareLoading(false);
    }
  }

  async function handleCreateLink() {
    try {
      setShareLoading(true);
      const { createShareLink } = await import("../../services/cloudShareService");
      await createShareLink(trip.id!, { ...shareOptions, mode: "request_edit" });
    } catch (e: any) {
      alert("Lỗi khi tạo link chia sẻ. Vui lòng thử lại sau.");
      console.error(e);
    } finally {
      setShareLoading(false);
    }
  }

  async function handleRevokeLink() {
    if (!activeShareLink) return;
    try {
      setShareLoading(true);
      const { revokeShareLink } = await import("../../services/cloudShareService");
      await revokeShareLink(trip.id!, activeShareLink.token);
      alert("Đã tắt link chia sẻ.");
    } catch (e: any) {
      alert("Lỗi khi tắt link chia sẻ. Vui lòng thử lại sau.");
      console.error(e);
    } finally {
      setShareLoading(false);
    }
  }

  async function executeDeleteMember() {
    if (!memberToDelete?.id) return;
    await db.members.delete(memberToDelete.id);
    onShowToast?.("Đã xóa người đồng hành");
    setIsDeleteMemberConfirmOpen(false);
    setMemberToDelete(null);
  }

  async function executeDeleteTrip() {
    if (!trip.id) return;
    await deleteTripCascade(trip.id);
    onShowToast?.("Đã xóa chuyến đi khỏi thiết bị này.");
    onTripDeleted();
  }

  function exportTrip() {
    try {
      const payload = createTripExport(tripData);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      downloadBlob(blob, `${safeFileName(trip.title)}.kattrip`);
      onShowToast?.("Đã tạo bản sao lưu thành công");
    } catch {
      onShowToast?.("Đã xảy ra lỗi khi tạo sao lưu");
    }
  }

  async function importTrip(file?: File) {
    if (!file) return;
    setImporting(true);
    try {
      const parsed = JSON.parse(await file.text()) as Partial<import("../../utils/helpers").TripExport>;
      if (parsed.app !== "KAT Journey" || !parsed.trip?.title) {
        throw new Error("Tệp không đúng định dạng KAT Journey.");
      }

      const newTripId = await db.transaction("rw", [db.trips, db.members, db.events, db.expenses, db.checklist, db.journals, db.packingItems, db.travelDocuments, db.backupPlans], async () => {
        const importedTrip = parsed.trip!;
        const id = await db.trips.add({
          title: `${importedTrip.title} (import)`,
          location: importedTrip.location ?? "",
          startDate: importedTrip.startDate || today,
          endDate: importedTrip.endDate || importedTrip.startDate || today,
          createdAt: new Date().toISOString()
        });

        const importedMembers = (parsed.members ?? []).map((member) => ({
            tripId: id,
            name: member.name ?? "",
            phone: member.phone ?? "",
            role: member.role ?? ""
          }));
        const importedEvents = (parsed.events ?? []).map((event) => ({
            tripId: id,
            date: event.date || today,
            time: event.time ?? "",
            title: event.title ?? "",
            location: event.location ?? "",
            notes: event.notes ?? "",
            mapLink: event.mapLink ?? "",
            completed: Boolean(event.completed)
          }));
        const importedExpenses = (parsed.expenses ?? []).map((expense) => ({
            tripId: id,
            amount: Number(expense.amount || 0),
            payer: expense.payer ?? "",
            category: expense.category ?? "Khác",
            description: expense.description ?? "",
            splitType: expense.splitType ?? "shared"
          }));
        const importedChecklist = (parsed.checklist ?? []).map((item) => ({
            tripId: id,
            section: checklistSections.includes(item.section as import("../../db").ChecklistSection) ? (item.section as import("../../db").ChecklistSection) : "Before Trip",
            title: item.title ?? "",
            completed: Boolean(item.completed)
          }));
        const importedJournals = (parsed.journals ?? []).map((entry) => ({
            tripId: id,
            date: entry.date || today,
            title: entry.title ?? "",
            content: entry.content ?? "",
            mood: (["very_bad", "bad", "okay", "good", "great"].includes(entry.mood as string)) ? (entry.mood as import("../../db").JournalMood) : "okay"
          }));
        const importedPackingItems = (parsed.packingItems ?? []).map((item) => ({
            tripId: id,
            tripType: packingTripTypes.includes(item.tripType as import("../../db").PackingTripType) ? (item.tripType as import("../../db").PackingTripType) : "Thành phố",
            title: item.title ?? "",
            completed: Boolean(item.completed)
          }));
        const importedDocuments = (parsed.travelDocuments ?? []).map((doc) => ({
            tripId: id,
            title: doc.title ?? "",
            type: doc.type ?? "other",
            code: doc.code ?? "",
            date: doc.date ?? "",
            link: doc.link ?? "",
            note: doc.note ?? ""
          }));
        const importedBackupPlans = (parsed.backupPlans ?? []).map((plan) => ({
            tripId: id,
            title: plan.title ?? "",
            type: plan.type ?? "other",
            reason: plan.reason ?? "",
            location: plan.location ?? "",
            note: plan.note ?? "",
            activityId: plan.activityId,
            date: plan.date
          }));

        if (importedMembers.length) await db.members.bulkAdd(importedMembers);
        if (importedEvents.length) await db.events.bulkAdd(importedEvents);
        if (importedExpenses.length) await db.expenses.bulkAdd(importedExpenses);
        if (importedChecklist.length) await db.checklist.bulkAdd(importedChecklist);
        if (importedJournals.length) await db.journals.bulkAdd(importedJournals);
        if (importedPackingItems.length) await db.packingItems.bulkAdd(importedPackingItems);
        if (importedDocuments.length) await db.travelDocuments.bulkAdd(importedDocuments);
        if (importedBackupPlans.length) await db.backupPlans.bulkAdd(importedBackupPlans);
        return id;
      });

      onTripSelected(newTripId);
      onShowToast?.("Đã nhập bản sao lưu thành công.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể import tệp này.");
    } finally {
      setImporting(false);
    }
  }

  async function factoryReset() {
    try {
      await db.delete();
      alert("Đã xóa dữ liệu thành công. Đang tải lại trang...");
      window.location.reload();
    } catch (e) {
      alert("Đã xảy ra lỗi khi xóa dữ liệu.");
    }
  }

  function openNewMember() {
    setEditingMember(null);
    setIsMemberFormOpen(true);
  }

  function openEditMember(member: Member) {
    setEditingMember(member);
    setIsMemberFormOpen(true);
  }

  const getTripDurationText = () => {
    const isDayTrip = trip.tripType === "dayTrip" || trip.startDate === trip.endDate;
    if (isDayTrip) return "Chuyến đi trong ngày";
    try {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Dài ngày";
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const diffNights = diffDays > 1 ? diffDays - 1 : 0;
      return `${diffDays} ngày ${diffNights} đêm`;
    } catch {
      return "Dài ngày";
    }
  };

  if (section === "journal") return <JournalSection tripId={trip.id!} journals={journals} onShowToast={onShowToast} onBack={() => setSection("overview")} />;
  if (section === "wrapped") return <WrappedSection data={tripData} setSection={setSection} />;
  if (section === "documents") return <TravelDocumentsSection tripId={trip.id!} onBack={() => setSection("overview")} onShowToast={onShowToast} />;
  
  if (section === "members") {
    const membersWithTasks = members.filter(m => checklist.some(c => c.assignedTo === m.name)).length;
    const membersWithExpenses = members.filter(m => expenses.some(e => e.payer === m.name)).length;

    return (
      <div className="mx-auto max-w-[960px] space-y-6 pb-0 md:pb-8">
        {/* Header / Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSection("overview")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent hover:bg-slate-100 text-slate-700 active:scale-95 transition-all shrink-0"
              title="Quay lại"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-[28px] md:text-[32px] font-extrabold tracking-tight text-[#030D2E]">Người đồng hành</h2>
              <p className="mt-0.5 text-[14px] md:text-[15px] font-medium text-slate-500">Quản lý những người cùng tham gia và chia sẻ hành trình.</p>
            </div>
          </div>
          <button 
            className="flex h-11 sm:h-12 items-center justify-center gap-1.5 rounded-2xl bg-[#00BFB7] px-5 text-[14px] font-black text-[#030D2E] transition-all hover:brightness-105 active:scale-[0.98] shadow-sm w-full sm:w-auto shrink-0"
            onClick={openNewMember}
          >
            <UserPlus className="w-4.5 h-4.5" strokeWidth={2.5} />
            Thêm người đồng hành
          </button>
        </div>

        {/* Overview Card */}
        <div className="rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] p-5 shadow-soft">
          {members.length ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="flex flex-col">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Người đồng hành</span>
                  <span className="text-[18px] md:text-[20px] font-black text-[#030D2E] mt-1">{members.length} người</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Được phân công</span>
                  <span className="text-[18px] md:text-[20px] font-black text-[#030D2E] mt-1">{membersWithTasks} người</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Đã chi trả</span>
                  <span className="text-[18px] md:text-[20px] font-black text-[#030D2E] mt-1">{membersWithExpenses} người</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Chia chi phí</span>
                  <span className={classNames(
                    "text-[12.5px] font-black mt-1 inline-flex items-center px-3 py-1 rounded-full w-fit leading-none border", 
                    members.length >= 2 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                      : "bg-slate-50 text-slate-500 border-slate-100"
                  )}>
                    {members.length >= 2 ? "Sẵn sàng" : "Cần ≥ 2 người"}
                  </span>
                </div>
              </div>
              {members.length < 2 && (
                <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5 text-[13px] font-semibold text-slate-500">
                  <UsersRound className="h-4.5 w-4.5 text-[#00BFB7] shrink-0" />
                  <p>Thêm người đồng hành để chia chi phí, phân công chuẩn bị và tổng kết chuyến đi rõ ràng hơn.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2.5 py-1 text-[14px] md:text-[15px] font-semibold text-slate-500 leading-relaxed">
              <UsersRound className="h-5 w-5 text-[#00BFB7] shrink-0 mt-0.5" />
              <span>Thêm người đồng hành để chia chi phí, phân công chuẩn bị và tổng kết chuyến đi rõ ràng hơn.</span>
            </div>
          )}
        </div>

        {/* Member List Section */}
        <section className="space-y-4">
          <h3 className="text-[17px] font-extrabold text-[#030D2E] px-1">Danh sách người đồng hành {members.length > 0 && `(${members.length})`}</h3>
          
          {members.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <MemberCardRow
                  key={member.id}
                  member={member}
                  checklist={checklist}
                  expenses={expenses}
                  openEditMember={openEditMember}
                  onDeleteMember={(m) => {
                    setMemberToDelete(m);
                    setIsDeleteMemberConfirmOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            /* Empty State Layout */
            <div className="rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] p-6 text-center shadow-soft max-w-md mx-auto my-6 animate-fadeIn">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mx-auto mb-4 ring-4 ring-kat-primary/5">
                <UsersRound className="h-6 w-6" />
              </div>
              <h3 className="text-[16px] font-bold text-[#030D2E]">Chưa có người đồng hành nào</h3>
              <p className="mt-2 text-[14.5px] font-semibold text-slate-500 leading-relaxed">
                Thêm người đồng hành để cùng chia chi phí, chuẩn bị hành lý và lưu lại vai trò trong chuyến đi.
              </p>
              <button
                onClick={openNewMember}
                className="mt-5 inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#00BFB7] text-[#030D2E] px-6 text-[14px] font-black transition-all hover:brightness-105 active:scale-95 shadow-sm"
              >
                <UserPlus className="w-4.5 h-4.5" strokeWidth={2.5} />
                Thêm người đồng hành đầu tiên
              </button>
            </div>
          )}
        </section>

        <MemberForm
          tripId={trip.id!}
          editing={editingMember}
          isOpen={isMemberFormOpen}
          onClose={() => setIsMemberFormOpen(false)}
          onShowToast={onShowToast}
        />
        
        <DeleteMemberConfirmModal
          isOpen={isDeleteMemberConfirmOpen}
          onClose={() => {
            setIsDeleteMemberConfirmOpen(false);
            setMemberToDelete(null);
          }}
          onConfirm={executeDeleteMember}
          memberName={memberToDelete?.name ?? ""}
          hasExpenses={memberToDelete ? expenses.some(e => e.payer === memberToDelete.name) : false}
          hasChecklist={memberToDelete ? checklist.some(c => c.assignedTo === memberToDelete.name) : false}
        />
      </div>
    );
  }

  if (section === "settings") {
    return (
      <div className="mx-auto max-w-[640px] space-y-6 pb-0 md:pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[32px] font-extrabold tracking-tight text-[#030D2E]">Không gian chuyến đi</h2>
            <p className="mt-1 text-[15px] font-medium text-slate-500">Quản lý ứng dụng và cấu hình dữ liệu.</p>
          </div>
          <button
            onClick={() => setSection("overview")}
            className="flex h-10 items-center justify-center rounded-full bg-[#EDEAE2] border border-[#C8BDB0] px-4 text-[13.5px] font-bold text-[#030D2E] transition-all hover:bg-[#E2DDD3] active:scale-95 shadow-sm"
          >
            Quay lại
          </button>
        </div>
        
        <div className="flex flex-col gap-2">
          <ActionCard
            icon={BadgeInfo}
            title="Phiên bản ứng dụng"
            iconBgColor="bg-slate-50"
            iconTextColor="text-slate-600 border-slate-100"
            rightElement={
              <span className="text-sm font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60">
                2.0.0
              </span>
            }
          />
          <ActionCard
            icon={Trash2}
            title="Khôi phục cài đặt gốc"
            onClick={() => setIsFactoryResetConfirmOpen(true)}
            iconBgColor="bg-rose-50"
            iconTextColor="text-rose-600 border-rose-100/60"
            titleClassName="text-rose-600 font-semibold"
            className="border-rose-100 bg-rose-50/10 hover:bg-rose-50/20 text-rose-600 focus:ring-rose-500/50"
          />
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-[13.5px] font-bold text-slate-400">
            thực hiện bởi{" "}
            <a
              href="https://www.youtube.com/@kat.thanhtungg"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-slate-500"
            >
              thanhtungg.
            </a>
          </p>
        </div>
      </div>
    );
  }

  const checklistPercent = getChecklistStats(checklist).percent;
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const tripDurationText = getTripDurationText();

  return (
    <div className="mx-auto max-w-[800px] px-2 md:px-0">
      <div className="flex flex-col gap-6 pb-0 md:pb-8">
        
        {/* Title Block */}
        <div>
          <h2 className="text-[32px] font-extrabold tracking-tight text-[#030D2E]">Không gian chuyến đi</h2>
          <p className="mt-1 text-[15px] font-medium text-slate-500">
            Tùy chỉnh thông tin, người đồng hành và dữ liệu cho hành trình của bạn.
          </p>
        </div>

        {/* Hero chuyến đi compact hơn */}
        <section className="relative overflow-hidden rounded-[28px] bg-[#FFFDF8] border border-[#E8E1D8] p-5 md:p-6 text-kat-text shadow-soft">
          <Compass className="absolute -right-6 -bottom-6 w-32 h-32 text-kat-primary/[0.04] rotate-12 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-4">
            {/* Header info */}
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Hành trình hiện tại</p>
              <h3 className="mt-1 break-words text-[24px] md:text-[28px] font-black leading-tight tracking-tight text-[#030D2E]">
                {trip.title}
              </h3>
            </div>
            
            {/* Metadata tags */}
            <div className="flex flex-wrap gap-2 text-[12.5px] font-bold text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF7F1] border border-[#E8E1D8] px-3 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-kat-primary" />
                {trip.location || "Chưa có địa điểm"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF7F1] border border-[#E8E1D8] px-3 py-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-kat-primary" />
                {trip.startDate === trip.endDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF7F1] border border-[#E8E1D8] px-3 py-1.5">
                <Clock3 className="h-3.5 w-3.5 text-kat-primary" />
                {tripDurationText}
              </span>
            </div>

            {/* Compact inline stats pills */}
            <div className="flex flex-wrap gap-2 pt-2.5 border-t border-slate-200/60 mt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-kat-primary-soft border border-kat-primary/20 px-3 py-1.5 text-[12.5px] font-extrabold text-kat-primary-usable">
                <UsersRound className="h-3.5 w-3.5" />
                {members.length} người đồng hành
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0081BE]/8 border border-[#0081BE]/15 px-3 py-1.5 text-[12.5px] font-extrabold text-[#0081BE]">
                <Route className="h-3.5 w-3.5" />
                {events.length} lịch trình
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/15 px-3 py-1.5 text-[12.5px] font-extrabold text-emerald-600">
                <WalletCards className="h-3.5 w-3.5" />
                {formatMoney(totalExpense)} chi phí
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F89B02]/8 border border-[#F89B02]/15 px-3 py-1.5 text-[12.5px] font-extrabold text-[#F89B02]">
                <Luggage className="h-3.5 w-3.5" />
                Chuẩn bị {checklistPercent}%
              </span>
            </div>
          </div>
        </section>

        {/* Thao tác chính */}
        <section className="space-y-3">
          <h3 className="px-2 text-[15px] font-extrabold uppercase tracking-wider text-slate-400">Công cụ hành trình</h3>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
            <ActionCard
              icon={MapPinned}
              title="Thông tin chuyến đi"
              onClick={() => setEditingTrip(true)}
              iconBgColor="bg-sky-50"
              iconTextColor="text-sky-600 border-sky-100"
            />
            <ActionCard
              icon={UsersRound}
              title="Người đồng hành"
              onClick={() => setSection("members")}
              iconBgColor="bg-amber-50"
              iconTextColor="text-amber-600 border-amber-100"
            />
            <ActionCard
              icon={Trophy}
              title="Tổng kết hành trình"
              onClick={() => setSection("wrapped")}
              iconBgColor="bg-indigo-50"
              iconTextColor="text-indigo-600 border-indigo-100"
            />
            <ActionCard
              icon={BookOpenText}
              title="Nhật ký hành trình"
              onClick={() => setSection("journal")}
              iconBgColor="bg-emerald-50"
              iconTextColor="text-emerald-600 border-emerald-100"
            />
            <ActionCard
              icon={TicketCheck}
              title="Vé, đặt chỗ & giấy tờ"
              onClick={() => setSection("documents")}
              iconBgColor="bg-teal-50"
              iconTextColor="text-teal-600 border-teal-100"
            />
            <ActionCard
              icon={Share2}
              title="Chia sẻ chuyến đi"
              onClick={handleShareTrip}
              iconBgColor="bg-violet-50"
              iconTextColor="text-violet-600 border-violet-100"
            />
          </div>
        </section>

        {/* Hệ thống */}
        <section className="space-y-3">
          <h3 className="px-2 text-[15px] font-extrabold uppercase tracking-wider text-slate-400">HỆ THỐNG</h3>
          <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
            <div className="flex flex-col gap-2 md:col-span-2">
              <ActionCard
                icon={DatabaseBackup}
                title="Dữ liệu chuyến đi"
                onClick={() => setIsDataSectionOpen(!isDataSectionOpen)}
                iconBgColor="bg-blue-50"
                iconTextColor="text-blue-600 border-blue-100"
                rightElement={
                  <ChevronRight 
                    className={classNames(
                      "h-5 w-5 text-muted-foreground transition-transform duration-200", 
                      isDataSectionOpen ? "rotate-90" : ""
                    )} 
                  />
                }
              />
              
              {isDataSectionOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4 border-l border-slate-200 mt-1 animate-fadeIn">
                  <ActionCard
                    icon={Download}
                    title="Sao lưu hành trình"
                    onClick={exportTrip}
                    iconBgColor="bg-sky-50"
                    iconTextColor="text-sky-600 border-sky-100"
                  />
                  
                  <label className="group flex w-full cursor-pointer items-center justify-between bg-[#FFFDF8] border border-[#E8E1D8] px-4 py-3 rounded-2xl min-h-[56px] text-left hover:bg-slate-50/60 transition-all focus-within:ring-2 focus-within:ring-[#00BFB7]/50 motion-press md:motion-hover-lift">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="flex shrink-0 h-10 w-10 items-center justify-center rounded-xl border bg-indigo-50 text-indigo-600 border-indigo-100">
                        <ArchiveRestore className="h-5.5 w-5.5" strokeWidth={2.2} />
                      </div>
                      <span className="text-base font-medium text-[#030D2E] truncate leading-none">
                        {importing ? "Đang nhập..." : "Khôi phục hành trình"}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    <input
                      className="sr-only"
                      type="file"
                      accept=".kattrip,application/json"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          setSelectedFileForRestore(file);
                          setIsRestoreConfirmOpen(true);
                        }
                        event.target.value = "";
                      }}
                    />
                  </label>

                  <ActionCard
                    icon={FileText}
                    title="Xuất báo cáo PDF"
                    onClick={() => exportTripPdf(tripData)}
                    iconBgColor="bg-rose-50"
                    iconTextColor="text-rose-600 border-rose-100"
                  />
                  
                  <ActionCard
                    icon={Table2}
                    title="Xuất bảng tính Excel"
                    onClick={() => exportTripExcel(tripData)}
                    iconBgColor="bg-emerald-50"
                    iconTextColor="text-emerald-600 border-emerald-100"
                  />
                </div>
              )}
            </div>

            <ActionCard
              icon={BadgeInfo}
              title="Phiên bản ứng dụng"
              iconBgColor="bg-slate-50"
              iconTextColor="text-slate-600 border-slate-100"
              rightElement={
                <span className="text-sm font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60">
                  2.0.0
                </span>
              }
            />

            <ActionCard
              icon={Coffee}
              title="Ủng hộ dự án"
              onClick={() => setIsDonateOpen(true)}
              iconBgColor="bg-amber-50"
              iconTextColor="text-amber-600 border-amber-100"
            />
          </div>
        </section>

        {/* Vùng nguy hiểm */}
        <section className="space-y-3 pt-2">
          <h3 className="px-2 text-[15px] font-extrabold uppercase tracking-wider text-rose-500/80">Vùng thao tác cẩn trọng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <ActionCard
              icon={Trash2}
              title="Xóa vĩnh viễn chuyến đi"
              onClick={() => setIsDeleteConfirmOpen(true)}
              iconBgColor="bg-rose-50"
              iconTextColor="text-rose-600 border-rose-100/60"
              titleClassName="text-rose-600 font-semibold"
              className="border-rose-100 bg-rose-50/10 hover:bg-rose-50/20 text-rose-600 focus:ring-rose-500/50 md:col-span-2"
            />
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[13.5px] font-bold text-slate-400">
            thực hiện bởi{" "}
            <a
              href="https://www.youtube.com/@kat.thanhtungg"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-slate-500"
            >
              thanhtungg.
            </a>
          </p>
        </div>

      </div>

      <DonateModal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
      />

      <TripForm
        trip={trip}
        isOpen={editingTrip}
        onClose={() => setEditingTrip(false)}
        onSaved={onTripSelected}
      />

      <MemberForm
        tripId={trip.id!}
        editing={editingMember}
        isOpen={isMemberFormOpen}
        onClose={() => setIsMemberFormOpen(false)}
        onShowToast={onShowToast}
      />

      <DeleteMemberConfirmModal
        isOpen={isDeleteMemberConfirmOpen}
        onClose={() => {
          setIsDeleteMemberConfirmOpen(false);
          setMemberToDelete(null);
        }}
        onConfirm={executeDeleteMember}
        memberName={memberToDelete?.name ?? ""}
        hasExpenses={memberToDelete ? expenses.some(e => e.payer === memberToDelete.name) : false}
        hasChecklist={memberToDelete ? checklist.some(c => c.assignedTo === memberToDelete.name) : false}
      />

      <ConfirmDeleteTripDialog
        open={isDeleteConfirmOpen}
        tripName={trip.title}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={async () => {
          setIsDeleteConfirmOpen(false);
          await executeDeleteTrip();
        }}
      />

      <TypedDeleteConfirmModal
        isOpen={isFactoryResetConfirmOpen}
        onClose={() => setIsFactoryResetConfirmOpen(false)}
        onConfirm={async () => {
          setIsFactoryResetConfirmOpen(false);
          await factoryReset();
        }}
        title="Khôi phục cài đặt gốc?"
        description="Hành động này sẽ xóa toàn bộ dữ liệu KAT Journey trên thiết bị hiện tại, bao gồm chuyến đi, lịch trình, chi phí, nhật ký và dữ liệu liên quan. Không thể hoàn tác."
        confirmLabel="Xóa toàn bộ dữ liệu"
      />

      <BottomSheet
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
        }}
        title="Chia sẻ chuyến đi"
        subtitle={
          <div className="space-y-2.5 mt-1">
            <p className="text-[13.5px] text-slate-500 leading-relaxed">
              Tạo link để người khác xem lịch trình và thông tin chuyến đi.
            </p>
            <div className="flex justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-700">
                Chế độ: Xem & đề xuất chỉnh sửa
              </span>
            </div>
          </div>
        }
      >
        <div className="space-y-5 px-1 pb-4">
          {!activeShareLink ? (
            <>
              {/* Option Rows */}
              <div className="space-y-2.5">
                {/* Row: Bao gồm chi phí */}
                <div 
                  onClick={() => setShareOptions({ ...shareOptions, includeExpenses: !shareOptions.includeExpenses })}
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-150/60 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                      <WalletCards className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700">Bao gồm chi phí</span>
                  </div>
                  <ShareSwitch 
                    checked={shareOptions.includeExpenses} 
                    onChange={(val) => setShareOptions({ ...shareOptions, includeExpenses: val })} 
                  />
                </div>

                {/* Row: Bao gồm nhật ký */}
                <div 
                  onClick={() => setShareOptions({ ...shareOptions, includeJournals: !shareOptions.includeJournals })}
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-150/60 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-500">
                      <BookOpenText className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700">Bao gồm nhật ký</span>
                  </div>
                  <ShareSwitch 
                    checked={shareOptions.includeJournals} 
                    onChange={(val) => setShareOptions({ ...shareOptions, includeJournals: val })} 
                  />
                </div>

                {/* Row: Bao gồm danh sách chuẩn bị */}
                <div 
                  onClick={() => setShareOptions({ ...shareOptions, includeChecklist: !shareOptions.includeChecklist })}
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-150/60 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                      <CheckCircle2 className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700">Bao gồm danh sách chuẩn bị</span>
                  </div>
                  <ShareSwitch 
                    checked={shareOptions.includeChecklist} 
                    onChange={(val) => setShareOptions({ ...shareOptions, includeChecklist: val })} 
                  />
                </div>

                {/* Row: Bao gồm phương án dự phòng */}
                <div 
                  onClick={() => setShareOptions({ ...shareOptions, includeBackupPlans: !shareOptions.includeBackupPlans })}
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-150/60 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-500">
                      <AlertTriangle className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700">Bao gồm phương án dự phòng</span>
                  </div>
                  <ShareSwitch 
                    checked={shareOptions.includeBackupPlans} 
                    onChange={(val) => setShareOptions({ ...shareOptions, includeBackupPlans: val })} 
                  />
                </div>

                {/* Row: Bao gồm giấy tờ & đặt chỗ */}
                <div 
                  onClick={() => setShareOptions({ ...shareOptions, includeDocuments: !shareOptions.includeDocuments })}
                  className="flex min-h-[48px] items-center justify-between py-3 px-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-150/60 rounded-2xl cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                      <FileText className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-[14.5px] font-bold text-slate-700">Bao gồm giấy tờ & đặt chỗ</span>
                  </div>
                  <ShareSwitch 
                    checked={shareOptions.includeDocuments} 
                    onChange={(val) => setShareOptions({ ...shareOptions, includeDocuments: val })} 
                  />
                </div>

                {shareOptions.includeDocuments && (
                  <div className="rounded-2xl bg-rose-50/70 border border-rose-100 p-4 text-[13px] text-rose-800 font-semibold flex gap-2 animate-fadeIn">
                    <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                    <span>Giấy tờ có thể chứa mã đặt chỗ, vé, số điện thoại hoặc liên kết riêng tư. Chỉ bật nếu bạn thực sự tin tưởng người nhận link.</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200 transition-colors min-h-[44px] text-[13.5px] focus:outline-none"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleCreateLink}
                  disabled={shareLoading}
                  className="flex-[2] rounded-xl bg-kat-primary py-3 font-bold text-white hover:brightness-105 transition-colors disabled:opacity-50 min-h-[44px] text-[13.5px] focus:outline-none"
                >
                  {shareLoading ? "Đang tạo link..." : "Tạo link chia sẻ"}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-5 animate-fadeIn">
              {/* Success layout */}
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100/80 p-3.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="text-[14px] font-bold text-emerald-800">Đã tạo link chia sẻ</span>
              </div>

              {/* Copy Link field inside an Input container with inline Copy button */}
              <div className="relative flex items-center rounded-xl bg-slate-100 border border-slate-200 px-3 py-2.5">
                <input
                  type="text"
                  readOnly
                  value={activeShareLink.url}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 bg-transparent border-none outline-none text-slate-600 text-[13.5px] font-medium pr-10 truncate cursor-text"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeShareLink.url);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition-all shadow-sm active:scale-95"
                  title="Sao chép link"
                >
                  {copiedLink ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Success actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 font-bold text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px] text-[13.5px] focus:outline-none"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleRevokeLink}
                  disabled={shareLoading}
                  className="flex-1 rounded-xl bg-transparent hover:bg-rose-50 text-rose-600 py-3 font-bold active:scale-95 transition-colors disabled:opacity-50 min-h-[44px] text-[13.5px] focus:outline-none"
                >
                  {shareLoading ? "Đang tắt..." : "Tắt chia sẻ"}
                </button>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Import Trip Confirmation Modal */}
      <BottomSheet 
        isOpen={isRestoreConfirmOpen} 
        onClose={() => {
          setIsRestoreConfirmOpen(false);
          setSelectedFileForRestore(null);
        }} 
        title="Khôi phục hành trình?"
      >
        <div className="space-y-5">
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-[13.5px] text-amber-800 font-semibold leading-relaxed">
            Dữ liệu hiện tại có thể bị thay đổi sau khi nhập bản sao lưu. Vui lòng đảm bảo tệp của bạn là hợp lệ trước khi tiến hành.
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setIsRestoreConfirmOpen(false);
                setSelectedFileForRestore(null);
              }}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
            >
              Hủy
            </button>
             <button
              type="button"
              onClick={async () => {
                setIsRestoreConfirmOpen(false);
                if (selectedFileForRestore) {
                  await importTrip(selectedFileForRestore);
                }
                setSelectedFileForRestore(null);
              }}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-kat-primary/10 border border-kat-primary/30 px-6 font-bold text-kat-text hover:bg-kat-primary/20 active:scale-98 transition-all duration-200 shadow-sm"
            >
              <Upload className="h-5 w-5" />
              Khôi phục
            </button>
          </div>
        </div>
      </BottomSheet>



    </div>
  );
}
export { TripForm };
