import { useI18n } from "../hooks/useI18n";

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
                <p className="text-sm lg:text-base text-gray-400 leading-relaxed">{f.desc}</p>
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
                { icon: "📱", title: t["landing.strength1.title"], desc: t["landing.strength1.desc"] },
                { icon: "🗂️", title: t["landing.strength2.title"], desc: t["landing.strength2.desc"] },
                { icon: "📝", title: t["landing.strength3.title"], desc: t["landing.strength3.desc"] },
                { icon: "🔒", title: t["landing.strength4.title"], desc: t["landing.strength4.desc"] },
                { icon: "🌐", title: t["landing.strength5.title"], desc: t["landing.strength5.desc"] },
              ].map((s) => (
                <div key={s.icon} className="flex items-start gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-base shrink-0">
                    {s.icon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm lg:text-base font-bold text-gray-800">{s.title}</h3>
                    <p className="text-sm lg:text-base text-gray-400 leading-snug">{s.desc}</p>
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
