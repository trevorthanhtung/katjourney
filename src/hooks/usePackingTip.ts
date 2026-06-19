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
  if (!forecast || !myForecast) return null;

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

  const destCode =
    forecast.current?.weathercode ?? forecast.weathercode?.[0] ?? 0;
  const myCode =
    myForecast.current?.weathercode ?? myForecast.weathercode?.[0] ?? 0;

  const diff = destTemp - myTemp;

  if (isRainy(destCode) && !isRainy(myCode))
    return {
      emoji: "🌧️",
      message: `Điểm đến đang có mưa, đừng quên bỏ ô vào vali!`,
      color: "bg-sky-500/15 border-sky-400/30 text-white",
    };
  if (diff <= -7)
    return {
      emoji: "🧥",
      message: `Lạnh hơn nơi bạn ${Math.abs(Math.round(diff))}°C. Nhớ mang áo ấm!`,
      color: "bg-white/15 border-white/25 text-white",
    };
  if (diff <= -4)
    return {
      emoji: "🧣",
      message: `Mát hơn nơi bạn ${Math.abs(Math.round(diff))}°C. Mang áo khoác mỏng nhé.`,
      color: "bg-white/15 border-white/25 text-white",
    };
  if (diff >= 7)
    return {
      emoji: "☀️",
      message: `Nóng hơn nơi bạn ${Math.round(diff)}°C. Chuẩn bị kem chống nắng!`,
      color: "bg-amber-500/15 border-amber-400/30 text-white",
    };
  if (diff >= 4)
    return {
      emoji: "🕶️",
      message: `Ấm hơn nơi bạn ${Math.round(diff)}°C. Đừng quên kính mát.`,
      color: "bg-orange-500/15 border-orange-400/30 text-white",
    };

  return null;
}
