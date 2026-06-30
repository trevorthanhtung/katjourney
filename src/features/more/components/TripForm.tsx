import { getCurrencyForCountry } from "../../../services/locationService";
import { FormActions } from "../../../components/ui/FormActions";
import { Input } from "../../../components/ui/Input";
import { LocationInput } from "../../../components/ui/LocationInput";
import { normalizeVietnameseDisplayText, today } from "../../../utils/helpers";
import { Select } from "../../../components/ui/Select";
import { CalendarRangePicker } from "../../../components/ui/CalendarRangePicker";
import { Trip, TripDestination } from "../../../db";

import { BottomSheet } from "../../../components/ui/BottomSheet";
import { db } from "../../../db";
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

export function TripForm({
  trip,
  isOpen,
  onClose,
  onSaved,
}: {
  trip?: Trip;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (id: number) => void;
}) {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState<{
    title: string;
    destinations: TripDestination[];
    defaultCurrency?: string;
    tripType: "dayTrip" | "multiDay";
    startDate: string;
    endDate: string;
  }>({
    title: trip?.title ?? "",
    destinations: trip?.destinations?.length
      ? trip.destinations
      : trip?.location
        ? [
            {
              name: trip.location,
              latitude: trip.latitude,
              longitude: trip.longitude,
              countryCode: trip.countryCode,
            },
          ]
        : [{ name: "" }],
    defaultCurrency: trip?.defaultCurrency,
    tripType: trip?.tripType ?? (trip?.startDate === trip?.endDate ? "dayTrip" : "multiDay"),
    startDate: trip?.startDate ?? today,
    endDate: trip?.endDate ?? today,
  });

  const [dirty, setDirty] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        title: trip?.title ?? "",
        destinations: trip?.destinations?.length
          ? trip.destinations
          : trip?.location
            ? [
                {
                  name: trip.location,
                  latitude: trip.latitude,
                  longitude: trip.longitude,
                  countryCode: trip.countryCode,
                },
              ]
            : [{ name: "" }],
        defaultCurrency: trip?.defaultCurrency,
        tripType: trip?.tripType ?? (trip?.startDate === trip?.endDate ? "dayTrip" : "multiDay"),
        startDate: trip?.startDate ?? today,
        endDate: trip?.endDate ?? today,
      });
      setDirty(false);
      setSubmitAttempted(false);
    }
  }, [trip, isOpen]);

  const titleError = !form.title.trim() ? t("tripForm.nameError") : "";
  const startDateError = !form.startDate ? t("tripForm.startDateError") : "";
  const endDateError =
    form.tripType === "multiDay" && !form.endDate ? t("tripForm.endDateError") : "";
  const dateCompareError =
    form.tripType === "multiDay" && form.endDate && form.startDate && form.endDate < form.startDate
      ? t("tripForm.dateCompareError")
      : "";
  const hasError = !!titleError || !!startDateError || !!endDateError || !!dateCompareError;

  async function save() {
    setSubmitAttempted(true);
    if (hasError) return;

    const payload = {
      ...form,
      location: form.destinations[0]?.name || "",
      latitude: form.destinations[0]?.latitude,
      longitude: form.destinations[0]?.longitude,
      countryCode: form.destinations[0]?.countryCode,
      endDate: form.tripType === "dayTrip" ? form.startDate : form.endDate,
      createdAt: trip?.createdAt ?? new Date().toISOString(),
    };
    if (trip?.id) {
      await db.trips.update(trip.id, payload);
      onSaved(trip.id);
      onClose();
    } else {
      const id = await db.trips.add(payload);
      onSaved(id);
      onClose();
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={trip ? t("tripForm.editTitle") : t("tripForm.createTitle")}
      subtitle={trip ? undefined : t("tripForm.createSubtitle")}
      footer={
        <FormActions
          onSave={save}
          saveLabel={trip ? t("tripForm.saveBtn") : t("tripForm.createBtn")}
          saveAriaLabel={trip ? t("tripForm.saveAria") : t("tripForm.createAria")}
          disabled={hasError}
          onCancel={onClose}
        />
      }
    >
      <div className="space-y-4 md:space-y-5">
        <div>
          <Input
            label={
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                <HugeiconsIcon
                  icon={PencilEdit01Icon}
                  size={16}
                  className="text-slate-700 dark:text-slate-300"
                />
                {t("tripForm.nameLabel")}
              </span>
            }
            value={form.title}
            onChange={(title: string) => {
              setForm({ ...form, title });
              setDirty(true);
            }}
            placeholder={t("tripForm.namePlaceholder")}
          />
          {(dirty || submitAttempted) && titleError && (
            <p className="mt-1.5 px-1 text-[13px] font-medium text-rose-500">{titleError}</p>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <HugeiconsIcon
                icon={Location01Icon}
                size={16}
                className="text-slate-700 dark:text-slate-300"
              />
              {t("tripForm.locationLabel")}
            </span>
          </div>
          <div className="space-y-3">
            {form.destinations.map((dest, idx) => (
              <div key={idx} className="relative">
                <LocationInput
                  value={dest.name}
                  onChange={(name: string) => {
                    const newDests = [...form.destinations];
                    newDests[idx] = {
                      ...newDests[idx],
                      name,
                      latitude: undefined,
                      longitude: undefined,
                      countryCode: undefined,
                    };
                    setForm((f) => ({ ...f, destinations: newDests }));
                  }}
                  onSelectResult={(result: any) => {
                    const display = normalizeVietnameseDisplayText(
                      [result.name, result.admin1, result.country].filter(Boolean).join(", ")
                    );
                    const newDests = [...form.destinations];
                    newDests[idx] = {
                      ...newDests[idx],
                      name: display,
                      latitude: result.latitude,
                      longitude: result.longitude,
                      countryCode: result.country_code,
                    };

                    const updates: any = { destinations: newDests };
                    // If first destination, update currency
                    if (idx === 0 && result.country_code) {
                      updates.defaultCurrency =
                        getCurrencyForCountry(result.country_code) || form.defaultCurrency;
                    }
                    setForm((f) => ({ ...f, ...updates }));
                  }}
                />
                {form.destinations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newDests = [...form.destinations];
                      newDests.splice(idx, 1);
                      setForm((f) => ({ ...f, destinations: newDests }));
                    }}
                    className="absolute right-[12px] top-[13px] text-slate-400 hover:text-rose-500 transition-colors bg-white dark:bg-slate-800"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={18} />
                  </button>
                )}
                {dest.latitude && dest.longitude ? (
                  <p className="mt-2 px-1 text-[11.5px] font-bold text-emerald-600 flex items-center gap-1 animate-fadeIn">
                    <HugeiconsIcon icon={CheckIcon} size={14} /> {t("tripForm.locationSuccess")}
                  </p>
                ) : (
                  <p className="mt-2 px-1 text-[11.5px] font-semibold text-slate-400 leading-relaxed">
                    {idx === 0
                      ? t("tripForm.locationHelper")
                      : t(
                          "tripForm.additionalLocationHelper",
                          "Choose destinations to get weather forecasts."
                        )}
                  </p>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setForm((f) => ({ ...f, destinations: [...f.destinations, { name: "" }] }));
              }}
              className="group relative flex items-center justify-center w-full py-3 mt-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/60 dark:border-white/5 text-[14px] font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-kat-primary dark:hover:text-kat-teal hover:border-kat-primary/30 dark:hover:border-kat-teal/30 hover:shadow-sm active:scale-[0.98] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
              <div className="relative z-10 flex items-center gap-1.5 drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
                <span className="text-[18px] leading-none mb-[2px] transition-transform duration-300 group-hover:rotate-90">
                  +
                </span>
                {t("tripForm.addDestination", "Add destination")}
              </div>
            </button>
          </div>
        </div>

        {/* === CURRENCY SECTION === */}
        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <HugeiconsIcon
              icon={Coins01Icon}
              size={16}
              className="text-slate-700 dark:text-slate-300"
            />
            {t("tripForm.currencyLabel")}
          </span>
          <Select
            value={form.defaultCurrency || "VND"}
            onChange={(val: any) => setForm((f) => ({ ...f, defaultCurrency: val }))}
            options={CURRENCY_OPTIONS}
            labels={useMemo(() => {
              const labels: Record<string, string> = {};
              CURRENCY_OPTIONS.forEach((code) => {
                labels[code] =
                  `${getCurrencyLabel(code, i18n.language)} ${code === (trip?.defaultCurrency || "VND") ? t("expenses.baseCurrency") : ""}`.trim();
              });
              return labels;
            }, [i18n.language, trip?.defaultCurrency, t])}
          />
        </div>

        {/* === DATE SECTION replaced with CalendarRangePicker === */}
        <div>
          <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <HugeiconsIcon
              icon={Calendar01Icon}
              size={16}
              className="text-slate-700 dark:text-slate-300"
            />
            {t("tripForm.timeLabel")}
          </span>
          <CalendarRangePicker
            startDate={form.startDate}
            endDate={form.endDate}
            tripType={form.tripType}
            onChangeTripType={(tripType) => setForm((f) => ({ ...f, tripType }))}
            onChangeStart={(startDate) => setForm((f) => ({ ...f, startDate }))}
            onChangeEnd={(endDate) => setForm((f) => ({ ...f, endDate }))}
          />
          {(dirty || submitAttempted) && startDateError && (
            <p className="mt-1.5 px-1 text-[13px] font-medium text-rose-500">{startDateError}</p>
          )}
          {(dirty || submitAttempted) && (endDateError || dateCompareError) && (
            <p className="mt-1.5 px-1 text-[13px] font-medium text-rose-500">
              {endDateError || dateCompareError}
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
