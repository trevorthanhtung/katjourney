import { Member, ChecklistItem, Expense, db } from "../../../db";
import { classNames, formatMoney } from "../../../utils/helpers";
import { getAvatarSvg } from "../../../utils/avatars";
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

export function MemberCardRow({
  member,
  checklist,
  expenses,
  openEditMember,
  onDeleteMember,
  isReadOnly,
}: {
  member: Member;
  checklist: ChecklistItem[];
  expenses: Expense[];
  openEditMember: (member: Member) => void;
  onDeleteMember: (member: Member) => void;
  isReadOnly?: boolean;
}) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const initial = member.name.trim().charAt(0).toUpperCase() || "?";

  // Helper computations
  const assignedTasksCount = checklist.filter((c) => c.assignedTo === member.name).length;
  const memberExpenses = expenses.filter((e) => e.payer === member.name && !e.isDeleted);
  const paidExpensesCount = memberExpenses.length;
  const totalSpent = memberExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const roleLower = (member.role || "").trim().toLowerCase();
  const isLeader =
    roleLower.includes("trưởng nhóm") ||
    roleLower.includes("trưởng đoàn") ||
    roleLower.includes("leader");
  const isCost = roleLower.includes("quản lý chi phí");
  const isDriver = roleLower.includes("tài xế");
  const isGuide = roleLower.includes("dẫn đường");
  const isLuggage = roleLower.includes("hành lý") || roleLower.includes("phụ trách hành lý");

  let cardBg =
    "bg-gradient-to-br from-slate-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-slate-800/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
  let borderAccent = "border-l-[3.5px] border-l-slate-400";
  let avatarRing = "ring-2 ring-slate-100 dark:ring-slate-800";

  if (isLeader) {
    cardBg =
      "bg-gradient-to-br from-amber-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-amber-950/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
    borderAccent = "border-l-[3.5px] border-l-amber-500";
    avatarRing =
      "ring-2 ring-amber-400/60 dark:ring-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]";
  } else if (isCost) {
    cardBg =
      "bg-gradient-to-br from-emerald-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-emerald-950/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
    borderAccent = "border-l-[3.5px] border-l-emerald-500";
    avatarRing =
      "ring-2 ring-emerald-400/60 dark:ring-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]";
  } else if (isDriver) {
    cardBg =
      "bg-gradient-to-br from-blue-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-blue-950/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
    borderAccent = "border-l-[3.5px] border-l-blue-500";
    avatarRing =
      "ring-2 ring-blue-400/60 dark:ring-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.2)]";
  } else if (isGuide) {
    cardBg =
      "bg-gradient-to-br from-sky-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-sky-950/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
    borderAccent = "border-l-[3.5px] border-l-sky-500";
    avatarRing =
      "ring-2 ring-sky-400/60 dark:ring-sky-500/40 shadow-[0_0_8px_rgba(14,165,233,0.2)]";
  } else if (isLuggage) {
    cardBg =
      "bg-gradient-to-br from-indigo-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-indigo-950/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
    borderAccent = "border-l-[3.5px] border-l-indigo-500";
    avatarRing =
      "ring-2 ring-indigo-400/60 dark:ring-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.2)]";
  } else if (member.isGroupLeader) {
    cardBg =
      "bg-gradient-to-br from-teal-50/30 via-white/80 to-white/70 border-slate-200/55 dark:from-teal-950/10 dark:via-slate-900/30 dark:to-slate-900/40 backdrop-blur-md dark:border-white/5";
    borderAccent = "border-l-[3.5px] border-l-teal-500";
    avatarRing =
      "ring-2 ring-teal-400/60 dark:ring-teal-500/40 shadow-[0_0_8px_rgba(20,184,166,0.2)]";
  }

  const renderRoleBadge = (roleStr: string) => {
    const roles = (roleStr || "Người đồng hành")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    if (roles.length === 0) roles.push(t("more.companion", "Người đồng hành"));

    return (
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {roles.map((r, idx) => {
          const rLower = r.toLowerCase();
          if (
            rLower.includes("trưởng nhóm") ||
            rLower.includes("trưởng đoàn") ||
            rLower.includes("leader")
          ) {
            return (
              <span
                key={idx}
                title={t("roles.roleLeader")}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110"
              >
                <HugeiconsIcon icon={CrownIcon} className="w-4 h-4 text-amber-500" />
              </span>
            );
          }
          if (rLower.includes("quản lý chi phí")) {
            return (
              <span
                key={idx}
                title={t("roles.roleCostManager")}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110"
              >
                <HugeiconsIcon icon={WalletCardsIcon} className="w-4 h-4 text-emerald-500" />
              </span>
            );
          }
          if (rLower.includes("tài xế")) {
            return (
              <span
                key={idx}
                title={t("roles.roleDriver")}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110"
              >
                <HugeiconsIcon icon={Car01Icon} className="w-4 h-4 text-blue-500" />
              </span>
            );
          }
          if (rLower.includes("dẫn đường")) {
            return (
              <span
                key={idx}
                title={t("roles.roleNavigator")}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-200/50 dark:border-sky-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110"
              >
                <HugeiconsIcon icon={CompassIcon} className="w-4 h-4 text-sky-500" />
              </span>
            );
          }
          if (rLower.includes("phụ trách hành lý") || rLower.includes("hành lý")) {
            return (
              <span
                key={idx}
                title={t("roles.roleLuggage")}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110"
              >
                <HugeiconsIcon icon={Luggage01Icon} className="w-4 h-4 text-indigo-500" />
              </span>
            );
          }
          return (
            <span
              key={idx}
              title={t("roles.roleCompanion")}
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 border border-slate-200/60 dark:border-slate-700/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] shrink-0 select-none transition-transform hover:scale-110"
            >
              <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4 text-slate-400" />
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={classNames(
        "relative rounded-3xl border transition-all flex flex-col justify-between gap-4.5 p-5 shadow-[0_4px_15px_rgba(3,13,46,0.015)] hover:shadow-[0_8px_25px_rgba(3,13,46,0.04)] hover:scale-[1.005] duration-200",
        cardBg,
        borderAccent
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {/* Avatar */}
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${avatarRing}`}
          >
            {member.avatar ? (
              getAvatarSvg(member.avatar, "w-full h-full")
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-slate-300 text-[18px] font-black">
                {initial}
              </div>
            )}
          </div>

          {/* Member details */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 min-w-0">
              <h4 className="text-[16.5px] font-extrabold text-kat-dark truncate leading-tight min-w-0">
                {member.name}
              </h4>
              {renderRoleBadge(member.role || "Người đồng hành")}
            </div>
            {member.phone && (
              <div className="mt-0.5">
                <a
                  href={`tel:${member.phone}`}
                  className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-slate-500 hover:text-kat-teal dark:hover:text-kat-primary transition-colors leading-none"
                  title={`${t("more.call", "Gọi")} ${member.name}`}
                >
                  <HugeiconsIcon icon={CallIcon} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{member.phone}</span>
                </a>
              </div>
            )}
            {member.group && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[13.5px] font-semibold text-slate-500 flex items-center">
                  {t("members.groupPrefix")}
                  <span
                    className={
                      member.isGroupLeader
                        ? "text-kat-dark font-extrabold dark:text-kat-primary-usable"
                        : "text-slate-700 dark:text-slate-300"
                    }
                  >
                    {member.group}
                  </span>
                </p>
                {member.isGroupLeader && (
                  <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-600 border border-teal-100 dark:bg-teal-950/30 dark:border-teal-900/30 dark:text-teal-400 select-none">
                    {t("more.representative", "Đại diện")}
                  </span>
                )}
              </div>
            )}
            {member.note && (
              <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 italic mt-2.5 border-l-2 border-slate-200 dark:border-slate-700/60 pl-3 py-0.5 max-w-full break-words leading-relaxed">
                "{member.note}"
              </p>
            )}
          </div>
        </div>

        {/* Dropdown Menu Trigger (min 44x44px target) */}
        {!isReadOnly && (
          <div className="relative shrink-0">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-kat-teal/40"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              title="Tùy chọn"
            >
              <HugeiconsIcon icon={MoreVerticalIcon} className="h-5 w-5" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 bottom-full mb-1 z-40 w-32 rounded-2xl border border-slate-150 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-1.5 shadow-lg text-left">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      openEditMember(member);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors"
                  >
                    <HugeiconsIcon
                      icon={PencilEdit01Icon}
                      className="h-4 w-4 text-slate-500 dark:text-slate-400"
                    />
                    {t("members.menuEdit")}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onDeleteMember(member);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13.5px] font-bold text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-900/20 transition-colors"
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
                    {t("members.menuDelete")}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mini Stats Row */}
      <div className="pt-3 border-t border-slate-100/60 dark:border-slate-700/40 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap gap-2 text-[12px]">
          <span
            className={classNames(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] border transition-all duration-200 hover:scale-[1.02] cursor-default",
              assignedTasksCount === 0
                ? "bg-slate-50/50 dark:bg-slate-800/20 border-slate-150 dark:border-white/5 text-slate-450 dark:text-slate-500 font-bold"
                : "bg-sky-500/[0.04] dark:bg-sky-500/[0.08] border-sky-500/10 text-sky-650 dark:text-sky-400 font-extrabold"
            )}
          >
            <HugeiconsIcon icon={Luggage01Icon} className="h-3.5 w-3.5 shrink-0 text-sky-500" />
            {assignedTasksCount} {t("members.taskCount")}
          </span>
          <span
            className={classNames(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] border transition-all duration-200 hover:scale-[1.02] cursor-default",
              totalSpent > 0
                ? "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] border-emerald-500/10 text-emerald-650 dark:text-emerald-400 font-extrabold"
                : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-150 dark:border-white/5 text-slate-450 dark:text-slate-500 font-bold"
            )}
          >
            <HugeiconsIcon
              icon={WalletCardsIcon}
              className="h-3.5 w-3.5 shrink-0 text-emerald-500"
            />
            {t("members.paidPrefix")}
            {formatMoney(totalSpent)}{" "}
            {paidExpensesCount > 0 && `(${paidExpensesCount} ${t("members.paidTimes")})`}
          </span>
        </div>
      </div>
    </div>
  );
}
