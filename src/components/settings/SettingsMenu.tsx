import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download01Icon,
  ChevronRightIcon,
  ColorsIcon,
  LanguageSkillIcon,
  Sun01Icon,
  Notification01Icon,
  Location01Icon,
  Coins01Icon,
  LockIcon,
  InformationCircleIcon,
  Coffee01Icon,
  Mail01Icon,
  PackageIcon,
  Loading01Icon,
  EraserIcon,
  PackageReceiveIcon,
  UserRemove01Icon,
  RotateLeft01Icon,
  Delete01Icon,
} from "@hugeicons/core-free-icons";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { clearTemporaryFiles } from "../../utils/dataActions";
import { showToast } from "../ui/ToastManager";
import { APP_VERSION } from "../../utils/helpers";
import { User } from "../../services/authService";

export type SettingsView =
  "menu" | "auth" | "privacy" | "about" | "donate" | "exchangeRates" | "theme" | "language";

interface SettingsMenuProps {
  user: User | null;
  setView: (view: SettingsView) => void;
  temperatureUnit: "C" | "F";
  toggleTemperatureUnit: () => void;
  isNotificationSupported: boolean;
  notificationPermission: string;
  notificationEnabled: boolean;
  requestNotificationPermission: () => Promise<string>;
  setNotificationEnabled: (enabled: boolean) => void;
  gpsEnabled: boolean;
  setGpsEnabled: (enabled: boolean) => void;
  importing: boolean;
  previewImportFile: (file?: File) => void;
  setIsDeleteAccountOpen: (isOpen: boolean) => void;
  setIsFactoryResetOpen: (isOpen: boolean) => void;
  handleInstallPWA: () => void;
}

export function SettingsMenu({
  user,
  setView,
  temperatureUnit,
  toggleTemperatureUnit,
  isNotificationSupported,
  notificationPermission,
  notificationEnabled,
  requestNotificationPermission,
  setNotificationEnabled,
  gpsEnabled,
  setGpsEnabled,
  importing,
  previewImportFile,
  setIsDeleteAccountOpen,
  setIsFactoryResetOpen,
  handleInstallPWA,
}: SettingsMenuProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isClearingTemp, setIsClearingTemp] = useState(false);
  const [clearTempSuccess, setClearTempSuccess] = useState(false);

  const { isInstallable, isStandalone } = usePWAInstall();

  return (
    <div className="flex flex-col gap-2">
      {/* Install PWA Option (Top position) */}
      {isInstallable && !isStandalone && (
        <button
          onClick={handleInstallPWA}
          className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-teal-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-teal-500/50 focus:outline-none mb-2"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-teal-500/10"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-teal-50 text-teal-600 shadow-inner dark:from-teal-900/40 dark:to-teal-800/20 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60 ring-1 ring-white/50 dark:ring-white/5">
              <HugeiconsIcon
                icon={Download01Icon}
                className="h-5.5 w-5.5 transition-transform group-hover:scale-110"
              />
            </div>
            <div className="min-w-0 text-left">
              <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {t("settings.menu.install.title")}
              </h4>
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {t("settings.menu.install.desc")}
              </p>
            </div>
          </div>
          <HugeiconsIcon
            icon={ChevronRightIcon}
            className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1"
          />
        </button>
      )}

      {/* Hệ thống (System Group) */}
      <div className="mb-2 rounded-[24px] border border-slate-200/60 bg-white p-2 shadow-sm dark:border-white/[0.04] dark:bg-slate-800/40">
        <div className="px-4 pt-3 pb-2">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t("settings.section.system", "Hệ thống")}
          </h3>
        </div>

        <div className="flex flex-col gap-1">
          {/* Giao diện (Theme Selector Row) */}
          <button
            onClick={() => setView("theme")}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-[16px] p-3 transition-all hover:bg-violet-50 dark:hover:bg-violet-500/10 active:scale-[0.98] focus:outline-none"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600 shadow-inner dark:from-violet-900/40 dark:to-violet-800/20 dark:text-violet-400 border border-violet-200 dark:border-violet-800/60 ring-1 ring-white/50 dark:ring-white/5">
                <HugeiconsIcon
                  icon={ColorsIcon}
                  className="h-5 w-5 transition-transform group-hover:scale-110"
                />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {t("settings.menu.theme.title")}
                </h4>
                <p className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.menu.theme.desc")}
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ChevronRightIcon}
              className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1"
            />
          </button>

          {/* Language Selector Row */}
          <button
            onClick={() => setView("language")}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-[16px] p-3 transition-all hover:bg-sky-50 dark:hover:bg-sky-500/10 active:scale-[0.98] focus:outline-none"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 text-sky-600 shadow-inner dark:from-sky-900/40 dark:to-sky-800/20 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 ring-1 ring-white/50 dark:ring-white/5">
                <HugeiconsIcon
                  icon={LanguageSkillIcon}
                  className="h-5 w-5 transition-transform group-hover:scale-110"
                />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {t("settings.menu.language.title")}
                </h4>
                <p className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.menu.language.desc")}
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ChevronRightIcon}
              className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1"
            />
          </button>

          {/* Temperature Unit */}
          <div className="group relative flex w-full items-center justify-between overflow-hidden rounded-[16px] p-3 transition-all hover:bg-orange-50 dark:hover:bg-orange-500/10">
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 shadow-inner dark:from-orange-900/40 dark:to-orange-800/20 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 ring-1 ring-white/50 dark:ring-white/5">
                <HugeiconsIcon
                  icon={Sun01Icon}
                  className="h-5 w-5 transition-transform group-hover:scale-110"
                />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {t("settings.menu.temperature.title", "Nhiệt độ")}
                </h4>
                <p className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.menu.temperature.desc", "Đơn vị nhiệt độ ưu tiên")}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTemperatureUnit}
              className="flex h-8 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm relative z-10 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              °{temperatureUnit}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {(() => {
        const isNotificationActive =
          isNotificationSupported && notificationPermission === "granted" && notificationEnabled;
        return (
          <div className="group relative flex items-center justify-between w-full p-4 rounded-[24px] border border-slate-200/60 bg-white shadow-sm transition-all hover:border-emerald-300 hover:shadow-md dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-emerald-500/50 mb-2">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-emerald-500/10"></div>
            <div className="flex items-center gap-4 relative z-10 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 shadow-inner dark:from-emerald-900/40 dark:to-emerald-800/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 ring-1 ring-white/50 dark:ring-white/5">
                <HugeiconsIcon
                  icon={Notification01Icon}
                  className="h-5.5 w-5.5 transition-transform group-hover:scale-110"
                />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {t("settings.menu.notification.title")}
                </h4>
                <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.menu.notification.desc")}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isNotificationActive}
              disabled={!isNotificationSupported}
              onClick={async () => {
                if (!isNotificationSupported) return;

                if (notificationPermission !== "granted") {
                  const result = await requestNotificationPermission();
                  if (result === "granted") {
                    setNotificationEnabled(true);
                    showToast(t("toast.pushNotifEnabled"), "success");
                  } else if (result === "denied") {
                    showToast(t("toast.pushNotifDenied"), "error");
                  }
                } else {
                  const nextState = !notificationEnabled;
                  setNotificationEnabled(nextState);
                  if (nextState) {
                    showToast(t("toast.inAppNotifEnabled"), "success");
                  } else {
                    showToast(t("toast.inAppNotifDisabled"), "success");
                  }
                }
              }}
              className={`relative z-10 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isNotificationActive ? "bg-kat-primary" : "bg-slate-200 dark:bg-slate-700"
              } ${!isNotificationSupported ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isNotificationActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        );
      })()}

      {/* GPS Setting */}
      <div className="group relative flex items-center justify-between p-4 rounded-[24px] border border-slate-200/60 bg-white shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-indigo-500/50 mb-2">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-indigo-500/10"></div>
        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 shadow-inner dark:from-indigo-900/40 dark:to-indigo-800/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 ring-1 ring-white/50 dark:ring-white/5">
            <HugeiconsIcon
              icon={Location01Icon}
              className="h-5.5 w-5.5 transition-transform group-hover:scale-110"
            />
          </div>
          <div className="min-w-0 text-left">
            <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {t("settings.menu.location.title")}
            </h4>
            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {t("settings.menu.location.desc")}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={gpsEnabled}
          onClick={() => {
            const nextState = !gpsEnabled;
            setGpsEnabled(nextState);
            localStorage.setItem("kat_gps_enabled", String(nextState));
            showToast(
              nextState ? t("toast.gpsAutoEnabled") : t("toast.gpsAutoDisabled"),
              "success"
            );
          }}
          className={`relative z-10 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            gpsEnabled ? "bg-kat-primary" : "bg-slate-200 dark:bg-slate-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              gpsEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Exchange Rates */}
      <button
        onClick={() => setView("exchangeRates")}
        className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-cyan-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-cyan-500/50 focus:outline-none mb-2"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-cyan-500/10"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-50 text-cyan-600 shadow-inner dark:from-cyan-900/40 dark:to-cyan-800/20 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60 ring-1 ring-white/50 dark:ring-white/5">
            <HugeiconsIcon
              icon={Coins01Icon}
              className="h-5.5 w-5.5 transition-transform group-hover:scale-110"
            />
          </div>
          <div className="min-w-0 text-left">
            <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              {t("settings.menu.exchangeRates.title")}
            </h4>
            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {t("settings.menu.exchangeRates.desc")}
            </p>
          </div>
        </div>
        <HugeiconsIcon
          icon={ChevronRightIcon}
          className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1"
        />
      </button>

      {/* Thông tin & Hỗ trợ (Info Group) */}
      <div className="mb-2 rounded-[24px] border border-slate-200/60 bg-white p-2 shadow-sm dark:border-white/[0.04] dark:bg-slate-800/40">
        <div className="px-4 pt-3 pb-2">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t("settings.section.info", "Thông tin & Hỗ trợ")}
          </h3>
        </div>

        <div className="flex flex-col gap-1">
          {/* Privacy */}
          <button
            onClick={() => setView("privacy")}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-[16px] p-3 transition-all hover:bg-blue-50 dark:hover:bg-blue-500/10 active:scale-[0.98] focus:outline-none"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 shadow-inner dark:from-blue-900/40 dark:to-blue-800/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 ring-1 ring-white/50 dark:ring-white/5">
                <HugeiconsIcon
                  icon={LockIcon}
                  className="h-5 w-5 transition-transform group-hover:scale-110"
                />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t("settings.menu.privacy.title")}
                </h4>
                <p className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.menu.privacy.desc")}
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ChevronRightIcon}
              className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1"
            />
          </button>

          {/* About App */}
          <button
            onClick={() => setView("about")}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-[16px] p-3 transition-all hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/10 active:scale-[0.98] focus:outline-none"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 text-fuchsia-600 shadow-inner dark:from-fuchsia-900/40 dark:to-fuchsia-800/20 dark:text-fuchsia-400 border border-fuchsia-200 dark:border-fuchsia-800/60 ring-1 ring-white/50 dark:ring-white/5">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  className="h-5 w-5 transition-transform group-hover:scale-110"
                />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                  {t("settings.menu.about.title")}
                </h4>
                <p className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.menu.about.desc")}
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ChevronRightIcon}
              className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1"
            />
          </button>

          {/* Support Author */}
          <button
            onClick={() => setView("donate")}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-[16px] p-3 transition-all hover:bg-amber-50 dark:hover:bg-amber-500/10 active:scale-[0.98] focus:outline-none"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 shadow-inner dark:from-amber-900/40 dark:to-amber-800/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 ring-1 ring-white/50 dark:ring-white/5">
                <HugeiconsIcon
                  icon={Coffee01Icon}
                  className="h-5 w-5 transition-transform group-hover:scale-110"
                />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {t("settings.menu.donate.title")}
                </h4>
                <p className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.menu.donate.desc")}
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ChevronRightIcon}
              className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1"
            />
          </button>

          {/* Send Feedback */}
          <a
            href="mailto:trevorthanhtung@gmail.com?subject=Phản hồi ứng dụng KAT Journey"
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-[16px] p-3 transition-all hover:bg-sky-50 dark:hover:bg-sky-500/10 active:scale-[0.98] focus:outline-none"
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 text-sky-600 shadow-inner dark:from-sky-900/40 dark:to-sky-800/20 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 ring-1 ring-white/50 dark:ring-white/5">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  className="h-5 w-5 transition-transform group-hover:scale-110"
                />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {t("settings.menu.feedback.title")}
                </h4>
                <p className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.menu.feedback.desc")}
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={ChevronRightIcon}
              className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1"
            />
          </a>

          {/* Version */}
          <div className="group relative flex w-full items-center justify-between overflow-hidden rounded-[16px] p-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-500/10">
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 shadow-inner dark:from-slate-800/40 dark:to-slate-700/40 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 ring-1 ring-white/50 dark:ring-white/5">
                <HugeiconsIcon
                  icon={PackageIcon}
                  className="h-5 w-5 transition-transform group-hover:scale-110"
                />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                  {t("settings.menu.version.title")}
                </h4>
                <p className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("settings.menu.version.desc")}
                </p>
              </div>
            </div>
            <span className="relative z-10 text-[11px] font-black text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              {APP_VERSION}
            </span>
          </div>
        </div>
      </div>

      {/* ── Section: Quản lý dữ liệu ── */}
      <div className="pt-2 space-y-2.5">
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 pb-1">
          {t("settings.menu.dataManagement.title")}
        </p>

        <button
          type="button"
          disabled={isClearingTemp}
          onClick={async () => {
            setIsClearingTemp(true);
            setClearTempSuccess(false);
            try {
              await clearTemporaryFiles();
              setClearTempSuccess(true);
              setTimeout(() => setClearTempSuccess(false), 3000);
            } finally {
              setIsClearingTemp(false);
            }
          }}
          className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-rose-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-rose-500/50 disabled:opacity-70"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-rose-500/10"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600 shadow-inner dark:from-rose-900/40 dark:to-rose-800/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 ring-1 ring-white/50 dark:ring-white/5">
              {isClearingTemp ? (
                <HugeiconsIcon icon={Loading01Icon} className="h-5.5 w-5.5 animate-spin" />
              ) : (
                <HugeiconsIcon
                  icon={EraserIcon}
                  className="h-5.5 w-5.5 transition-transform group-hover:scale-110 group-hover:rotate-6"
                />
              )}
            </div>
            <div className="text-left">
              <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                {t("settings.menu.dataManagement.clearTemp.title")}
              </h4>
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {t("settings.menu.dataManagement.clearTemp.desc")}
              </p>
            </div>
          </div>
          {clearTempSuccess ? (
            <span className="relative z-10 flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-sm">
              {t("common.done")}
            </span>
          ) : (
            <HugeiconsIcon
              icon={ChevronRightIcon}
              className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1"
            />
          )}
        </button>

        <div className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-lime-300 hover:shadow-md active:scale-[0.98] dark:border-white/[0.04] dark:bg-slate-800/40 dark:hover:border-lime-500/50">
          <div className="absolute inset-0 bg-gradient-to-br from-lime-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-lime-500/10"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-100 to-lime-50 text-lime-600 shadow-inner dark:from-lime-900/40 dark:to-lime-800/20 dark:text-lime-400 border border-lime-200 dark:border-lime-800/60 ring-1 ring-white/50 dark:ring-white/5">
              {importing ? (
                <HugeiconsIcon icon={Loading01Icon} className="h-5.5 w-5.5 animate-spin" />
              ) : (
                <HugeiconsIcon
                  icon={PackageReceiveIcon}
                  className="h-5.5 w-5.5 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5"
                />
              )}
            </div>
            <div className="text-left">
              <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                {importing ? "..." : t("settings.menu.dataManagement.restoreData.title")}
              </h4>
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {t("settings.menu.dataManagement.restoreData.desc")}
              </p>
            </div>
          </div>
          <HugeiconsIcon
            icon={ChevronRightIcon}
            className="relative z-10 h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1"
          />
          <input
            ref={fileInputRef}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
            type="file"
            accept=".katjourney,application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) previewImportFile(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      {/* ── Section: Vùng nguy hiểm ── */}
      <div className="pt-1 pb-2">
        <p className="text-[11px] font-bold text-red-400 dark:text-rose-500 uppercase tracking-widest px-2 pb-1">
          {t("settings.menu.dangerZone.title")}
        </p>
        {user && !user.isAnonymous ? (
          <button
            type="button"
            onClick={() => setIsDeleteAccountOpen(true)}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-red-200/60 bg-white p-4 shadow-sm transition-all hover:border-red-400 hover:shadow-md active:scale-[0.98] dark:border-rose-900/35 dark:bg-slate-800/40 dark:hover:border-rose-500/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-rose-500/10"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-red-50 text-red-600 shadow-inner dark:from-rose-950/40 dark:to-rose-900/20 dark:text-rose-400 border border-red-200 dark:border-rose-800/60 ring-1 ring-white/50 dark:ring-white/5">
                <HugeiconsIcon
                  icon={UserRemove01Icon}
                  className="h-5.5 w-5.5 transition-transform group-hover:scale-110 group-hover:rotate-6"
                />
              </div>
              <div className="text-left">
                <h4 className="text-[15px] font-bold text-red-700 dark:text-rose-400 group-hover:text-red-600 transition-colors">
                  {t("settings.menu.dangerZone.deleteAccount.title")}
                </h4>
                <p className="text-[12px] font-medium text-red-400 dark:text-rose-500 mt-0.5">
                  {t("settings.menu.dangerZone.deleteAccount.desc")}
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={Delete01Icon}
              className="relative z-10 h-5.5 w-5.5 text-red-500/80 transition-transform group-hover:scale-110 dark:text-rose-500/80"
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsFactoryResetOpen(true)}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-[24px] border border-red-200/60 bg-white p-4 shadow-sm transition-all hover:border-red-400 hover:shadow-md active:scale-[0.98] dark:border-rose-900/35 dark:bg-slate-800/40 dark:hover:border-rose-500/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-rose-500/10"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-red-50 text-red-600 shadow-inner dark:from-rose-950/40 dark:to-rose-900/20 dark:text-rose-400 border border-red-200 dark:border-rose-800/60 ring-1 ring-white/50 dark:ring-white/5">
                <HugeiconsIcon
                  icon={RotateLeft01Icon}
                  className="h-5.5 w-5.5 transition-transform group-hover:scale-110 group-hover:-rotate-12"
                />
              </div>
              <div className="text-left">
                <h4 className="text-[15px] font-bold text-red-700 dark:text-rose-400 group-hover:text-red-600 transition-colors">
                  {t("settings.menu.dangerZone.factoryReset.title")}
                </h4>
                <p className="text-[12px] font-medium text-red-400 dark:text-rose-500 mt-0.5">
                  {t("settings.menu.dangerZone.factoryReset.desc")}
                </p>
              </div>
            </div>
            <HugeiconsIcon
              icon={Delete01Icon}
              className="relative z-10 h-5.5 w-5.5 text-red-500/80 transition-transform group-hover:scale-110 dark:text-rose-500/80"
            />
          </button>
        )}
      </div>
    </div>
  );
}
