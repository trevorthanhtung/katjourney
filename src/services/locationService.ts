export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface GeocodeResult {
  locality: string;
  city: string;
  countryName: string;
  countryCode: string;
  displayName: string;
}

const CURRENCY_MAP: Record<string, string> = {
  VN: "VND", // Vietnam
  TH: "THB", // Thailand
  JP: "JPY", // Japan
  KR: "KRW", // South Korea
  SG: "SGD", // Singapore
  MY: "MYR", // Malaysia
  ID: "IDR", // Indonesia
  PH: "PHP", // Philippines
  TW: "TWD", // Taiwan
  CN: "CNY", // China
  US: "USD", // United States
  EU: "EUR", // European Union
  GB: "GBP", // United Kingdom
  AU: "AUD", // Australia
  NZ: "NZD", // New Zealand
  HK: "HKD", // Hong Kong
  IN: "INR", // India
  // Add more as needed
};

export async function getCurrentPosition(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    if (localStorage.getItem("kat_gps_enabled") === "false") {
      reject(new Error("GPS is disabled by user setting"));
      return;
    }
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=vi`
    );
    if (!response.ok) throw new Error("Reverse geocoding failed");

    const data = await response.json();

    const locality = data.locality || "";
    const city = data.city || data.principalSubdivision || "";
    const countryName = data.countryName || "";
    const countryCode = data.countryCode || "";

    // Construct a sensible display name like "Shinjuku, Tokyo" or "Quận 1, Hồ Chí Minh"
    const parts = [];
    if (locality) parts.push(locality);
    if (city && city !== locality) parts.push(city);

    // If we only have country, use it
    if (parts.length === 0 && countryName) {
      parts.push(countryName);
    }

    return {
      locality,
      city,
      countryName,
      countryCode,
      displayName: parts.join(", "),
    };
  } catch (error) {
    console.warn("Primary geocoding (BigDataCloud) failed, falling back to Nominatim:", error);
    try {
      // Fallback to Nominatim OpenStreetMap if BigDataCloud is blocked by ad-blockers
      const fallbackUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1&accept-language=vi`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          "User-Agent": "KatJourney/1.0",
        },
      });
      if (!fallbackRes.ok) throw new Error("Fallback geocoding failed");
      const fallbackData = await fallbackRes.json();

      const address = fallbackData.address || {};
      const locality = address.suburb || address.quarter || address.neighbourhood || "";
      const city = address.city || address.town || address.county || address.state || "";
      const countryName = address.country || "";
      const countryCode = (address.country_code || "").toUpperCase();

      const parts = [];
      if (locality) parts.push(locality);
      if (city && city !== locality) parts.push(city);
      if (parts.length === 0 && countryName) parts.push(countryName);

      return {
        locality,
        city,
        countryName,
        countryCode,
        displayName: parts.join(", "),
      };
    } catch (fallbackError) {
      console.error("All geocoding services failed:", fallbackError);
      throw fallbackError;
    }
  }
}

export function getCurrencyForCountry(countryCode: string): string {
  return CURRENCY_MAP[countryCode.toUpperCase()] || "";
}
