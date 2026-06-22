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
          const coordMatch = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || url.hash.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
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
  const trimmed = url.trim();
  if (!trimmed) return "";
  
  // If it starts with a protocol or is a mailto/tel link, return as is
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }
  
  // If it starts with //, prepend https:
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  
  // Otherwise, prepend https://
  return `https://${trimmed}`;
}

