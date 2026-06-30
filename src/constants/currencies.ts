export const CURRENCY_OPTIONS = [
  "VND",
  "USD",
  "EUR",
  "JPY",
  "KRW",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "DKK",
  "GBP",
  "HKD",
  "INR",
  "KWD",
  "MYR",
  "NOK",
  "NZD",
  "RUB",
  "SAR",
  "SEK",
  "SGD",
  "THB",
];

let displayNamesCache: Record<string, Intl.DisplayNames> = {};

export const getCurrencyLabel = (code: string, language: string = "vi"): string => {
  try {
    if (!displayNamesCache[language]) {
      displayNamesCache[language] = new Intl.DisplayNames([language], { type: "currency" });
    }
    const name = displayNamesCache[language].of(code);
    if (!name || name === code) return code;
    return `${code} - ${name.charAt(0).toUpperCase() + name.slice(1)}`;
  } catch (e) {
    return code;
  }
};
