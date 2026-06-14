export function getEmbedMapUrl(input: string, fallbackLocation?: string): string {
  if (!input) {
    if (fallbackLocation) return getEmbedMapUrl(fallbackLocation);
    return "";
  }

  let query = input.trim();

  // If input is a URL, try to extract a useful query
  if (query.startsWith("http")) {
    try {
      const url = new URL(query);
      if (url.hostname.includes("google.com")) {
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
          // If we can't parse the URL (like short links maps.app.goo.gl), 
          // we fallback to the location text if available, else we just use the URL (which might fail but it's best effort)
          if (fallbackLocation) return getEmbedMapUrl(fallbackLocation);
        }
      } else {
        if (fallbackLocation) return getEmbedMapUrl(fallbackLocation);
      }
    } catch (e) {
      // Invalid URL, just use it as string
    }
  }
  
  const baseUrl = "https://maps.google.com/maps";
  const encodedQuery = encodeURIComponent(query);
  
  return `${baseUrl}?q=${encodedQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}
