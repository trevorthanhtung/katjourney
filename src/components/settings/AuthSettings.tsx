import React from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading01Icon,
  CompassIcon,
  UserIcon,
  CheckIcon,
  Cancel01Icon,
  PencilEdit01Icon,
  InformationCircleIcon,
  Download01Icon,
  CloudIcon,
  AlertCircleIcon,
  Clock01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import { User } from "../../services/authService";

const GoogleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    xmlns="http://www.w3.org/2000/svg"
    className="mr-1"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

interface AuthSettingsProps {
  user: User | null;
  authLoading: boolean;
  provider: string | null;
  actionLoading: string | null;
  isEditingName: boolean;
  setIsEditingName: (isEditing: boolean) => void;
  newName: string;
  setNewName: (name: string) => void;
  handleUpdateName: () => void;
  handleGoogleSignIn: () => void;
  handleGuestSignIn: () => void;
  handleBackupAllData: () => void;
  handleSync: () => void;
  syncProps: {
    isSyncing: boolean;
    isAutoBackingUp: boolean;
    lastBackupAt: string | null;
    autoBackupEnabled: boolean;
    hasCloudVersion: boolean;
    setAutoBackupEnabled: (enabled: boolean) => void;
  };
  syncError: string | null;
  syncSuccess: string | null;
  getInitials: (name: string) => string;
}

export function AuthSettings({
  user,
  authLoading,
  provider,
  actionLoading,
  isEditingName,
  setIsEditingName,
  newName,
  setNewName,
  handleUpdateName,
  handleGoogleSignIn,
  handleGuestSignIn,
  handleBackupAllData,
  handleSync,
  syncProps,
  syncError,
  syncSuccess,
  getInitials,
}: AuthSettingsProps) {
  const { t } = useTranslation();
  const {
    isSyncing,
    isAutoBackingUp,
    lastBackupAt,
    autoBackupEnabled,
    hasCloudVersion,
    setAutoBackupEnabled,
  } = syncProps;

  const renderBackupSection = () => {
    const backupTimeStr = lastBackupAt
      ? new Date(lastBackupAt).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    const backupDateStr = lastBackupAt
      ? new Date(lastBackupAt).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : null;

    return (
      <div className="border-t border-slate-200/50 dark:border-white/5 pt-5 mt-4 space-y-4 text-left animate-fadeIn">
        <div className="flex items-center gap-3 mb-1 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 shadow-inner shrink-0">
            <HugeiconsIcon
              icon={CloudIcon}
              className={`w-5 h-5 ${isSyncing || isAutoBackingUp ? "animate-spin" : ""}`}
            />
          </div>
          <div>
            <h4 className="text-[15.5px] font-black text-kat-dark dark:text-slate-200">
              {t("settings.auth.dataSync")}
            </h4>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 font-bold">
              {t("settings.auth.dataSyncDesc")}
            </p>
          </div>
        </div>

        {hasCloudVersion && (
          <div className="rounded-[22px] bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 dark:border-amber-900/30 p-4 text-[13.5px] text-amber-800 dark:text-amber-400 font-bold leading-relaxed flex items-start gap-3 animate-fadeIn shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
              <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4" />
            </div>
            <span className="pt-0.5 flex-1">{t("settings.auth.newerVersionAlert")}</span>
          </div>
        )}

        {syncError && (
          <div className="rounded-[22px] bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/20 dark:border-rose-900/30 p-4 text-[13.5px] text-rose-855 dark:text-rose-400 font-bold leading-relaxed flex items-start gap-3 animate-fadeIn shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5">
              <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4" />
            </div>
            <span className="pt-0.5 flex-1">{syncError}</span>
          </div>
        )}

        {syncSuccess && (
          <div className="rounded-[22px] bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-900/30 p-4 text-[13.5px] text-emerald-855 dark:text-emerald-400 font-bold leading-relaxed flex items-start gap-3 animate-fadeIn shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5">
              <HugeiconsIcon icon={CheckIcon} className="w-4 h-4" strokeWidth={3.5} />
            </div>
            <span className="pt-0.5 flex-1">{syncSuccess}</span>
          </div>
        )}

        {!user ? (
          <div className="rounded-[22px] bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 dark:border-amber-900/30 p-4 text-[13.5px] text-amber-800 dark:text-amber-400 font-bold leading-relaxed shadow-xs">
            {t("settings.auth.loginToSync")}
          </div>
        ) : (
          <>
            <div className="bg-white/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/5 rounded-[22px] p-4.5 flex justify-between items-center text-[13.5px] font-bold text-slate-500 dark:text-slate-400 min-h-[60px] shadow-soft relative overflow-hidden">
              <span className="text-slate-500 dark:text-slate-450 font-bold">
                {t("settings.auth.lastSync")}
              </span>
              {lastBackupAt && backupTimeStr && backupDateStr ? (
                <div className="flex gap-2 items-center">
                  <div className="inline-flex items-center gap-1.5 font-black text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-800/80 border border-slate-200/50 dark:border-white/5 px-3.5 py-1.5 rounded-full text-[13px] shadow-xs">
                    <HugeiconsIcon
                      icon={Clock01Icon}
                      className="w-3.5 h-3.5 text-slate-455 dark:text-slate-500 shrink-0"
                    />
                    <span>{backupTimeStr}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 font-black text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-800/80 border border-slate-200/50 dark:border-white/5 px-3.5 py-1.5 rounded-full text-[13px] shadow-xs">
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      className="w-3.5 h-3.5 text-slate-455 dark:text-slate-500 shrink-0"
                    />
                    <span>{backupDateStr}</span>
                  </div>
                </div>
              ) : (
                <span className="font-black text-slate-500 dark:text-slate-450 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 px-4 py-1.5 rounded-full text-[13px]">
                  {t("settings.auth.neverSynced")}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-4.5 rounded-[22px] border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/30 min-h-[76px] shadow-soft">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 shadow-inner shrink-0">
                  <HugeiconsIcon icon={CloudIcon} className="w-5 h-5" />
                </div>
                <div className="text-left pr-2">
                  <span className="text-[14px] font-black text-kat-dark dark:text-slate-200">
                    {t("settings.auth.autoBackupCloud")}
                  </span>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 font-bold mt-0.5 leading-normal">
                    {t("settings.auth.autoBackupDesc")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={autoBackupEnabled}
                onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  autoBackupEnabled ? "bg-[#00BFB7]" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                    autoBackupEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </>
        )}

        <div className="pt-2">
          <button
            onClick={handleSync}
            disabled={!user || isSyncing}
            className="w-full flex items-center justify-center gap-2.5 h-13 rounded-[20px] bg-[#00BFB7] hover:bg-[#00A19D] active:scale-[0.97] transition-all font-black text-[15px] text-slate-950 shadow-[0_4px_14px_rgba(0,191,183,0.2)] hover:shadow-[0_6px_20px_rgba(0,191,183,0.35)] disabled:opacity-40 disabled:active:scale-100 disabled:shadow-none shrink-0 cursor-pointer"
          >
            {isSyncing ? (
              <>
                <HugeiconsIcon icon={Loading01Icon} className="w-4.5 h-4.5 animate-spin shrink-0" />
                <span>{t("settings.auth.syncing")}</span>
              </>
            ) : isAutoBackingUp ? (
              <>
                <HugeiconsIcon icon={Loading01Icon} className="w-4.5 h-4.5 animate-spin shrink-0" />
                <span>{t("settings.auth.autoBackingUp")}</span>
              </>
            ) : (
              <>
                <span>{t("settings.auth.syncNow")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 py-2">
      {authLoading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <HugeiconsIcon icon={Loading01Icon} className="h-8 w-8 text-kat-teal animate-spin" />
          <p className="text-sm font-bold text-slate-400">{t("settings.authView.loading")}</p>
        </div>
      ) : !user ? (
        <>
          <div className="space-y-6 flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kat-primary/10 text-kat-primary ring-4 ring-kat-primary/5">
              <HugeiconsIcon icon={CompassIcon} className="h-6 w-6" />
            </div>

            <div className="space-y-2 max-w-sm">
              <h3 className="text-[20px] font-black text-kat-dark text-balance">
                {t("settings.authView.welcome")}
              </h3>
              <p className="text-[13.5px] font-semibold leading-relaxed text-slate-500">
                {t("settings.authView.guestDesc")}
              </p>
            </div>

            <div className="w-full space-y-3 pt-2">
              <button
                onClick={handleGoogleSignIn}
                disabled={actionLoading !== null}
                className="group relative flex w-full items-center justify-center gap-3 min-h-[50px] overflow-hidden rounded-[20px] bg-kat-teal font-black text-[15px] text-kat-dark shadow-xs transition-all hover:bg-opacity-90 hover:shadow-md active:scale-[0.98] disabled:opacity-60 dark:bg-kat-teal dark:text-slate-900"
              >
                {actionLoading === "google" ? (
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    className="h-5 w-5 text-kat-teal animate-spin"
                  />
                ) : (
                  <GoogleIcon />
                )}
                {t("settings.authView.continueGoogle")}
              </button>

              <button
                onClick={handleGuestSignIn}
                disabled={actionLoading !== null}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-[16px] bg-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all font-semibold text-[14px] active:scale-[0.98] disabled:opacity-60"
              >
                {actionLoading === "guest" && (
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    className="h-4 w-4 text-slate-500 animate-spin"
                  />
                )}
                {t("settings.authView.continueGuest")}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4.5 p-5 rounded-[24px] bg-white/50 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/50 dark:border-white/5 shadow-soft hover:shadow-md transition-all duration-350 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-500/2 dark:bg-indigo-500/4 rounded-full blur-xl pointer-events-none" />
            {provider === "google" ? (
              user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Avatar"}
                  className="h-14 w-14 rounded-full border border-slate-200/85 dark:border-white/4 object-cover shadow-xs shrink-0 ring-2 ring-slate-100 dark:ring-slate-900"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-[#4285F4] to-[#357AE8] text-white font-extrabold text-lg shadow-inner shrink-0">
                  {getInitials(user.displayName || "Google User")}
                </div>
              )
            ) : (
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-tr from-[#0081BE] via-kat-teal to-[#80EAD6] text-white shadow-[0_4px_16px_rgba(0,191,183,0.2)] border-2 border-white dark:border-slate-800 shrink-0">
                <HugeiconsIcon icon={UserIcon} className="h-6.5 w-6.5 text-white" />
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-white dark:border-slate-800"></span>
                </span>
              </div>
            )}

            {isEditingName ? (
              <div className="flex-1 flex items-center gap-1.5 min-w-0">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 h-10 px-3 text-[14.5px] font-bold text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:border-kat-teal focus:ring-1 focus:ring-kat-teal/40 min-w-0"
                  placeholder={t("settings.authView.displayName")}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateName();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                />
                <button
                  onClick={handleUpdateName}
                  disabled={actionLoading !== null || !newName.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-kat-teal text-kat-dark hover:brightness-105 active:scale-95 transition-all shrink-0 disabled:opacity-50"
                >
                  {actionLoading === "guest" ? (
                    <HugeiconsIcon icon={Loading01Icon} className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <HugeiconsIcon icon={CheckIcon} className="w-4.5 h-4.5" strokeWidth={3} />
                  )}
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  disabled={actionLoading !== null}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all shrink-0"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-1.5 max-w-full">
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="flex items-center gap-2 text-left hover:opacity-85 transition-all min-w-0 group"
                    title="Đổi tên hiển thị"
                  >
                    <h3 className="text-[17.5px] font-black text-slate-800 dark:text-slate-200 leading-snug truncate">
                      {user.displayName ||
                        (provider === "guest"
                          ? t("settings.authView.localAccount")
                          : t("settings.authView.anonymousAccount"))}
                    </h3>
                    <div className="p-1.5 text-slate-400 dark:text-slate-500 group-hover:text-kat-teal group-hover:bg-slate-100 dark:group-hover:bg-slate-800 rounded-lg shrink-0 transition-all">
                      <HugeiconsIcon
                        icon={PencilEdit01Icon}
                        className="w-4 h-4"
                        strokeWidth={2.5}
                      />
                    </div>
                  </button>
                </div>
                {provider === "google" && user.email && (
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 font-semibold leading-normal truncate mt-0.5">
                    {user.email}
                  </p>
                )}
                <div className="mt-2.5">
                  {provider === "google" ? (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      <span className="text-[#4285F4]">G</span>
                      <span className="text-[#EA4335]">O</span>
                      <span className="text-[#FBBC05]">O</span>
                      <span className="text-[#4285F4]">G</span>
                      <span className="text-[#34A853]">L</span>
                      <span className="text-[#EA4335]">E</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-250/50 dark:border-amber-900/30 shadow-[inset_0_1px_1px_rgba(245,158,11,0.05)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      {t("settings.authView.notSynced")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {provider === "guest" && (
            <>
              <div className="p-4 rounded-[22px] bg-linear-to-br from-cyan-500/10 to-teal-500/5 dark:from-cyan-950/20 dark:to-teal-950/10 border border-cyan-500/20 dark:border-cyan-500/15 text-left flex items-start gap-3 shadow-inner">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 dark:bg-cyan-500/25 text-kat-primary-usable dark:text-cyan-400 shrink-0 mt-0.5 shadow-xs">
                  <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4" />
                </div>
                <p className="text-[13px] font-bold leading-relaxed text-slate-650 dark:text-slate-350">
                  {t("settings.authView.guestNotice1")}
                  <strong className="font-extrabold text-slate-800 dark:text-slate-200">
                    {t("settings.authView.safe")}
                  </strong>
                  {t("settings.authView.guestNotice2")}
                  <strong className="font-extrabold text-slate-800 dark:text-slate-200">
                    {t("settings.authView.shareTrip")}
                  </strong>
                  {t("settings.authView.guestNotice3")}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={actionLoading !== null}
                  className="w-full flex items-center justify-center gap-3 h-13 rounded-[20px] border border-slate-200/50 dark:border-white/5 bg-white/80 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] transition-all font-black text-[14.5px] text-slate-800 dark:text-slate-200 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] disabled:opacity-60 relative overflow-hidden cursor-pointer"
                >
                  {actionLoading === "google" ? (
                    <HugeiconsIcon
                      icon={Loading01Icon}
                      className="h-5 w-5 text-kat-teal animate-spin"
                    />
                  ) : (
                    <GoogleIcon />
                  )}
                  {t("settings.authView.linkGoogle")}
                </button>

                <button
                  onClick={handleBackupAllData}
                  disabled={actionLoading !== null}
                  className="w-full flex items-center justify-center gap-2.5 h-11.5 rounded-[16px] border border-dashed border-slate-200/80 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 active:scale-[0.98] transition-all font-bold text-[13px] disabled:opacity-60 shadow-xs cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={Download01Icon}
                    className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500 shrink-0"
                  />
                  {t("settings.authView.manualBackup")}
                </button>
              </div>
            </>
          )}

          {renderBackupSection()}
        </div>
      )}
    </div>
  );
}
