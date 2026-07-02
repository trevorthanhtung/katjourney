import i18n from "../../i18n";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Add01Icon,
  Delete01Icon,
  PencilEdit01Icon,
  Ticket01Icon,
  HotelIcon,
  CalendarCheckIcon,
  CallIcon,
  MapsIcon,
  File01Icon,
  FileCheckIcon,
  ExternalLinkIcon,
  Link02Icon,
  SparklesIcon,
  ChevronRightIcon,
  CopyIcon,
  CheckIcon,
  Cancel01Icon,
  ImageAdd01Icon,
  Loading01Icon,
  Maximize01Icon,
  MoreHorizontalIcon,
  SecurityIcon,
  PassportIcon,
  CompassIcon,
} from "@hugeicons/core-free-icons";
import { db, TravelDocument } from "../../db";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import {
  BottomSheet,
  Input,
  Textarea,
  Select,
  DatePicker,
  DeleteConfirmModal,
  classNames,
} from "../../components/ui";
import { processLocalImage } from "../../services/storageService";
import { useModalHistory } from "../../hooks/useModalHistory";

const typeOptions: Array<{ value: NonNullable<TravelDocument["type"]>; label: string }> = [
  { value: "ticket", label: i18n.t("documents.typeTicket", "Travel ticket") },
  { value: "hotel", label: i18n.t("documents.typeHotel", "Hotel booking") },
  { value: "booking", label: i18n.t("documents.typeBooking", "Booking code") },
  { value: "insurance", label: i18n.t("documents.typeInsurance", "Travel insurance") },
  { value: "visa", label: i18n.t("documents.typeVisa", "Visa / Passport") },
  { value: "tour", label: "Vé tham quan" },
  { value: "contact", label: "Liên hệ" },
  { value: "map", label: "Bản đồ" },
  { value: "other", label: i18n.t("common.other", "Other") },
];

const typeLabels: Record<NonNullable<TravelDocument["type"]>, string> = {
  ticket: i18n.t("documents.typeTicket", "Travel ticket"),
  hotel: i18n.t("documents.typeHotel", "Hotel booking"),
  booking: "Mã đặt chỗ",
  insurance: i18n.t("documents.typeInsurance", "Travel insurance"),
  visa: i18n.t("documents.typeVisa", "Visa / Passport"),
  tour: "Vé tham quan",
  document: i18n.t("common.other", "Other"),
  contact: "Liên hệ",
  map: "Bản đồ",
  other: i18n.t("common.other", "Other"),
};

const typeIcons: Record<NonNullable<TravelDocument["type"]>, any> = {
  ticket: Ticket01Icon,
  hotel: HotelIcon,
  booking: CalendarCheckIcon,
  insurance: SecurityIcon,
  visa: PassportIcon,
  tour: CompassIcon,
  document: File01Icon,
  contact: CallIcon,
  map: MapsIcon,
  other: File01Icon,
};

const typeColors: Record<
  NonNullable<TravelDocument["type"]>,
  { bg: string; text: string; border: string }
> = {
  ticket: {
    bg: "bg-sky-50 dark:bg-sky-950/20",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-200/50 dark:border-sky-900/30",
  },
  hotel: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200/50 dark:border-emerald-900/30",
  },
  booking: {
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200/50 dark:border-indigo-900/30",
  },
  insurance: {
    bg: "bg-violet-50 dark:bg-violet-950/20",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-200/50 dark:border-violet-900/30",
  },
  visa: {
    bg: "bg-teal-50 dark:bg-teal-950/20",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-200/50 dark:border-teal-900/30",
  },
  tour: {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200/50 dark:border-orange-900/30",
  },
  document: {
    bg: "bg-slate-50 dark:bg-slate-800/40",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200/50 dark:border-slate-700/40",
  },
  contact: {
    bg: "bg-rose-50 dark:bg-rose-950/20",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200/50 dark:border-rose-900/30",
  },
  map: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200/50 dark:border-amber-900/30",
  },
  other: {
    bg: "bg-slate-50 dark:bg-slate-800/40",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200/50 dark:border-slate-700/40",
  },
};

interface DocumentFormProps {
  tripId: number;
  editing: TravelDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

function DocumentForm({ tripId, editing, isOpen, onClose, onShowToast }: DocumentFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "",
    type: "ticket" as NonNullable<TravelDocument["type"]>,
    code: "",
    date: "",
    link: "",
    note: "",
    attachmentUrl: "",
    isPrivate: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
          note: editing.note || "",
          attachmentUrl: editing.attachmentUrl || "",
          isPrivate: editing.isPrivate || false,
        });
        if (
          editing.date ||
          editing.link ||
          editing.note ||
          editing.attachmentUrl ||
          editing.isPrivate
        ) {
          setShowAdvanced(true);
        }
      } else {
        setForm({
          title: "",
          type: "ticket",
          code: "",
          date: "",
          link: "",
          note: "",
          attachmentUrl: "",
          isPrivate: false,
        });
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setSubmitAttempted(false);
      setDirty(false);
    }
  }, [editing, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    setSelectedFile(file);
    setDirty(true);
  };

  const titleError = !form.title.trim() ? t("documents.titleRequired") : "";
  const hasError = !!titleError;

  async function save() {
    setSubmitAttempted(true);
    if (hasError) return;

    setIsUploading(true);
    let finalAttachmentUrl = form.attachmentUrl;

    try {
      if (selectedFile) {
        finalAttachmentUrl = await processLocalImage(selectedFile);
      }

      if (editing?.id) {
        await db.travelDocuments.update(editing.id, {
          ...form,
          attachmentUrl: finalAttachmentUrl,
          createdBy: "owner",
          updatedAt: new Date().toISOString(),
        });
        onShowToast?.(t("documents.toastUpdated"));
      } else {
        await db.travelDocuments.add({
          ...form,
          tripId,
          attachmentUrl: finalAttachmentUrl,
          createdBy: "owner",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        onShowToast?.(t("documents.toastSaved"));
      }
      onClose();
    } catch (e) {
      console.error("Lỗi khi lưu tài liệu:", e);
      onShowToast?.(t("documents.toastError"));
    } finally {
      setIsUploading(false);
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
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? t("documents.editDocumentTitle") : t("documents.addDocumentTitle")}
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
              setDirty(true);
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
          {(dirty || submitAttempted) && titleError && (
            <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{titleError}</p>
          )}
        </div>

        {/* Type & Code & Privacy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={t("documents.inputTypeLabel")}
            value={form.type}
            onChange={(type) => {
              setForm({ ...form, type: type as NonNullable<TravelDocument["type"]> });
              setDirty(true);
            }}
            options={typeOptions.map((t) => t.value)}
            labels={{
              ticket: t("documents.typeTicket"),
              hotel: t("documents.typeHotel"),
              booking: t("documents.typeBooking"),
              insurance: t("documents.typeInsurance"),
              visa: t("documents.typeVisa"),
              tour: t("documents.typeTour"),
              document: t("documents.typeOther"),
              contact: t("documents.typeContact"),
              map: t("documents.typeMap"),
              other: t("documents.typeOther"),
            }}
          />
          <Select
            label={t("documents.inputPrivacyLabel")}
            value={form.isPrivate ? t("documents.privacyPrivate") : t("documents.privacyGroup")}
            onChange={(val) => {
              setForm({ ...form, isPrivate: val === t("documents.privacyPrivate") });
              setDirty(true);
            }}
            options={[t("documents.privacyGroup"), t("documents.privacyPrivate")]}
          />
        </div>
        <Input
          label={t("documents.inputCodeLabel")}
          value={form.code}
          onChange={(code) => {
            setForm({ ...form, code });
            setDirty(true);
          }}
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
                  onChange={(date) => {
                    setForm({ ...form, date });
                    setDirty(true);
                  }}
                />
                <Input
                  label={t("documents.inputLinkLabel")}
                  value={form.link}
                  onChange={(link) => {
                    setForm({ ...form, link });
                    setDirty(true);
                  }}
                  placeholder={t("documents.inputLinkPlaceholder")}
                />
              </div>
              <div>
                <Textarea
                  label={t("documents.inputNoteLabel")}
                  value={form.note}
                  onChange={(note) => {
                    setForm({ ...form, note });
                    setDirty(true);
                  }}
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
                      className="w-full h-auto max-h-[400px] object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setForm({ ...form, attachmentUrl: "" });
                        setDirty(true);
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
  );
}

function DocumentCard({
  doc,
  onEdit,
  onDelete,
  idx = 0,
  isReadOnly,
}: {
  doc: TravelDocument;
  onEdit: () => void;
  onDelete: () => void;
  idx?: number;
  isReadOnly?: boolean;
}) {
  const { t } = useTranslation();
  const colors = typeColors[doc.type || "other"];
  const Icon = typeIcons[doc.type || "other"];
  const formattedDate = doc.date
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(doc.date))
    : null;

  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!doc.code) return;
    navigator.clipboard.writeText(doc.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article
      className={`motion-card-enter motion-delay-${Math.min(idx + 1, 5)} flex flex-col justify-between rounded-3xl bg-white dark:bg-kat-surface p-5 border border-slate-200 dark:border-kat-border transition-all duration-200 hover:shadow-md`}
    >
      <div>
        {/* Top info row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}
          >
            <HugeiconsIcon icon={Icon} className="w-3.5 h-3.5" />
            {
              t(
                "documents.type" +
                  ((doc.type || "other").charAt(0).toUpperCase() + (doc.type || "other").slice(1))
              ).split(" / ")[0]
            }
          </span>

          {/* ... menu */}
          {!isReadOnly && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                title={t("documents.optionsBtn")}
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} className="h-5 w-5" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-40 w-32 rounded-2xl border border-slate-150 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-1.5 shadow-lg animate-scaleIn text-left">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onEdit();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors"
                  >
                    <HugeiconsIcon
                      icon={PencilEdit01Icon}
                      className="h-4 w-4 text-slate-500 dark:text-slate-400"
                    />
                    {t("documents.editBtn")}
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
                    {t("documents.deleteBtn")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h4 className="text-lg font-semibold text-kat-dark leading-tight mb-2.5">{doc.title}</h4>

        {/* Code Container */}
        {doc.code && (
          <div
            onClick={handleCopy}
            className="group/code flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/40 rounded-xl p-3 mt-2.5 transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t("documents.codeLabel")}
              </p>
              <p className="text-[14px] font-extrabold text-kat-dark truncate mt-0.5">{doc.code}</p>
            </div>
            <button
              type="button"
              className="ml-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-kat-dark dark:hover:text-slate-200 transition-all shadow-sm shrink-0"
              title={t("documents.copyCodeBtn")}
            >
              {copied ? (
                <HugeiconsIcon icon={CheckIcon} className="h-4 w-4 text-emerald-500" />
              ) : (
                <HugeiconsIcon icon={CopyIcon} className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        {/* Date & Note */}
        {formattedDate && (
          <p className="text-[13px] font-semibold text-slate-500 mt-3.5">
            {t("documents.relatedDateLabel")}{" "}
            <span className="font-extrabold text-slate-700 dark:text-slate-200">
              {formattedDate}
            </span>
          </p>
        )}

        {doc.note && (
          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium whitespace-pre-line bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 mt-2.5">
            {doc.note}
          </p>
        )}

        {doc.attachmentUrl && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              {t("documents.attachmentLabel")}
            </p>
            <div
              className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 cursor-pointer group bg-[#F8F9FA] dark:bg-slate-800/40 flex justify-center items-center"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(doc.attachmentUrl || null);
              }}
            >
              <img
                src={doc.attachmentUrl}
                alt={doc.title}
                loading="lazy"
                className="w-full h-auto max-h-[400px] object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <HugeiconsIcon
                  icon={Maximize01Icon}
                  className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
                />
              </div>
            </div>
          </div>
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
            <HugeiconsIcon icon={Link02Icon} className="w-3.5 h-3.5" />
            <span>{t("documents.openLinkBtn")}</span>
          </a>
        </div>
      )}

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
    </article>
  );
}

export function TravelDocumentsSection({
  tripId,
  onBack,
  onShowToast,
  isReadOnly,
}: {
  tripId: number;
  onBack: () => void;
  onShowToast?: (msg: string) => void;
  isReadOnly?: boolean;
}) {
  const { t } = useTranslation();
  const documents =
    useLiveQuery(
      async () =>
        (await db.travelDocuments.where("tripId").equals(tripId).toArray()).filter(
          (d) => !d.isDeleted
        ),
      [tripId]
    ) ?? [];
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TravelDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<TravelDocument | null>(null);

  useModalHistory(
    formOpen,
    () => {
      setFormOpen(false);
      setEditingDoc(null);
    },
    "travel-document-form"
  );

  useModalHistory(Boolean(docToDelete), () => setDocToDelete(null), "delete-document-confirm");

  const filteredDocs =
    selectedTypeFilter === "all"
      ? documents
      : documents.filter((doc) => doc.type === selectedTypeFilter);

  async function executeDelete() {
    if (!docToDelete?.id) return;
    await db.travelDocuments.update(docToDelete.id, { isDeleted: true });
    onShowToast?.(t("documents.toastDeleted"));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 transition-all shrink-0 motion-press"
            title="Quay lại"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-[28px] font-extrabold text-kat-dark dark:text-slate-200 leading-tight">
              {t("documents.featureTitle")}
            </h2>
            <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {t("documents.featureDesc")}
            </p>
          </div>
        </div>
        {!isReadOnly && documents.length === 0 && (
          <button
            onClick={openNewForm}
            className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 px-5 text-[13.5px] font-bold hover:bg-kat-dark dark:hover:brightness-110 bg-opacity-90 active:scale-95 transition-all motion-press shadow-sm shrink-0 w-full sm:w-auto self-stretch sm:self-center border border-transparent dark:border-kat-primary"
          >
            <HugeiconsIcon icon={Add01Icon} className="h-4.5 w-4.5" />
            <span>{t("documents.addBtn")}</span>
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
                ? "bg-kat-dark border-kat-dark text-white dark:bg-kat-primary dark:border-kat-primary dark:text-slate-950"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80"
            }`}
          >
            {t("documents.filterAll")} ({documents.length})
          </button>
          {typeOptions.map((opt) => {
            const count = documents.filter((doc) => doc.type === opt.value).length;
            if (count === 0) return null; // Only show filters with items
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedTypeFilter(opt.value)}
                className={`px-4 py-2 rounded-full text-[13px] font-extrabold border transition-all motion-press ${
                  selectedTypeFilter === opt.value
                    ? "bg-kat-dark border-kat-dark text-white dark:bg-kat-primary dark:border-kat-primary dark:text-slate-950"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80"
                }`}
              >
                {t("documents.type" + (opt.value.charAt(0).toUpperCase() + opt.value.slice(1)))} (
                {count})
              </button>
            );
          })}
        </div>
      )}

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[28px] bg-white dark:bg-kat-surface border border-slate-200 dark:border-kat-border p-12 text-center shadow-soft max-w-md mx-auto">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-kat-primary/10 text-kat-primary">
            <HugeiconsIcon icon={File01Icon} className="h-8 w-8" />
          </div>
          <h4 className="text-[16px] font-extrabold text-kat-dark mb-1">
            {selectedTypeFilter === "all"
              ? t("documents.emptyAllTitle")
              : t("documents.emptyFilterTitle")}
          </h4>
          <p className="text-[13.5px] font-semibold text-slate-400 dark:text-slate-450 mb-0 max-w-[280px]">
            {selectedTypeFilter === "all"
              ? t("documents.emptyAllDesc")
              : t("documents.emptyFilterDesc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc, idx) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onEdit={() => openEditForm(doc)}
              onDelete={() => setDocToDelete(doc)}
              idx={idx}
            />
          ))}
        </div>
      )}

      <DeleteConfirmModal
        isOpen={Boolean(docToDelete)}
        onClose={() => setDocToDelete(null)}
        onConfirm={executeDelete}
        title={t("documents.deleteModalTitle")}
        itemName={docToDelete?.title}
        description={t("documents.deleteModalDesc")}
        confirmLabel={t("documents.deleteModalConfirm")}
      />

      {/* Document Form Bottom Sheet */}
      <DocumentForm
        tripId={tripId}
        editing={editingDoc}
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onShowToast={onShowToast}
      />

      {/* FAB for adding documents when there are existing documents */}
      {!isReadOnly &&
        documents.length > 0 &&
        createPortal(
          <button
            onClick={() => openNewForm()}
            className="md:hidden fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/40 dark:border-slate-700/50 text-kat-dark dark:text-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] motion-press hover:scale-105 hover:bg-white/25 duration-200"
            style={{ bottom: "calc(6rem + var(--safe-bottom))" }}
            aria-label={t("documents.addBtn")}
          >
            <HugeiconsIcon icon={Add01Icon} className="h-6 w-6" />
          </button>,
          document.body
        )}
    </div>
  );
}
