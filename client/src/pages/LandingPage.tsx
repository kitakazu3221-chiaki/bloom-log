import { useI18n } from "../hooks/useI18n";

const StrengthIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <path d={d} fill="#059669" />
  </svg>
);

export function LandingPage() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col items-center justify-center px-6 py-4 lg:py-3 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-50/60 blur-3xl pointer-events-none" />

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setLocale(locale === "ja" ? "en" : "ja")}
          className="text-sm font-medium text-gray-400 hover:text-gray-600 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg px-2.5 py-1 transition-colors"
        >
          {locale === "ja" ? "EN" : "JA"}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-4xl animate-fade-in-up">
        {/* Hero */}
        <div className="text-center mb-3 lg:mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 mb-1 animate-float">
            <span className="text-2xl">🌱</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 tracking-tight mb-0.5">
            Bloom Log
          </h1>
          <p className="text-lg lg:text-xl text-gray-500">
            {t["landing.tagline"]}
          </p>
        </div>

        {/* Features + Strengths side by side on lg */}
        <div className="grid lg:grid-cols-2 gap-3 lg:gap-3 mb-2.5">
          {/* Features (3 cards stacked) */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:gap-2">
            {[
              { title: t["landing.feature1.title"], desc: t["landing.feature1.desc"] },
              { title: t["landing.feature2.title"], desc: t["landing.feature2.desc"] },
              { title: t["landing.feature3.title"], desc: t["landing.feature3.desc"] },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 lg:py-2.5 text-center lg:text-left lg:flex lg:items-center lg:gap-4"
              >
                <h3 className="text-base lg:text-lg font-bold text-gray-800 lg:shrink-0">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Strengths */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-2.5">
            <h2 className="text-sm lg:text-base font-bold text-gray-400 uppercase tracking-wide mb-1.5 text-center">
              {t["landing.strengthsTitle"]}
            </h2>
            <div className="space-y-1">
              {[
                { icon: "M7 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H7Zm5 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z", title: t["landing.strength1.title"], desc: t["landing.strength1.desc"] },
                { icon: "M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z", title: t["landing.strength2.title"], desc: t["landing.strength2.desc"] },
                { icon: "M9 2a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H9ZM4 6a2 2 0 0 1 2-2h1v1a1 1 0 0 0 2 0V4h6v1a1 1 0 1 0 2 0V4h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm4 4a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H9Z", title: t["landing.strength3.title"], desc: t["landing.strength3.desc"] },
                { icon: "M12 2C9.24 2 7 4.24 7 7v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7c0-2.76-2.24-5-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Zm3 4a2 2 0 0 1 1 3.73V19a1 1 0 1 1-2 0v-1.27A2 2 0 0 1 12 14Z", title: t["landing.strength4.title"], desc: t["landing.strength4.desc"] },
                { icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 17.93A8.01 8.01 0 0 1 4.07 13H7v-2H4.07A8.01 8.01 0 0 1 11 4.07V7h2V4.07A8.01 8.01 0 0 1 19.93 11H17v2h2.93A8.01 8.01 0 0 1 13 19.93V17h-2v2.93Z", title: t["landing.strength5.title"], desc: t["landing.strength5.desc"] },
              ].map((s) => (
                <div key={s.title} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 shrink-0 mt-0.5">
                    <StrengthIcon d={s.icon} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm lg:text-base font-bold text-gray-800">{s.title}</h3>
                    <p className="text-sm text-gray-400 leading-snug">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-2 mb-2.5">
          <h2 className="text-sm lg:text-base font-bold text-gray-400 uppercase tracking-wide mb-2 text-center">
            {t["landing.howToUse"]}
          </h2>
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            {[
              { num: "1", text: t["landing.step1"] },
              { num: "2", text: t["landing.step2"] },
              { num: "3", text: t["landing.step3"] },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                {i > 0 && <span className="text-gray-200 mr-2 hidden sm:block">→</span>}
                <span className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 text-sm font-bold shrink-0">
                  {s.num}
                </span>
                <p className="text-base lg:text-lg text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/auth"
            className="inline-block px-12 py-3 rounded-xl bg-emerald-600 text-white font-bold text-lg lg:text-xl shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition-all active:scale-[0.98]"
          >
            {t["landing.cta"]}
          </a>
          <p className="text-gray-400 text-sm lg:text-base mt-1.5">
            {t["landing.ctaSub"]}
          </p>
          <a href="/legal" className="text-gray-300 hover:text-gray-400 text-xs mt-1 inline-block transition-colors">
            {t["landing.legal"]}
          </a>
        </div>
      </div>
    </div>
  );
}
