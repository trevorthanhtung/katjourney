import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { classNames } from "../../../utils/helpers";

interface SharedTripBannerProps {
  isVisible: boolean;
  onClose: () => void;
  canEdit: boolean;
  userRoleLower: string;
  canRequestEdit: boolean;
  t: (key: string, options?: any) => string;
  getTranslatedRoles: (role: string) => string;
  rawRole: string;
}

export function SharedTripBanner({
  isVisible,
  onClose,
  canEdit,
  userRoleLower,
  canRequestEdit,
  t,
  getTranslatedRoles,
  rawRole,
}: SharedTripBannerProps) {
  if (
    !isVisible ||
    !canEdit ||
    !(
      userRoleLower.includes("tài xế") ||
      userRoleLower.includes("dẫn đường") ||
      userRoleLower.includes("quản lý chi phí") ||
      canRequestEdit
    )
  ) {
    return null;
  }

  const isDirectEdit =
    userRoleLower.includes("tài xế") ||
    userRoleLower.includes("dẫn đường") ||
    userRoleLower.includes("quản lý chi phí");

  return (
    <div
      className={classNames(
        "py-2.5 px-4 shadow-md select-none border-b",
        isDirectEdit
          ? "text-emerald-900 border-emerald-200/50 bg-gradient-to-r from-emerald-50 via-emerald-100/80 to-teal-50/50 dark:text-white dark:border-white/5 dark:bg-gradient-to-r dark:from-[#003830] dark:via-[#005c56] dark:to-[#004c43]"
          : "text-sky-900 border-sky-200/50 bg-gradient-to-r from-sky-50 via-sky-100/80 to-indigo-50/50 dark:text-white dark:border-white/5 dark:bg-gradient-to-r dark:from-[#0a122c] dark:via-[#0f1d4a] dark:to-[#161330]"
      )}
    >
      <div className="max-w-[1120px] mx-auto w-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-[12px] font-bold text-slate-800 dark:text-white/90">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            <HugeiconsIcon icon={PencilEdit01Icon} className="h-3 w-3" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={classNames(
                "px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-slate-200/50 dark:border-white/10",
                isDirectEdit
                  ? "bg-kat-teal/20 text-kat-teal dark:text-teal-400"
                  : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
              )}
            >
              {isDirectEdit
                ? t("sharedScreen.bannerDirectEdit")
                : t("sharedScreen.bannerSuggestMode")}
            </span>
            <span className="text-slate-700 dark:text-white/85 font-medium">
              {isDirectEdit
                ? t("sharedScreen.bannerDirectEditDesc", {
                    role: getTranslatedRoles(rawRole),
                  })
                : t("sharedScreen.bannerSuggestModeDesc")}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white/85 p-1 rounded-full transition-colors cursor-pointer shrink-0"
          title={t("sharedScreen.closeBanner")}
        >
          <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
