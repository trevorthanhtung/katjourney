import React, { useEffect, useState } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  Ticket, 
  Hotel, 
  CalendarCheck, 
  Phone, 
  Map, 
  FileText, 
  FileCheck, 
  ExternalLink,
  Link2
} from "lucide-react";
import { db, TravelDocument } from "../../db";
import { useLiveQuery } from "dexie-react-hooks";
import { BottomSheet, Input, Textarea, Select, TypedDeleteConfirmModal } from "../../components/ui";

const typeOptions: Array<{ value: NonNullable<TravelDocument["type"]>; label: string }> = [
  { value: "ticket", label: "Vé di chuyển" },
  { value: "hotel", label: "Đặt phòng" },
  { value: "booking", label: "Mã đặt chỗ" },
  { value: "contact", label: "Liên hệ" },
  { value: "map", label: "Bản đồ" },
  { value: "other", label: "Khác" }
];

const typeLabels: Record<NonNullable<TravelDocument["type"]>, string> = {
  ticket: "Vé di chuyển",
  hotel: "Đặt phòng",
  booking: "Mã đặt chỗ",
  document: "Khác",
  contact: "Liên hệ",
  map: "Bản đồ",
  other: "Khác"
};

const typeIcons: Record<NonNullable<TravelDocument["type"]>, React.ElementType> = {
  ticket: Ticket,
  hotel: Hotel,
  booking: CalendarCheck,
  document: FileText,
  contact: Phone,
  map: Map,
  other: FileText
};

const typeColors: Record<NonNullable<TravelDocument["type"]>, { bg: string; text: string; border: string }> = {
  ticket: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200/50" },
  hotel: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200/50" },
  booking: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200/50" },
  document: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200/50" },
  contact: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200/50" },
  map: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200/50" },
  other: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200/50" }
};

interface DocumentFormProps {
  tripId: number;
  editing: TravelDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

function DocumentForm({ tripId, editing, isOpen, onClose, onShowToast }: DocumentFormProps) {
  const [form, setForm] = useState({
    title: "",
    type: "ticket" as NonNullable<TravelDocument["type"]>,
    code: "",
    date: "",
    link: "",
    note: ""
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editing) {
        setForm({
          title: editing.title || "",
          type: editing.type || "ticket",
          code: editing.code || "",
          date: editing.date || "",
          link: editing.link || "",
          note: editing.note || ""
        });
      } else {
        setForm({
          title: "",
          type: "ticket",
          code: "",
          date: "",
          link: "",
          note: ""
        });
      }
      setSubmitAttempted(false);
      setDirty(false);
    }
  }, [editing, isOpen]);

  const titleError = !form.title.trim() ? "Vui lòng nhập tiêu đề." : "";
  const hasError = !!titleError;

  async function save() {
    setSubmitAttempted(true);
    if (hasError) return;

    const payload: Omit<TravelDocument, "id"> = {
      tripId,
      title: form.title.trim(),
      type: form.type,
      code: form.code.trim(),
      date: form.date,
      link: form.link.trim(),
      note: form.note.trim(),
      updatedAt: new Date().toISOString()
    };

    if (editing?.id) {
      await db.travelDocuments.update(editing.id, payload);
      onShowToast?.("Đã cập nhật giấy tờ");
    } else {
      await db.travelDocuments.add({
        ...payload,
        createdAt: new Date().toISOString()
      });
      onShowToast?.("Đã lưu giấy tờ mới");
    }
    onClose();
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={editing ? "Chỉnh sửa giấy tờ & đặt chỗ" : "Thêm giấy tờ & đặt chỗ"}>
      <div className="space-y-4">
        <div>
          <Input 
            label="Tên mục *" 
            value={form.title} 
            onChange={(title) => { setForm({ ...form, title }); setDirty(true); }} 
            placeholder="VD: Vé máy bay khứ hồi, mã đặt phòng khách sạn..." 
          />
          {(dirty || submitAttempted) && titleError && (
            <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{titleError}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select 
            label="Phân loại" 
            value={form.type} 
            onChange={(type) => { setForm({ ...form, type: type as NonNullable<TravelDocument["type"]> }); setDirty(true); }}
            options={typeOptions.map(t => t.value)}
            labels={typeLabels}
          />
          <Input 
            label="Mã / thông tin đặt chỗ" 
            value={form.code} 
            onChange={(code) => { setForm({ ...form, code }); setDirty(true); }} 
            placeholder="VD: PNR ABC123, mã phòng, số vé..." 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="Ngày liên quan" 
            type="date"
            value={form.date} 
            onChange={(date) => { setForm({ ...form, date }); setDirty(true); }} 
          />
          <Input 
            label="Đường dẫn liên quan" 
            value={form.link} 
            onChange={(link) => { setForm({ ...form, link }); setDirty(true); }} 
            placeholder="VD: Link vé điện tử, bản đồ, tệp đặt phòng..." 
          />
        </div>

        <div>
          <Textarea 
            label="Ghi chú" 
            value={form.note} 
            onChange={(note) => { setForm({ ...form, note }); setDirty(true); }} 
            placeholder="VD: Giờ nhận phòng, hành lý, số điện thoại liên hệ..." 
          />
        </div>

        <div className="flex gap-3 pt-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-[15px] hover:bg-slate-200 active:scale-98 transition-all"
          >
            Hủy bỏ
          </button>
          <button
            onClick={save}
            className="flex-1 py-3.5 rounded-2xl bg-kat-primary text-white font-bold text-[15px] hover:bg-kat-primary-dark shadow-sm active:scale-98 transition-all"
          >
            Lưu giấy tờ
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

export function TravelDocumentsSection({ 
  tripId, 
  onBack, 
  onShowToast 
}: { 
  tripId: number; 
  onBack: () => void; 
  onShowToast?: (msg: string) => void; 
}) {
  const documents = useLiveQuery(() => db.travelDocuments.where("tripId").equals(tripId).toArray(), [tripId]) ?? [];
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TravelDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<TravelDocument | null>(null);

  const filteredDocs = selectedTypeFilter === "all" 
    ? documents 
    : documents.filter(doc => doc.type === selectedTypeFilter);

  async function executeDelete() {
    if (!docToDelete?.id) return;
    await db.travelDocuments.delete(docToDelete.id);
    onShowToast?.("Đã xóa thành công");
    setDocToDelete(null);
  }

  function openNewForm() {
    setEditingDoc(null);
    setFormOpen(true);
  }

  function openEditForm(doc: TravelDocument) {
    setEditingDoc(doc);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFDF8] p-5 rounded-[24px] border border-[#E8E1D8] shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <button 
            onClick={onBack} 
            className="flex h-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors px-3 shrink-0 motion-press"
            title="Quản lý chuyến đi"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            <span className="text-[13px] font-extrabold ml-1.5 hidden sm:inline">Quản lý chuyến đi</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-[20px] font-extrabold text-[#030D2E] leading-tight">Giấy tờ & đặt chỗ</h2>
            <p className="text-[13px] font-semibold text-slate-500 mt-1 max-w-xl">Lưu vé, mã đặt chỗ và thông tin quan trọng để tra cứu nhanh khi cần.</p>
          </div>
        </div>
        {documents.length > 0 && (
          <button
            onClick={openNewForm}
            className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-kat-primary/10 border border-kat-primary/30 text-kat-text px-5 text-[13.5px] font-bold hover:bg-kat-primary/20 motion-press shadow-sm shrink-0 w-full sm:w-auto self-stretch sm:self-center"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>Thêm giấy tờ</span>
          </button>
        )}
      </div>

      {/* Filter bar */}
      {documents.length > 0 && (
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 px-1">
          <button
            onClick={() => setSelectedTypeFilter("all")}
            className={`px-4 py-2 rounded-full text-[13px] font-extrabold border transition-all motion-press ${
              selectedTypeFilter === "all"
                ? "bg-[#030D2E] border-[#030D2E] text-white"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tất cả ({documents.length})
          </button>
          {typeOptions.map(opt => {
            const count = documents.filter(doc => doc.type === opt.value).length;
            if (count === 0) return null; // Only show filters with items
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedTypeFilter(opt.value)}
                className={`px-4 py-2 rounded-full text-[13px] font-extrabold border transition-all motion-press ${
                  selectedTypeFilter === opt.value
                    ? "bg-[#030D2E] border-[#030D2E] text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[28px] bg-white border border-[#E8E1D8] p-12 text-center shadow-soft max-w-md mx-auto">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-kat-primary/10 text-kat-primary">
            <FileText className="h-8 w-8" />
          </div>
          <h4 className="text-[16px] font-extrabold text-[#030D2E] mb-1">
            {selectedTypeFilter === "all" ? "Chưa có giấy tờ nào" : "Không tìm thấy mục lưu trữ"}
          </h4>
          <p className="text-[13.5px] font-semibold text-slate-400 mb-6 max-w-[280px]">
            {selectedTypeFilter === "all" 
              ? "Lưu vé, mã đặt chỗ, liên hệ quan trọng hoặc link bản đồ để tra cứu nhanh khi cần."
              : "Chọn bộ lọc khác hoặc thêm mới giấy tờ & đặt chỗ thuộc nhóm này."}
          </p>
          <button 
            onClick={openNewForm}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-kat-primary/10 border border-kat-primary/25 px-5 py-2.5 text-[13.5px] font-bold text-kat-text hover:bg-kat-primary/20 motion-press shadow-sm"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
            Thêm giấy tờ đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc, idx) => {
            const colors = typeColors[doc.type || "other"];
            const Icon = typeIcons[doc.type || "other"];
            const formattedDate = doc.date ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(doc.date)) : null;

            return (
              <div 
                key={doc.id} 
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-150 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 motion-card-enter motion-delay-${Math.min(idx + 1, 5)}`}
              >
                <div>
                  {/* Top info row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {typeLabels[doc.type || "other"].split(" / ")[0]}
                    </span>

                    {/* Actions buttons */}
                    <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditForm(doc)}
                        className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors motion-press"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDocToDelete(doc)}
                        className="p-1.5 rounded-full text-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors motion-press"
                        title="Xóa bỏ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Code */}
                  <h4 className="text-[16px] font-extrabold text-[#030D2E] leading-tight mb-2">{doc.title}</h4>
                  
                  {doc.code && (
                    <div className="mb-2">
                      <span className="text-[12px] font-semibold text-slate-400">Mã xác nhận / Code:</span>
                      <span className="ml-1.5 inline-block text-[13px] font-bold text-slate-700 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md">
                        {doc.code}
                      </span>
                    </div>
                  )}

                  {/* Date & Note */}
                  {formattedDate && (
                    <p className="text-[13px] font-semibold text-slate-500 mb-1.5">
                      Ngày liên quan: <span className="font-extrabold text-slate-700">{formattedDate}</span>
                    </p>
                  )}

                  {doc.note && (
                    <p className="text-[13px] text-slate-500 font-medium whitespace-pre-line bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 mt-2">
                      {doc.note}
                    </p>
                  )}
                </div>

                {/* Bottom link row */}
                {doc.link && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <a
                      href={doc.link.startsWith("http") ? doc.link : `https://${doc.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] font-bold text-kat-primary hover:text-kat-primary-dark transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Mở liên kết trực tuyến</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TypedDeleteConfirmModal
        isOpen={Boolean(docToDelete)}
        onClose={() => setDocToDelete(null)}
        onConfirm={executeDelete}
        title="Xóa giấy tờ này?"
        itemName={docToDelete?.title}
        description="Mục giấy tờ hoặc đặt chỗ này sẽ bị xóa khỏi chuyến đi. Sau khi xóa, không thể hoàn tác."
        confirmLabel="Xóa giấy tờ"
      />

      {/* Document Form Bottom Sheet */}
      <DocumentForm 
        tripId={tripId} 
        editing={editingDoc} 
        isOpen={formOpen} 
        onClose={() => setFormOpen(false)} 
        onShowToast={onShowToast} 
      />
    </div>
  );
}
