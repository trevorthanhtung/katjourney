import { useState, useEffect } from "react";
import { getIdentity, saveIdentity, UserIdentity } from "../../../utils/identityCache";

export function useSharedTripIdentity(data: any) {
  const [identityChecked, setIdentityChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserIdentity | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [step, setStep] = useState<"pin" | "identity">("pin");
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  useEffect(() => {
    if (data && data.trip) {
      const saved = getIdentity(data.trip.id);
      const pendingSwap = localStorage.getItem("kat_pending_swap_" + data.trip.id) === "true";

      if (!saved || pendingSwap) {
        setShowIdentityModal(true);
        setStep("identity");
      } else {
        const member = data.members?.find((m: any) => m.name === saved.name);
        if (member) {
          saved.role = member.role;
          saveIdentity(saved, data.trip.id);
        }
        setCurrentUser(saved);
        setIdentityChecked(true);
        setIsBannerVisible(true);
      }
    }
  }, [data]);

  const switchUser = (tripId: string | number) => {
    localStorage.setItem("kat_pending_swap_" + tripId, "true");
    setStep("identity");
    setShowIdentityModal(true);
  };

  return {
    identityChecked,
    setIdentityChecked,
    currentUser,
    setCurrentUser,
    showIdentityModal,
    setShowIdentityModal,
    step,
    setStep,
    isBannerVisible,
    setIsBannerVisible,
    switchUser,
  };
}
