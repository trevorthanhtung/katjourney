import { BottomSheet } from "../../../components/ui/BottomSheet";
import { Input } from "../../../components/ui/Input";
import { getRandomAvatarId } from "../../../utils/avatars";
import { RolesHelpSheet } from "../../../components/modals/RolesHelpSheet";
import { Member, db } from "../../../db";
import { classNames } from "../../../utils/helpers";
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

export function MemberForm({
  tripId,
  editing,
  isOpen,
  onClose,
  onShowToast,
}: {
  tripId: number;
  editing: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}) {
  const { t } = useTranslation();
  const PRESETS = [
    t("members.roleLeader"),
    t("members.roleBudget"),
    t("members.roleDriver"),
    t("members.roleNavigator"),
    t("members.roleCompanion"),
  ];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPresets, setSelectedPresets] = useState<string[]>(["Người đồng hành"]);
  const [isRolesHelpOpen, setIsRolesHelpOpen] = useState(false);

  const togglePreset = (preset: string) => {
    setDirty(true);
    const companionLabel = t("members.roleCompanion");
    const leaderLabel = t("members.roleLeader");

    if (
      preset === companionLabel ||
      preset === leaderLabel ||
      preset === "Người đồng hành" ||
      preset === "Trưởng nhóm"
    ) {
      setSelectedPresets([preset]);
    } else {
      let next = selectedPresets.filter(
        (p) =>
          p !== companionLabel &&
          p !== leaderLabel &&
          p !== "Người đồng hành" &&
          p !== "Trưởng nhóm"
      );
      if (next.includes(preset)) {
        next = next.filter((p) => p !== preset);
      } else {
        next.push(preset);
      }
      if (next.length === 0) {
        next = [companionLabel];
      }
      setSelectedPresets(next);
    }
  };

  const [note, setNote] = useState("");
  const [gender, setGender] = useState<string>("male");
  const [group, setGroup] = useState("");
  const [isGroupLeader, setIsGroupLeader] = useState(false);

  const [dirty, setDirty] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const liveMembers = useLiveQuery(() => db.members.where({ tripId }).toArray(), [tripId]) || [];
  const existingGroups = Array.from(
    new Set(liveMembers.map((m) => m.group).filter(Boolean))
  ) as string[];

  useEffect(() => {
    if (isOpen) {
      if (editing) {
        setName(editing.name ?? "");
        setPhone(editing.phone ?? "");
        setNote(editing.note ?? "");
        setGender(editing.gender ?? "male");
        setGroup(editing.group ?? "");
        setIsGroupLeader(editing.isGroupLeader ?? false);

        const currentRole = editing.role ?? "Người đồng hành";
        const loadedPresets = currentRole
          .split(",")
          .map((r) => r.trim())
          .filter((r) => PRESETS.includes(r));
        if (loadedPresets.length > 0) {
          setSelectedPresets(loadedPresets);
        } else {
          setSelectedPresets(["Người đồng hành"]);
        }
      } else {
        setName("");
        setPhone("");
        setSelectedPresets(["Người đồng hành"]);
        setNote("");
        setGender("male");
        setGroup("");
        setIsGroupLeader(false);
      }
      setDirty(false);
      setSubmitAttempted(false);
    }
  }, [editing, isOpen]);

  const nameError = !name.trim() ? "Vui lòng nhập tên thành viên." : "";

  const phoneClean = phone.trim();
  const isPhoneInvalid = phoneClean !== "" && !/^(0[3|5|7|8|9])[0-9]{8}$/.test(phoneClean);
  const phoneError = isPhoneInvalid ? t("members.phoneError") : "";

  const hasError = !!nameError || !!phoneError;

  async function save() {
    setSubmitAttempted(true);
    if (hasError) return;

    const finalRole = selectedPresets.join(", ");

    // Generate avatar if not already present or if gender changed
    let finalAvatar = editing?.avatar;
    const existingMembers = await db.members.where({ tripId }).toArray();

    if (!editing?.id) {
      const existingAvatars = existingMembers.map((m) => m.avatar).filter(Boolean) as string[];
      finalAvatar = getRandomAvatarId(gender, existingAvatars);
    } else if (editing && editing.gender !== gender) {
      const existingAvatars = existingMembers
        .filter((m) => m.id !== editing.id)
        .map((m) => m.avatar)
        .filter(Boolean) as string[];
      finalAvatar = getRandomAvatarId(gender, existingAvatars);
    }

    const payload = {
      tripId,
      name: name.trim(),
      phone: phone.trim(),
      role: finalRole,
      note: note.trim(),
      gender,
      avatar: finalAvatar,
      group: group.trim() || undefined,
      isGroupLeader: group.trim() ? isGroupLeader : undefined,
      updatedAt: new Date().toISOString(),
    };

    if (editing?.id) {
      await db.members.update(editing.id, payload);
    } else {
      await db.members.add({
        ...payload,
        createdAt: new Date().toISOString(),
      });
    }

    // Automatically unset other group leaders if this member is now the leader
    if (payload.group && payload.isGroupLeader) {
      const otherLeaders = existingMembers.filter(
        (m) => m.group === payload.group && m.isGroupLeader && m.id !== editing?.id
      );
      for (const leader of otherLeaders) {
        if (leader.id) {
          await db.members.update(leader.id, { isGroupLeader: false });
        }
      }
    }

    onShowToast?.(editing?.id ? "Đã cập nhật thành viên" : "Đã thêm thành viên");
    onClose();
  }

  const getPresetIcon = (preset: string) => {
    switch (preset) {
      case "Người đồng hành":
        return <HugeiconsIcon icon={UserGroupIcon} className="h-3.5 w-3.5" />;
      case "Trưởng nhóm":
        return <HugeiconsIcon icon={CrownIcon} className="h-3.5 w-3.5 text-amber-500" />;
      case "Quản lý chi phí":
        return <HugeiconsIcon icon={WalletCardsIcon} className="h-3.5 w-3.5 text-emerald-500" />;
      case "Tài xế":
        return <HugeiconsIcon icon={Car01Icon} className="h-3.5 w-3.5 text-blue-500" />;
      case "Dẫn đường":
        return <HugeiconsIcon icon={CompassIcon} className="h-3.5 w-3.5 text-sky-500" />;
      case "Phụ trách hành lý":
        return <HugeiconsIcon icon={Luggage01Icon} className="h-3.5 w-3.5 text-indigo-500" />;
      default:
        return null;
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? t("members.formEditTitle") : t("members.formAddTitle")}
      footer={
        <div className="flex items-center gap-2.5 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex h-[52px] shrink-0 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 px-6 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.96] transition-all border border-transparent dark:border-slate-700 motion-press"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={hasError}
            onClick={save}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950 px-6 font-black shadow-xs hover:bg-kat-dark/95 dark:hover:bg-kat-primary-light active:scale-[0.98] transition-all border border-transparent disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/40 dark:disabled:text-slate-600 dark:disabled:border-transparent disabled:cursor-not-allowed motion-press"
          >
            {editing ? (
              <HugeiconsIcon icon={CheckIcon} className="h-5 w-5" />
            ) : (
              <HugeiconsIcon icon={UserAdd01Icon} className="h-5 w-5" />
            )}
            {editing ? t("members.btnSave") : t("members.btnAdd")}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <Input
            label={
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={UserIcon} className="h-4 w-4 text-slate-500" />
                {t("members.nameLabel")}
              </span>
            }
            value={name}
            onChange={(val: any) => {
              setName(val);
              setDirty(true);
            }}
            placeholder={t("members.namePlaceholder")}
          />
          {(dirty || submitAttempted) && nameError && (
            <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{nameError}</p>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <HugeiconsIcon icon={UserIcon} className="h-4 w-4 text-slate-500" />
            {t("members.genderLabel")}
          </span>
          <div className="flex gap-2">
            {[
              { value: "male", label: t("members.genderMale") },
              { value: "female", label: t("members.genderFemale") },
              { value: "other", label: t("members.genderOther") },
            ].map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => {
                  setGender(g.value);
                  setDirty(true);
                }}
                className={classNames(
                  "flex-1 rounded-2xl py-3 text-[14px] font-black transition-all duration-200 active:scale-95 border text-center justify-center flex items-center",
                  gender === g.value
                    ? "bg-kat-primary-soft dark:bg-kat-primary-soft/30 border-[#00BFB7] dark:border-kat-primary/50 text-kat-teal dark:text-kat-primary-usable shadow-xs"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Input
            label={
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={UserGroupIcon} className="h-4 w-4 text-slate-500" />
                {t("members.groupLabel")}
              </span>
            }
            value={group}
            onChange={(val: any) => {
              setGroup(val);
              setDirty(true);
            }}
            placeholder={t("members.groupPlaceholder")}
          />
          {existingGroups.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {existingGroups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGroup(g);
                    setDirty(true);
                  }}
                  className={classNames(
                    "px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors border",
                    group === g
                      ? "bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
          {(() => {
            const currentGroupMembers = liveMembers.filter((m) => m.group === group.trim());
            const existingLeader = currentGroupMembers.find(
              (m) => m.isGroupLeader && m.id !== editing?.id
            );
            return (
              group.trim() !== "" && (
                <div className="mt-3 flex items-center justify-between px-1">
                  <div className="flex flex-col">
                    <span className="text-[13.5px] font-bold text-slate-600 dark:text-slate-400">
                      {t("members.isGroupLeader")}
                    </span>
                    {existingLeader && (
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        {isGroupLeader
                          ? t("members.willReplace", { name: existingLeader.name })
                          : t("members.currentLeaderIs", { name: existingLeader.name })}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGroupLeader(!isGroupLeader);
                      setDirty(true);
                    }}
                    className={classNames(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                      isGroupLeader ? "bg-kat-teal" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  >
                    <span
                      className={classNames(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                        isGroupLeader ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              )
            );
          })()}
        </div>

        <div>
          <Input
            label={
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={CallIcon} className="h-4 w-4 text-slate-500" />
                {t("members.phone")}
              </span>
            }
            type="tel"
            value={phone}
            onChange={(val: any) => {
              setPhone(val);
              setDirty(true);
            }}
            placeholder={t("members.phonePlaceholder")}
          />
          {(dirty || submitAttempted) && phoneError ? (
            <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{phoneError}</p>
          ) : (
            <p className="mt-1.5 px-1 text-[11.5px] font-bold text-kat-muted">
              {t("members.phoneHelp")}
            </p>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} className="h-4 w-4 text-slate-500" />
              {t("roles.roleLabel")}
            </span>
            <button
              type="button"
              onClick={() => setIsRolesHelpOpen(true)}
              className="text-slate-400 hover:text-kat-teal transition-colors flex items-center gap-1 text-xs font-bold"
              title="Thông tin các vai trò"
            >
              <HugeiconsIcon icon={InformationCircleIcon} className="h-3.5 w-3.5" />
              <span>{t("members.viewRoles")}</span>
            </button>
          </span>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => togglePreset(preset)}
                className={classNames(
                  "rounded-full px-4 py-2 text-[13.5px] font-extrabold transition-all duration-200 active:scale-95 border flex items-center gap-1.5",
                  selectedPresets.includes(preset)
                    ? "bg-kat-primary-soft dark:bg-kat-primary-soft/30 border-[#00BFB7] dark:border-kat-primary/50 text-kat-teal dark:text-kat-primary-usable"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                {getPresetIcon(preset)}
                <span>{preset}</span>
              </button>
            ))}
          </div>

          <p className="mt-1.5 px-1 text-[11.5px] font-bold text-kat-muted">
            {t("members.roleHelpDesc")}
          </p>
        </div>

        <div className="pt-1">
          <label className="block">
            <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
              <HugeiconsIcon icon={Note01Icon} className="h-4 w-4 text-slate-500" />
              {t("members.noteLabelShort")}
            </span>
            <textarea
              className="mt-1.5 min-h-[90px] w-full rounded-2xl border-0 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-[15px] font-medium outline-hidden ring-1 ring-inset ring-slate-200/60 dark:ring-slate-700/50 transition-shadow focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-kat-teal placeholder-slate-400 dark:placeholder-slate-500"
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setDirty(true);
              }}
              placeholder={t("members.notePlaceholderDetailed")}
            />
          </label>
        </div>
      </div>
      <RolesHelpSheet isOpen={isRolesHelpOpen} onClose={() => setIsRolesHelpOpen(false)} />
    </BottomSheet>
  );
}
