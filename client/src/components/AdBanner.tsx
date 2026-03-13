import { useState, useMemo } from "react";
import { useI18n } from "../hooks/useI18n";
import { JP_ADS, GLOBAL_ADS, type AdItem } from "../config/ads";

interface AdBannerProps {
  region: "jp" | "global";
  subscription: "trialing" | "active" | "expired";
}

export function AdBanner({ region, subscription }: AdBannerProps) {
  const { t, locale } = useI18n();

  // 有料会員には広告を表示しない
  if (subscription === "active") return null;

  const ads = region === "jp" ? JP_ADS : GLOBAL_ADS;

  // ランダムに1つ選ぶ（セッション中は固定）
  const ad = useMemo(() => ads[Math.floor(Math.random() * ads.length)], [ads]);

  return <AdCard ad={ad} locale={locale} t={t} />;
}

function AdCard({
  ad,
  locale,
  t,
}: {
  ad: AdItem;
  locale: string;
  t: Record<string, string>;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const title = locale === "ja" ? ad.titleJa : ad.titleEn;
  const desc = locale === "ja" ? ad.descJa : ad.descEn;

  return (
    <div className="relative bg-surface rounded-2xl border border-theme-light shadow-theme p-5 lg:p-6">
      {/* バッジ + 閉じるボタン */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
          {ad.badge}
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-theme-faint hover:text-theme-muted text-sm transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* 広告コンテンツ */}
      <a
        href={ad.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block group"
      >
        <p className="text-base lg:text-lg font-bold text-theme-primary group-hover:text-emerald-600 transition-colors mb-1.5">
          {title}
        </p>
        <p className="text-sm text-theme-muted leading-relaxed mb-3">
          {desc}
        </p>
        <span className="inline-flex items-center text-sm font-medium text-emerald-600 group-hover:text-emerald-500 transition-colors">
          {t["ad.learnMore"]} →
        </span>
      </a>

      {/* フッター: 開示 + アップグレードリンク */}
      <div className="mt-4 pt-3 border-t border-theme flex items-center justify-between text-xs text-theme-faint">
        <span>{t["ad.disclosure"]}</span>
        <span>
          {t["ad.hideAds"]}{" "}
          <a
            href="/paywall"
            className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors"
          >
            {t["ad.upgrade"]}
          </a>
        </span>
      </div>
    </div>
  );
}
