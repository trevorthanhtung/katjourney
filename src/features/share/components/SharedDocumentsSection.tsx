import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  CheckmarkCircle02Icon,
  BookOpen01Icon,
  File01Icon,
  AlertCircleIcon,
  Add01Icon,
  PenTool01Icon,
  Delete01Icon,
  MoreVerticalIcon,
  ReceiptTextIcon,
  UserCheck01Icon,
  Tag01Icon,
  ChevronRightIcon,
  BalanceScaleIcon,
  InformationCircleIcon,
  CheckIcon,
  Cancel01Icon,
  Clock01Icon,
  FileCheckIcon,
  ShirtIcon,
  Briefcase01Icon,
  PlugIcon,
  PillIcon,
  Bread01Icon,
  PackageIcon,
  BadgeCheckIcon,
  StickyNoteIcon,
  MinusSignIcon,
  UserIcon,
  Calendar01Icon,
  Maximize01Icon,
  Image01Icon,
  ImageAdd01Icon,
  Loading01Icon,
  SmileIcon,
  NotebookIcon,
  SaveIcon,
  SparklesIcon,
  HelpCircleIcon,
  UserGroupIcon,
  BubbleChatIcon,
  GlobeIcon,
  CrownIcon,
  Luggage01Icon,
  Car01Icon,
  CalculatorIcon,
  PieChartIcon,
  Search01Icon,
  Airplane01Icon,
  HotelIcon,
  Ticket01Icon,
  ShoppingBag01Icon,
  Gamepad2Icon,
  CompassIcon,
  ChevronDownIcon,
  Location01Icon,
  LocationOfflineIcon,
} from "@hugeicons/core-free-icons";
import {
  Expense,
  ChecklistItem,
  JournalEntry,
  TravelDocument,
  BackupPlan,
  Member,
  EventItem,
} from "../../../db";
import {
  formatMoney,
  expenseCategories,
  formatDate,
  moodLabels,
  sumBy,
  getSettlementSuggestions,
} from "../../../utils/helpers";
import { submitChangeRequest } from "../../../services/cloudShareService";
import { showToast } from "../../../components/ui/ToastManager";
import { processLocalImage } from "../../../services/storageService";
import { getIdentity } from "../../../utils/identityCache";
import {
  getCurrentPosition,
  reverseGeocode,
  getCurrencyForCountry,
} from "../../../services/locationService";
import {
  BottomSheet,
  Input,
  Select,
  Textarea,
  DatePicker,
  DeleteConfirmModal,
} from "../../../components/ui";
import { getAvatarSvg, getRandomAvatarId } from "../../../utils/avatars";
import { BreakdownSection, CategoryBar, SettlementCard } from "../../expenses/ExpensesScreen";
import { fetchExchangeRates, ExchangeRate } from "../../../services/currencyService";

const classNames = (...classes: any[]) => classes.filter(Boolean).join(" ");

const CATEGORIES = [
  "documents",
  "clothing",
  "personal",
  "electronics",
  "medical",
  "money",
  "snacks",
  "other",
] as const;
const CATEGORY_ICONS: Record<string, any> = {
  documents: FileCheckIcon,
  clothing: ShirtIcon,
  personal: Briefcase01Icon,
  electronics: PlugIcon,
  medical: PillIcon,
  money: Wallet01Icon,
  snacks: Bread01Icon,
  other: PackageIcon,
};

export function SharedDocumentsSection({
  tripId,
  token,
  mode,
  documents,
  changeRequests = [],
  guestName,
}: {
  tripId?: string | number;
  token: string;
  mode: string;
  documents: TravelDocument[];
  changeRequests?: any[];
  guestName?: string;
}) {
  const { t } = useTranslation();

  const [activeSubTab, setActiveSubTab] = React.useState<"shared" | "private">("shared");
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = React.useState<TravelDocument | null>(null);
  const isRequestEdit = mode === "request_edit";

  // Local Private Documents
  const localPrivateDocs =
    useLiveQuery(async () => {
      if (!tripId) return [];
      const targetTripId =
        typeof tripId === "number" ? tripId : isNaN(Number(tripId)) ? tripId : Number(tripId);
      try {
        const items = await db.travelDocuments.where("tripId").equals(targetTripId).toArray();
        return items.filter(
          (d) =>
            d.isPrivate &&
            !d.isDeleted &&
            (d.createdBy === guestName || (!d.createdBy && !guestName))
        );
      } catch (e) {
        console.error("Error loading local private travel documents:", e);
        return [];
      }
    }, [tripId, activeSubTab, guestName]) ?? [];

  // Form states for private documents
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingDoc, setEditingDoc] = React.useState<TravelDocument | null>(null);
  const [form, setForm] = React.useState({
    title: "",
    type: "ticket" as TravelDocument["type"],
    code: "",
    date: "",
    link: "",
    note: "",
    attachmentUrl: "",
  });
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [showValidationError, setShowValidationError] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Context menu for private documents
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [menuPos, setMenuPos] = React.useState<{ top: number; right: number } | null>(null);

  React.useEffect(() => {
    if (!activeMenuId) return;
    const handleScroll = () => {
      setActiveMenuId(null);
      setMenuPos(null);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeMenuId]);

  React.useEffect(() => {
    if (isFormOpen) {
      setShowValidationError(false);
      setShowAdvanced(false);
      if (editingDoc) {
        setForm({
          title: editingDoc.title,
          type: editingDoc.type || "ticket",
          code: editingDoc.code || "",
          date: editingDoc.date || "",
          link: editingDoc.link || "",
          note: editingDoc.note || "",
          attachmentUrl: editingDoc.attachmentUrl || "",
        });
        setPreviewUrl(editingDoc.attachmentUrl || null);
      } else {
        setForm({
          title: "",
          type: "ticket",
          code: "",
          date: "",
          link: "",
          note: "",
          attachmentUrl: "",
        });
        setPreviewUrl(null);
      }
      setSelectedFile(null);
    }
  }, [isFormOpen, editingDoc]);

  const mergedDocuments = React.useMemo(() => {
    return documents.map((item) => {
      const pendingDelete = changeRequests.some(
        (r) =>
          r.section === "travelDocuments" &&
          r.action === "delete" &&
          String(r.targetId) === String(item.id)
      );
      return {
        ...item,
        isPendingDelete: pendingDelete,
      };
    });
  }, [documents, changeRequests]);

  const displayedDocs = activeSubTab === "private" ? localPrivateDocs : mergedDocuments;

  function startAdd() {
    setEditingDoc(null);
    setIsFormOpen(true);
  }

  function startEdit(d: TravelDocument) {
    setEditingDoc(d);
    setIsFormOpen(true);
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  async function save() {
    if (!form.title.trim()) {
      setShowValidationError(true);
      return;
    }
    setIsUploading(true);
    let finalAttachmentUrl = form.attachmentUrl;
    const targetTripId = typeof tripId === "number" ? tripId : Number(tripId);

    try {
      if (selectedFile) {
        finalAttachmentUrl = await processLocalImage(selectedFile);
      }

      if (editingDoc?.id) {
        await db.travelDocuments.update(editingDoc.id, {
          ...form,
          attachmentUrl: finalAttachmentUrl,
          createdBy: guestName || "guest",
          updatedAt: new Date().toISOString(),
        });
        showToast(t("toast.personalDocUpdated"));
      } else {
        await db.travelDocuments.add({
          ...form,
          tripId: targetTripId,
          isPrivate: true,
          attachmentUrl: finalAttachmentUrl,
          createdBy: guestName || "guest",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        showToast(t("toast.personalDocAdded"));
      }
      setIsFormOpen(false);
    } catch (e: any) {
      showToast(t("toast.saveError", { message: e.message }), "error");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(d: TravelDocument) {
    setDeleteTargetId(d);
  }

  async function executeDelete(d: TravelDocument) {
    try {
      if (activeSubTab === "private") {
        if (d.id) {
          await db.travelDocuments.update(d.id, { isDeleted: true });
          showToast(t("toast.personalDocDeleted"));
        }
      } else {
        await submitChangeRequest(token, {
          section: "travelDocuments",
          action: "delete",
          targetId: String(d.id),
          before: d as any,
          requesterName: guestName,
        });
        showToast(t("toast.requestSent"));
      }
    } catch (e: any) {
      showToast(t("toast.errorMsg", { message: e.message }), "error");
    }
  }

  const isSaveDisabled = !form.title.trim() || isUploading;

  const headerAction = (
    <button
      type="button"
      onClick={save}
      disabled={isSaveDisabled}
      className="inline-flex h-9 items-center justify-center rounded-xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 px-4 text-[13.5px] font-extrabold shadow-sm transition-all active:scale-[0.97] disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/40 dark:disabled:text-slate-600 disabled:border-transparent disabled:cursor-not-allowed"
    >
      {isUploading ? (
        <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin text-slate-400" />
      ) : (
        t("documents.saveBtn")
      )}
    </button>
  );

  return (
    <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[24px] border border-slate-200/50 dark:border-white/5 p-5 shadow-soft hover:shadow-md transition-all duration-300 relative overflow-hidden space-y-4">
      {/* Ambient background glow */}
      <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-rose-500/[0.03] dark:bg-rose-500/[0.05] blur-[30px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30 shadow-inner">
            <HugeiconsIcon icon={File01Icon} className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[16px] font-black text-slate-800 dark:text-slate-200">
              {t("documents.featureTitle")}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
              {t("share.docsDesc", "Lưu trữ tài liệu du lịch, vé tàu xe, khách sạn")}
            </p>
          </div>
        </div>
        {displayedDocs.length > 0 && (
          <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450 border border-rose-100/50 dark:border-rose-900/30">
            {t("packing.catCount", { done: displayedDocs.length, total: displayedDocs.length })}
          </span>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-slate-100/80 dark:bg-slate-800/50 p-1 rounded-xl gap-1 relative z-0">
        <button
          type="button"
          onClick={() => setActiveSubTab("shared")}
          className={classNames(
            "flex-1 py-2 text-[13px] font-bold rounded-lg transition-all duration-300 text-center cursor-pointer",
            activeSubTab === "shared"
              ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          {t("packing.sharedTab")}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("private")}
          className={classNames(
            "flex-1 py-2 text-[13px] font-bold rounded-lg transition-all duration-300 text-center cursor-pointer flex items-center justify-center gap-1.5",
            activeSubTab === "private"
              ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          {t("packing.personalTab")}
          {localPrivateDocs.length > 0 && (
            <span className="flex items-center justify-center min-w-4.5 h-4.5 text-[9.5px] font-black px-1 rounded-full bg-rose-650 text-white">
              {localPrivateDocs.length}
            </span>
          )}
        </button>
      </div>

      {/* Document cards grid */}
      {displayedDocs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(displayedDocs as any[]).map((d) => (
            <div
              key={d.id}
              className={classNames(
                "flex flex-col gap-1 rounded-xl p-3 border transition-all relative",
                d.isPendingDelete
                  ? "border-rose-100 dark:border-rose-950/60 bg-slate-50/50 dark:bg-slate-800/20 opacity-70"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span
                    className={classNames(
                      "text-[14px] font-bold text-slate-700 dark:text-slate-200",
                      d.isPendingDelete ? "line-through text-slate-400 dark:text-slate-500" : ""
                    )}
                  >
                    {d.title}
                  </span>
                  {d.isPendingDelete && (
                    <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-450 select-none animate-fadeIn">
                      {t("share.suggestDelete")}
                    </span>
                  )}
                </div>

                {/* Options button */}
                {activeSubTab === "private" ? (
                  <div className="shrink-0 ml-2">
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
                        if (activeMenuId === String(d.id)) {
                          setActiveMenuId(null);
                          setMenuPos(null);
                        } else {
                          setActiveMenuId(String(d.id));
                          setMenuPos({
                            top: rect.bottom + 4,
                            right: window.innerWidth - rect.right,
                          });
                        }
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 active:scale-90 transition-all focus:outline-none"
                      title={t("packing.options")}
                    >
                      <HugeiconsIcon icon={MoreVerticalIcon} className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ) : (
                  isRequestEdit &&
                  !d.isPendingDelete && (
                    <button
                      onClick={() => handleDelete(d)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-slate-200/60 dark:border-slate-700/60 transition-all active:scale-95 shadow-sm bg-white dark:bg-slate-800 shrink-0"
                      title={t("share.suggestDelete")}
                    >
                      <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                    </button>
                  )
                )}
              </div>

              {d.code && (
                <div className="text-[12px] font-bold text-slate-400 mt-0.5">
                  {t("share.code", "Mã:")}{" "}
                  <span className="text-slate-600 dark:text-slate-300">{d.code}</span>
                </div>
              )}
              {d.date && (
                <div className="text-[11.5px] font-semibold text-slate-400">
                  {t("share.date", "Ngày:")}{" "}
                  <span className="text-slate-500 dark:text-slate-350">{formatDate(d.date)}</span>
                </div>
              )}
              {d.link && (
                <a
                  href={d.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11.5px] font-bold text-blue-500 dark:text-blue-400 hover:underline mt-0.5 w-fit"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t("share.link", "Link liên kết")}
                </a>
              )}

              {d.note && (
                <span
                  className={classNames(
                    "text-[13px] text-slate-500 dark:text-slate-350 mt-1",
                    d.isPendingDelete
                      ? "line-through text-slate-400 dark:text-slate-500 opacity-60"
                      : ""
                  )}
                >
                  {d.note}
                </span>
              )}

              {/* Attachment Image Display */}
              {d.attachmentUrl && (
                <div className="mt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    {t("documents.attachmentLabel")}
                  </p>
                  <div
                    className={classNames(
                      "relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 cursor-pointer group bg-[#F8F9FA] dark:bg-slate-800/40 flex justify-center items-center",
                      d.isPendingDelete ? "opacity-60 grayscale" : ""
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!d.isPendingDelete) setPreviewImage(d.attachmentUrl || null);
                    }}
                  >
                    <img
                      src={d.attachmentUrl}
                      alt={d.title}
                      loading="lazy"
                      className="w-full h-auto max-h-[300px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    {!d.isPendingDelete && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <HugeiconsIcon
                          icon={Maximize01Icon}
                          className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200/60 dark:border-slate-800/60 my-2">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 dark:text-rose-450 mb-3">
            <HugeiconsIcon icon={File01Icon} className="h-6 w-6" />
          </div>
          <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200">
            {activeSubTab === "private"
              ? t("documents.emptyPrivate")
              : t("documents.emptyAllTitle")}
          </h4>
          <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-1 font-bold max-w-[240px]">
            {activeSubTab === "private" ? t("documents.emptyAllDesc") : t("documents.emptyAllDesc")}
          </p>
        </div>
      )}

      {/* Add Button for Private Documents */}
      {activeSubTab === "private" && (
        <button
          onClick={startAdd}
          className="mt-4 flex items-center justify-center gap-2 text-[13.5px] font-bold text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100/80 dark:hover:bg-rose-950/30 active:scale-[0.99] rounded-xl transition-all shadow-sm shadow-rose-100/30 dark:shadow-none h-11 w-full"
        >
          <HugeiconsIcon icon={Add01Icon} className="w-4.5 h-4.5" />
          {t("documents.addPrivate")}
        </button>
      )}

      {/* Form BottomSheet for Private Documents */}
      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingDoc ? t("documents.editPrivate") : t("documents.addPrivate")}
        headerAction={headerAction}
      >
        <div className="space-y-4">
          {/* Title */}
          <div>
            <Input
              label={t("documents.inputTitleLabel")}
              value={form.title}
              onChange={(title) => {
                setForm({ ...form, title });
                setShowValidationError(false);
              }}
              placeholder={
                form.type === "visa"
                  ? t("documents.placeholderTitleVisa")
                  : form.type === "insurance"
                    ? t("documents.placeholderTitleInsurance")
                    : form.type === "tour"
                      ? t("documents.placeholderTitleTour")
                      : t("documents.inputTitlePlaceholder")
              }
            />
            {showValidationError && !form.title.trim() && (
              <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">
                {t("documents.titleRequired")}
              </p>
            )}
          </div>

          {/* Phân loại & Mã đặt chỗ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t("documents.inputTypeLabel")}
              value={form.type || "ticket"}
              onChange={(type) => setForm({ ...form, type: type as any })}
              options={[
                "ticket",
                "hotel",
                "booking",
                "insurance",
                "visa",
                "tour",
                "contact",
                "map",
                "other",
              ]}
              labels={{
                ticket: t("documents.typeTicket"),
                hotel: t("documents.typeHotel"),
                booking: t("documents.typeBooking"),
                insurance: t("documents.typeInsurance"),
                visa: t("documents.typeVisa"),
                tour: t("documents.typeTour"),
                contact: t("documents.typeContact"),
                map: t("documents.typeMap"),
                other: t("documents.typeOther"),
              }}
            />
            <Input
              label={t("documents.inputCodeLabel")}
              value={form.code}
              onChange={(code) => setForm({ ...form, code })}
              placeholder={
                form.type === "visa"
                  ? t("documents.placeholderCodeVisa")
                  : form.type === "insurance"
                    ? t("documents.placeholderCodeInsurance")
                    : form.type === "tour"
                      ? t("documents.placeholderCodeTour")
                      : t("documents.inputCodePlaceholder")
              }
            />
          </div>

          {/* Collapsible Info Section */}
          <div className="pt-2 border-t border-slate-100/80">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between py-2 text-sm font-bold text-slate-500 hover:text-kat-dark transition-colors focus:outline-none"
            >
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Add01Icon} className="h-4 w-4 text-slate-400" />
                {t("documents.advancedInfoLabel")}
              </span>
              <HugeiconsIcon
                icon={ChevronRightIcon}
                className={classNames(
                  "h-4 w-4 transition-transform duration-200 text-slate-400",
                  showAdvanced ? "rotate-90" : ""
                )}
              />
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DatePicker
                    label={t("documents.inputDateLabel")}
                    value={form.date}
                    onChange={(date) => setForm({ ...form, date })}
                  />
                  <Input
                    label={t("documents.inputLinkLabel")}
                    value={form.link}
                    onChange={(link) => setForm({ ...form, link })}
                    placeholder={t("documents.inputLinkPlaceholder")}
                  />
                </div>
                <div>
                  <Textarea
                    label={t("documents.inputNoteLabel")}
                    value={form.note}
                    onChange={(note) => setForm({ ...form, note })}
                    placeholder={
                      form.type === "visa"
                        ? t("documents.placeholderNoteVisa")
                        : form.type === "insurance"
                          ? t("documents.placeholderNoteInsurance")
                          : form.type === "tour"
                            ? t("documents.placeholderNoteTour")
                            : t("documents.inputNotePlaceholder")
                    }
                  />
                </div>

                {/* Image Upload Area */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-kat-dark">
                    {t("documents.inputAttachmentLabel")}
                  </label>
                  {previewUrl || form.attachmentUrl ? (
                    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center">
                      <img
                        src={previewUrl || form.attachmentUrl}
                        alt="Preview"
                        className="w-full h-auto max-h-[300px] object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          setForm({ ...form, attachmentUrl: "" });
                        }}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-rose-500 transition-colors"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <HugeiconsIcon
                          icon={ImageAdd01Icon}
                          className="w-6 h-6 mb-2 text-slate-400"
                        />
                        <p className="text-[13px]">
                          <span className="font-semibold text-kat-primary-usable">
                            {t("documents.uploadBtn")}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                          {t("documents.uploadAcceptedFormats")}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewImage(null);
          }}
        >
          <img
            src={previewImage}
            alt="Fullscreen preview"
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Context Menu Dropdown */}
      {activeMenuId &&
        menuPos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[998]"
              onClick={() => {
                setActiveMenuId(null);
                setMenuPos(null);
              }}
            />
            <div
              className="fixed z-[999] w-36 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-lg py-1.5 animate-fadeIn"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <button
                onClick={() => {
                  const id = activeMenuId;
                  setActiveMenuId(null);
                  setMenuPos(null);
                  const item =
                    activeSubTab === "private"
                      ? localPrivateDocs.find((x) => String(x.id) === id)
                      : mergedDocuments.find((x) => String(x.id) === id);
                  if (item) startEdit(item);
                }}
                className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t("documents.editBtn")}
              </button>
              <button
                onClick={() => {
                  const id = activeMenuId;
                  setActiveMenuId(null);
                  setMenuPos(null);
                  const item =
                    activeSubTab === "private"
                      ? localPrivateDocs.find((x) => String(x.id) === id)
                      : mergedDocuments.find((x) => String(x.id) === id);
                  if (item) handleDelete(item);
                }}
                className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/35 active:bg-rose-100 dark:active:bg-rose-900/20 transition-colors"
              >
                {t("documents.deleteBtn")}
              </button>
            </div>
          </>,
          document.body
        )}

      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (!deleteTargetId) return;
          await executeDelete(deleteTargetId);
          setDeleteTargetId(null);
        }}
        title={
          activeSubTab === "private"
            ? t("documents.deleteModalTitle")
            : t("documents.suggestDeleteTitle")
        }
        description={
          activeSubTab === "private"
            ? t("documents.deleteModalDesc")
            : t("documents.suggestDeleteDesc")
        }
        confirmLabel={
          activeSubTab === "private" ? t("documents.deleteBtn") : t("share.suggestDelete")
        }
        itemName={deleteTargetId?.title}
      />
    </section>
  );
}
