import { useState, useEffect, useCallback } from "react";

export function useTemperatureUnit() {
  const [unit, setUnit] = useState<"C" | "F">(() => {
    return (localStorage.getItem("kat_temperature_unit") as "C" | "F") || "C";
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "kat_temperature_unit") {
        setUnit((e.newValue as "C" | "F") || "C");
      }
    };

    const handleCustomChange = () => {
      setUnit((localStorage.getItem("kat_temperature_unit") as "C" | "F") || "C");
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("kat_settings_changed", handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("kat_settings_changed", handleCustomChange);
    };
  }, []);

  const formatTemp = useCallback(
    (celsius: number) => {
      if (unit === "F") {
        return Math.round((celsius * 9) / 5 + 32);
      }
      return Math.round(celsius);
    },
    [unit]
  );

  return { unit, formatTemp };
}
