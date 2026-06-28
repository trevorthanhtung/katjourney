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
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-[#0A1124] p-4 animate-fadeIn overflow-hidden z-50">
      <div className="w-full max-w-md max-h-[90dvh] rounded-[32px] bg-white dark:bg-kat-surface p-6 shadow-xl border border-slate-100 dark:border-slate-800/80 animate-scaleIn flex flex-col relative">
        {currentUser && (
          <button
            onClick={() => {
              localStorage.removeItem("kat_pending_swap_" + trip.id);
              setShowIdentityModal(false);
            }}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"
            title={t("common.close")}
          >
            <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
          </button>
        )}
        <div className="flex flex-col items-center text-center shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 mb-4">
            <HugeiconsIcon icon={UserGroupIcon} className="h-8 w-8" />
          </div>

          <h2 className="text-[22px] font-extrabold text-kat-dark tracking-tight flex items-center justify-center gap-1.5">
            <span>{t("share.whoAreYou")}</span>
            <button
              type="button"
              onClick={() => setIsRolesHelpOpen(true)}
              className="text-slate-400 hover:text-kat-teal transition-colors p-1 flex items-center justify-center"
              title={t("roles.info") || "Role Information"}
            >
              <HugeiconsIcon icon={InformationCircleIcon} className="h-4.5 w-4.5" />
            </button>
          </h2>
          <p className="mt-2 text-[14px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {t("share.selectYourName")}
          </p>
        </div>

        <div className="mt-6 flex-1 min-h-0 flex flex-col">
          <div className="space-y-3 flex-1 min-h-0 flex flex-col">
            <div className="relative shrink-0">
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder={t("share.searchMember")}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl text-[14px] font-semibold text-kat-dark placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal focus:outline-none focus:border-kat-teal focus:ring-2 focus:ring-kat-teal/15 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
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

            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-100 dark:border-slate-800/60 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 custom-scrollbar">
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
                    <div className="p-8 text-center text-slate-400 dark:text-slate-500 select-none">
                      <HugeiconsIcon
                        icon={Search01Icon}
                        className="w-8 h-8 mx-auto mb-2 text-slate-350 dark:text-slate-600"
                      />
                      <p className="text-xs font-semibold">{t("share.memberNotFound")}</p>
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
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700">
                      {m.avatar ? (
                        getAvatarSvg(m.avatar, "w-full h-full")
                      ) : (
                        <HugeiconsIcon icon={UserGroupIcon} className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between flex-1 pr-1">
                      <span className="text-[14px] font-bold text-slate-800 dark:text-slate-200">
                        {m.name}
                      </span>
                      {renderRoleIcons(m.role || "")}
                    </div>
                  </button>
                ));
              })()}
            </div>

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
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border border-slate-100 dark:border-slate-800/60 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 shrink-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-400">
                <HugeiconsIcon icon={GlobeIcon} className="h-4 w-4" />
              </div>
              <span className="text-[14px] font-bold text-slate-600 dark:text-slate-300">
                {t("share.justWantToView")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
