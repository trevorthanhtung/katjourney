export interface ExchangeRate {
  currencyCode: string;
  currencyName: string;
  buy: number;
  transfer: number;
  sell: number;
}

const CACHE_KEY = "kat_journey_exchange_rates";
const CACHE_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours

const FALLBACK_RATES: ExchangeRate[] = [
  { currencyCode: "USD", currencyName: "USD", buy: 25000, transfer: 25400, sell: 25500 },
  { currencyCode: "EUR", currencyName: "EUR", buy: 26500, transfer: 27000, sell: 27200 },
  { currencyCode: "JPY", currencyName: "JPY", buy: 155, transfer: 160, sell: 165 },
  { currencyCode: "SGD", currencyName: "SGD", buy: 18000, transfer: 18500, sell: 18800 },
  { currencyCode: "THB", currencyName: "THB", buy: 680, transfer: 720, sell: 750 },
  { currencyCode: "KRW", currencyName: "KRW", buy: 17, transfer: 18, sell: 19 },
  { currencyCode: "CNY", currencyName: "CNY", buy: 3400, transfer: 3450, sell: 3500 },
  { currencyCode: "AUD", currencyName: "AUD", buy: 16000, transfer: 16400, sell: 16600 },
  { currencyCode: "CAD", currencyName: "CAD", buy: 17800, transfer: 18200, sell: 18400 },
  { currencyCode: "GBP", currencyName: "GBP", buy: 31000, transfer: 31500, sell: 32000 },
];

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

  // Use our local Vercel serverless function to proxy and cache Vietcombank exchange rates XML
  const exchangeRatesUrl = "/api/exchange-rates";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const response = await fetch(exchangeRatesUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
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
      return rates;
    }
    
    throw new Error("No exchange rates found in response");
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Error fetching VCB exchange rates:", error);
    // If API fails and we have cache (even expired), return it
    if (cached) {
      try {
        return JSON.parse(cached).data;
      } catch (e) {
        // ignore
      }
    }
    return FALLBACK_RATES;
  }
}
