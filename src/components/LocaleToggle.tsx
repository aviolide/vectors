import { useLocale } from "../i18n";

export function LocaleToggle() {
  const locale = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);
  return (
    <div className="locale-toggle">
      <button
        className={locale === "en" ? "active" : ""}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <button
        className={locale === "ru" ? "active" : ""}
        onClick={() => setLocale("ru")}
      >
        RU
      </button>
    </div>
  );
}
