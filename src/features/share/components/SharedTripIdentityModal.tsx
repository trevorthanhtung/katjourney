import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  UserGroupIcon,
  InformationCircleIcon,
  Search01Icon,
  GlobeIcon,
} from "@hugeicons/core-free-icons";

interface SharedTripIdentityModalProps {
  currentUser: any;
  trip: any;
  members: any[];
  memberSearchQuery: string;
  setMemberSearchQuery: (query: string) => void;
  saveIdentity: (guest: any, tripId: string) => void;
  setCurrentUser: (user: any) => void;
  setShowIdentityModal: (show: boolean) => void;
  setIdentityChecked: (checked: boolean) => void;
  setIsBannerVisible: (visible: boolean) => void;
  setIsRolesHelpOpen: (open: boolean) => void;
  t: (key: string) => string;
  getAvatarSvg: (avatar: string, className?: string) => React.ReactNode;
  renderRoleIcons: (role: string) => React.ReactNode;
}

export function SharedTripIdentityModal({
  currentUser,
  trip,
  members,
  memberSearchQuery,
  setMemberSearchQuery,
  saveIdentity,
  setCurrentUser,
  setShowIdentityModal,
  setIdentityChecked,
  setIsBannerVisible,
  setIsRolesHelpOpen,
  t,
  getAvatarSvg,
  renderRoleIcons,
}: SharedTripIdentityModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-100/90 dark:bg-[#060b19]/90 p-4 animate-fadeIn overflow-hidden z-50">
      {/* Animated background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/[0.08] dark:bg-indigo-500/[0.05] blur-[80px] animate-pulse pointer-events-none" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-500/[0.08] dark:bg-teal-500/[0.05] blur-[80px] animate-pulse pointer-events-none"
        style={{ animationDelay: "2s" }}
      />

      <div className="w-full max-w-md max-h-[90dvh] rounded-[32px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-white/50 dark:border-white/5 animate-scaleIn flex flex-col relative overflow-hidden">
        {/* Close button (only when swapping identity) */}
        {currentUser && (
          <button
            onClick={() => {
              localStorage.removeItem("kat_pending_swap_" + trip.id);
              setShowIdentityModal(false);
            }}
            className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all z-20"
            title={t("common.close")}
          >
            <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
          </button>
        )}

        {/* ── SCROLLABLE AREA: header scrolls away, search sticks ── */}
        <div className="flex-1 min-h-0 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
          {/* Header — scrolls away when user drags down */}
          <div className="flex flex-col items-center text-center px-4 sm:px-6 pt-5 sm:pt-6">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 shadow-inner mb-3 sm:mb-4">
              <HugeiconsIcon icon={UserGroupIcon} className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <h2 className="text-[18px] sm:text-[22px] font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center justify-center gap-1.5 leading-tight">
              <span>{t("share.whoAreYou")}</span>
              <button
                type="button"
                onClick={() => setIsRolesHelpOpen(true)}
                className="text-slate-400 hover:text-indigo-550 transition-colors p-1 flex items-center justify-center"
                title={t("roles.info") || "Role Information"}
              >
                <HugeiconsIcon icon={InformationCircleIcon} className="h-4.5 w-4.5" />
              </button>
            </h2>
            <p className="mt-2 text-[14px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
              {t("share.selectYourName")}
            </p>
          </div>

          {/* Search bar — scrolls with header */}
          <div className="px-4 sm:px-6 py-3">
            <div className="relative">
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder={t("share.searchMember")}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl text-[14px] font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450">
                <HugeiconsIcon icon={Search01Icon} className="w-4 h-4" />
              </div>
              {memberSearchQuery && (
                <button
                  onClick={() => setMemberSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Member list */}
          <div className="px-4 sm:px-6 pb-3 space-y-2.5">
            {(() => {
              const filteredMembers = members.filter((m: any) => {
                const roleLower = (m.role || "").trim().toLowerCase();
                const matchesSearch =
                  memberSearchQuery.trim() === "" ||
                  m.name.toLowerCase().includes(memberSearchQuery.toLowerCase());
                return (
                  matchesSearch &&
                  !(
                    roleLower === "trưởng nhóm" ||
                    roleLower === "trưởng đoàn" ||
                    roleLower === "người đại diện" ||
                    roleLower === "leader"
                  )
                );
              });

              if (filteredMembers.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 select-none bg-slate-50/20 dark:bg-slate-800/10 rounded-2xl border border-dashed border-slate-200/50 dark:border-slate-800/50">
                    <HugeiconsIcon
                      icon={Search01Icon}
                      className="w-8 h-8 mx-auto mb-2 text-slate-350 dark:text-slate-600"
                    />
                    <p className="text-xs font-bold">{t("share.memberNotFound")}</p>
                  </div>
                );
              }

              return filteredMembers.map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => {
                    const roleLower = (m.role || "").toLowerCase();
                    const isViewer =
                      roleLower.includes("xem") ||
                      roleLower.includes("trẻ em") ||
                      roleLower.includes("khách") ||
                      roleLower.includes("chỉ xem") ||
                      roleLower.includes("viewer");
                    const guest = {
                      name: m.name,
                      role: m.role,
                      isGuest: true,
                      canEdit: !isViewer,
                    };
                    saveIdentity(guest, trip.id);
                    localStorage.removeItem("kat_pending_swap_" + trip.id);
                    setCurrentUser(guest);
                    setShowIdentityModal(false);
                    setIdentityChecked(true);
                    setIsBannerVisible(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left rounded-[20px] bg-white/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-white/5 hover:border-slate-350 dark:hover:border-slate-700 hover:scale-[1.01] hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-sm shrink-0">
                    {m.avatar ? (
                      getAvatarSvg(m.avatar, "w-full h-full")
                    ) : (
                      <HugeiconsIcon icon={UserGroupIcon} className="h-4.5 w-4.5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between flex-1 pr-1 min-w-0">
                    <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {m.name}
                    </span>
                    {renderRoleIcons(m.role || "")}
                  </div>
                </button>
              ));
            })()}
          </div>
        </div>

        {/* ── FROZEN FOOTER — Viewer button always visible ── */}
        <div className="shrink-0 px-4 sm:px-6 pb-4 sm:pb-6 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <button
            onClick={() => {
              const guest = {
                name: (t("share.viewer") || "Người xem") as string,
                isGuest: true,
                canEdit: false,
              };
              saveIdentity(guest, trip.id);
              localStorage.removeItem("kat_pending_swap_" + trip.id);
              setCurrentUser(guest);
              setShowIdentityModal(false);
              setIdentityChecked(true);
              setIsBannerVisible(true);
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left rounded-[20px] bg-indigo-500/[0.04] dark:bg-indigo-500/[0.02] border border-dashed border-indigo-200/60 dark:border-indigo-900/30 hover:border-indigo-400 hover:bg-indigo-500/[0.08] dark:hover:bg-indigo-500/[0.05] transition-all active:scale-[0.99] shrink-0 cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
              <HugeiconsIcon icon={GlobeIcon} className="h-4.5 w-4.5" />
            </div>
            <span className="text-[14px] font-black text-indigo-650 dark:text-indigo-400">
              {t("share.justWantToView")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
