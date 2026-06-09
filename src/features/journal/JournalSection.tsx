import React, { useEffect, useState } from "react";
import { Edit3, Plus, Trash2, BookOpen } from "lucide-react";
import { db, JournalEntry, JournalMood } from "../../db";
import { formatDate, moodLabels, moods, today } from "../../utils/helpers";
import { BottomSheet, EmptyCard, FAB, FormActions, Input, ScreenTitle, Select, Textarea } from "../../components/ui";

function JournalForm({ tripId, editing, isOpen, onClose }: { tripId: number; editing: JournalEntry | null; isOpen: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ date: today, title: "", content: "", mood: "good" as JournalMood });

  useEffect(() => {
    if (isOpen) {
      setForm(
        editing
          ? { date: editing.date, title: editing.title, content: editing.content, mood: editing.mood }
          : { date: today, title: "", content: "", mood: "good" }
      );
    }
  }, [editing, isOpen]);

  async function save() {
    if (!form.title.trim() && !form.content.trim()) return;
    if (editing?.id) {
      await db.journals.update(editing.id, form);
      onClose();
    } else {
      await db.journals.add({ ...form, tripId });
      onClose();
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={editing ? "Sửa nhật ký" : "Viết nhật ký"}>
      <div className="space-y-4">
        <Input label="Ngày" type="date" value={form.date} onChange={(date) => setForm({ ...form, date })} />
        <Input label="Tiêu đề" value={form.title} onChange={(title) => setForm({ ...form, title })} placeholder="Một ngày tuyệt vời..." />
        <Select
          label="Cảm xúc"
          value={form.mood}
          onChange={(mood) => setForm({ ...form, mood: mood as JournalMood })}
          options={moods}
          labels={moodLabels}
        />
        <Textarea label="Nội dung" value={form.content} onChange={(content) => setForm({ ...form, content })} placeholder="Ghi lại những điều đáng nhớ nhất..." />
        <div className="pt-2">
          <FormActions onSave={save} saveLabel={editing ? "Lưu thay đổi" : "Lưu nhật ký"} />
        </div>
      </div>
    </BottomSheet>
  );
}

function JournalEmptyState({ onWrite }: { onWrite: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6">
        <BookOpen className="h-10 w-10" />
      </div>
      <h3 className="text-[22px] font-bold text-slate-900 mb-3">Chưa có trang nhật ký nào.</h3>
      <p className="text-[15px] text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
        Hãy ghi lại cảm xúc, câu chuyện hoặc khoảnh khắc đáng nhớ trong chuyến đi này.
      </p>
      
      <button 
        onClick={onWrite}
        className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-[15px] font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95 mb-12"
      >
        <Plus className="h-5 w-5" />
        Viết nhật ký đầu tiên
      </button>

      <div className="w-full max-w-lg text-left">
        <p className="text-[13px] font-bold uppercase tracking-wider text-slate-400 mb-4 pl-2">Gợi ý cho bạn</p>
        <div className="space-y-3">
          <button onClick={onWrite} className="w-full text-left bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <p className="text-[15px] font-medium text-slate-700 group-hover:text-emerald-700">Hôm nay bạn nhớ nhất điều gì?</p>
          </button>
          <button onClick={onWrite} className="w-full text-left bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <p className="text-[15px] font-medium text-slate-700 group-hover:text-emerald-700">Có khoảnh khắc nào khiến bạn muốn lưu lại?</p>
          </button>
          <button onClick={onWrite} className="w-full text-left bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <p className="text-[15px] font-medium text-slate-700 group-hover:text-emerald-700">Một món ăn, một nơi chốn, hoặc một người bạn gặp?</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export function JournalSection({ tripId, journals }: { tripId: number; journals: JournalEntry[] }) {
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const sorted = [...journals].sort((a, b) => `${b.date}${b.id ?? 0}`.localeCompare(`${a.date}${a.id ?? 0}`));
  const grouped = sorted.reduce<Record<string, JournalEntry[]>>((result, entry) => {
    result[entry.date] = [...(result[entry.date] ?? []), entry];
    return result;
  }, {});

  async function deleteEntry(entry: JournalEntry) {
    if (!entry.id || !window.confirm("Xóa nhật ký này khỏi chuyến đi?")) return;
    await db.journals.delete(entry.id);
  }

  function openNewForm() {
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEditForm(entry: JournalEntry) {
    setEditing(entry);
    setIsFormOpen(true);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="space-y-6 pb-28">
        <ScreenTitle 
          title="Nhật ký" 
          subtitle="Ghi lại cảm xúc và những điều đáng nhớ." 
          action={
            <button 
              onClick={openNewForm}
              className="hidden md:flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-5 py-2.5 text-[14px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <Plus className="h-4 w-4" />
              Viết nhật ký
            </button>
          }
        />
        
        {sorted.length ? (
          Object.entries(grouped).map(([date, entries]) => (
            <section key={date} className="space-y-4">
              <h3 className="px-1 text-[15px] font-bold text-slate-900">{formatDate(date)}</h3>
              <div className="space-y-4">
                {entries.map((entry) => (
                  <article key={entry.id} className="group relative rounded-[24px] bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider text-emerald-700">
                          {moodLabels[entry.mood]}
                        </span>
                        <div className="flex shrink-0 gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" onClick={() => openEditForm(entry)}>
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" onClick={() => void deleteEntry(entry)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-[18px] font-bold text-slate-900 leading-snug">
                          {entry.title || "Một ngày trong chuyến đi"}
                        </h4>
                        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-600 line-clamp-4">
                          {entry.content}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        ) : (
          <JournalEmptyState onWrite={openNewForm} />
        )}
      </div>

      <FAB 
        icon={<Plus className="h-7 w-7" />} 
        label="Viết nhật ký" 
        onClick={openNewForm} 
        className="md:hidden h-16 w-16 bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
      />

      <JournalForm
        tripId={tripId}
        editing={editing}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}
