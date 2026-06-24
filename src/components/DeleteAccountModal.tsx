import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { executeDeleteAccount } from "../utils/dataActions";
import { TypedDeleteConfirmModal } from "./ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { t } = useTranslation();

  const handleDelete = async () => {
    setErrorMsg(null);
    try {
      await executeDeleteAccount();
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      if (err.message === "requires-recent-login") {
        setErrorMsg(t('settings.dialogs.deleteAccount.errorAuth'));
      } else {
        setErrorMsg(t('settings.dialogs.deleteAccount.errorGeneric'));
      }
      throw err;
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
    }
  }, [isOpen]);

  return (
    <TypedDeleteConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title={t('settings.dialogs.deleteAccount.title')}
      warning={
        <span className="font-bold text-red-600">
          {t('settings.dialogs.deleteAccount.warning')}
        </span>
      }
      description={
        <div className="space-y-4">
          <p className="text-[14px] text-slate-700">
            {t('settings.dialogs.deleteAccount.desc')}
          </p>
          <div className="bg-slate-100 p-3.5 rounded-xl text-left">
            <p className="font-bold text-slate-700 text-[13px] mb-1">{t('settings.dialogs.deleteAccount.deletedData')}</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-650 text-[12.5px]">
              <li>{t('settings.dialogs.deleteAccount.li1')}</li>
              <li>{t('settings.dialogs.deleteAccount.li2')}</li>
              <li>{t('settings.dialogs.deleteAccount.li3')}</li>
              <li>{t('settings.dialogs.deleteAccount.li4')}</li>
            </ul>
          </div>
          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-[13px] text-rose-800 font-bold leading-relaxed flex items-start gap-2 text-left animate-fadeIn">
              <HugeiconsIcon icon={AlertCircleIcon} className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      }
      confirmLabel={t('settings.dialogs.deleteAccount.confirmBtn')}
      confirmationText={t('settings.dialogs.deleteAccount.confirmText')}
      inputPlaceholder={t('settings.dialogs.deleteAccount.inputPlaceholder')}
      itemName={t('settings.dialogs.deleteAccount.itemName')}
    />
  );
}
