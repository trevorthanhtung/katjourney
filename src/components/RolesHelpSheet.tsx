import React from "react";
import { BottomSheet } from "./ui";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CrownIcon,
  WalletCardsIcon,
  Car01Icon,
  CompassIcon,
  UserGroupIcon
} from "@hugeicons/core-free-icons";

export function RolesHelpSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const roles = [
    {
      title: t("roles.roleLeader"),
      icon: CrownIcon,
      colorClass: "bg-amber-50 text-amber-600 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
      description: t("roles.roleLeaderDesc"),
      permissions: [
        { label: t("roles.permEditTripDirectly"), allowed: true },
        { label: t("roles.permManageCostDirectly"), allowed: true }
      ]
    },
    {
      title: t("roles.roleDriver"),
      icon: Car01Icon,
      colorClass: "bg-blue-50 text-blue-600 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
      description: t("roles.roleDriverDesc"),
      permissions: [
        { label: t("roles.permEditTripDirectly"), allowed: true },
        { label: t("roles.permSuggestCost"), allowed: false }
      ]
    },
    {
      title: t("roles.roleNavigator"),
      icon: CompassIcon,
      colorClass: "bg-sky-50 text-sky-600 border-sky-200/50 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30",
      description: t("roles.roleNavigatorDesc"),
      permissions: [
        { label: t("roles.permEditTripDirectly"), allowed: true },
        { label: t("roles.permSuggestCost"), allowed: false }
      ]
    },
    {
      title: t("roles.roleCostManager"),
      icon: WalletCardsIcon,
      colorClass: "bg-emerald-50 text-emerald-600 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
      description: t("roles.roleCostManagerDesc"),
      permissions: [
        { label: t("roles.permManageCostDirectly"), allowed: true },
        { label: t("roles.permSuggestTrip"), allowed: false }
      ]
    },
    {
      title: t("roles.roleCompanion"),
      icon: UserGroupIcon,
      colorClass: "bg-slate-50 text-slate-600 border-slate-200/50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50",
      description: t("roles.roleCompanionDesc"),
      permissions: [
        { label: t("roles.permSuggestTrip"), allowed: false },
        { label: t("roles.permSuggestCost"), allowed: false }
      ]
    }
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t("roles.rolesHelpTitle")}
      subtitle={t("roles.rolesHelpSubtitle")}
    >
      <div className="space-y-4 pb-4">
        {roles.map((role, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md flex flex-col gap-3 shadow-sm transition-all hover:bg-white/60 dark:hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${role.colorClass} shadow-sm shrink-0`}>
                <HugeiconsIcon icon={role.icon} className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14.5px] font-extrabold text-slate-800 dark:text-slate-200 leading-none">
                  {role.title}
                </h4>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-1.5 leading-relaxed">
                  {role.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1.5 border-t border-slate-200/60 dark:border-white/10">
              {role.permissions.map((p, pIdx) => (
                <span
                  key={pIdx}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    p.allowed
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                      : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                  }`}
                >
                  <span
                    className={`w-1 h-1 rounded-full ${
                      p.allowed ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
