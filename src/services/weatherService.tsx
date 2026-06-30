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

export interface WeatherForecast {
  current?: {
    temperature: number;
    weathercode: number;
    is_day: number;
    humidity?: number;
    windspeed?: number;
    apparent_temperature?: number;
  };
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  uv_index_max?: number[];
  hourly?: {
    time: string[];
    temperature: number[];
    weathercode: number[];
    precipitation_probability: number[];
  };
}

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
  country_code?: string;
}

const geocodeCache = new Map<string, GeocodingResult | null>();

export async function searchLocation(query: string): Promise<GeocodingResult[]> {
  if (!query || query.length < 2) return [];
  try {
    // Normalize string to remove accents since Open-Meteo geocoding struggles with some Vietnamese accents (like Đà Lạt)
    const normalizedQuery = query
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalizedQuery)}&count=5&language=vi&format=json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Geocoding search error:", error);
    return [];
  }
}

export async function geocodeDestination(destination: string): Promise<GeocodingResult | null> {
  if (!destination || !destination.trim()) return null;

  // We should cache geocoding results to avoid rate limits
  const cacheKey = destination.toLowerCase().trim();

  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey) || null;

  // Try localStorage first
  try {
    const stored = localStorage.getItem(`geo_${cacheKey}`);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      geocodeCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch (e) {}

  try {
    const trimmedDest = destination.trim();
    const normalizedQuery = trimmedDest
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalizedQuery)}&count=1&language=vi&format=json`
    );

    if (!res.ok) {
      console.warn("Geocoding API failed");
      return null;
    }
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      const result = {
        name: data.results[0].name,
        latitude: data.results[0].latitude,
        longitude: data.results[0].longitude,
      };
      geocodeCache.set(cacheKey, result);

      // Persist to localStorage
      try {
        localStorage.setItem(`geo_${cacheKey}`, JSON.stringify(result));
      } catch (e) {}

      return result;
    }
    geocodeCache.set(cacheKey, null);

    // Cache the null result to avoid spamming
    try {
      localStorage.setItem(`geo_${cacheKey}`, JSON.stringify(null));
    } catch (e) {}

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    // Do not cache null on network errors so it can retry next time
    return null;
  }
}

const weatherCache = new Map<string, { timestamp: number; data: WeatherForecast | null }>();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export async function getWeatherForecast(
  lat: number,
  lon: number,
  days: number = 3,
  startDate?: string
): Promise<WeatherForecast | null> {
  const today = new Date().toISOString().split("T")[0];

  // Open-Meteo free tier: max 16 days with forecast_days param
  const MAX_FORECAST_DAYS = 16;

  // Calculate how many days from today we need to fetch to cover startDate + days
  let fetchDays = Math.max(3, days);
  let daysUntilTrip = 0;
  if (startDate && startDate > today) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const startMs = new Date(startDate + "T00:00:00").getTime();
    const todayMs = new Date(today + "T00:00:00").getTime();
    daysUntilTrip = Math.ceil((startMs - todayMs) / msPerDay);
    fetchDays = daysUntilTrip + Math.max(days, 1);
  }

  // If the trip start is beyond what the API can provide, return null
  if (fetchDays > MAX_FORECAST_DAYS || daysUntilTrip >= MAX_FORECAST_DAYS) return null;

  const cacheKey = `${lat},${lon},${fetchDays}`;
  const cached = weatherCache.get(cacheKey);

  let dataToReturn: WeatherForecast | null = null;

  // Force bypass memory cache if the cached data doesn't have current weather
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION && cached.data?.current) {
    dataToReturn = cached.data;
  } else {
    // Try localStorage
    try {
      const stored = localStorage.getItem(`weather_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_DURATION && parsed.data?.current) {
          weatherCache.set(cacheKey, parsed);
          dataToReturn = parsed.data;
        }
      }
    } catch (e) {}

    // If still no valid data, fetch from API
    if (!dataToReturn) {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code,relative_humidity_2m,wind_speed_10m,apparent_temperature&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&hourly=temperature_2m,weather_code,precipitation_probability&timezone=auto&forecast_days=${fetchDays}`
        );
        if (!res.ok) {
          console.error("Open-Meteo API Error:", res.status, res.statusText);
          // If rate limited, try to return stale cache from localStorage as a last resort
          try {
            const stored = localStorage.getItem(`weather_${cacheKey}`);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.data) {
                return applyDaysLimit(parsed.data, days, fetchDays, daysUntilTrip);
              }
            }
          } catch (e) {}
          // If no stale cache, we DO NOT return null here. We let it fall through to the mock data.
        } else {
          const data = await res.json();
          if (data.daily) {
            // Map new API format to our internal format
            const currentObj = data.current || data.current_weather || {};
            const mappedCurrent = {
              temperature: currentObj.temperature_2m ?? currentObj.temperature,
              weathercode: currentObj.weather_code ?? currentObj.weathercode,
              is_day: currentObj.is_day,
              humidity: currentObj.relative_humidity_2m ?? currentObj.humidity,
              windspeed: currentObj.wind_speed_10m ?? currentObj.windspeed,
              apparent_temperature: currentObj.apparent_temperature,
            };
            const mappedDaily = {
              time: data.daily.time,
              weathercode: data.daily.weather_code ?? data.daily.weathercode,
              temperature_2m_max: data.daily.temperature_2m_max,
              temperature_2m_min: data.daily.temperature_2m_min,
              uv_index_max: data.daily.uv_index_max,
            };

            // Slice hourly data to show next 24 hours
            let mappedHourly = undefined;
            if (data.hourly) {
              const now = new Date();
              const offset = now.getTimezoneOffset();
              const localNow = new Date(now.getTime() - offset * 60 * 1000);
              const currentHourStr = localNow.toISOString().substring(0, 13) + ":00";
              let startIndex = data.hourly.time.findIndex((t: string) =>
                t.startsWith(currentHourStr)
              );
              if (startIndex === -1) startIndex = 0;
              const endIndex = startIndex + 24;

              mappedHourly = {
                time: data.hourly.time.slice(startIndex, endIndex),
                temperature: (data.hourly.temperature_2m ?? data.hourly.temperature ?? []).slice(
                  startIndex,
                  endIndex
                ),
                weathercode: (data.hourly.weather_code ?? data.hourly.weathercode ?? []).slice(
                  startIndex,
                  endIndex
                ),
                precipitation_probability: (data.hourly.precipitation_probability ?? []).slice(
                  startIndex,
                  endIndex
                ),
              };
            }

            // Fallback mock hourly forecast if not available
            if (!mappedHourly) {
              const minTemp = mappedDaily.temperature_2m_min[0] ?? 20;
              const maxTemp = mappedDaily.temperature_2m_max[0] ?? 30;
              const wcode = mappedCurrent.weathercode ?? 0;

              const times: string[] = [];
              const temps: number[] = [];
              const codes: number[] = [];
              const precips: number[] = [];

              const now = new Date();
              for (let i = 0; i < 24; i++) {
                const h = new Date(now.getTime() + i * 60 * 60 * 1000);
                times.push(h.toISOString());
                const hour = h.getHours();
                const rad = ((hour - 5) / 24) * 2 * Math.PI;
                const factor = (Math.sin(rad - Math.PI / 2) + 1) / 2; // 0 to 1
                const temp = minTemp + factor * (maxTemp - minTemp);
                temps.push(Math.round(temp));
                codes.push(wcode);
                const isRainy = (wcode >= 51 && wcode <= 67) || (wcode >= 80 && wcode <= 82);
                const isStormy = wcode >= 95 && wcode <= 99;
                precips.push(isStormy ? 90 : isRainy ? 75 : 10);
              }
              mappedHourly = {
                time: times,
                temperature: temps,
                weathercode: codes,
                precipitation_probability: precips,
              };
            }

            const fullData = { ...mappedDaily, current: mappedCurrent, hourly: mappedHourly };
            const cacheObj = { timestamp: Date.now(), data: fullData };
            weatherCache.set(cacheKey, cacheObj);
            try {
              localStorage.setItem(`weather_${cacheKey}`, JSON.stringify(cacheObj));
            } catch (e) {}
            dataToReturn = fullData;
          }
        }
      } catch (error) {
        console.error("Weather forecast error:", error);
        // Try stale cache on network error
        try {
          const stored = localStorage.getItem(`weather_${cacheKey}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.data) {
              return applyDaysLimit(parsed.data, days, fetchDays, daysUntilTrip);
            }
          }
        } catch (e) {}
      }
    }
  }

  if (!dataToReturn) {
    return null;
  }

  return applyDaysLimit(dataToReturn, days, fetchDays, daysUntilTrip);
}

function applyDaysLimit(
  dataToReturn: WeatherForecast | null,
  days: number,
  fetchDays: number,
  startOffset: number = 0
) {
  if (!dataToReturn) return dataToReturn;

  // startOffset = days from today until trip start
  // We slice from startOffset to startOffset+days
  const from = startOffset;
  const to = from + days;

  if (from > 0 || to < fetchDays) {
    return {
      // Don't expose current weather when displaying future days
      current: from === 0 ? dataToReturn.current : undefined,
      time: dataToReturn.time.slice(from, to),
      weathercode: dataToReturn.weathercode.slice(from, to),
      temperature_2m_max: dataToReturn.temperature_2m_max.slice(from, to),
      temperature_2m_min: dataToReturn.temperature_2m_min.slice(from, to),
      uv_index_max: dataToReturn.uv_index_max?.slice(from, to),
      hourly: dataToReturn.hourly,
    };
  }

  return dataToReturn;
}

// Map Tailwind w-N or w-[Npx] class to an approximate font-size class for emoji
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
