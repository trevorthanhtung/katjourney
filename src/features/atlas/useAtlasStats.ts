import { useState, useEffect, useMemo } from "react";
import { Trip } from "../../db";
import { numericToAlpha2 } from "../../lib/countryCodes";
// @ts-ignore
import { feature } from "topojson-client";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const alpha2ToNumeric = Object.entries(numericToAlpha2).reduce(
  (acc, [num, a2]) => {
    acc[a2] = num;
    return acc;
  },
  {} as Record<string, string>
);

export function useAtlasStats(trips: Trip[]) {
  const [geographies, setGeographies] = useState<any[]>([]);

  useEffect(() => {
    fetch(geoUrl)
      .then((res) => res.json())
      .then((topology) => {
        const geojson = feature(topology, topology.objects.countries);
        setGeographies((geojson as any).features);
      })
      .catch((err) => console.error("Failed to fetch geographies:", err));
  }, []);

  const stats = useMemo(() => {
    const countryStats: Record<string, any> = {};
    const visited = new Set<string>();
    const uniqueLocations = new Set<string>();
    let places = 0;

    let latestDate = 0;
    let latestCountry = "";
    let latestCountryId = "";

    let thisYearCount = 0;
    const currentYear = new Date().getFullYear();

    trips.forEach((trip) => {
      const tripDate = new Date(trip.startDate);
      const tripYear = tripDate.getFullYear();
      if (tripYear === currentYear) thisYearCount++;

      const tripCountriesCounted = new Set<string>();
      const destinationsToProcess = trip.destinations?.length
        ? trip.destinations
        : [
            {
              name: trip.location,
              countryCode: trip.countryCode,
            },
          ];

      destinationsToProcess.forEach((dest: any) => {
        if (dest.name) uniqueLocations.add(dest.name);
        places += 1;

        let geoId: string | null = null;
        let geo: any = null;

        // Primary check: By Country Code
        if (dest.countryCode) {
          geoId = alpha2ToNumeric[dest.countryCode];
          if (geoId) geo = geographies.find((g) => g.id === geoId);
        }

        // Fallback check: By Location Name string matching
        if (!geo && dest.name && geographies.length > 0) {
          const normalizedLoc = dest.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
          geo = geographies.find((g) => {
            const countryName = g.properties.name
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase();
            return (
              normalizedLoc.includes(countryName) ||
              (countryName === "vietnam" && normalizedLoc.includes("viet nam"))
            );
          });
          if (geo) geoId = geo.id;
        }

        if (geo && geoId) {
          visited.add(geoId);
          if (!countryStats[geoId]) {
            countryStats[geoId] = {
              name: geo.properties.name,
              trips: 0,
              places: 0,
              firstDate: trip.startDate,
              lastDate: trip.startDate,
            };
          }
          const s = countryStats[geoId];

          if (!tripCountriesCounted.has(geoId)) {
            s.trips += 1;
            tripCountriesCounted.add(geoId);
          }
          s.places += 1;

          if (trip.startDate < s.firstDate) s.firstDate = trip.startDate;
          if (trip.startDate > s.lastDate) s.lastDate = trip.startDate;

          const tripTime = tripDate.getTime();
          if (tripTime > latestDate) {
            latestDate = tripTime;
            latestCountry = geo.properties.name;
            latestCountryId = geo.id;
          }
        }
      });
    });

    // Format dates to MM/YYYY
    Object.keys(countryStats).forEach((id) => {
      const s = countryStats[id];
      const fd = new Date(s.firstDate);
      const ld = new Date(s.lastDate);
      if (!isNaN(fd.getTime())) {
        s.firstTrip = `${String(fd.getMonth() + 1).padStart(2, "0")}/${fd.getFullYear()}`;
      } else {
        s.firstTrip = "-";
      }
      if (!isNaN(ld.getTime())) {
        s.lastTrip = `${String(ld.getMonth() + 1).padStart(2, "0")}/${ld.getFullYear()}`;
      } else {
        s.lastTrip = "-";
      }
    });

    const visitedAlpha2s = Array.from(visited)
      .map((id) => numericToAlpha2[id])
      .filter(Boolean);

    return {
      countryStats,
      visitedCountries: Array.from(visited),
      visitedAlpha2s,
      totalCities: uniqueLocations.size,
      totalPlaces: places,
      lastTripName: latestCountry || "-",
      lastTripId: latestCountryId || "",
      currentYearTrips: thisYearCount,
    };
  }, [trips, geographies]);

  return { geographies, ...stats };
}
