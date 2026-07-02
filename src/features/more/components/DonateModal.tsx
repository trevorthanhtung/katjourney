import { BottomSheet } from "../../../components/ui/BottomSheet";
import { classNames } from "../../../utils/helpers";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { CURRENCY_OPTIONS, getCurrencyLabel } from "../../../constants/currencies";
import { showToast } from "../../../components/ui/ToastManager";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Alert01Icon,
  AlertCircleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  AwardIcon,
  BookOpen01Icon,
  Calendar01Icon,
  Cancel01Icon,
  Car01Icon,
  Camera01Icon,
  CallIcon,
  CircleUnlock01Icon,
  CheckIcon,
  CheckmarkBadge01Icon,
  CheckmarkCircle01Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock01Icon,
  Coffee01Icon,
  CompassIcon,
  CopyIcon,
  CrownIcon,
  DatabaseBackupIcon,
  Delete01Icon,
  Download01Icon,
  File01Icon,
  FileDownloadIcon,
  GlobeIcon,
  InformationCircleIcon,
  Location01Icon,
  Coins01Icon,
  LockIcon,
  Luggage01Icon,
  MapsIcon,
  MoreVerticalIcon,
  Note01Icon,
  PackageIcon,
  PencilEdit01Icon,
  PlusSignIcon,
  Refresh01Icon,
  Route01Icon,
  Search01Icon,
  Share01Icon,
  SmilePlusIcon,
  SparklesIcon,
  StarIcon,
  Sun01Icon,
  Table01Icon,
  Ticket01Icon,
  UserIcon,
  UserAdd01Icon,
  UserGroupIcon,
  WalletCardsIcon,
  ChevronDownIcon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";

export function DonateModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<"vn" | "intl">(i18n.language === "vi" ? "vn" : "intl");

  useEffect(() => {
    if (isOpen) {
      setTab(i18n.language === "vi" ? "vn" : "intl");
    }
  }, [i18n.language, isOpen]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t("donateView.title")}>
      <div className="space-y-5 flex flex-col items-center text-center pb-4">
        {/* Coffee Icon */}
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-xs">
          <HugeiconsIcon icon={Coffee01Icon} className="h-5 w-5" />
        </div>

        {/* Texts */}
        <div className="space-y-2 max-w-md">
          <h4 className="text-[18px] font-black text-kat-dark">{t("donateView.title")}</h4>
          <p className="text-[14px] font-semibold leading-relaxed text-slate-500">
            {t("donateView.desc1")}
          </p>
          <p className="text-[12px] font-medium text-slate-400">{t("donateView.desc2")}</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-[85%] max-w-[280px] mb-2">
          <button
            onClick={() => setTab("vn")}
            className={classNames(
              "flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all",
              tab === "vn"
                ? "bg-white dark:bg-slate-700 text-kat-dark dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            {t("donateView.tabVietQR", "VietQR")}
          </button>
          <button
            onClick={() => setTab("intl")}
            className={classNames(
              "flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all",
              tab === "intl"
                ? "bg-white dark:bg-slate-700 text-kat-dark dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            {t("donateView.tabInternational", "International")}
          </button>
        </div>

        {/* Payment Methods */}
        {tab === "vn" ? (
          <>
            {/* QR Code Card */}
            <div className="w-[85%] max-w-[280px] p-4 bg-white border border-slate-200 rounded-[24px] shadow-soft flex flex-col items-center transition-all hover:shadow-md">
              <img
                src="/donates.png"
                alt="Donate QR Code"
                className="w-full h-auto rounded-[16px] object-contain aspect-square"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="mt-3 text-[11px] font-extrabold text-kat-dark uppercase tracking-wider bg-slate-50/80 px-3 py-1 rounded-full border border-slate-100">
                {t("donateView.scanQR")}
              </span>
            </div>

            {/* Save QR action */}
            <a
              href="/donates.png"
              download="kat-journey-donate-qr.png"
              className="text-[13px] font-bold text-kat-teal hover:underline flex items-center gap-1 active:scale-95 transition-all"
            >
              {t("donateView.saveQR")}
            </a>
          </>
        ) : (
          <div className="w-full max-w-[280px] space-y-3 mt-2">
            <a
              href="https://paypal.me/trevorthanhtung"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full gap-2 py-3.5 px-4 rounded-[16px] bg-[#00457C] text-white font-extrabold text-[14px] transition-all hover:bg-[#005a9e] active:scale-[0.98] shadow-xs"
            >
              <HugeiconsIcon icon={GlobeIcon} className="w-5 h-5" />
              {t("donateView.supportPayPal", "Support via PayPal")}
            </a>
            <p className="text-[12px] font-medium text-slate-400 mt-3">
              {t("donateView.thankYou", "(Thank you for your support!)")}
            </p>
          </div>
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full inline-flex min-h-[48px] items-center justify-center rounded-[16px] bg-white border border-slate-200 text-kat-dark px-6 font-bold hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
        >
          {t("common.close", "Close")}
        </button>
      </div>
    </BottomSheet>
  );
}
