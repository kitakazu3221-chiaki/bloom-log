export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF8]">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-50/60 blur-3xl pointer-events-none" />

        <div className="relative z-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-200 mb-6 animate-float">
            <span className="text-4xl">🌱</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight mb-3">
            Bloom Log
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
            変化は、記録から見えてくる。
          </p>
          <a
            href="/auth"
            className="inline-block px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition-all active:scale-[0.98]"
          >
            始める
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-2xl mx-auto">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: "📸",
              title: "変化を可視化",
              desc: "毎日の写真で、目では気づきにくい変化を確認できます",
            },
            {
              icon: "🔀",
              title: "Before / After比較",
              desc: "スライダーで過去と今を並べて、一目で違いがわかります",
            },
            {
              icon: "📝",
              title: "習慣も一緒に記録",
              desc: "シャンプーや睡眠など、頭皮に影響する情報も管理できます",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center"
            >
              <span className="text-3xl block mb-3">{f.icon}</span>
              <h3 className="text-sm font-bold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="px-6 py-16 bg-white border-y border-gray-100">
        <div className="max-w-md mx-auto">
          <h2 className="text-center text-sm font-bold text-gray-800 mb-8">
            使い方はシンプル
          </h2>
          <div className="space-y-6">
            {[
              { num: "1", text: "スマホで頭皮を撮影" },
              { num: "2", text: "自動で日付・部位ごとに整理" },
              { num: "3", text: "タイムラインで変化を確認" },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 text-sm font-bold shrink-0">
                  {s.num}
                </span>
                <p className="text-sm text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <p className="text-gray-500 text-sm mb-5">
          まずは無料トライアルからお試しください
        </p>
        <a
          href="/auth"
          className="inline-block px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition-all active:scale-[0.98]"
        >
          無料で始める
        </a>
      </section>
    </div>
  );
}
