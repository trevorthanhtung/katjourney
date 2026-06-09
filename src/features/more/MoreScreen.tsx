import React, { useEffect, useState } from "react";
import { Backpack, BookOpen, ChevronRight, Download, Edit3, FileText, Settings, Sparkles, Table2, Trash2, Upload, Users, MapPin, Calendar, WalletCards, Map, Sun, Camera, Smile } from "lucide-react";
import { ChecklistItem, db, EventItem, Expense, JournalEntry, Member, PackingItem, Trip } from "../../db";
import { checklistSections, createTripExport, formatDate, formatMoney, getWrappedStats, moodLabels, packingTripTypes, safeFileName, today, TripData, downloadBlob } from "../../utils/helpers";
import { exportTripExcel, exportTripPdf } from "../../utils/exports";
import { BottomSheet, EmptyCard, FormActions, IconButton, Input, ScreenTitle } from "../../components/ui";
import { JournalSection } from "../journal/JournalSection";
import { PackingSection } from "../packing/PackingSection";

function TripForm({ trip, isOpen, onClose, onSaved }: { trip?: Trip; isOpen: boolean; onClose: () => void; onSaved: (id: number) => void }) {
  const [form, setForm] = useState({
    title: trip?.title ?? "",
    location: trip?.location ?? "",
    startDate: trip?.startDate ?? today,
    endDate: trip?.endDate ?? today
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        title: trip?.title ?? "",
        location: trip?.location ?? "",
        startDate: trip?.startDate ?? today,
        endDate: trip?.endDate ?? today
      });
    }
  }, [trip, isOpen]);

  async function save() {
    if (!form.title.trim()) return;
    const payload = { ...form, createdAt: trip?.createdAt ?? new Date().toISOString() };
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
    <BottomSheet isOpen={isOpen} onClose={onClose} title={trip ? "Sửa chuyến đi" : "Tạo chuyến đi"}>
      <div className="space-y-4">
        <Input label="Tên chuyến đi" value={form.title} onChange={(title) => setForm({ ...form, title })} placeholder="VD: Mùa hè rực rỡ" />
        <Input label="Địa điểm" value={form.location} onChange={(location) => setForm({ ...form, location })} placeholder="VD: Phú Quốc" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Ngày đi" type="date" value={form.startDate} onChange={(startDate) => setForm({ ...form, startDate })} />
          <Input label="Ngày về" type="date" value={form.endDate} onChange={(endDate) => setForm({ ...form, endDate })} />
        </div>
        <div className="pt-2">
          <FormActions onSave={save} saveLabel={trip ? "Lưu thay đổi" : "Bắt đầu hành trình"} />
        </div>
      </div>
    </BottomSheet>
  );
}

function MemberForm({ tripId, editing, isOpen, onClose }: { tripId: number; editing: Member | null; isOpen: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", role: "" });

  useEffect(() => {
    if (isOpen) {
      setForm(editing ? { name: editing.name, phone: editing.phone, role: editing.role } : { name: "", phone: "", role: "" });
    }
  }, [editing, isOpen]);

  async function save() {
    if (!form.name.trim()) return;
    if (editing?.id) {
      await db.members.update(editing.id, form);
      onClose();
    } else {
      await db.members.add({ ...form, tripId });
      onClose();
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={editing ? "Sửa thành viên" : "Thêm thành viên"}>
      <div className="space-y-4">
        <Input label="Tên" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="Tên người đi cùng" />
        <Input label="Số điện thoại (không bắt buộc)" type="tel" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} placeholder="VD: 0987..." />
        <Input label="Vai trò (không bắt buộc)" value={form.role} onChange={(role) => setForm({ ...form, role })} placeholder="VD: Trưởng đoàn, Thủ quỹ..." />
        <div className="pt-2">
          <FormActions onSave={save} saveLabel={editing ? "Lưu thay đổi" : "Thêm thành viên"} />
        </div>
      </div>
    </BottomSheet>
  );
}

function WrappedSection({ data, setSection }: { data: TripData; setSection: (section: any) => void }) {
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

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-24">
      <ScreenTitle title="Travel Wrapped" subtitle="Nhìn lại những dấu ấn đáng nhớ trong chuyến đi của bạn." />
      
      {/* Hero Recap Card */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-8 text-white shadow-soft">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <Sparkles className="h-10 w-10 text-emerald-200 mb-4" />
          <h2 className="text-[32px] font-bold leading-tight tracking-tight drop-shadow-sm">{data.trip.title}</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[14px] font-medium backdrop-blur-md border border-white/20">
              <MapPin className="h-4 w-4" />
              {data.trip.location || "Đang lên kế hoạch"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[14px] font-medium backdrop-blur-md border border-white/20">
              <Calendar className="h-4 w-4" />
              {formatDate(data.trip.startDate)} - {formatDate(data.trip.endDate)}
            </span>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-[24px] bg-white p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-h-[140px] transition-all hover:-translate-y-1 hover:shadow-md">
          <Sun className="h-6 w-6 text-slate-300 mb-3" />
          <span className="text-[32px] font-bold text-emerald-600 leading-none">{stats.totalDays}</span>
          <span className="mt-2 text-[12px] font-bold text-slate-400 uppercase tracking-widest">Ngày khám phá</span>
        </div>
        <div className="rounded-[24px] bg-white p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-h-[140px] transition-all hover:-translate-y-1 hover:shadow-md">
          <Map className="h-6 w-6 text-slate-300 mb-3" />
          <span className="text-[32px] font-bold text-sunset-600 leading-none">{stats.activityCount}</span>
          <span className="mt-2 text-[12px] font-bold text-slate-400 uppercase tracking-widest">Hoạt động</span>
        </div>
        <div className="rounded-[24px] bg-white p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-h-[140px] transition-all hover:-translate-y-1 hover:shadow-md">
          <Backpack className="h-6 w-6 text-slate-300 mb-3" />
          <span className="text-[32px] font-bold text-emerald-600 leading-none">{stats.checklistPercent}%</span>
          <span className="mt-2 text-[12px] font-bold text-slate-400 uppercase tracking-widest">Chuẩn bị</span>
        </div>
        <div className="rounded-[24px] bg-white p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-h-[140px] transition-all hover:-translate-y-1 hover:shadow-md">
          <BookOpen className="h-6 w-6 text-slate-300 mb-3" />
          <span className="text-[32px] font-bold text-sunset-600 leading-none">{stats.journalCount}</span>
          <span className="mt-2 text-[12px] font-bold text-slate-400 uppercase tracking-widest">Trang nhật ký</span>
        </div>
      </div>

      {/* Finance Recap */}
      <div className="rounded-[32px] bg-slate-900 p-8 text-white shadow-soft">
        <h3 className="text-[14px] font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <WalletCards className="h-5 w-5 text-emerald-500" />
          Tài chính chuyến đi
        </h3>
        
        {data.expenses.length > 0 ? (
          <div className="space-y-6">
            <div>
              <p className="text-[14px] font-medium text-slate-400">Tổng đã chi</p>
              <p className="mt-1 text-[32px] font-bold text-emerald-400">{formatMoney(stats.totalExpense)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
              <div>
                <p className="text-[13px] font-medium text-slate-400">Chi chung</p>
                <p className="mt-1 text-[18px] font-bold text-white">{formatMoney(sharedTotal)}</p>
              </div>
              <div>
                <p className="text-[13px] font-medium text-slate-400">Tự trả riêng</p>
                <p className="mt-1 text-[18px] font-bold text-white">{formatMoney(personalTotal)}</p>
              </div>
            </div>
            
            {stats.topPayer && (
              <div className="border-t border-slate-800 pt-6">
                <p className="text-[14px] font-medium text-slate-400">Nhà tài trợ chính</p>
                <p className="mt-1 text-[15px] font-medium leading-relaxed text-slate-300">
                  <span className="font-bold text-white">{stats.topPayer.name}</span> là người chi nhiều nhất với <span className="font-bold text-emerald-400">{formatMoney(stats.topPayer.amount)}</span>.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-[15px] font-medium text-slate-500">Chưa có dữ liệu chi phí.</p>
          </div>
        )}
      </div>

      {/* Memory / Mood Section */}
      <div className="rounded-[32px] bg-white p-8 shadow-sm border border-slate-100 text-center flex flex-col items-center">
        <Smile className="h-8 w-8 text-sunset-400 mb-4" />
        <h3 className="text-[14px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cảm xúc chủ đạo</h3>
        {mood ? (
          <p className="mt-2 text-[28px] font-bold text-slate-900">{mood}</p>
        ) : (
          <div className="flex flex-col items-center mt-2">
            <p className="text-[16px] font-bold text-slate-900 mb-2">Chưa có đủ kỷ niệm để tổng kết cảm xúc.</p>
            <p className="text-[14px] text-slate-500 mb-6 max-w-sm">Viết thêm nhật ký để Travel Wrapped trở nên sống động hơn.</p>
            <button 
              onClick={() => setSection("journal")}
              className="flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-6 py-2.5 text-[14px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <BookOpen className="h-4 w-4" />
              Viết nhật ký đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Storytelling Blocks */}
      {(firstMomentText || maxEventsDate || uniqueLocations.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {firstMomentText && (
            <div className="rounded-[24px] bg-white p-6 shadow-sm border border-slate-100 flex flex-col md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="h-5 w-5 text-sunset-500" />
                <h4 className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Khoảnh khắc đầu tiên</h4>
              </div>
              <p className="text-[16px] font-medium text-slate-900 leading-relaxed">{firstMomentText}</p>
            </div>
          )}

          {maxEventsDate && (
            <div className="rounded-[24px] bg-white p-6 shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Sun className="h-5 w-5 text-amber-500" />
                <h4 className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Ngày đáng nhớ nhất</h4>
              </div>
              <p className="text-[15px] font-medium text-slate-900 leading-relaxed">
                <span className="font-bold text-amber-600">{formatDate(maxEventsDate)}</span> là ngày bận rộn nhất với {maxEventsCount} hoạt động được ghi nhận.
              </p>
            </div>
          )}

          {uniqueLocations.length > 0 && (
            <div className="rounded-[24px] bg-white p-6 shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-emerald-500" />
                <h4 className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Bạn đã đi qua</h4>
              </div>
              <p className="text-[15px] font-medium text-slate-900 leading-relaxed">
                {uniqueLocations.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Share / Export CTA */}
      <div className="pt-8 flex justify-center">
        <button 
          onClick={() => exportTripPdf(data)}
          className="flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-3.5 text-[15px] font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
        >
          <FileText className="h-5 w-5" />
          Xuất PDF tổng kết
        </button>
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, subtitle, onClick, value, danger = false }: { icon: React.ReactNode; label: string; subtitle?: string; onClick?: () => void; value?: string; danger?: boolean }) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <div className={`flex shrink-0 h-8 w-8 items-center justify-center rounded-lg ${danger ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
          {icon}
        </div>
        <div className="flex flex-col text-left">
          <span className={`text-[16px] font-medium ${danger ? 'text-rose-600' : 'text-slate-900'}`}>{label}</span>
          {subtitle && <span className="text-[13px] text-slate-500">{subtitle}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-[15px] text-slate-500">{value}</span>}
        {onClick && <ChevronRight className="h-5 w-5 text-slate-300" />}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="flex w-full items-center justify-between bg-white px-4 py-3 transition-colors hover:bg-slate-50 active:bg-slate-100">
        {content}
      </button>
    );
  }

  return (
    <div className="flex w-full items-center justify-between bg-white px-4 py-3">
      {content}
    </div>
  );
}

export function MoreScreen({
  trip,
  members,
  events,
  expenses,
  checklist,
  journals,
  packingItems,
  onTripDeleted,
  onTripSelected,
  section,
  setSection
}: {
  trip: Trip;
  members: Member[];
  events: EventItem[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  journals: JournalEntry[];
  packingItems: PackingItem[];
  onTripDeleted: () => void;
  onTripSelected: (id: number) => void;
  section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members";
  setSection: (section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members") => void;
}) {
  const [editingTrip, setEditingTrip] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const tripData = { trip, members, events, expenses, checklist, journals, packingItems };

  async function deleteTrip() {
    if (!trip.id || !window.confirm("Xóa chuyến đi này khỏi thiết bị?")) return;
    await db.transaction("rw", [db.trips, db.members, db.events, db.expenses, db.checklist, db.journals, db.packingItems], async () => {
      await db.members.where("tripId").equals(trip.id!).delete();
      await db.events.where("tripId").equals(trip.id!).delete();
      await db.expenses.where("tripId").equals(trip.id!).delete();
      await db.checklist.where("tripId").equals(trip.id!).delete();
      await db.journals.where("tripId").equals(trip.id!).delete();
      await db.packingItems.where("tripId").equals(trip.id!).delete();
      await db.trips.delete(trip.id!);
    });
    onTripDeleted();
  }

  function exportTrip() {
    const payload = createTripExport(tripData);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${safeFileName(trip.title)}.kattrip`);
  }

  async function importTrip(file?: File) {
    if (!file) return;
    setImporting(true);
    try {
      const parsed = JSON.parse(await file.text()) as Partial<import("../../utils/helpers").TripExport>;
      if (parsed.app !== "KAT Journey" || !parsed.trip?.title) {
        throw new Error("Tệp không đúng định dạng KAT Journey.");
      }

      const newTripId = await db.transaction("rw", [db.trips, db.members, db.events, db.expenses, db.checklist, db.journals, db.packingItems], async () => {
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
            description: expense.description ?? ""
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

        if (importedMembers.length) await db.members.bulkAdd(importedMembers);
        if (importedEvents.length) await db.events.bulkAdd(importedEvents);
        if (importedExpenses.length) await db.expenses.bulkAdd(importedExpenses);
        if (importedChecklist.length) await db.checklist.bulkAdd(importedChecklist);
        if (importedJournals.length) await db.journals.bulkAdd(importedJournals);
        if (importedPackingItems.length) await db.packingItems.bulkAdd(importedPackingItems);
        return id;
      });

      onTripSelected(newTripId);
      window.alert("Đã import chuyến đi vào dữ liệu cục bộ.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Không thể import tệp này.");
    } finally {
      setImporting(false);
    }
  }

  async function factoryReset() {
    const confirmation = window.prompt("CẢNH BÁO: Hành động này sẽ xóa toàn bộ chuyến đi, lịch trình, chi phí, nhật ký và dữ liệu cục bộ trên thiết bị này. Không thể hoàn tác. Để tiếp tục, vui lòng nhập chính xác: XOA TAT CA");
    if (confirmation === "XOA TAT CA") {
      try {
        await db.delete();
        window.alert("Đã xóa dữ liệu. Trang sẽ tải lại.");
        window.location.reload();
      } catch (e) {
        window.alert("Đã xảy ra lỗi khi xóa dữ liệu.");
      }
    } else if (confirmation !== null) {
      window.alert("Xác nhận không đúng. Đã hủy khôi phục cài đặt gốc.");
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

  if (section === "journal") return <JournalSection tripId={trip.id!} journals={journals} />;
  if (section === "packing") return <PackingSection tripId={trip.id!} packingItems={packingItems} />;
  if (section === "wrapped") return <WrappedSection data={tripData} setSection={setSection} />;
  if (section === "members") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-8">
        <ScreenTitle title="Thành viên" subtitle="Quản lý những người cùng tham gia chuyến đi." />
        
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[15px] font-bold text-slate-900">Danh sách ({members.length})</h3>
          <button 
            className="flex items-center justify-center rounded-full bg-emerald-50 px-4 py-2 text-[13px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100" 
            onClick={openNewMember}
          >
            Thêm
          </button>
        </div>
        
        <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-100 bg-white">
          {members.length ? (
            members.map((member, index) => (
              <React.Fragment key={member.id}>
                <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="text-[16px] font-medium text-slate-900">{member.name}</p>
                    <p className="text-[14px] text-slate-500">{member.role || "Bạn đồng hành"}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" onClick={() => openEditMember(member)}>
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" onClick={() => db.members.delete(member.id!)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {index < members.length - 1 && <div className="h-px bg-slate-100 mx-4" />}
              </React.Fragment>
            ))
          ) : (
            <div className="p-6 text-center text-[15px] text-slate-500">
              Chưa có thành viên nào.
            </div>
          )}
        </div>
        
        <MemberForm
          tripId={trip.id!}
          editing={editingMember}
          isOpen={isMemberFormOpen}
          onClose={() => setIsMemberFormOpen(false)}
        />
      </div>
    );
  }
  if (section === "settings") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-8">
        <ScreenTitle title="Cài đặt" subtitle="Quản lý ứng dụng và dữ liệu cục bộ." />
        
        <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-100">
          <SettingsRow icon={<Settings className="h-4 w-4" />} label="Phiên bản" value="1.0.0" />
          <div className="h-px bg-slate-100 mx-4" />
          <SettingsRow icon={<Trash2 className="h-4 w-4" />} label="Khôi phục cài đặt gốc" onClick={() => void factoryReset()} danger />
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[13px] font-medium text-slate-400">Thực hiện bởi thanhtungg.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="space-y-8 pb-24">
        <ScreenTitle title="Quản lý chuyến đi" subtitle="Quản lý thông tin, dữ liệu và các công cụ hỗ trợ cho chuyến đi." />
        
        {/* Trip Overview Card */}
        <section className="rounded-[24px] bg-white p-5 shadow-sm border border-slate-100 flex flex-col gap-2">
          <h3 className="text-[18px] font-bold text-slate-900">{trip.title}</h3>
          <div className="flex items-center gap-2 text-[14px] text-slate-500">
            <MapPin className="flex-none h-4 w-4 text-rose-500" strokeWidth={2.5} />
            <span className="truncate">{trip.location || "Chưa có địa điểm"}</span>
          </div>
          <div className="flex items-center gap-2 text-[14px] text-slate-500">
            <Calendar className="flex-none h-4 w-4 text-indigo-400" strokeWidth={2.5} />
            <span>{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-[14px] text-slate-500">
            <Users className="flex-none h-4 w-4 text-indigo-600" strokeWidth={2.5} />
            <span>{members.length} thành viên</span>
          </div>
        </section>

        {/* A. Current Trip Settings */}
        <section className="space-y-3">
          <h3 className="px-2 text-[15px] font-bold text-slate-900">Chuyến đi hiện tại</h3>
          <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-100">
            <SettingsRow icon={<Edit3 className="h-4 w-4" />} label="Sửa thông tin" onClick={() => setEditingTrip(true)} />
            <div className="h-px bg-slate-100 mx-4" />
            <SettingsRow icon={<Users className="h-4 w-4" />} label="Quản lý thành viên" subtitle="Thêm hoặc chỉnh sửa người đồng hành." onClick={() => setSection("members")} />
          </div>
        </section>

        {/* C. Tools */}
        <section className="space-y-3">
          <h3 className="px-2 text-[15px] font-bold text-slate-900">Công cụ chuyến đi</h3>
          <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-100">
            <SettingsRow icon={<Sparkles className="h-4 w-4" />} label="Tổng kết chuyến đi" onClick={() => setSection("wrapped")} />
            <div className="h-px bg-slate-100 mx-4" />
            <SettingsRow icon={<BookOpen className="h-4 w-4" />} label="Nhật ký chuyến đi" onClick={() => setSection("journal")} />
            <div className="h-px bg-slate-100 mx-4" />
            <SettingsRow icon={<Backpack className="h-4 w-4" />} label="Gợi ý hành lý" onClick={() => setSection("packing")} />
            <div className="h-px bg-slate-100 mx-4" />
            <SettingsRow icon={<Settings className="h-4 w-4" />} label="Cài đặt hệ thống" onClick={() => setSection("settings")} />
          </div>
        </section>

        {/* D. Export / Import */}
        <section className="space-y-3">
          <div className="px-2">
            <h3 className="text-[15px] font-bold text-slate-900">Sao lưu & Chia sẻ</h3>
            <p className="mt-0.5 text-[13px] text-slate-500">Lưu trữ hoặc chia sẻ dữ liệu chuyến đi khi cần.</p>
          </div>
          <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-100">
            <SettingsRow icon={<Download className="h-4 w-4" />} label="Sao lưu chuyến đi" subtitle="Tạo bản sao dữ liệu (.kattrip)" onClick={exportTrip} />
            <div className="h-px bg-slate-100 mx-4" />
            <label className="flex w-full cursor-pointer items-center justify-between bg-white px-4 py-3 transition-colors hover:bg-slate-50 active:bg-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Upload className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[16px] font-medium text-slate-900">{importing ? "Đang nhập..." : "Khôi phục dữ liệu"}</span>
                  <span className="text-[13px] text-slate-500">Nhập dữ liệu từ bản sao lưu</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
              <input
                className="sr-only"
                type="file"
                accept=".kattrip,application/json"
                onChange={(event) => {
                  void importTrip(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            <div className="h-px bg-slate-100 mx-4" />
            <SettingsRow icon={<FileText className="h-4 w-4" />} label="Xuất báo cáo PDF" onClick={() => exportTripPdf(tripData)} />
            <div className="h-px bg-slate-100 mx-4" />
            <SettingsRow icon={<Table2 className="h-4 w-4" />} label="Xuất bảng tính Excel" onClick={() => exportTripExcel(tripData)} />
          </div>
        </section>

        {/* E. Danger Zone */}
        <section className="space-y-3 pt-4">
          <h3 className="px-2 text-[15px] font-bold text-rose-600">Vùng nguy hiểm</h3>
          <div className="overflow-hidden rounded-2xl border border-rose-100 bg-rose-50/30 shadow-sm">
            <SettingsRow icon={<Trash2 className="h-4 w-4" />} label="Xóa chuyến đi" onClick={() => void deleteTrip()} danger />
          </div>
        </section>

        {/* F. Footer */}
        <div className="mt-12 text-center">
          <p className="text-[13px] font-medium text-slate-400">Thực hiện bởi thanhtungg.</p>
        </div>
      </div>

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
      />
    </div>
  );
}

export { TripForm };
