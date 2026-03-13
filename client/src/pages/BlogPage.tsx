import { useI18n } from "../hooks/useI18n";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageSelect } from "../components/LanguageSelect";

interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  tags: string[];
}

const articles: Record<string, BlogArticle[]> = {
  ja: [
    {
      slug: "aga-treatment-tracking-guide",
      title: "AGA治療の経過を記録する方法｜写真で見る薄毛改善ガイド",
      description:
        "AGA治療を始めたら、経過を写真で記録することが重要です。本記事では、効果的な頭皮写真の撮り方や記録のコツ、治療経過を視覚化するメリットを解説します。",
      date: "2026-03-13",
      readTime: "5分",
      tags: ["AGA治療", "薄毛対策", "経過記録"],
    },
    {
      slug: "scalp-photo-tips",
      title: "頭皮写真の上手な撮り方｜薄毛の経過観察に役立つ撮影テクニック",
      description:
        "薄毛治療の効果を正しく比較するには、毎回同じ条件で頭皮写真を撮ることが大切です。照明・角度・距離の3つのポイントを押さえた撮影テクニックを紹介します。",
      date: "2026-03-13",
      readTime: "4分",
      tags: ["頭皮写真", "撮影テクニック", "経過観察"],
    },
    {
      slug: "lifestyle-hair-health",
      title: "生活習慣と髪の健康｜睡眠・食事・ストレスが薄毛に与える影響",
      description:
        "薄毛の進行には生活習慣が深く関わっています。睡眠、食事、ストレス、運動が髪の健康にどう影響するかをデータに基づいて解説します。",
      date: "2026-03-13",
      readTime: "6分",
      tags: ["生活習慣", "髪の健康", "薄毛予防"],
    },
  ],
  en: [
    {
      slug: "aga-treatment-tracking-guide",
      title: "How to Track Your Hair Loss Treatment Progress with Photos",
      description:
        "Tracking your AGA treatment with consistent scalp photos is key to understanding effectiveness. Learn tips for capturing, comparing, and visualizing your progress.",
      date: "2026-03-13",
      readTime: "5 min",
      tags: ["AGA Treatment", "Hair Loss", "Progress Tracking"],
    },
    {
      slug: "scalp-photo-tips",
      title: "Scalp Photography Tips for Accurate Hair Loss Monitoring",
      description:
        "Getting consistent, comparable scalp photos requires proper lighting, angle, and distance. Master these 3 techniques for reliable before/after comparisons.",
      date: "2026-03-13",
      readTime: "4 min",
      tags: ["Scalp Photos", "Photography Tips", "Monitoring"],
    },
    {
      slug: "lifestyle-hair-health",
      title: "How Sleep, Diet & Stress Affect Your Hair Health",
      description:
        "Your daily habits have a significant impact on hair loss. Learn how sleep quality, nutrition, stress levels, and exercise influence hair growth and thinning.",
      date: "2026-03-13",
      readTime: "6 min",
      tags: ["Lifestyle", "Hair Health", "Prevention"],
    },
  ],
};

export function BlogListPage() {
  const { locale } = useI18n();
  const list = articles[locale] ?? articles.ja;
  const isJa = locale === "ja";

  return (
    <div
      className="min-h-screen bg-page"
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-theme-light">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-lg text-theme-primary">
              Bloom Log
            </span>
          </a>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelect />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-theme-primary mb-2">
          {isJa ? "ブログ" : "Blog"}
        </h1>
        <p className="text-theme-secondary mb-8">
          {isJa
            ? "薄毛治療・頭皮ケアに関するお役立ち情報"
            : "Helpful articles about hair loss treatment & scalp care"}
        </p>

        <div className="grid gap-6">
          {list.map((article) => (
            <a
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="block bg-surface rounded-2xl border border-theme-light shadow-theme p-6 hover:shadow-theme-md transition-shadow group"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-xl font-bold text-theme-primary mb-2 group-hover:text-emerald-600 transition-colors">
                {article.title}
              </h2>
              <p className="text-theme-secondary text-sm leading-relaxed mb-3">
                {article.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-theme-faint">
                <span>{article.date}</span>
                <span>
                  {isJa ? "読了" : "Read"}: {article.readTime}
                </span>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="/auth"
            className="inline-block px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-all"
          >
            {isJa
              ? "Bloom Logを無料で始める"
              : "Start Bloom Log for Free"}
          </a>
        </div>
      </main>

      <footer className="border-t border-theme-light py-6 text-center text-xs text-theme-faint">
        <p>&copy; 2026 Bloom Log. All rights reserved.</p>
      </footer>
    </div>
  );
}

export function BlogArticlePage({ slug }: { slug: string }) {
  const { locale } = useI18n();
  const isJa = locale === "ja";
  const list = articles[locale] ?? articles.ja;
  const article = list.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">404</p>
          <p className="text-theme-secondary">
            {isJa ? "記事が見つかりません" : "Article not found"}
          </p>
          <a href="/blog" className="text-emerald-600 mt-4 inline-block">
            {isJa ? "ブログ一覧に戻る" : "Back to Blog"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-page"
    >
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-theme-light">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-lg text-theme-primary">
              Bloom Log
            </span>
          </a>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelect />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <a
          href="/blog"
          className="text-emerald-600 text-sm mb-6 inline-flex items-center gap-1 hover:underline"
        >
          <span>&#8592;</span>{" "}
          {isJa ? "ブログ一覧" : "All Articles"}
        </a>

        <article className="mt-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary mb-3 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-theme-faint mb-8">
            <span>{article.date}</span>
            <span>
              {isJa ? "読了" : "Read"}: {article.readTime}
            </span>
          </div>

          {/* Article body */}
          <ArticleContent slug={slug} locale={locale} />

          {/* CTA */}
          <div className="mt-12 p-8 bg-emerald-50 rounded-2xl text-center border border-emerald-200">
            <h3 className="text-xl font-bold text-emerald-800 mb-2">
              {isJa
                ? "頭皮の変化を記録しませんか？"
                : "Ready to track your scalp changes?"}
            </h3>
            <p className="text-emerald-700 text-sm mb-4">
              {isJa
                ? "Bloom Logなら、毎日の頭皮写真を簡単に記録・比較できます。14日間無料。"
                : "Bloom Log makes it easy to capture and compare daily scalp photos. Free for 14 days."}
            </p>
            <a
              href="/auth"
              className="inline-block px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-all"
            >
              {isJa ? "無料で始める" : "Start Free"}
            </a>
          </div>
        </article>
      </main>

      <footer className="border-t border-theme-light py-6 text-center text-xs text-theme-faint mt-16">
        <p>&copy; 2026 Bloom Log. All rights reserved.</p>
      </footer>
    </div>
  );
}

/* ─── Article Content by slug ─── */

function ArticleContent({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const isJa = locale === "ja";

  if (slug === "aga-treatment-tracking-guide") {
    return isJa ? <AGATrackingGuideJA /> : <AGATrackingGuideEN />;
  }
  if (slug === "scalp-photo-tips") {
    return isJa ? <ScalpPhotoTipsJA /> : <ScalpPhotoTipsEN />;
  }
  if (slug === "lifestyle-hair-health") {
    return isJa ? <LifestyleHairJA /> : <LifestyleHairEN />;
  }
  return null;
}

const prose =
  "prose prose-emerald max-w-none text-theme-primary [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-theme-primary [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-theme-primary [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-theme-secondary [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-theme-secondary [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-theme-secondary [&_ol]:mb-4 [&_li]:mb-1 [&_strong]:text-theme-primary";

/* ─── Article 1: AGA治療経過記録ガイド (JA) ─── */
function AGATrackingGuideJA() {
  return (
    <div className={prose}>
      <p>
        AGA（男性型脱毛症）の治療を始めると、効果が実感できるまでに3〜6ヶ月かかると言われています。
        この長い期間、自分の治療が正しい方向に進んでいるか不安になることも多いでしょう。
        そんなとき、毎日の頭皮写真による経過記録が大きな助けになります。
      </p>

      <h2>なぜ経過記録が重要なのか</h2>
      <p>
        薄毛の変化は非常にゆっくり進むため、鏡を見ているだけでは変化に気づきにくいものです。
        写真で記録を残しておくと、以下のメリットがあります。
      </p>
      <ul>
        <li>
          <strong>客観的な比較が可能</strong>
          ：感覚ではなくデータで治療効果を判断できる
        </li>
        <li>
          <strong>モチベーション維持</strong>
          ：小さな改善も可視化されるため治療を続けやすい
        </li>
        <li>
          <strong>医師との共有</strong>
          ：診察時に経過写真を見せることで、より的確なアドバイスが得られる
        </li>
        <li>
          <strong>治療方針の見直し</strong>
          ：効果がない場合の判断材料になる
        </li>
      </ul>

      <h2>効果的な記録の取り方</h2>
      <h3>1. 撮影のタイミングを固定する</h3>
      <p>
        毎日同じ時間帯に撮影するのが理想的です。朝のスタイリング前、入浴後など、
        髪の状態が安定しているタイミングを選びましょう。
      </p>

      <h3>2. 3つのアングルから撮影</h3>
      <p>
        頭頂部（上から）、前頭部（正面）、側頭部（横から）の3方向から撮影することで、
        薄毛の進行を多角的に把握できます。Bloom
        Logではこの3アングルに対応した撮影ガイドを提供しています。
      </p>

      <h3>3. 生活習慣も一緒に記録する</h3>
      <p>
        睡眠時間、ストレスレベル、食事内容、運動の有無など、生活習慣のデータも併せて記録すると、
        どの要因が髪の状態に影響しているかを分析できるようになります。
      </p>

      <h2>Bloom Logを使った記録方法</h2>
      <p>
        Bloom
        Logは、薄毛治療の経過記録に特化したWebアプリです。スマートフォンのカメラで頭皮を撮影し、
        日付・アングル・生活習慣データと一緒に自動保存されます。Before/After比較スライダーで、
        治療開始時と現在の状態を視覚的に比較でき、PC-スマホ連携撮影機能により、
        1人でも簡単に頭頂部の写真を撮ることができます。
      </p>

      <h2>まとめ</h2>
      <p>
        AGA治療は長期戦です。毎日の写真記録を習慣にすることで、治療効果の可視化、
        モチベーション維持、そしてより良い治療判断につながります。
        まずは今日から、頭皮の写真を1枚撮ることから始めてみませんか。
      </p>
    </div>
  );
}

/* ─── Article 1: AGA Treatment Tracking Guide (EN) ─── */
function AGATrackingGuideEN() {
  return (
    <div className={prose}>
      <p>
        When starting AGA (androgenetic alopecia) treatment, it typically
        takes 3-6 months to see noticeable results. During this long period,
        daily scalp photo documentation can be incredibly valuable for
        tracking your progress.
      </p>

      <h2>Why Progress Tracking Matters</h2>
      <p>
        Hair changes happen so gradually that they are nearly invisible
        day-to-day. Photo documentation provides these benefits:
      </p>
      <ul>
        <li>
          <strong>Objective comparison</strong>: Judge treatment
          effectiveness with data, not feelings
        </li>
        <li>
          <strong>Motivation</strong>: Even small improvements become visible
          when compared side-by-side
        </li>
        <li>
          <strong>Doctor consultations</strong>: Share progress photos for
          better medical advice
        </li>
        <li>
          <strong>Treatment decisions</strong>: Evidence-based reasons to
          continue or adjust your regimen
        </li>
      </ul>

      <h2>How to Track Effectively</h2>
      <h3>1. Fix Your Schedule</h3>
      <p>
        Take photos at the same time each day. Before styling in the morning
        or after showering ensures consistent hair conditions.
      </p>

      <h3>2. Capture 3 Angles</h3>
      <p>
        Top (bird's eye), front (hairline), and side views give you a
        comprehensive picture of any changes. Bloom Log provides guided
        capture for all three angles.
      </p>

      <h3>3. Log Your Lifestyle Too</h3>
      <p>
        Sleep hours, stress levels, diet quality, and exercise - tracking
        these alongside photos helps identify which factors affect your hair
        health.
      </p>

      <h2>Tracking with Bloom Log</h2>
      <p>
        Bloom Log is a web app purpose-built for hair loss treatment
        tracking. Capture scalp photos with your smartphone, automatically
        saved with date, angle, and lifestyle data. The before/after
        comparison slider lets you visually compare your starting point with
        your current state. The PC-to-phone remote capture feature makes it
        easy to photograph the top of your head on your own.
      </p>

      <h2>Key Takeaways</h2>
      <p>
        AGA treatment is a marathon, not a sprint. Building a daily photo
        habit helps you see progress, stay motivated, and make informed
        treatment decisions. Start today with just one photo.
      </p>
    </div>
  );
}

/* ─── Article 2: 頭皮写真の撮り方 (JA) ─── */
function ScalpPhotoTipsJA() {
  return (
    <div className={prose}>
      <p>
        薄毛治療の経過を正確に記録するには、毎回同じ条件で頭皮写真を撮影することが重要です。
        照明、角度、距離の3つのポイントを押さえるだけで、比較しやすい写真が撮れるようになります。
      </p>

      <h2>1. 照明を統一する</h2>
      <p>
        写真の見え方に最も影響するのが照明です。以下のポイントを意識しましょう。
      </p>
      <ul>
        <li>
          <strong>同じ場所で撮影する</strong>
          ：毎回同じ部屋・同じ照明条件で撮影
        </li>
        <li>
          <strong>天井照明を正面に</strong>
          ：影が均一になるポジションを見つける
        </li>
        <li>
          <strong>フラッシュは使わない</strong>
          ：反射で頭皮の状態が正しく写らないため
        </li>
        <li>
          <strong>自然光を活用</strong>
          ：窓際で撮影すると、より自然な色味で記録できる
        </li>
      </ul>

      <h2>2. アングルを固定する</h2>
      <p>頭皮写真は3つのアングルから撮影するのが効果的です。</p>
      <ul>
        <li>
          <strong>頭頂部（Top）</strong>
          ：真上から撮影。つむじ周辺の薄毛を確認
        </li>
        <li>
          <strong>前頭部（Front）</strong>
          ：正面から撮影。生え際のラインを確認
        </li>
        <li>
          <strong>側頭部（Side）</strong>
          ：横から撮影。全体的なボリュームを確認
        </li>
      </ul>
      <p>
        Bloom LogのPC-スマホ連携機能を使えば、PCの画面でプレビューしながら
        スマホで撮影できるため、頭頂部の撮影も1人で簡単にできます。
      </p>

      <h2>3. 距離を一定に保つ</h2>
      <ul>
        <li>カメラと頭皮の距離を毎回15〜20cm程度に統一する</li>
        <li>できれば三脚やスマホスタンドを活用する</li>
        <li>ズーム機能は使わない（画質が劣化するため）</li>
      </ul>

      <h2>4. その他のコツ</h2>
      <ul>
        <li>
          <strong>髪を同じスタイルに</strong>
          ：分け目を毎回同じにして撮影
        </li>
        <li>
          <strong>乾いた状態で撮影</strong>：濡れた髪は薄く見えるため
        </li>
        <li>
          <strong>同じ時間帯に撮影</strong>
          ：朝と夜で頭皮の状態は変わる
        </li>
      </ul>

      <h2>まとめ</h2>
      <p>
        頭皮写真の品質を安定させることで、治療効果の判断精度が大きく向上します。
        照明・角度・距離の3つを統一するだけで、信頼性の高いBefore/After比較が可能になります。
      </p>
    </div>
  );
}

/* ─── Article 2: Scalp Photo Tips (EN) ─── */
function ScalpPhotoTipsEN() {
  return (
    <div className={prose}>
      <p>
        Accurate hair loss monitoring depends on consistent photo conditions.
        By controlling just three variables - lighting, angle, and distance -
        you can capture comparable photos every time.
      </p>

      <h2>1. Standardize Your Lighting</h2>
      <ul>
        <li>
          <strong>Same location every time</strong>: Find one spot with
          consistent lighting
        </li>
        <li>
          <strong>Overhead lighting</strong>: Position yourself under even
          ceiling light
        </li>
        <li>
          <strong>Skip the flash</strong>: Flash creates glare that distorts
          appearance
        </li>
        <li>
          <strong>Natural light works best</strong>: Window-side photos
          capture true color
        </li>
      </ul>

      <h2>2. Fix Your Angles</h2>
      <ul>
        <li>
          <strong>Top view</strong>: Directly above, checking the crown area
        </li>
        <li>
          <strong>Front view</strong>: Straight-on, documenting the hairline
        </li>
        <li>
          <strong>Side view</strong>: Profile angle for overall volume
          assessment
        </li>
      </ul>
      <p>
        Bloom Log's PC-to-phone remote capture lets you preview on your
        computer screen while shooting with your phone - making top-of-head
        photos easy to capture alone.
      </p>

      <h2>3. Keep Distance Consistent</h2>
      <ul>
        <li>Maintain 15-20cm (6-8 inches) from camera to scalp</li>
        <li>Use a phone stand or tripod when possible</li>
        <li>Avoid digital zoom (degrades image quality)</li>
      </ul>

      <h2>4. Additional Tips</h2>
      <ul>
        <li>
          <strong>Same hairstyle</strong>: Keep your part consistent
        </li>
        <li>
          <strong>Dry hair only</strong>: Wet hair appears thinner
        </li>
        <li>
          <strong>Same time of day</strong>: Scalp condition varies
          throughout the day
        </li>
      </ul>

      <h2>Summary</h2>
      <p>
        Consistent photo conditions are the foundation of reliable progress
        tracking. Control lighting, angle, and distance to create
        trustworthy before/after comparisons.
      </p>
    </div>
  );
}

/* ─── Article 3: 生活習慣と髪の健康 (JA) ─── */
function LifestyleHairJA() {
  return (
    <div className={prose}>
      <p>
        薄毛は遺伝的要因だけでなく、日々の生活習慣によっても大きく影響を受けます。
        睡眠、食事、ストレス、運動などの生活要因と髪の健康の関係について解説します。
      </p>

      <h2>睡眠と髪の成長</h2>
      <p>
        髪の成長に必要な成長ホルモンは、主に深い睡眠中に分泌されます。
        睡眠不足が続くと、毛髪の成長サイクルが乱れ、薄毛が進行しやすくなります。
      </p>
      <ul>
        <li>理想的な睡眠時間は7〜8時間</li>
        <li>就寝・起床時間を一定に保つことが重要</li>
        <li>睡眠の質も量と同じくらい大切</li>
      </ul>

      <h2>食事と栄養</h2>
      <p>
        髪の主成分であるケラチンの生成には、タンパク質、亜鉛、鉄分、ビタミンB群が不可欠です。
      </p>
      <ul>
        <li>
          <strong>タンパク質</strong>：肉、魚、卵、大豆製品を毎食取り入れる
        </li>
        <li>
          <strong>亜鉛</strong>：牡蠣、ナッツ類、レバーに豊富
        </li>
        <li>
          <strong>鉄分</strong>：ほうれん草、赤身肉、貝類から摂取
        </li>
        <li>
          <strong>ビタミンB群</strong>：全粒穀物、卵、緑黄色野菜
        </li>
      </ul>

      <h2>ストレスの影響</h2>
      <p>
        慢性的なストレスは、コルチゾールの分泌を増加させ、毛髪の成長サイクルを乱します。
        休止期脱毛症（テロゲンエフルビウム）と呼ばれる急激な抜け毛を引き起こすこともあります。
      </p>
      <ul>
        <li>定期的なリラックス時間の確保</li>
        <li>瞑想やヨガなどのストレス管理法の実践</li>
        <li>趣味や社交活動でのストレス発散</li>
      </ul>

      <h2>運動の効果</h2>
      <p>
        適度な運動は血行を促進し、頭皮への栄養供給を改善します。
        また、ストレスホルモンの低減にも効果的です。
      </p>
      <ul>
        <li>週3〜4回、30分程度の有酸素運動が理想的</li>
        <li>ウォーキング、ジョギング、水泳など</li>
        <li>過度な運動は逆にストレスになるので注意</li>
      </ul>

      <h2>Bloom Logで生活習慣を記録しよう</h2>
      <p>
        Bloom
        Logでは、頭皮写真と一緒に睡眠時間、ストレスレベル、食事内容、運動の有無を記録できます。
        インサイト機能では、これらの生活習慣と髪の状態の相関を分析し、
        あなたに最適な生活改善ポイントを発見する手助けをします。
      </p>

      <h2>まとめ</h2>
      <p>
        薄毛対策は薬だけでなく、生活習慣の改善も重要な柱です。
        睡眠、食事、ストレス管理、運動の4つを意識し、その変化を記録することで、
        より効果的な薄毛対策が可能になります。
      </p>
    </div>
  );
}

/* ─── Article 3: Lifestyle & Hair Health (EN) ─── */
function LifestyleHairEN() {
  return (
    <div className={prose}>
      <p>
        Hair loss is influenced not just by genetics but significantly by
        daily lifestyle habits. Understanding how sleep, diet, stress, and
        exercise affect hair health empowers you to take proactive steps.
      </p>

      <h2>Sleep & Hair Growth</h2>
      <p>
        Growth hormone, essential for hair follicle activity, is primarily
        released during deep sleep. Chronic sleep deprivation disrupts the
        hair growth cycle and accelerates thinning.
      </p>
      <ul>
        <li>Aim for 7-8 hours of quality sleep</li>
        <li>Maintain consistent sleep and wake times</li>
        <li>Sleep quality matters as much as quantity</li>
      </ul>

      <h2>Nutrition & Diet</h2>
      <p>
        Hair is made primarily of keratin protein. Key nutrients for healthy
        hair include:
      </p>
      <ul>
        <li>
          <strong>Protein</strong>: Meat, fish, eggs, legumes at every meal
        </li>
        <li>
          <strong>Zinc</strong>: Oysters, nuts, seeds
        </li>
        <li>
          <strong>Iron</strong>: Spinach, red meat, shellfish
        </li>
        <li>
          <strong>B vitamins</strong>: Whole grains, eggs, leafy greens
        </li>
      </ul>

      <h2>Stress Impact</h2>
      <p>
        Chronic stress increases cortisol, which disrupts the hair growth
        cycle. It can trigger telogen effluvium - a condition causing
        significant temporary hair shedding.
      </p>
      <ul>
        <li>Schedule regular relaxation time</li>
        <li>Practice meditation or yoga</li>
        <li>Engage in hobbies and social activities</li>
      </ul>

      <h2>Exercise Benefits</h2>
      <p>
        Regular exercise improves blood circulation to the scalp and reduces
        stress hormones.
      </p>
      <ul>
        <li>Aim for 30 minutes of cardio, 3-4 times per week</li>
        <li>Walking, jogging, and swimming are excellent options</li>
        <li>Avoid overtraining, which can increase cortisol</li>
      </ul>

      <h2>Track Habits with Bloom Log</h2>
      <p>
        Bloom Log lets you record sleep, stress, diet, and exercise
        alongside your daily scalp photos. The Insights feature analyzes
        correlations between your lifestyle data and hair condition, helping
        you discover which habits matter most.
      </p>

      <h2>Key Takeaways</h2>
      <p>
        Effective hair loss management goes beyond medication. By optimizing
        sleep, nutrition, stress management, and exercise - and tracking the
        results - you gain a powerful advantage in your treatment journey.
      </p>
    </div>
  );
}
