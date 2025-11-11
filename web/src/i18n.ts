import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./i18n/locales/en";
import zhHans from "./i18n/locales/zhHans";
import zhHant from "./i18n/locales/zhHant";
import ja from "./i18n/locales/ja";
import ko from "./i18n/locales/ko";

export const LANG_OPTIONS = [
  { value: "en", label: "English" },
  { value: "zh-Hans", label: "简体中文" },
  { value: "zh-Hant", label: "繁體中文" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
];

const resources = {
  en: { translation: en },
  "zh-Hans": { translation: zhHans },
  "zh-Hant": { translation: zhHant },
  ja: { translation: ja },
  ko: { translation: ko },
};

const storedLang = localStorage.getItem("app-language") ?? "en";

i18n.use(initReactI18next).init({
  resources,
  lng: storedLang,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("app-language", lng);
});

export default i18n;
