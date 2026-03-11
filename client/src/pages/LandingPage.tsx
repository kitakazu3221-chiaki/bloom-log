import { useI18n } from "../hooks/useI18n";
import { LanguageSelect } from "../components/LanguageSelect";
import { ThemeToggle } from "../components/ThemeToggle";

const FeatureIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <path d={d} fill="#059669" />
  </svg>
);

export function LandingPage() {
  const { t } = useI18n();

  const features = [
    { icon: "M7 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H7Zm5 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z", title: t["landing.strength1.title"], desc: t["landing.strength1.desc"] },
    { icon: "M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z", title: t["landing.strength2.title"], desc: t["landing.strength2.desc"] },
    { icon: "M9 2a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H9ZM4 6a2 2 0 0 1 2-2h1v1a1 1 0 0 0 2 0V4h6v1a1 1 0 1 0 2 0V4h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm4 4a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H9Z", title: t["landing.strength3.title"], desc: t["landing.strength3.desc"] },
    { icon: "M4 6a2 2 0 0 1 2-2h5v16H6a2 2 0 0 1-2-2V6Zm9-2h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5V4ZM11 11H7v2h4v-2Zm6 0h-4v2h4v-2Z", title: t["landing.feature2.title"], desc: t["landing.feature2.desc"] },
    { icon: "M12 2C9.24 2 7 4.24 7 7v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7c0-2.76-2.24-5-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Zm3 4a2 2 0 0 1 1 3.73V19a1 1 0 1 1-2 0v-1.27A2 2 0 0 1 12 14Z", title: t["landing.strength4.title"], desc: t["landing.strength4.desc"] },
    { icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 17.93A8.01 8.01 0 0 1 4.07 13H7v-2H4.07A8.01 8.01 0 0 1 11 4.07V7h2V4.07A8.01 8.01 0 0 1 19.93 11H17v2h2.93A8.01 8.01 0 0 1 13 19.93V17h-2v2.93Z", title: t["landing.strength5.title"], desc: t["landing.strength5.desc"] },
  ];

  const steps = [
    { num: "1", text: t["landing.step1"] },
    { num: "2", text: t["landing.step2"] },
    { num: "3", text: t["landing.step3"] },
  ];

  return (
    <div className="min-h-screen bg-page relative overflow-hidden" style={{ fontFamily: "'Kosugi Maru', sans-serif" }}>
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-50/60 blur-3xl pointer-events-none" />

      {/* Top controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelect className="[&_button:first-child]:bg-surface [&_button:first-child]:backdrop-blur-sm" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-12 px-6 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center mb-3 animate-float">
          <span className="text-5xl">🌱</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-theme-primary tracking-tight mb-3">
          Bloom Log
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-theme-secondary mb-8 max-w-xl mx-auto">
          {t["landing.tagline"]}
        </p>
        <a
          href="/auth"
          className="inline-block px-10 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-600/30 transition-all active:scale-[0.98]"
        >
          {t["landing.cta"]}
        </a>
        <p className="text-theme-secondary text-sm mt-3">
          {t["landing.ctaSub"]}
        </p>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 pb-14">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-theme-primary mb-8">
            {t["landing.strengthsTitle"]}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-surface rounded-2xl border border-theme-light shadow-theme p-6 flex flex-col gap-3 hover:shadow-theme-md transition-shadow"
              >
                <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-50 p-2">
                  <FeatureIcon d={f.icon} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-theme-primary mb-1">{f.title}</h3>
                  <p className="text-sm text-theme-secondary leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="relative z-10 px-6 pb-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-theme-primary mb-8">
            {t["landing.howToUse"]}
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-4 sm:gap-3">
                {i > 0 && (
                  <span className="hidden sm:block text-2xl text-emerald-300 mr-1">→</span>
                )}
                <div className="flex items-center gap-3 bg-surface rounded-2xl border border-theme-light shadow-theme px-6 py-4 sm:px-5 sm:py-3.5">
                  <span className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {s.num}
                  </span>
                  <p className="text-base text-theme-primary font-medium whitespace-nowrap">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="relative z-10 px-6 pb-16 text-center">
        <div className="max-w-xl mx-auto bg-surface rounded-3xl border border-theme-light shadow-theme p-8 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-theme-primary mb-2">
            {t["landing.cta"]}
          </h2>
          <p className="text-theme-secondary text-sm mb-6">
            {t["landing.ctaSub"]}
          </p>
          <a
            href="/auth"
            className="inline-block w-full sm:w-auto px-12 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-600/30 transition-all active:scale-[0.98]"
          >
            {t["landing.cta"]}
          </a>
        </div>
        <a href="/legal" className="text-theme-faint hover:text-theme-muted text-xs mt-4 inline-block transition-colors">
          {t["landing.legal"]}
        </a>
      </section>
    </div>
  );
}
