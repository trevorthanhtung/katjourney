import { useState, useEffect } from "react";
import { getCurrentPosition } from "../services/locationService";
import { getWeatherForecast, WeatherForecast } from "../services/weatherService";

interface CurrentLocationWeather {
  forecast: WeatherForecast | null;
  locationName: string | null;
  loading: boolean;
  error: boolean;
}

const SESSION_KEY = "kat_clw_cache";

function loadCache(): { forecast: WeatherForecast; locationName: string; ts: number } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > 15 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useCurrentLocationWeather(): CurrentLocationWeather {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (localStorage.getItem("kat_gps_enabled") === "false") return;

    const cached = loadCache();
    if (cached) {
      setForecast(cached.forecast);
      setLocationName(cached.locationName);
      return;
    }

    async function fetchCurrentWeather() {
      setLoading(true);
      try {
        const pos = await getCurrentPosition();

        // Reverse geocode using BigDataCloud
        let locName = "Vị trí hiện tại";
        try {
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.latitude}&longitude=${pos.longitude}&localityLanguage=vi`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const parts: string[] = [];
            if (geoData.locality) parts.push(geoData.locality);
            else if (geoData.city) parts.push(geoData.city);
            else if (geoData.principalSubdivision) parts.push(geoData.principalSubdivision);
            if (geoData.countryName && parts.length === 0) parts.push(geoData.countryName);
            locName = parts.join(", ") || "Vị trí hiện tại";
          }
        } catch { /* silent */ }

        const weatherData = await getWeatherForecast(pos.latitude, pos.longitude, 1);

        if (!isMounted) return;
        if (weatherData) {
          setForecast(weatherData);
          setLocationName(locName);
          try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({ forecast: weatherData, locationName: locName, ts: Date.now() }));
          } catch { /* ignore */ }
        } else {
          setError(true);
        }
      } catch {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCurrentWeather();
    return () => { isMounted = false; };
  }, []);

  return { forecast, locationName, loading, error };
}
