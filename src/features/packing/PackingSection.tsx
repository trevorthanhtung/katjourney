import React, { useState } from "react";
import { Check, Edit3, Plus, Sparkles, Trash2, Luggage } from "lucide-react";
import { db, PackingItem, PackingTripType } from "../../db";
import { getChecklistStats, packingSuggestions, packingTripTypes } from "../../utils/helpers";
import { BottomSheet, EmptyCard, FAB, FormActions, FormCard, IconButton, Input, ProgressRing, ScreenTitle, Select, classNames } from "../../components/ui";

export function PackingSection({ tripId, packingItems }: { tripId: number; packingItems: PackingItem[] }) {
  const [tripType, setTripType] = useState<PackingTripType>("Biển");
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<PackingItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Cast section to "Before Trip" just to satisfy the getChecklistStats type which expects ChecklistItem
  const stats = getChecklistStats(packingItems.map((item) => ({ ...item, section: "Before Trip" as const })));

  const groupedItems = [...packingItems].reduce<Record<string, PackingItem[]>>((acc, item) => {
    acc[item.tripType] = [...(acc[item.tripType] || []), item];
    return acc;
  }, {});

  async function generateSuggestions() {
    // Fetch directly from DB to prevent duplicate generation on rapid clicks
    const currentItems = await db.packingItems.where("tripId").equals(tripId).toArray();
    const existing = new Set(currentItems.map((item) => item.title.trim().toLowerCase()));
    
    const suggestions = packingSuggestions[tripType]
      .filter((item) => !existing.has(item.toLowerCase()))
      .map((item) => ({ tripId, tripType, title: item, completed: false }));
      
    if (suggestions.length) await db.packingItems.bulkAdd(suggestions);
  }

  async function addOrEditItem() {
    if (!title.trim()) return;
    if (editing?.id) {
      await db.packingItems.update(editing.id, { title: title.trim(), tripType });
      setEditing(null);
    } else {
      await db.packingItems.add({ tripId, tripType, title: title.trim(), completed: false });
    }
    setTitle("");
    setIsFormOpen(false);
  }

  function openNewForm() {
    setEditing(null);
    setTitle("");
    setIsFormOpen(true);
  }

  function startEdit(item: PackingItem) {
    setEditing(item);
    setTitle(item.title);
    setTripType(item.tripType);
    setIsFormOpen(true);
  }

  async function deleteItem(item: PackingItem) {
    if (!item.id || !window.confirm("Xóa món đồ này khỏi danh sách hành lý?")) return;
    await db.packingItems.delete(item.id);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="space-y-6 pb-28">
        <ScreenTitle title="Hành lý" subtitle="Gợi ý thông minh, không lo bỏ sót." />
        
        {/* Progress Card Hero */}
        <section className="flex flex-col items-center justify-center rounded-[32px] bg-emerald-50 p-8 shadow-sm border border-emerald-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-600 mb-4 shadow-sm">
            <Luggage className="h-8 w-8" />
          </div>
          <h3 className="text-[20px] font-bold text-emerald-900 mb-1">Chuẩn bị hành lý</h3>
          <p className="text-[15px] font-bold text-emerald-700 bg-white px-4 py-1.5 rounded-full mb-3 shadow-sm">
            {stats.completed} / {stats.total} món đã sẵn sàng
          </p>
          <p className="text-[14px] font-medium text-emerald-600 text-center">
            {stats.completed === stats.total && stats.total > 0 
              ? "Tuyệt vời! Hành lý đã sẵn sàng."
              : stats.total === 0 
                ? "Thêm món đồ đầu tiên để bắt đầu chuẩn bị."
                : `Còn ${stats.total - stats.completed} món nữa để chuyến đi hoàn hảo.`}
          </p>
        </section>



        <section>
          {packingItems.length ? (
            <div className="space-y-6">
              {Object.entries(groupedItems).sort(([a], [b]) => a.localeCompare(b)).map(([type, items]) => (
                <div key={type} className="space-y-3">
                  <h3 className="px-1 text-[16px] font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {type}
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {items.sort((a, b) => a.title.localeCompare(b.title)).map((item) => (
                      <div key={item.id} className={classNames("flex items-center gap-4 rounded-[20px] bg-white p-4 shadow-sm border transition-all hover:shadow-md", item.completed ? "opacity-60 border-slate-100 bg-slate-50/50" : "border-slate-100")}>
                        <button
                          className={classNames(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                            item.completed ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-100 text-slate-300 ring-1 ring-inset ring-slate-200 hover:bg-slate-200"
                          )}
                          onClick={() => db.packingItems.update(item.id!, { completed: !item.completed })}
                          aria-label="Đánh dấu hành lý"
                        >
                          <Check className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={classNames("break-words text-[16px] font-medium transition-all duration-300", item.completed ? "text-slate-500 line-through" : "text-slate-800")}>{item.title}</p>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyCard text="Chưa có món đồ nào. Nhận gợi ý để bắt đầu chuẩn bị nhé!" />
          )}
        </section>
      </div>



      <BottomSheet isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editing ? "Sửa món đồ" : "Thêm món đồ"}>
        <div className="space-y-4">
          <Input label="Tên món đồ" value={title} onChange={setTitle} placeholder="VD: Bàn chải điện" />
          <div className="pt-2">
            <FormActions onSave={() => void addOrEditItem()} saveLabel={editing ? "Lưu thay đổi" : "Thêm vào danh sách"} />
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
