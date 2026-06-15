import { useState, useEffect } from "react";
import { getWeatherForecast, WeatherForecast, geocodeDestination } from "../services/weatherService";

export function useWeather(destination?: string, latitude?: number, longitude?: number, days: number = 3) {
  const [loading, setLoading] = useState(false); // Default to false to avoid initial flashing if not fetching
  const [error, setError] = useState(false);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function loadWeather() {
      if (!destination && (!latitude || !longitude)) {
        setError(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);
      
      try {
        let lat = latitude;
        let lon = longitude;

        if ((!lat || !lon) && destination) {
          try {
            const geocode = await geocodeDestination(destination);
            if (geocode) {
              lat = geocode.latitude;
              lon = geocode.longitude;
            }
          } catch (e) {
            console.error("Fallback geocoding failed", e);
          }
        }

        if (!lat || !lon) {
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
          return;
        }

        const data = await getWeatherForecast(lat, lon, days);
        if (!isMounted) return; // Ignore if unmounted
        
        if (!data) {
          setError(true);
          return;
        }

        setForecast(data);
      } catch (e) {
        console.error("Failed to load weather", e);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    // Only load if we have a valid destination or coords
    if (destination || (latitude && longitude)) {
      loadWeather();
    }

    return () => {
      isMounted = false;
    };
  }, [destination, latitude, longitude, days]);

  return { loading, error, forecast };
}
