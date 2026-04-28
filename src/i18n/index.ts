import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "en" | "ru";

type LocaleState = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggle: () => void;
};

export const useLocale = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
      toggle: () => set({ locale: get().locale === "en" ? "ru" : "en" }),
    }),
    { name: "shaderforge.locale.v1" }
  )
);
