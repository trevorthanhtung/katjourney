import React from "react";
import i18n from "../i18n";
import {
  SunIcon,
  PartlyCloudyIcon,
  CloudyIcon,
  FogIcon,
  RainIcon,
  DrizzleIcon,
  ThunderstormIcon,
  SnowIcon,
  ThermometerIcon,
} from "../components/ui/WeatherIcons";

function emojiSizeFromClass(className: string): string {
  const match = className.match(/w-\[?(\d+(?:\.\d+)?)/);
  if (!match) return "text-2xl";
  const n = parseFloat(match[1]);
  if (n <= 12) return "text-xs";
  if (n <= 14) return "text-sm";
  if (n <= 16) return "text-base";
  if (n <= 18) return "text-lg";
  if (n <= 20) return "text-xl";
  if (n <= 22) return "text-[22px]";
  if (n <= 24) return "text-2xl";
  if (n <= 28) return "text-[28px]";
  return "text-4xl";
}

export function getWeatherIcon(code: number, className: string = "w-5 h-5"): React.ReactNode {
  if (code === 0) return <SunIcon className={`${className} animate-weather-spin`} />;
  else if (code === 1) return <PartlyCloudyIcon className={`${className} animate-weather-sway`} />;
  else if (code === 2) return <PartlyCloudyIcon className={`${className} animate-weather-sway`} />;
  else if (code === 3) return <CloudyIcon className={`${className} animate-weather-sway`} />;
  else if (code === 45 || code === 48)
    return <FogIcon className={`${className} animate-weather-pulse`} />;
  else if (code >= 51 && code <= 55)
    return <DrizzleIcon className={`${className} animate-weather-pulse`} />;
  else if (code === 56 || code === 57)
    return <SnowIcon className={`${className} animate-weather-sway`} />;
  else if (code >= 61 && code <= 67)
    return <RainIcon className={`${className} animate-weather-pulse`} />;
  else if (code >= 71 && code <= 77)
    return <SnowIcon className={`${className} animate-weather-sway`} />;
  else if (code === 80 || code === 81 || code === 82)
    return <RainIcon className={`${className} animate-weather-pulse`} />;
  else if (code === 85 || code === 86)
    return <SnowIcon className={`${className} animate-weather-sway`} />;
  else if (code >= 95 && code <= 99)
    return <ThunderstormIcon className={`${className} animate-weather-pulse`} />;
  else return <ThermometerIcon className={className} />;
}

export function getWeatherText(code: number): string {
  if (code === 0) return i18n.t("weather.clear");
  if (code === 1 || code === 2) return i18n.t("weather.partlyCloudy");
  if (code === 3) return i18n.t("weather.cloudy");
  if ([45, 48].includes(code)) return i18n.t("weather.fog");
  if (code >= 51 && code <= 67) return i18n.t("weather.rain");
  if (code >= 80 && code <= 82) return i18n.t("weather.showers");
  if (code >= 95 && code <= 99) return i18n.t("weather.thunderstorm");
  return i18n.t("weather.mostlyCloudy");
}

export function getWeatherGradient(code: number): string {
  // Sunny / Clear: Rich warm amber → coral gold
  if (code === 0 || code === 1) {
    return "linear-gradient(135deg, #F5A623 0%, #F76B1C 50%, #E8573D 100%)";
  }
  // Partly Cloudy: Premium sky blue → soft periwinkle
  if (code === 2 || code === 3) {
    return "linear-gradient(135deg, #4A90D9 0%, #6BAED6 55%, #A8C8E8 100%)";
  }
  // Fog / Mist: Muted steel blue → cool grey
  if (code === 45 || code === 48) {
    return "linear-gradient(135deg, #6B7FA3 0%, #8A9DBF 55%, #B0BFCE 100%)";
  }
  // Drizzle / Rain: Deep ocean blue → slate
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return "linear-gradient(135deg, #2C4A6E 0%, #3D6080 50%, #536E8A 100%)";
  }
  // Thunderstorm: Deep midnight navy → stormy indigo
  if (code >= 95 && code <= 99) {
    return "linear-gradient(135deg, #1A1F3C 0%, #252D52 50%, #2E3B6E 100%)";
  }
  // Default (Neutral Blue)
  return "linear-gradient(135deg, #4A7FA5 0%, #6A9FBF 55%, #92BFDA 100%)";
}
