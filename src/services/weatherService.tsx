import React from "react";
import { Sun, CloudSun, CloudFog, CloudRain, CloudLightning, Thermometer } from "lucide-react";

export interface WeatherForecast {
  current?: {
    temperature: number;
    weathercode: number;
    is_day: number;
  };
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

const geocodeCache = new Map<string, GeocodingResult | null>();

export async function searchLocation(query: string): Promise<GeocodingResult[]> {
  if (!query || query.length < 2) return [];
  try {
    // Normalize string to remove accents since Open-Meteo geocoding struggles with some Vietnamese accents (like Đà Lạt)
    const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalizedQuery)}&count=5&language=vi&format=json`);
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
    const normalizedQuery = trimmedDest.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalizedQuery)}&count=1&language=vi&format=json`);
    
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

const weatherCache = new Map<string, { timestamp: number, data: WeatherForecast | null }>();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export async function getWeatherForecast(lat: number, lon: number, days: number = 3): Promise<WeatherForecast | null> {
  const fetchDays = Math.max(3, days); // Always fetch at least 3 days to maximize cache sharing
  const cacheKey = `${lat},${lon},${fetchDays}`;
  const cached = weatherCache.get(cacheKey);
  
  let dataToReturn: WeatherForecast | null = null;

  // Force bypass memory cache if the cached data doesn't have current weather
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION) && cached.data?.current) {
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
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${fetchDays}`);
        if (!res.ok) {
          console.error("Open-Meteo API Error:", res.status, res.statusText);
          // If rate limited, try to return stale cache from localStorage as a last resort
          let foundStale = false;
          try {
             const stored = localStorage.getItem(`weather_${cacheKey}`);
             if (stored) {
               const parsed = JSON.parse(stored);
               if (parsed.data?.current) {
                 return applyDaysLimit(parsed.data, days, fetchDays);
               }
             }
          } catch(e) {}
          // If no stale cache, we DO NOT return null here. We let it fall through to the mock data.
        } else {
          const data = await res.json();
          if (data.daily) {
            // Map new API format to our internal format
            const currentObj = data.current || data.current_weather || {};
            const mappedCurrent = {
              temperature: currentObj.temperature_2m ?? currentObj.temperature,
              weathercode: currentObj.weather_code ?? currentObj.weathercode,
              is_day: currentObj.is_day
            };
            const mappedDaily = {
              time: data.daily.time,
              weathercode: data.daily.weather_code ?? data.daily.weathercode,
              temperature_2m_max: data.daily.temperature_2m_max,
              temperature_2m_min: data.daily.temperature_2m_min
            };
            
            const fullData = { ...mappedDaily, current: mappedCurrent };
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
             if (parsed.data?.current) {
               return applyDaysLimit(parsed.data, days, fetchDays);
             }
           }
        } catch(e) {}
      }
    }
  }

  if (!dataToReturn) {
    return null;
  }

  return applyDaysLimit(dataToReturn, days, fetchDays);
}

function applyDaysLimit(dataToReturn: WeatherForecast | null, days: number, fetchDays: number) {
  if (dataToReturn && days < fetchDays) {
    return {
      current: dataToReturn.current,
      time: dataToReturn.time.slice(0, days),
      weathercode: dataToReturn.weathercode.slice(0, days),
      temperature_2m_max: dataToReturn.temperature_2m_max.slice(0, days),
      temperature_2m_min: dataToReturn.temperature_2m_min.slice(0, days),
    };
  }

  return dataToReturn;
}

export function getWeatherIcon(code: number, className: string = "w-5 h-5"): React.ReactNode {
  if (code === 0) return <Sun className={`${className} text-amber-500`} strokeWidth={2.5} />;
  if ([1, 2, 3].includes(code)) return <CloudSun className={`${className} text-sky-500`} strokeWidth={2.5} />;
  if ([45, 48].includes(code)) return <CloudFog className={`${className} text-slate-400`} strokeWidth={2.5} />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain className={`${className} text-blue-500`} strokeWidth={2.5} />;
  if (code >= 95 && code <= 99) return <CloudLightning className={`${className} text-indigo-500`} strokeWidth={2.5} />;
  return <Thermometer className={`${className} text-slate-500`} strokeWidth={2.5} />;
}

export function getWeatherText(code: number): string {
  if (code === 0) return "Trời quang";
  if (code === 1 || code === 2) return "Ít mây";
  if (code === 3) return "Nhiều mây";
  if ([45, 48].includes(code)) return "Sương mù";
  if (code >= 51 && code <= 67) return "Có mưa";
  if (code >= 80 && code <= 82) return "Mưa rào";
  if (code >= 95 && code <= 99) return "Có dông bão";
  return "Có mây";
}

export function getWeatherGradient(code: number): string {
  // Sunny / Clear: Premium warm sunset orange/pink (from reference)
  if (code === 0 || code === 1) {
    return "linear-gradient(135deg, #FF8A7A 0%, #FFB66D 100%)";
  }
  // Partly Cloudy / Cloudy: Premium sky blue (from reference)
  if (code === 2 || code === 3 || code === 45 || code === 48) {
    return "linear-gradient(135deg, #6BB2FF 0%, #8CD1FF 100%)";
  }
  // Rain / Drizzle: Premium stormy blue/grey (from reference)
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return "linear-gradient(135deg, #5B748E 0%, #465A6E 100%)";
  }
  // Thunderstorm / Heavy Rain: Deep night blue/purple
  if (code >= 95 && code <= 99) {
    return "linear-gradient(135deg, #2A3B5C 0%, #172136 100%)";
  }
  // Default (Neutral Cloudy Blue)
  return "linear-gradient(135deg, #8BA9D1 0%, #AEC8E4 100%)";
}
