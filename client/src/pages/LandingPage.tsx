import { useI18n } from "../hooks/useI18n";

export function LandingPage() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col items-center justify-center px-6 py-6 relative overflow-hidden">
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

      <div className="relative z-10 w-full max-w-2xl animate-fade-in-up">
        {/* Hero */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 mb-3 animate-float">
            <span className="text-2xl">🌱</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight mb-1">
            Bloom Log
          </h1>
          <p className="text-base text-gray-500">
            {t["landing.tagline"]}
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-3 sm:grid-cols-3 mb-5">
          {[
            { title: t["landing.feature1.title"], desc: t["landing.feature1.desc"] },
            { title: t["landing.feature2.title"], desc: t["landing.feature2.desc"] },
            { title: t["landing.feature3.title"], desc: t["landing.feature3.desc"] },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 text-center"
            >
              <h3 className="text-sm font-bold text-gray-800 mb-0.5">{f.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Strengths */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 text-center">
            {t["landing.strengthsTitle"]}
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {[
              { icon: "📱", title: t["landing.strength1.title"], desc: t["landing.strength1.desc"] },
              { icon: "🗂️", title: t["landing.strength2.title"], desc: t["landing.strength2.desc"] },
              { icon: "📝", title: t["landing.strength3.title"], desc: t["landing.strength3.desc"] },
              { icon: "🔒", title: t["landing.strength4.title"], desc: t["landing.strength4.desc"] },
              { icon: "🌐", title: t["landing.strength5.title"], desc: t["landing.strength5.desc"] },
            ].map((s) => (
              <div key={s.icon} className="flex items-start gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-sm shrink-0">
                  {s.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-gray-800">{s.title}</h3>
                  <p className="text-xs text-gray-400 leading-snug">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5 mb-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 text-center">
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
                <span className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
                  {s.num}
                </span>
                <p className="text-xs text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/auth"
            className="inline-block px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold text-base shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition-all active:scale-[0.98]"
          >
            {t["landing.cta"]}
          </a>
          <p className="text-gray-400 text-xs mt-2">
            {t["landing.ctaSub"]}
          </p>
          <a href="/legal" className="text-gray-300 hover:text-gray-400 text-xs mt-3 inline-block transition-colors">
            {t["landing.legal"]}
          </a>
        </div>
      </div>
    </div>
  );
}
