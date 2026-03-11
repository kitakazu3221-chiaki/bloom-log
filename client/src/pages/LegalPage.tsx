import { useI18n } from "../hooks/useI18n";

const ROWS = [
  "operator", "address", "phone", "email",
  "price", "payment", "delivery", "cancel", "extra",
] as const;

export function LegalPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-page flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-xl">
        <a href="/" className="text-sm text-theme-muted hover:text-theme-secondary transition-colors mb-6 inline-block">
          ← Bloom Log
        </a>
        <h1 className="text-xl font-bold text-theme-primary mb-6">{t["legal.title"]}</h1>
        <div className="bg-surface rounded-2xl border border-theme-light shadow-theme overflow-hidden">
          {ROWS.map((key, i) => (
            <div
              key={key}
              className={`flex flex-col sm:flex-row px-5 py-3.5 ${i > 0 ? "border-t border-theme-light" : ""}`}
            >
              <span className="text-sm font-semibold text-theme-secondary sm:w-36 shrink-0 mb-1 sm:mb-0">
                {t[`legal.${key}` as keyof typeof t]}
              </span>
              <span className="text-sm text-theme-secondary leading-relaxed">
                {t[`legal.${key}Value` as keyof typeof t]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
