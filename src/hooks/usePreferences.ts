import { useState, useEffect, useCallback } from "react";

export function usePreferences() {
  const [distanceUnit, setDistanceUnit] = useState<"km" | "mi">(() => {
    return (
      (typeof localStorage !== "undefined"
        ? (localStorage.getItem("kat_distance_unit") as "km" | "mi")
        : "km") || "km"
    );
  });

  const [temperatureUnit, setTemperatureUnit] = useState<"C" | "F">(() => {
    return (
      (typeof localStorage !== "undefined"
        ? (localStorage.getItem("kat_temperature_unit") as "C" | "F")
        : "C") || "C"
    );
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "kat_distance_unit") {
        setDistanceUnit((e.newValue as "km" | "mi") || "km");
      }
      if (e.key === "kat_temperature_unit") {
        setTemperatureUnit((e.newValue as "C" | "F") || "C");
      }
    };

    const handleCustomChange = () => {
      if (typeof localStorage !== "undefined") {
        setDistanceUnit((localStorage.getItem("kat_distance_unit") as "km" | "mi") || "km");
        setTemperatureUnit((localStorage.getItem("kat_temperature_unit") as "C" | "F") || "C");
      }
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
      if (distanceUnit === "mi") {
        return Math.round(km * 0.621371);
      }
      return Math.round(km);
    },
    [distanceUnit]
  );

  /** Convert km/h to mph if needed, returns rounded number */
  const formatSpeed = useCallback(
    (kmh: number) => {
      if (distanceUnit === "mi") {
        return Math.round(kmh * 0.621371);
      }
      return Math.round(kmh);
    },
    [distanceUnit]
  );

  /** Convert Celsius to Fahrenheit if needed, returns rounded number */
  const formatTemp = useCallback(
    (celsius: number) => {
      if (temperatureUnit === "F") {
        return Math.round((celsius * 9) / 5 + 32);
      }
      return Math.round(celsius);
    },
    [temperatureUnit]
  );

  /** Returns the appropriate speed label: "km/h" or "mph" */
  const speedLabel = distanceUnit === "mi" ? "mph" : "km/h";

  /** Returns the appropriate distance label: "km" or "mi" */
  const distanceLabel = distanceUnit;

  return {
    distanceUnit,
    temperatureUnit,
    formatDistance,
    formatSpeed,
    formatTemp,
    speedLabel,
    distanceLabel,
  };
}
