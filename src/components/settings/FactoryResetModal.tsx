import React from "react";
import { useTranslation } from "react-i18next";
import { executeFactoryReset } from "../../utils/dataActions";
import { TypedDeleteConfirmModal } from "../ui";

interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FactoryResetModal({ isOpen, onClose }: FactoryResetModalProps) {
  const { t } = useTranslation();

  const handleReset = async () => {
    try {
      await executeFactoryReset();
    } catch (err) {
      console.error("Factory reset failed:", err);
    }
  };

  return (
    <TypedDeleteConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleReset}
      title={t("settings.dialogs.factoryReset.title")}
      warning={
        <span className="font-bold text-red-600">{t("settings.dialogs.factoryReset.warning")}</span>
      }
      description={
        <div className="space-y-3">
          <p>{t("settings.dialogs.factoryReset.desc")}</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-650 text-[13px]">
            <li>{t("settings.dialogs.factoryReset.li1")}</li>
            <li>{t("settings.dialogs.factoryReset.li2")}</li>
            <li>{t("settings.dialogs.factoryReset.li3")}</li>
            <li>{t("settings.dialogs.factoryReset.li4")}</li>
          </ul>
        </div>
      }
      confirmLabel={t("settings.dialogs.factoryReset.confirmBtn")}
      confirmationText={t("settings.dialogs.factoryReset.confirmText")}
      inputPlaceholder={t("settings.dialogs.factoryReset.inputPlaceholder")}
      itemName={t("settings.dialogs.factoryReset.itemName")}
    />
  );
}
