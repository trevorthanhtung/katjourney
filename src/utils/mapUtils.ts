export function getEmbedMapUrl(input: string, fallbackLocation?: string): string {
  if (!input) {
    if (fallbackLocation) return getEmbedMapUrl(fallbackLocation);
    return "";
  }

  let query = input.trim();

  // Do not show embed iframe for directions/route (roadmap) links
  if (query.includes("/maps/dir/") || query.includes("maps/dir")) {
    return "";
  }

  // If input is a URL, try to extract a useful query
  if (query.startsWith("http")) {
    try {
      const url = new URL(query);
      if (url.hostname.includes("google.com") || url.hostname.includes("goo.gl")) {
        // Try to get 'q' or 'query' param
        const q = url.searchParams.get("q") || url.searchParams.get("query");
        if (q) {
          query = q;
        } else if (url.pathname.includes("/place/")) {
          // e.g. /maps/place/Dalat+Market/...
          const parts = url.pathname.split("/place/");
          if (parts[1]) {
            query = decodeURIComponent(parts[1].split("/")[0]);
          }
        } else {
          // Try to extract coordinates @lat,lng from pathname or hash
          const coordMatch =
            url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
            url.hash.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (coordMatch) {
            query = `${coordMatch[1]},${coordMatch[2]}`;
          } else {
            // If we can't parse the URL (like short links maps.app.goo.gl),
            // we fallback to the location text if available
            if (fallbackLocation) {
              return getEmbedMapUrl(fallbackLocation);
            } else {
              return "";
            }
          }
        }
      } else {
        if (fallbackLocation) {
          return getEmbedMapUrl(fallbackLocation);
        } else {
          return "";
        }
      }
    } catch (e) {
      // Invalid URL
      return "";
    }
  }

  // If the query is still a URL (could not be parsed), do not render the iframe
  if (query.startsWith("http")) {
    return "";
  }

  const baseUrl = "https://maps.google.com/maps";
  const encodedQuery = encodeURIComponent(query);
  return `${baseUrl}?q=${encodedQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

export function ensureAbsoluteUrl(url?: string): string {
  if (!url) return "";
  let trimmed = url.trim();
  if (!trimmed) return "";

  // Remove leading and trailing double/single quotes if the user copied them
  trimmed = trimmed.replace(/^["']|["']$/g, "").trim();

  let absoluteUrl = trimmed;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    absoluteUrl = trimmed;
  } else if (trimmed.startsWith("//")) {
    absoluteUrl = `https:${trimmed}`;
  } else {
    absoluteUrl = `https://${trimmed}`;
  }

  try {
    // encodeURI is safe to call on a full absolute URL.
    // It will encode spaces to %20 and other unsafe characters, while leaving protocol, slashes, query params intact.
    return encodeURI(absoluteUrl);
  } catch (e) {
    return absoluteUrl;
  }
}

/**
 * Dynamically determines the appropriate CSS filter class for Google Maps iframe embeds.
 * It implements "trời sáng nó sáng trời tối nó tối" (daytime map is light, nighttime map is dark).
 *
 * @param timeStr Optional time of the activity (e.g. "08:00" or "19:30")
 * @returns Tailwind filter classes to apply to the iframe
 */
export function getMapFilterClass(timeStr?: string): string {
  let isNight = false;
  if (timeStr) {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const hour = parseInt(match[1], 10);
      isNight = hour < 6 || hour >= 18;
    }
  } else {
    // If no time is specified, follow global dark theme first
    const isGlobalDark =
      typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    if (isGlobalDark) {
      isNight = true;
    } else {
      // Fallback to current system time
      const hour = new Date().getHours();
      isNight = hour < 6 || hour >= 18;
    }
  }

  // Return custom filters:
  // In light mode, standard Google Maps colors are bright and perfect.
  // In dark mode, we apply a high-quality dark slate filter:
  // - invert-100 flips colors completely (dark background, light text)
  // - hue-rotate-180 restores the original color spectrum (so the pin is restored to bright red, water to blue)
  // - saturate-110 boosts the colors slightly to make the red pin pop and look bright red (đỏ tươi)
  // - brightness-90 and contrast-95 ensure perfect readability
  if (isNight) {
    return "invert-100 hue-rotate-180 saturate-110 brightness-90 contrast-95";
  }
  return "";
}
