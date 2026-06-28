import { useState, useEffect, useCallback } from "react";

export function useDistanceUnit() {
  const [unit, setUnit] = useState<"km" | "mi">(() => {
    return (localStorage.getItem("kat_distance_unit") as "km" | "mi") || "km";
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "kat_distance_unit") {
        setUnit((e.newValue as "km" | "mi") || "km");
      }
    };

    const handleCustomChange = () => {
      setUnit((localStorage.getItem("kat_distance_unit") as "km" | "mi") || "km");
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("kat_settings_changed", handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("kat_settings_changed", handleCustomChange);
    };
  }, []);

  /** Convert km to mi if needed, returns rounded number */
  const formatDistance = useCallback(
    (km: number) => {
      if (unit === "mi") {
        return Math.round(km * 0.621371);
      }
      return Math.round(km);
    },
    [unit]
  );

  /** Convert km/h to mph if needed, returns rounded number */
  const formatSpeed = useCallback(
    (kmh: number) => {
      if (unit === "mi") {
        return Math.round(kmh * 0.621371);
      }
      return Math.round(kmh);
    },
    [unit]
  );

  /** Returns the appropriate speed label: "km/h" or "mph" */
  const speedLabel = unit === "mi" ? "mph" : "km/h";

  /** Returns the appropriate distance label: "km" or "mi" */
  const distanceLabel = unit;

  return { unit, formatDistance, formatSpeed, speedLabel, distanceLabel };
}
