import { useTranslation } from "react-i18next";
/**
 * Tính gợi ý đồ đạc dựa trên so sánh thời tiết điểm đến vs vị trí hiện tại.
 */
export interface PackingTip {
  emoji: string;
  message: string;
  color: string;
}

interface WeatherForecast {
  current?: { temperature?: number; weathercode?: number };
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  weathercode?: number[];
}

function isRainy(code: number) {
  return (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99)
  );
}

export function usePackingTip(
  forecast: WeatherForecast | null | undefined,
  myForecast: WeatherForecast | null | undefined
): PackingTip | null {
  const { t } = useTranslation();
  if (!forecast) return null;

  const destCode =
    forecast.current?.weathercode ?? forecast.weathercode?.[0] ?? 0;

  // Rain tip should show regardless of myForecast or myCode
  if (isRainy(destCode)) {
    return {
      emoji: "🌧️",
      message: t("weather.packingRainShort"),
      color: "bg-sky-500/15 border-sky-400/30 text-white",
    };
  }

  // If myForecast is not available, we can't compare temperature differences
  if (!myForecast) return null;

  const destTemp =
    forecast.current?.temperature ??
    ((forecast.temperature_2m_max?.[0] ?? 0) +
      (forecast.temperature_2m_min?.[0] ?? 0)) /
      2;
  const myTemp =
    myForecast.current?.temperature ??
    ((myForecast.temperature_2m_max?.[0] ?? 0) +
      (myForecast.temperature_2m_min?.[0] ?? 0)) /
      2;

  const diff = destTemp - myTemp;

  if (diff <= -7)
    return {
      emoji: "🧥",
      message: t("weather.colderShort", { diff: Math.abs(Math.round(diff)) }),
      color: "bg-white/15 border-white/25 text-white",
    };
  if (diff <= -4)
    return {
      emoji: "🧣",
      message: t("weather.coolerShort", { diff: Math.abs(Math.round(diff)) }),
      color: "bg-white/15 border-white/25 text-white",
    };
  if (diff >= 7)
    return {
      emoji: "☀️",
      message: t("weather.hotterShort", { diff: Math.round(diff) }),
      color: "bg-amber-500/15 border-amber-400/30 text-white",
    };
  if (diff >= 4)
    return {
      emoji: "🕶️",
      message: t("weather.warmerShort", { diff: Math.round(diff) }),
      color: "bg-orange-500/15 border-orange-400/30 text-white",
    };

  return null;
}
