import { useState, useCallback } from "react";

export function useSharedTripAuth() {
  const [enteredPin, setEnteredPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const handlePinInput = useCallback(
    (val: string, index: number) => {
      const arr = pinInput.split("").slice(0, 4);
      arr[index] = val;
      const newPin = arr.join("").slice(0, 4);
      setPinInput(newPin);
      setPinError(false);

      if (val && index < 3) {
        const next = document.getElementById(`share-pin-digit-${index + 1}`);
        next?.focus();
      }
      if (newPin.length === 4) {
        setEnteredPin(newPin);
      }
    },
    [pinInput]
  );

  const handlePinBackspace = useCallback(
    (key: string, index: number) => {
      if (key === "Backspace" && !pinInput[index] && index > 0) {
        const prev = document.getElementById(`share-pin-digit-${index - 1}`);
        prev?.focus();
      }
    },
    [pinInput]
  );

  const confirmPin = useCallback(() => {
    if (pinInput.length === 4) {
      setEnteredPin(pinInput);
    }
  }, [pinInput]);

  return {
    enteredPin,
    setEnteredPin,
    pinInput,
    pinError,
    setPinError,
    handlePinInput,
    handlePinBackspace,
    confirmPin,
  };
}
