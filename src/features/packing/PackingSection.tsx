import { useTranslation } from "react-i18next";
import React, { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckIcon, Delete01Icon, Luggage01Icon, MoreHorizontalIcon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { db, PackingItem, PackingTripType } from "../../db";
import { getChecklistStats, packingSuggestions, packingTripTypes } from "../../utils/helpers";
import { BottomSheet, EmptyCard, FAB, FormActions, FormCard, IconButton, Input, ProgressRing, ScreenTitle, Select, DeleteConfirmModal, classNames } from "../../components/ui";
import { useModalHistory } from "../../hooks/useModalHistory";

function PackingItemRow({ item, onEdit, onDelete }: { item: PackingItem; onEdit: () => void; onDelete: () => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <div className={classNames("flex items-center gap-3 rounded-[20px] bg-white p-3.5 shadow-sm border transition-all hover:shadow-md", item.completed ? "opacity-60 border-slate-100 bg-slate-50/50" : "border-slate-100")}>
      <button
        className={classNames(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300",
          item.completed ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-100 text-slate-300 ring-1 ring-inset ring-slate-200 hover:bg-slate-200"
        )}
        onClick={() => db.packingItems.update(item.id!, { completed: !item.completed })}
        aria-label="Đánh dấu hành lý"
      >
        <HugeiconsIcon icon={CheckIcon} className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={classNames("break-words text-[15px] font-medium transition-all duration-300", item.completed ? "text-slate-500 line-through" : "text-slate-800")}>{item.title}</p>
      </div>

      {/* ... menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          title="Tùy chọn"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4.5 w-4.5" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 bottom-full mb-1 z-40 w-32 rounded-2xl border border-slate-150 bg-white p-1.5 shadow-lg animate-scaleIn text-left">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4 text-slate-500" />
              Sửa
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-900/20 transition-colors"
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
              Xóa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PackingSection({ tripId, packingItems }: { tripId: number; packingItems: PackingItem[] }) {
  const { t } = useTranslation();
  const catMap: Record<string, string> = React.useMemo(() => ({
    "Giấy tờ": t("packing.catDocuments"),
    "Quần áo": t("packing.catClothing"),
    "Đồ cá nhân": t("packing.catPersonal"),
    "Thiết bị điện tử": t("packing.catElectronics"),
    "Thuốc & y tế": t("packing.catMedical"),
    "Tiền & ví": t("packing.catMoney"),
    "Đồ ăn nhẹ": t("packing.catSnacks"),
    "Khác": t("packing.catOther"),
  }), [t]);
  const [tripType, setTripType] = useState<PackingTripType>("Biển");
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<PackingItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PackingItem | null>(null);

  useModalHistory(isFormOpen, () => {
    setIsFormOpen(false);
    setEditing(null);
    setTitle("");
  }, "packing-form-modal");

  useModalHistory(Boolean(itemToDelete), () => setItemToDelete(null), "delete-packing-confirm");
  
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
    await db.packingItems.update(itemToDelete.id, { isDeleted: true });
    setItemToDelete(null);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="space-y-6 pb-0 md:pb-8">
        <ScreenTitle title={t("packing.pageTitle")} subtitle={t("packing.pageSubtitle")} />
        
        {/* Progress Card Hero */}
        <section className="flex flex-col items-center justify-center rounded-[24px] bg-kat-surface p-8 shadow-soft border border-kat-border/60">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary mb-4 ring-4 ring-kat-primary/5">
            <HugeiconsIcon icon={Luggage01Icon} className="h-6 w-6" />
          </div>
          <h3 className="text-[18px] font-bold text-kat-text mb-1">{t("packing.pageTitle")}</h3>
          <p className="text-[13px] font-bold text-kat-primary bg-kat-primary/10 px-4 py-1.5 rounded-full mb-3 shadow-sm">
            {t("packing.progressStatus", { completed: stats.completed, total: stats.total })}
          </p>
          <p className="text-[13.5px] font-medium text-kat-muted text-center">
            {stats.completed === stats.total && stats.total > 0 
              ? t("packing.progressPerfect")
              : stats.total === 0 
                ? t("packing.progressEmpty")
                : t("packing.progressRemaining", { remaining: stats.total - stats.completed })}
          </p>
        </section>



        <section>
          {packingItems.length ? (
            <div className="space-y-6">
              {Object.entries(groupedItems).sort(([a], [b]) => a.localeCompare(b)).map(([type, items]) => (
                <div key={catMap[type] || type} className="space-y-3">
                  <h3 className="px-1 text-[16px] font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {catMap[type] || type}
                  </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                    {items.sort((a, b) => a.title.localeCompare(b.title)).map((item) => (
                      <PackingItemRow
                        key={item.id}
                        item={item}
                        onEdit={() => startEdit(item)}
                        onDelete={() => deleteItem(item)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyCard text="Chưa có món đồ nào. Nhận gợi ý để bắt đầu chuẩn bị nhé!" icon={<HugeiconsIcon icon={Luggage01Icon} className="h-6 w-6" />} />
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
