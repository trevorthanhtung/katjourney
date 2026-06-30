import React from "react";
import { useTranslation } from "react-i18next";
import { TypedDeleteConfirmModal } from "../ui";

type ConfirmDeleteTripDialogProps = {
  open: boolean;
  tripName?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export function ConfirmDeleteTripDialog({
  open,
  tripName,
  onClose,
  onConfirm,
}: ConfirmDeleteTripDialogProps) {
  const { t } = useTranslation();
  return (
    <TypedDeleteConfirmModal
      isOpen={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t("more.deleteModalTitle")}
      description={t("more.deleteModalDesc")}
      warning={<span className="font-bold">{t("more.deleteModalWarning")}</span>}
      confirmLabel={t("more.deleteModalConfirm")}
      confirmationText={t("more.deleteModalMatch")}
      inputPlaceholder={t("more.deleteModalInput")}
      itemName={tripName}
    />
  );
}
