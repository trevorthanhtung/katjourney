import React, { useEffect, useState } from "react";
import { 
  BookOpen, 
  Calendar, 
  Edit3, 
  Plus, 
  Smile, 
  Trash2,
  ArrowLeft,
  BookOpenText,
  PenLine,
  SmilePlus,
  Clock3,
  Star,
  Camera,
  MapPin,
  Compass,
  CalendarDays,
  Type,
  NotebookPen,
  Save,
  Sparkles,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { db, JournalEntry, JournalMood } from "../../db";
import { formatDate, moodLabels, today } from "../../utils/helpers";
import { BottomSheet, FAB, Input, Textarea, DatePicker, DeleteConfirmModal } from "../../components/ui";
import { getIdentity } from "../../services/identityService";
import { uploadJournalImage } from "../../services/storageService";
import { getCurrentUser } from "../../services/authService";

const moodOptionList: Array<{ value: JournalMood; label: string }> = [
  { value: "good", label: "Vui" },
  { value: "okay", label: "Bình yên" },
  { value: "great", label: "Hào hứng" },
  { value: "very_bad", label: "Mệt" },
  { value: "bad", label: "Bất ngờ" }
];

const moodColorClasses: Record<JournalMood, string> = {
  good: "bg-amber-500",
  okay: "bg-emerald-500",
  great: "bg-rose-500",
  very_bad: "bg-slate-400",
  bad: "bg-blue-500"
};

const moodBadgeClasses: Record<JournalMood, string> = {
  good: "bg-amber-50 text-amber-800 border-amber-200",
  okay: "bg-emerald-50 text-emerald-800 border-emerald-200",
  great: "bg-rose-50 text-rose-800 border-rose-200",
  very_bad: "bg-slate-100 text-slate-700 border-slate-300",
  bad: "bg-blue-50 text-blue-800 border-blue-200"
};

function JournalForm({ 
  tripId, 
  editing, 
  isOpen, 
  onClose,
  prefilledContent,
  onClearPrefilled,
  onShowToast
}: { 
  tripId: number; 
  editing: JournalEntry | null; 
  isOpen: boolean; 
  onClose: () => void;
  prefilledContent: string;
  onClearPrefilled: () => void;
  onShowToast?: (msg: string) => void;
}) {
  const [form, setForm] = useState({ date: today, title: "", content: "", mood: "good" as JournalMood, imageUrl: "" });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadJournalImage(file, tripId);
      setForm(prev => ({ ...prev, imageUrl: url }));
      setDirty(true);
    } catch (err: any) {
      console.error(err);
      onShowToast?.("Lỗi: " + (err.message || "Tải ảnh thất bại"));
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (editing) {
        setForm({ date: editing.date, title: editing.title, content: editing.content, mood: editing.mood, imageUrl: editing.imageUrl || "" });
      } else {
        setForm({ date: today, title: "", content: prefilledContent || "", mood: "good", imageUrl: "" });
      }
      setSubmitAttempted(false);
      setDirty(false);
    }
  }, [editing, isOpen, prefilledContent]);

  const titleError = !form.title.trim() ? "Vui lòng nhập tiêu đề." : "";
  const contentError = !form.content.trim() ? "Vui lòng nhập nội dung nhật ký." : "";
  const hasError = !!titleError || !!contentError;

  async function save() {
    setSubmitAttempted(true);
    if (hasError) return;

    const identity = getIdentity(tripId);
    // Ưu tiên tên từ Firebase Auth (displayName đã set trong cài đặt)
    const firebaseUser = await getCurrentUser();
    const resolvedName = firebaseUser?.displayName || identity?.name || "Trưởng nhóm";
    const resolvedId = firebaseUser?.uid || identity?.id || "lead";

    const now = new Date().toISOString();
    const payload = {
      tripId,
      date: form.date,
      title: form.title.trim(),
      content: form.content.trim(),
      mood: form.mood,
      imageUrl: form.imageUrl || undefined,
      authorId: resolvedId,
      authorName: resolvedName,
      postedAt: editing?.postedAt || now, // giữ nguyên postedAt khi edit
    };

    if (editing?.id) {
      await db.journals.update(editing.id, { ...payload, updatedAt: now });
      onShowToast?.("Đã cập nhật nhật ký");
    } else {
      await db.journals.add(payload);
      onShowToast?.("Đã lưu nhật ký");
    }
    
    onClearPrefilled();
    onClose();
  }

  const promptSuggestions = [
    "Điều muốn nhớ nhất",
    "Món ăn đáng nhớ",
    "Người bạn đã gặp",
    "Khoảnh khắc vui",
    "Điều muốn nhớ mãi"
  ];

  function handlePromptClick(prompt: string) {
    setForm(prev => ({
      ...prev,
      content: prev.content + (prev.content.trim() ? "\n\n" : "") + `- ${prompt}: `
    }));
    setDirty(true);
  }

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={() => {
        onClearPrefilled();
        onClose();
      }} 
      title={editing ? "Sửa nhật ký hành trình" : "Viết nhật ký hành trình"}
      footer={
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={() => {
              onClearPrefilled();
              onClose();
            }}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={hasError}
            onClick={save}
            className="flex-[2] inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-[#030D2E] text-white px-6 font-black hover:bg-[#030D2E]/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#030D2E] disabled:active:scale-100 shadow-sm"
          >
            <Save className="h-4.5 w-4.5" strokeWidth={2.5} />
            Lưu nhật ký
          </button>
        </div>
      }
    >
      <div className="space-y-4 md:space-y-5">
        {/* Date Field */}
          <div className="mb-5">
            <DatePicker 
              label={
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
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
                <Type className="h-4 w-4 text-slate-500" />
                Tiêu đề nhật ký *
              </span>
            } 
            value={form.title} 
            onChange={(title) => { setForm({ ...form, title }); setDirty(true); }} 
            placeholder="VD: Một ngày đáng nhớ ở Vũng Tàu" 
          />
          {(dirty || submitAttempted) && titleError && (
            <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{titleError}</p>
          )}
        </div>

        {/* Mood Chips */}
        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <SmilePlus className="h-4 w-4 text-slate-500" />
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
                  onClick={() => { setForm({ ...form, mood: opt.value }); setDirty(true); }}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-bold border transition-all duration-200 active:scale-95 ${
                    isActive
                      ? "bg-[#00BFB7]/10 border-[#00BFB7] text-[#030D2E]"
                      : "bg-[#FFFDF8] border-[#E8E1D8] text-slate-600 hover:bg-slate-50"
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
                <NotebookPen className="h-4 w-4 text-slate-500" />
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
                <Trash2 className="h-4 w-4" />
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
                  <><Loader2 className="h-5 w-5 animate-spin" /> Đang tải ảnh...</>
                ) : (
                  <><ImageIcon className="h-5 w-5" /> Đính kèm hình ảnh</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Quick Prompts Section inside Modal */}
        <div className="pt-1">
          <span className="mb-2 block text-[12.5px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-slate-500" />
            Gợi ý viết nhanh
          </span>
          <div className="flex flex-wrap gap-1.5">
            {promptSuggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className="rounded-lg bg-[#FAF7F1] border border-[#E8E1D8] px-3 py-1.5 text-[12.5px] font-bold text-slate-600 hover:bg-[#00BFB7]/10 hover:text-[#00BFB7] hover:border-[#00BFB7]/30 transition-all active:scale-95"
              >
                + {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

function DeleteJournalConfirmModal({
  isOpen,
  onClose,
  onConfirm
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <DeleteConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Xóa nhật ký này?"
      description="Nhật ký sẽ không còn xuất hiện trong chuyến đi. Sau khi xóa, không thể hoàn tác."
      confirmLabel="Xóa nhật ký"
    />
  );
}

function JournalEmptyState({ onPromptClick, onWrite }: { onPromptClick: (promptText: string) => void; onWrite: () => void }) {
  const prompts = [
    "Hôm nay bạn muốn nhớ nhất điều gì?",
    "Có khoảnh khắc nào bạn muốn lưu lại không?",
    "Một món ăn, một điểm đến hoặc một người bạn đã gặp?",
    "Điều gì làm hành trình này trở nên khác biệt?"
  ];

  return (
    <div className="space-y-6">
      {/* Small Compact Card for Empty state */}
      <div className="rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] p-6 text-center shadow-soft max-w-md mx-auto my-4 animate-fadeIn">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mx-auto mb-4 ring-4 ring-kat-primary/5">
          <BookOpenText className="h-6 w-6" />
        </div>
        <h3 className="text-[16px] font-bold text-[#030D2E]">Chưa có nhật ký nào</h3>
        <p className="mt-2 text-[14.5px] font-semibold text-slate-500 leading-relaxed">
          Bắt đầu bằng một cảm xúc, một nơi đã ghé qua hoặc một khoảnh khắc bạn muốn nhớ.
        </p>
      </div>

      {/* Prompts Section */}
      <div className="w-full max-w-xl md:max-w-none mx-auto space-y-3">
        <div className="flex items-center justify-between pl-1">
          <p className="text-[12.5px] font-extrabold uppercase tracking-wider text-slate-400">Gợi ý viết nhanh</p>
          <span className="text-[11px] font-bold text-slate-400 md:hidden">Vuốt ngang ›</span>
        </div>
        <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1.5 -mx-2 px-2 touch-pan-x snap-x snap-mandatory scrollbar-none md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
          {prompts.map((prompt, idx) => {
            const icons = [Star, Camera, MapPin, Compass];
            const colors = ["text-amber-500", "text-rose-500", "text-emerald-500", "text-sky-500"];
            const PromptIcon = icons[idx];
            const iconColor = colors[idx];

            return (
              <button 
                key={prompt}
                onClick={() => onPromptClick(prompt)} 
                className="text-left bg-[#FFFDF8] p-4 rounded-[20px] border border-[#E8E1D8] shadow-sm hover:shadow-md transition-all group active:scale-[0.99] flex flex-col justify-between min-h-[112px] w-[260px] md:w-full shrink-0 md:shrink-0 snap-center"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg bg-slate-50 border border-slate-100/60 ${iconColor} shrink-0 mt-0.5`}>
                    <PromptIcon className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-[13.5px] font-extrabold text-slate-700 leading-snug group-hover:text-[#00BFB7] transition-colors line-clamp-2">
                    {prompt}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-[#00BFB7] uppercase tracking-wider mt-2 block opacity-80 group-hover:opacity-100 transition-opacity pl-9">
                  Ghi lại ngay →
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function JournalSection({ 
  tripId, 
  journals,
  onShowToast,
  onBack,
  isReadOnly
}: { 
  tripId: number; 
  journals: JournalEntry[];
  onShowToast?: (msg: string) => void;
  onBack?: () => void;
  isReadOnly?: boolean;
}) {
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [prefilledContent, setPrefilledContent] = useState("");

  // Delete flow state
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const sorted = [...journals].sort((a, b) => {
    const ta = a.postedAt || `${a.date}T00:00:00`;
    const tb = b.postedAt || `${b.date}T00:00:00`;
    return tb.localeCompare(ta);
  });
  const grouped = sorted.reduce<Record<string, JournalEntry[]>>((result, entry) => {
    result[entry.date] = [...(result[entry.date] ?? []), entry];
    return result;
  }, {});

  // Compute overview details
  const journalCount = journals.length;
  let lastMood = "";
  let lastWriteDate = "";
  if (journalCount > 0) {
    const sortedDesc = [...journals].sort((a, b) => b.date.localeCompare(a.date));
    lastMood = moodLabels[sortedDesc[0].mood] || "Đáng nhớ";
    lastWriteDate = formatDate(sortedDesc[0].date);
  }

  function handlePromptClick(promptText: string) {
    setPrefilledContent(`Gợi ý: ${promptText}\n\n`);
    setEditing(null);
    setIsFormOpen(true);
  }

  function openNewForm() {
    setPrefilledContent("");
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEditForm(entry: JournalEntry) {
    setPrefilledContent("");
    setEditing(entry);
    setIsFormOpen(true);
  }

  function triggerDelete(entry: JournalEntry) {
    setEntryToDelete(entry);
    setIsDeleteOpen(true);
  }

  async function executeDelete() {
    if (entryToDelete?.id) {
      await db.journals.update(entryToDelete.id, { isDeleted: true });
      onShowToast?.("Đã xóa nhật ký");
    }
    setIsDeleteOpen(false);
    setEntryToDelete(null);
  }

  return (
    <div className="mx-auto max-w-[960px] space-y-6 md:space-y-8 pb-0 md:pb-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent hover:bg-slate-100 text-slate-700 active:scale-95 transition-all shrink-0"
              title="Quay lại"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-[28px] md:text-[32px] font-extrabold tracking-tight text-[#030D2E]">Nhật ký hành trình</h1>
            <p className="mt-0.5 text-[14px] md:text-[15px] font-medium text-slate-500">Lưu lại cảm xúc, câu chuyện và những khoảnh khắc đáng nhớ.</p>
          </div>
        </div>
        {!isReadOnly && (
            <button
              onClick={openNewForm}
              className="hidden md:flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#030D2E] px-5 text-[14px] font-black text-white transition-all hover:bg-[#030D2E]/90 shadow-sm shrink-0 motion-press"
            >
              <PenLine className="w-4.5 h-4.5" strokeWidth={2.5} />
              Viết nhật ký
            </button>
        )}
      </div>

      {/* Journal Overview Card */}
      <div className="rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary">
            <BookOpenText className="h-6 w-6" />
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-6 flex-1 min-w-0">
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpenText className="h-3.5 w-3.5 text-kat-primary shrink-0" />
                Nhật ký đã viết
              </span>
              <span className="text-[15px] md:text-[17px] font-black text-[#030D2E] mt-1 block truncate">
                {journalCount > 0 ? `${journalCount} trang` : "Chưa có trang nào"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <SmilePlus className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                Cảm xúc mới nhất
              </span>
              <span className="text-[15px] md:text-[17px] font-black text-[#030D2E] mt-1 block truncate">
                {lastMood || "—"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                Lần ghi gần nhất
              </span>
              <span className="text-[15px] md:text-[17px] font-black text-[#030D2E] mt-1 block truncate">
                {lastWriteDate || "—"}
              </span>
            </div>
          </div>
        </div>
        {journalCount === 0 && (
          <p className="mt-3.5 pt-3.5 border-t border-slate-100 text-[13px] font-medium text-slate-500">
            Ghi lại một khoảnh khắc để chuyến đi có câu chuyện riêng.
          </p>
        )}
      </div>

      {/* Main List Area */}
      {sorted.length ? (
        <div className="space-y-6 md:space-y-8">
          {Object.entries(grouped).map(([date, entries]) => (
            <section key={date} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Calendar className="h-4.5 w-4.5 text-slate-400" />
                <h3 className="text-[15px] font-extrabold text-[#030D2E]">{formatDate(date)}</h3>
              </div>
              
              <div className="columns-1 md:columns-2 gap-4">
                {entries.map((entry, idx) => {
                  const moodBadge = moodBadgeClasses[entry.mood] || "bg-slate-50 text-slate-700 border-slate-200";
                  return (
                    <article 
                      key={entry.id} 
                      className={`break-inside-avoid mb-4 group rounded-[24px] border border-[#E8E1D8] bg-[#FFFDF8] shadow-soft hover:shadow-md transition-all flex flex-col motion-card-enter overflow-hidden motion-delay-${Math.min(idx + 1, 5)}`}
                    >
                      <div className="flex items-center justify-between gap-4 p-4 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-black text-[15px]">
                            {(entry.authorName || "T").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-extrabold text-slate-800">{entry.authorName || "Trưởng nhóm"}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${moodBadge}`}>
                                {moodLabels[entry.mood] || "Đáng nhớ"}
                              </span>
                              {entry.postedAt && (
                                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                                  <Clock3 className="h-2.5 w-2.5" />
                                  {new Date(entry.postedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Edit / Delete Buttons */}
                        {!isReadOnly && (
                          <div className="flex gap-1.5">
                            <button 
                              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-all motion-press" 
                              onClick={() => openEditForm(entry)}
                              title="Sửa nhật ký"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              className="flex h-8 w-8 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50 transition-all motion-press" 
                              onClick={() => triggerDelete(entry)}
                              title="Xóa nhật ký"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {entry.imageUrl && (
                        <div className="w-full bg-[#F3F4F6] border-y border-slate-100/50 flex justify-center">
                          <img src={entry.imageUrl} alt="Journal" className="w-full h-auto max-h-[500px] object-contain" />
                        </div>
                      )}

                      <div className="p-4 pt-3">
                        <h4 className="text-[17px] font-black text-[#030D2E] leading-snug break-words">
                          {entry.title || "Nhật ký chuyến đi"}
                        </h4>
                        <p className="mt-1.5 whitespace-pre-wrap text-[14.5px] leading-relaxed text-slate-600">
                          {entry.content}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <JournalEmptyState onPromptClick={handlePromptClick} onWrite={openNewForm} />
      )}

      {/* FAB Mobile button */}
      {!isReadOnly && (
        <FAB 
          icon={<PenLine className="h-6 w-6" strokeWidth={2.5} />} 
          label="Viết nhật ký" 
          onClick={openNewForm} 
          className="md:hidden h-14 w-14 bg-white/15 backdrop-blur-2xl border border-white/40 text-[#030D2E] hover:scale-105 hover:bg-white/25 duration-200 shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] motion-press"
        />
      )}

      {/* Modal Form */}
      <JournalForm
        tripId={tripId}
        editing={editing}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        prefilledContent={prefilledContent}
        onClearPrefilled={() => setPrefilledContent("")}
        onShowToast={onShowToast}
      />

      {/* Delete Confirmation Sheet */}
      <DeleteJournalConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setEntryToDelete(null);
        }}
        onConfirm={executeDelete}
      />
    </div>
  );
}
