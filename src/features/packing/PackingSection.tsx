import React, { useState } from "react";
import { Check, Edit3, Plus, Sparkles, Trash2, Luggage } from "lucide-react";
import { db, PackingItem, PackingTripType } from "../../db";
import { getChecklistStats, packingSuggestions, packingTripTypes } from "../../utils/helpers";
import { BottomSheet, EmptyCard, FAB, FormActions, FormCard, IconButton, Input, ProgressRing, ScreenTitle, Select, DeleteConfirmModal, classNames } from "../../components/ui";

export function PackingSection({ tripId, packingItems }: { tripId: number; packingItems: PackingItem[] }) {
  const [tripType, setTripType] = useState<PackingTripType>("Biển");
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<PackingItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PackingItem | null>(null);
  
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

  function deleteItem(item: PackingItem) {
    if (!item.id) return;
    setItemToDelete(item);
  }

  async function executeDeleteItem() {
    if (!itemToDelete?.id) return;
    await db.packingItems.delete(itemToDelete.id);
    setItemToDelete(null);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="space-y-6 pb-0 md:pb-8">
        <ScreenTitle title="Hành lý" subtitle="Gợi ý thông minh, không lo bỏ sót." />
        
        {/* Progress Card Hero */}
        <section className="flex flex-col items-center justify-center rounded-[24px] bg-kat-surface p-8 shadow-soft border border-kat-border/60">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mb-4 ring-4 ring-kat-primary/5">
            <Luggage className="h-6 w-6" />
          </div>
          <h3 className="text-[18px] font-bold text-kat-text mb-1">Chuẩn bị hành lý</h3>
          <p className="text-[13px] font-bold text-kat-primary bg-kat-primary/10 px-4 py-1.5 rounded-full mb-3 shadow-sm">
            {stats.completed} / {stats.total} món đã sẵn sàng
          </p>
          <p className="text-[13.5px] font-medium text-kat-muted text-center">
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
            <EmptyCard text="Chưa có món đồ nào. Nhận gợi ý để bắt đầu chuẩn bị nhé!" icon={<Luggage className="h-6 w-6" />} />
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

      <DeleteConfirmModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={executeDeleteItem}
        title="Xóa món hành lý này?"
        itemName={itemToDelete?.title}
        description="Món hành lý này sẽ bị xóa khỏi danh sách chuẩn bị. Sau khi xóa, không thể hoàn tác."
        confirmLabel="Xóa món"
      />
    </div>
  );
}
