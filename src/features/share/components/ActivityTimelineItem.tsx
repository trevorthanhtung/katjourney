import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreVerticalIcon,
  Clock01Icon,
  UserCheck01Icon,
  Location01Icon,
  MapsIcon,
  Route01Icon,
  Wallet01Icon,
  GitBranchIcon,
} from "@hugeicons/core-free-icons";
import { classNames, formatDate } from "../../../utils/helpers";
import { getEmbedMapUrl, ensureAbsoluteUrl, getMapFilterClass } from "../../../utils/mapUtils";

interface ActivityTimelineItemProps {
  item: any;
  idx?: number;
  getCategory: (type: string) => {
    icon: any;
    bgColor: string;
    id: string;
  };
  changeRequests: any[];
  t: (key: string, options?: any) => string;
  isRequestEdit: boolean;
  activeMenuId: string | null;
  onMenuClick: (id: string, rect: DOMRect) => void;
  expenses: any[];
  mergedBackupPlans: any[];
  isBackupPlansRequestEdit: boolean;
  isBackupPlansDirectEdit: boolean;
  onOpenBackupPlans: (item: any) => void;
}

export function ActivityTimelineItem({
  item,
  idx,
  getCategory,
  changeRequests,
  t,
  isRequestEdit,
  activeMenuId,
  onMenuClick,
  expenses,
  mergedBackupPlans,
  isBackupPlansRequestEdit,
  isBackupPlansDirectEdit,
  onOpenBackupPlans,
}: ActivityTimelineItemProps) {
  const isPending = item.isPendingCreate || item.isPendingUpdate || item.isPendingDelete;
  const category = getCategory(item.type);
  const CatIcon = category.icon;

  return (
    <div key={item.id || idx} className="relative flex gap-4 pl-1 group">
      <div className="absolute bottom-0 left-[19px] top-8 w-0.5 bg-slate-100 dark:bg-slate-800 group-last:bg-transparent" />
      <div className="relative z-10 flex shrink-0 mt-1">
        <div
          className={classNames(
            "flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#0A1124] shadow-[0_2px_8px_rgba(3,13,46,0.06)] border border-slate-100 dark:border-kat-border/40",
            category.bgColor
          )}
        >
          <HugeiconsIcon icon={CatIcon} className="h-4.5 w-4.5" />
        </div>
      </div>

      <div
        className={classNames(
          "flex flex-col w-full min-w-0 pt-0.5 pb-4 border-b border-slate-100/60 dark:border-slate-800/40 group-last:border-transparent transition-all rounded-2xl px-3",
          item.isPendingCreate || item.isPendingUpdate
            ? "bg-sky-50/40 dark:bg-sky-950/10 border border-sky-100/50 dark:border-sky-900/30 my-1 py-3"
            : "",
          item.isPendingDelete ? "bg-slate-50/30 dark:bg-slate-900/30 opacity-70" : ""
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <h4
              className={classNames(
                "text-[15.5px] font-black text-kat-dark break-words tracking-tight",
                item.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
              )}
            >
              {item.title}
            </h4>

            {item.isPendingDelete && (
              <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 shrink-0 select-none animate-fadeIn">
                {changeRequests.find((r) => String(r.id) === String(item.changeRequestId))
                  ?.status === "auto_approved"
                  ? t("share.deleting")
                  : t("share.suggestDelete")}
              </span>
            )}
            {item.isPendingCreate && (
              <span className="inline-flex items-center rounded-full bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400 shrink-0 select-none animate-fadeIn">
                {changeRequests.find((r) => String(r.id) === String(item.changeRequestId))
                  ?.status === "auto_approved"
                  ? t("common.savingBadge")
                  : t("share.suggestAdd")}
              </span>
            )}
            {item.isPendingUpdate && (
              <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0 select-none animate-fadeIn">
                {changeRequests.find((r) => String(r.id) === String(item.changeRequestId))
                  ?.status === "auto_approved"
                  ? t("share.saving")
                  : t("share.suggestEdit")}
              </span>
            )}
          </div>

          {isRequestEdit && !isPending && (
            <div className="shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  onMenuClick(String(item.id), rect);
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 transition-all focus:outline-none"
                title={t("expenses.suggestOption")}
              >
                <HugeiconsIcon icon={MoreVerticalIcon} className="h-4.5 w-4.5" />
              </button>
            </div>
          )}
        </div>

        <div
          className={classNames(
            "mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] font-medium text-slate-500",
            item.isPendingDelete ? "opacity-60" : ""
          )}
        >
          {item.time && (
            <span
              className={classNames(
                "flex items-center gap-1 font-bold text-[#00AFA8] dark:text-teal-400 bg-indigo-50/50 dark:bg-teal-950/20 px-2 py-0.5 rounded-lg border border-indigo-100/40 dark:border-teal-900/30",
                item.isPendingDelete ? "line-through text-slate-400" : ""
              )}
            >
              <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5" />
              {item.time}
            </span>
          )}
          <span
            className={classNames(
              "bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded-lg border border-slate-100/60 dark:border-slate-700/40 dark:text-slate-400",
              item.isPendingDelete ? "line-through" : ""
            )}
          >
            {formatDate(item.date)}
          </span>

          <span
            className={classNames(
              "text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-100",
              category.bgColor
            )}
          >
            {t(`timeline.cat${category.id.charAt(0).toUpperCase() + category.id.slice(1)}`)}
          </span>

          {item.assignee && (
            <span
              className={classNames(
                "flex items-center gap-1 font-bold text-slate-500",
                item.isPendingDelete ? "line-through" : ""
              )}
            >
              <span className="h-1 w-1 rounded-full bg-slate-300 mx-1"></span>
              <HugeiconsIcon icon={UserCheck01Icon} className="h-3.5 w-3.5" />
              {item.assignee}
            </span>
          )}
        </div>

        {item.location && (
          <p
            className={classNames(
              "mt-2 text-[13.5px] text-slate-600 dark:text-slate-350 flex items-start gap-1.5",
              item.isPendingDelete ? "line-through opacity-60" : ""
            )}
          >
            <HugeiconsIcon
              icon={Location01Icon}
              className="h-4 w-4 shrink-0 mt-0.5 text-slate-400"
            />
            <span className="break-words font-medium">{item.location}</span>
          </p>
        )}

        {item.notes && (
          <div
            className={classNames(
              "mt-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 p-3 border border-slate-100 dark:border-kat-border/40",
              item.isPendingDelete ? "opacity-60" : ""
            )}
          >
            <p
              className={classNames(
                "text-[13px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed",
                item.isPendingDelete ? "line-through" : ""
              )}
            >
              {item.notes}
            </p>
          </div>
        )}

        {/* Google Maps Embed */}
        {(item.mapLink || item.location) && (
          <div
            className={classNames(
              "mt-3 space-y-2",
              item.isPendingDelete ? "opacity-60 grayscale" : ""
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {getEmbedMapUrl(item.mapLink || item.location || "", item.location) && (
              <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-100 relative min-h-[160px]">
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <span className="text-[12px] font-medium animate-pulse">Đang tải bản đồ...</span>
                </div>
                <iframe
                  title="Google Maps Embed"
                  width="100%"
                  height="160"
                  className={`border-0 relative z-10 ${getMapFilterClass(item.time)}`}
                  loading="lazy"
                  allowFullScreen
                  src={getEmbedMapUrl(item.mapLink || item.location || "", item.location) || ""}
                ></iframe>
              </div>
            )}
            {(() => {
              const isRoute =
                item.mapLink &&
                (item.mapLink.includes("/maps/dir/") || item.mapLink.includes("maps/dir"));
              return (
                <a
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-[13px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                  href={
                    ensureAbsoluteUrl(item.mapLink) ||
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      item.location || ""
                    )}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {isRoute ? (
                    <HugeiconsIcon icon={Route01Icon} className="w-3.5 h-3.5" />
                  ) : (
                    <HugeiconsIcon icon={MapsIcon} className="w-3.5 h-3.5" />
                  )}
                  {isRoute ? t("timeline.viewRoute") + " " : t("share.openGoogleMaps") + " "}
                  &rarr;
                </a>
              );
            })()}
          </div>
        )}

        {/* Expenses & Backup plans linked */}
        {(() => {
          const rawLinkedExpenses = expenses.filter(
            (exp) => String(exp.eventId) === String(item.id)
          );
          const linkedExpenses = rawLinkedExpenses.filter(
            (exp, index, self) =>
              index ===
              self.findIndex((t) => t.amount === exp.amount && t.description === exp.description)
          );
          const backupCount = mergedBackupPlans.filter(
            (p) =>
              p.activityId !== undefined && String(p.activityId) === String(item.id) && !p.isDeleted
          ).length;
          return (
            <>
              {linkedExpenses.length > 0 && (
                <div
                  className="mt-3 border-t border-slate-100/40 dark:border-slate-800/40 pt-2 flex flex-wrap items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {linkedExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-[11px] rounded-xl border border-rose-100 dark:border-rose-900/30 shadow-[0_1px_4px_rgba(229,10,98,0.03)] font-bold"
                    >
                      <HugeiconsIcon icon={Wallet01Icon} className="w-3 h-3 text-rose-500" />
                      <span>{new Intl.NumberFormat("vi-VN").format(exp.amount)}đ</span>
                      <span className="text-rose-500/80 dark:text-slate-400 font-medium truncate max-w-[110px]">
                        &middot; {exp.description || exp.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {(backupCount > 0 || isBackupPlansRequestEdit) && (
                <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      onOpenBackupPlans(item);
                    }}
                    className={classNames(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-bold border transition-colors motion-press cursor-pointer focus:outline-none",
                      backupCount > 0
                        ? "bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/30 shadow-[0_1px_4px_rgba(79,70,229,0.03)]"
                        : "bg-slate-50/40 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/85 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                  >
                    <HugeiconsIcon icon={GitBranchIcon} className="w-3.5 h-3.5" />
                    <span>
                      {backupCount > 0
                        ? t("timeline.backupPlansCount", { count: backupCount })
                        : isBackupPlansDirectEdit
                          ? t("timeline.addBackupPlan")
                          : t("share.suggestAddBackupPlan")}
                    </span>
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
