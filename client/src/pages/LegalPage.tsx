import { useI18n } from "../hooks/useI18n";

const ROWS = [
  "operator", "address", "phone", "email",
  "price", "payment", "delivery", "cancel", "extra",
] as const;

export function LegalPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-xl">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6 inline-block">
          ← Bloom Log
        </a>
        <h1 className="text-xl font-bold text-gray-800 mb-6">{t["legal.title"]}</h1>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {ROWS.map((key, i) => (
            <div
              key={key}
              className={`flex flex-col sm:flex-row px-5 py-3.5 ${i > 0 ? "border-t border-gray-100" : ""}`}
            >
              <span className="text-sm font-semibold text-gray-600 sm:w-36 shrink-0 mb-1 sm:mb-0">
                {t[`legal.${key}` as keyof typeof t]}
              </span>
              <span className="text-sm text-gray-500 leading-relaxed">
                {t[`legal.${key}Value` as keyof typeof t]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
