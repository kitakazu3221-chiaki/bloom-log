import { useState, useRef, useEffect } from "react";
import { useI18n } from "../hooks/useI18n";

export function LanguageSelect({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-theme-muted hover:text-theme-secondary bg-secondary border border-theme rounded-lg px-2.5 py-1 transition-colors flex items-center gap-1.5"
      >
        <span className="text-xs">🌐</span>
        Language
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-theme rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px]">
          <button
            onClick={() => { setLocale("ja"); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
              locale === "ja" ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-theme-secondary hover:bg-[var(--card-hover)]"
            }`}
          >
            日本語
            {locale === "ja" && <span className="text-emerald-500 text-xs">✓</span>}
          </button>
          <button
            onClick={() => { setLocale("en"); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
              locale === "en" ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-theme-secondary hover:bg-[var(--card-hover)]"
            }`}
          >
            English
            {locale === "en" && <span className="text-emerald-500 text-xs">✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}
