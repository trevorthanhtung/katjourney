import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import vi from "./locales/vi.json";
import en from "./locales/en.json";
import ja from "./locales/ja.json";
import zh from "./locales/zh.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
      ja: { translation: ja },
      zh: { translation: zh },
    },
    fallbackLng: "vi",
    supportedLngs: ["vi", "en", "ja", "zh"],
    detection: {
      // Đọc từ localStorage trước (key: i18nextLng), sau đó từ browser
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: {
      // React đã escape XSS, không cần i18next escape
      escapeValue: false,
    },
  });

export default i18n;
