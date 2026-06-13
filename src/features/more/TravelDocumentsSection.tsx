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
  Link2,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
  PencilLine
} from "lucide-react";
import { db, TravelDocument } from "../../db";
import { useLiveQuery } from "dexie-react-hooks";
import { BottomSheet, Input, Textarea, Select, DeleteConfirmModal, classNames } from "../../components/ui";

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAdvanced(false);
      if (editing) {
        setForm({
          title: editing.title || "",
          type: editing.type || "ticket",
          code: editing.code || "",
          date: editing.date || "",
          link: editing.link || "",
          note: editing.note || ""
        });
        if (editing.date || editing.link || editing.note) {
          setShowAdvanced(true);
        }
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

  const isSaveDisabled = !form.title.trim();

  const headerAction = (
    <button
      type="button"
      onClick={save}
      disabled={isSaveDisabled}
      className="inline-flex h-9 items-center justify-center rounded-xl bg-kat-primary hover:bg-kat-primary-usable text-[#030D2E] px-4 text-[13.5px] font-bold shadow-sm transition-all active:scale-[0.97] disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed"
    >
      Lưu
    </button>
  );

  return (
    <BottomSheet 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editing ? "Sửa giấy tờ & đặt chỗ" : "Thêm giấy tờ & đặt chỗ"}
      headerAction={headerAction}
    >
      <div className="space-y-4">
        {/* Title */}
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

        {/* Type & Code */}
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

        {/* Collapsible Info Section */}
        <div className="pt-2 border-t border-slate-100/80">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between py-2 text-sm font-bold text-slate-500 hover:text-[#030D2E] transition-colors focus:outline-none"
          >
            <span className="flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-slate-400" />
              Thông tin bổ sung
            </span>
            <ChevronRight className={classNames("h-4 w-4 transition-transform duration-200 text-slate-400", showAdvanced ? "rotate-90" : "")} />
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-4 animate-fadeIn">
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
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}

function DocumentCard({
  doc,
  onEdit,
  onDelete,
  idx = 0,
  isSwiped,
  onSwipe
}: {
  doc: TravelDocument;
  onEdit: () => void;
  onDelete: () => void;
  idx?: number;
  isSwiped: boolean;
  onSwipe: (swiped: boolean) => void;
}) {
  const colors = typeColors[doc.type || "other"];
  const Icon = typeIcons[doc.type || "other"];
  const formattedDate = doc.date ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(doc.date)) : null;

  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!doc.code) return;
    navigator.clipboard.writeText(doc.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const touchStartX = React.useRef(0);
  const touchEndX = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) {
      onSwipe(true);
    } else if (diff < -40) {
      onSwipe(false);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl motion-card-enter motion-delay-${Math.min(idx + 1, 5)}`}>
      {/* Background Action Buttons */}
      <div className="absolute inset-y-0 right-0 z-0 flex items-center justify-end gap-2 pr-4 pl-12 bg-slate-50/60 rounded-3xl border border-slate-100">
        <button 
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm border border-slate-200/50 focus:outline-none" 
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Chỉnh sửa"
        >
          <PencilLine className="h-5 w-5" />
        </button>
        <button 
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 transition-all shadow-sm border border-rose-100 focus:outline-none" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Xóa"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Main Card Content Overlay */}
      <article 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          e.stopPropagation();
          onSwipe(!isSwiped);
        }}
        className={classNames(
          "relative z-10 flex flex-col justify-between rounded-3xl bg-[#FFFDF8] p-5 border border-[#E8E1D8] transition-all duration-200 hover:shadow-md cursor-pointer select-none",
          isSwiped ? "-translate-x-28 border-slate-300" : "translate-x-0"
        )}
      >
        <div>
          {/* Top info row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
              <Icon className="w-3.5 h-3.5" />
              {typeLabels[doc.type || "other"].split(" / ")[0]}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-lg font-semibold text-[#030D2E] leading-tight mb-2.5">{doc.title}</h4>
          
          {/* Code Container */}
          {doc.code && (
            <div 
              onClick={handleCopy}
              className="group/code flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 border border-slate-200/50 rounded-xl p-3 mt-2.5 transition-all active:scale-[0.99] cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã xác nhận / Code</p>
                <p className="text-[14px] font-extrabold text-[#030D2E] truncate mt-0.5">{doc.code}</p>
              </div>
              <button
                type="button"
                className="ml-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200/60 text-slate-500 hover:text-[#030D2E] transition-all shadow-sm shrink-0"
                title="Sao chép mã"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          )}

          {/* Date & Note */}
          {formattedDate && (
            <p className="text-[13px] font-semibold text-slate-500 mt-3.5">
              Ngày liên quan: <span className="font-extrabold text-slate-700">{formattedDate}</span>
            </p>
          )}

          {doc.note && (
            <p className="text-[13px] text-slate-500 font-medium whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-100 mt-2.5">
              {doc.note}
            </p>
          )}
        </div>

        {/* Bottom link row */}
        {doc.link && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center">
            <a
              href={doc.link.startsWith("http") ? doc.link : `https://${doc.link}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-kat-primary hover:text-kat-primary-dark transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Mở liên kết trực tuyến</span>
            </a>
          </div>
        )}
      </article>
    </div>
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
  const [swipedDocId, setSwipedDocId] = useState<number | null>(null);

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
    <div 
      className="space-y-6 animate-fadeIn pb-24"
      onClick={() => setSwipedDocId(null)}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={onBack} 
            className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent hover:bg-slate-100 text-slate-700 active:scale-95 transition-all shrink-0 motion-press"
            title="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-[28px] font-extrabold text-[#030D2E] leading-tight">Giấy tờ & đặt chỗ</h2>
            <p className="text-[14px] font-medium text-slate-500 mt-0.5">Lưu vé, mã đặt chỗ và thông tin quan trọng để tra cứu nhanh khi cần.</p>
          </div>
        </div>
        {documents.length > 0 && (
          <button
            onClick={openNewForm}
            className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#00BFB7] text-[#030D2E] px-5 text-[13.5px] font-bold hover:brightness-105 active:scale-95 transition-all motion-press shadow-sm shrink-0 w-full sm:w-auto self-stretch sm:self-center"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            <span>Thêm giấy tờ</span>
          </button>
        )}
      </div>

      {/* Filter bar */}
      {documents.length > 0 && (
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 px-1 scrollbar-none">
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
          {filteredDocs.map((doc, idx) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onEdit={() => {
                setSwipedDocId(null);
                openEditForm(doc);
              }}
              onDelete={() => {
                setSwipedDocId(null);
                setDocToDelete(doc);
              }}
              idx={idx}
              isSwiped={swipedDocId === doc.id}
              onSwipe={(swiped) => setSwipedDocId(swiped ? doc.id! : null)}
            />
          ))}
        </div>
      )}

      <DeleteConfirmModal
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
