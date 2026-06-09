import React, { useState } from "react";
import { Check, Plus, Trash2, Luggage } from "lucide-react";
import { ChecklistItem, ChecklistSection, db } from "../../db";
import { checklistSections, getChecklistStats, sectionLabels } from "../../utils/helpers";
import { BottomSheet, EmptyCard, FAB, FormActions, IconButton, Input, ProgressRing, ScreenTitle, Select, classNames } from "../../components/ui";

export function ChecklistScreen({ checklist, tripId }: { checklist: ChecklistItem[]; tripId: number }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState<ChecklistSection>("Before Trip");
  const stats = getChecklistStats(checklist);

  async function addItem() {
    if (!title.trim()) return;
    await db.checklist.add({ tripId, title: title.trim(), section, completed: false });
    setTitle("");
    setIsFormOpen(false);
  }

  const isEmpty = checklist.length === 0;

  function handleQuickAdd(suggestedTitle: string) {
    setTitle(suggestedTitle);
    setSection("Before Trip");
    setIsFormOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="space-y-6 pb-8">
        <ScreenTitle title="Chuẩn bị" subtitle="Đừng để quên những thứ quan trọng nhất." />
        
        {/* Progress Ring Hero */}
        <section className="flex flex-col items-center justify-center rounded-[32px] bg-white p-8 shadow-sm border border-emerald-950/5">
          <ProgressRing value={stats.percent} size={140} strokeWidth={12}>
            <span className="text-3xl font-bold text-slate-900">{stats.percent}%</span>
            <span className="text-[13px] font-medium text-slate-500">Hoàn thành</span>
          </ProgressRing>
          {!isEmpty && (
            <p className="mt-6 text-center text-[15px] font-medium text-slate-600">
              {stats.completed} / {stats.total} mục đã xong
            </p>
          )}
          <button 
            onClick={() => { setTitle(""); setIsFormOpen(true); }}
            className="mt-6 flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-6 py-2.5 text-[14px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Thêm món đồ
          </button>
        </section>

        {/* Sections */}
        <div className="grid gap-6 md:grid-cols-2 items-start">
          {checklistSections.map((group) => {
            const items = checklist.filter((item) => item.section === group);
            if (items.length === 0) return null;
            
            return (
              <section key={group}>
                <h3 className="mb-3 px-1 text-[17px] font-bold text-slate-900">{sectionLabels[group]}</h3>
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-emerald-950/5">
                  {items.map((item, index) => (
                    <div key={item.id} className={classNames("flex items-center gap-4 p-4 transition-colors hover:bg-slate-50", index !== items.length - 1 && "border-b border-slate-100")}>
                      <button
                        className={classNames(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                          item.completed ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300 ring-1 ring-inset ring-slate-200 hover:bg-slate-200"
                        )}
                        onClick={() => db.checklist.update(item.id!, { completed: !item.completed })}
                        aria-label="Đánh dấu checklist"
                      >
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                      <p className={classNames("min-w-0 flex-1 break-words text-[16px] font-medium transition-all duration-300", item.completed ? "text-slate-400 line-through" : "text-slate-700")}>
                        {item.title}
                      </p>
                      <button className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors" onClick={() => db.checklist.delete(item.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
          {isEmpty && (
            <div className="md:col-span-2 rounded-[32px] bg-white px-6 py-12 shadow-sm border border-slate-100 flex flex-col items-center text-center animate-fadeIn">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6 ring-8 ring-emerald-50/50">
                <Luggage className="h-10 w-10" />
              </div>
              <p className="text-[18px] font-bold text-slate-900 mb-2">Chưa có món đồ nào.</p>
              <p className="text-[15px] font-medium text-slate-500 mb-8 max-w-sm">
                Thêm những thứ cần mang theo để chuyến đi không bị thiếu sót.
              </p>
              
              <button 
                onClick={() => { setTitle(""); setIsFormOpen(true); }}
                className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-[15px] font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg hover:bg-emerald-700 active:scale-95 w-full sm:w-auto mb-8"
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} />
                Thêm món đồ đầu tiên
              </button>

              <div className="space-y-4">
                <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">Gợi ý bắt đầu</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {["Giấy tờ", "Quần áo", "Sạc pin", "Thuốc men", "Đồ cá nhân"].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleQuickAdd(chip)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[14px] font-medium text-slate-600 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isEmpty && (
        <FAB 
          icon={<Plus className="h-7 w-7" strokeWidth={2.5} />} 
          label="Thêm mục chuẩn bị" 
          onClick={() => { setTitle(""); setIsFormOpen(true); }} 
          className="md:hidden h-14 w-14 sm:h-16 sm:w-16 bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
        />
      )}

      <BottomSheet isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Thêm việc cần làm">
        <div className="space-y-4">
          <Input label="Nội dung" value={title} onChange={setTitle} placeholder="VD: Mua bảo hiểm du lịch" />
          <Select
            label="Nhóm"
            value={section}
            onChange={(value) => setSection(value as ChecklistSection)}
            options={checklistSections}
            labels={sectionLabels}
          />
          <div className="pt-2">
            <FormActions onSave={addItem} saveLabel="Thêm vào danh sách" />
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
