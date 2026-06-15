export interface ExchangeRate {
  currencyCode: string;
  currencyName: string;
  buy: number;
  transfer: number;
  sell: number;
}

const CACHE_KEY = "kat_journey_exchange_rates";
const CACHE_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
        return data;
      }
    } catch (e) {
      console.warn("Failed to parse cached exchange rates", e);
    }
  }

  // Use a CORS proxy to bypass browser restrictions
  const VCB_API_URL = "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx";
  const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(VCB_API_URL)}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Failed to fetch exchange rates");
    
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const exrateNodes = xmlDoc.getElementsByTagName("Exrate");
    const rates: ExchangeRate[] = [];
    
    for (let i = 0; i < exrateNodes.length; i++) {
      const node = exrateNodes[i];
      const currencyCode = node.getAttribute("CurrencyCode");
      const currencyName = node.getAttribute("CurrencyName")?.trim() || "";
      const buyStr = node.getAttribute("Buy")?.replace(/,/g, "") || "0";
      const transferStr = node.getAttribute("Transfer")?.replace(/,/g, "") || "0";
      const sellStr = node.getAttribute("Sell")?.replace(/,/g, "") || "0";
      
      if (currencyCode) {
        rates.push({
          currencyCode,
          currencyName,
          buy: parseFloat(buyStr) || 0,
          transfer: parseFloat(transferStr) || 0,
          sell: parseFloat(sellStr) || 0,
        });
      }
    }

    if (rates.length > 0) {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data: rates, timestamp: Date.now() })
      );
    }

    return rates;
  } catch (error) {
    console.error("Error fetching VCB exchange rates:", error);
    // If API fails and we have cache (even expired), return it
    if (cached) {
      try {
        return JSON.parse(cached).data;
      } catch (e) {
        // ignore
      }
    }
    return [];
  }
}
