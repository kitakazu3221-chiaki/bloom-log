export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-50/60 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl animate-fade-in-up">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 mb-4 animate-float">
            <span className="text-3xl">🌱</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight mb-2">
            Bloom Log
          </h1>
          <p className="text-lg text-gray-500">
            髪の変化は、記録から見えてくる。
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          {[
            {
              title: "変化を可視化",
              desc: "毎日の写真で、目では気づきにくい変化を確認",
            },
            {
              title: "Before / After比較",
              desc: "スライダーで過去と今を並べて一目瞭然",
            },
            {
              title: "習慣も一緒に記録",
              desc: "シャンプーや睡眠など頭皮に影響する情報も管理",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 text-center"
            >
              <h3 className="text-base font-bold text-gray-800 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 mb-8">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4 text-center">
            使い方
          </h2>
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            {[
              { num: "1", text: "スマホで撮影" },
              { num: "2", text: "自動で整理" },
              { num: "3", text: "変化を確認" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                {i > 0 && <span className="text-gray-200 mr-2 hidden sm:block">→</span>}
                <span className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 text-sm font-bold shrink-0">
                  {s.num}
                </span>
                <p className="text-sm text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/auth"
            className="inline-block px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-base shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition-all active:scale-[0.98]"
          >
            無料で始める
          </a>
          <p className="text-gray-400 text-sm mt-3">
            まずは無料トライアルからお試しください
          </p>
        </div>
      </div>
    </div>
  );
}
