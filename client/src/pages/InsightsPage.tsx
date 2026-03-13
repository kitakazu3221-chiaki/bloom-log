import { useState, useEffect, useCallback, useMemo } from "react";
import { useI18n } from "../hooks/useI18n";
import { useStorage, type StorageMode } from "../hooks/useStorage";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageSelect } from "../components/LanguageSelect";
import { AdBanner } from "../components/AdBanner";
import {
  aggregateDailyData,
  computeCorrelations,
  getTimeSeriesData,
  type CorrelationResult,
} from "../utils/correlation";
import type { PhotoRecord } from "../types";

interface InsightsPageProps {
  username: string;
  onLogout: () => void;
  subscription: "free" | "active";
  createdAt: string;
  storageMode: StorageMode;
  region: "jp" | "global";
}

const MIN_DAYS = 14;

const FACTOR_I18N: Record<string, string> = {
  sleep: "insights.factorSleep",
  stress: "insights.factorStress",
  exercise: "insights.factorExercise",
  diet: "insights.factorDiet",
  alcohol: "insights.factorAlcohol",
  scalpMassage: "insights.factorMassage",
};

function SimpleLineChart({
  data,
  color = "#059669",
  yMin = 0,
  yMax,
  yLabel,
}: {
  data: { date: string; value: number }[];
  color?: string;
  yMin?: number;
  yMax?: number;
  yLabel?: string;
}) {
  if (data.length === 0) return null;

  const width = 400;
  const height = 140;
  const padLeft = 50;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 28;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const values = data.map((d) => d.value);
  const actualMin = Math.min(...values);
  const actualMax = Math.max(...values);
  const minY = yMin ?? actualMin;
  const maxY = yMax ?? actualMax;
  const rangeY = maxY - minY || 1;

  const points = data.map((d, i) => {
    const x = padLeft + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
    const y = padTop + chartH - ((d.value - minY) / rangeY) * chartH;
    return { x, y, date: d.date };
  });

  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `${points[0].x},${padTop + chartH} ${linePoints} ${points[points.length - 1].x},${padTop + chartH}`;

  // Show a few date labels
  const labelIndices: number[] = [];
  if (data.length <= 5) {
    data.forEach((_, i) => labelIndices.push(i));
  } else {
    labelIndices.push(0, Math.floor(data.length / 2), data.length - 1);
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = padTop + chartH - frac * chartH;
        return (
          <line
            key={frac}
            x1={padLeft}
            y1={y}
            x2={width - padRight}
            y2={y}
            stroke="var(--border)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Y-axis labels */}
      <text x={padLeft - 6} y={padTop + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10">
        {maxY}
      </text>
      <text x={padLeft - 6} y={padTop + chartH + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10">
        {minY}
      </text>
      {yLabel && (
        <text x={12} y={padTop + chartH / 2} textAnchor="middle" fill="var(--text-muted)" fontSize="9" transform={`rotate(-90 12 ${padTop + chartH / 2})`}>
          {yLabel}
        </text>
      )}

      {/* Area fill */}
      <polygon points={areaPoints} fill={color} opacity="0.1" />

      {/* Line */}
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}

      {/* X-axis date labels */}
      {labelIndices.map((i) => (
        <text
          key={i}
          x={points[i].x}
          y={height - 4}
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize="9"
        >
          {data[i].date.slice(5)}
        </text>
      ))}
    </svg>
  );
}

function CorrelationCard({
  result,
  t,
}: {
  result: CorrelationResult;
  t: Record<string, string>;
}) {
  const factorALabel = t[FACTOR_I18N[result.factorA] ?? ""] ?? result.factorA;
  const factorBLabel = t[FACTOR_I18N[result.factorB] ?? ""] ?? result.factorB;

  const dirColor =
    result.direction === "positive"
      ? "text-emerald-600"
      : result.direction === "negative"
      ? "text-red-500"
      : "text-theme-muted";

  const dirBg =
    result.direction === "positive"
      ? "bg-emerald-600/10"
      : result.direction === "negative"
      ? "bg-red-500/10"
      : "bg-secondary";

  const dirLabel =
    result.direction === "positive"
      ? t["insights.positive"]
      : result.direction === "negative"
      ? t["insights.negative"]
      : t["insights.neutral"];

  const strengthLabel =
    result.strength === "strong"
      ? t["insights.strong"]
      : result.strength === "moderate"
      ? t["insights.moderate"]
      : t["insights.weak"];

  return (
    <div className="bg-surface border border-theme rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-theme-primary">
          {factorALabel} × {factorBLabel}
        </span>
        <span className={`text-sm font-bold ${dirColor}`}>
          r = {result.r.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dirBg} ${dirColor}`}>
          {dirLabel}
        </span>
        <span className="text-xs text-theme-muted">
          {strengthLabel} · {t["insights.sampleSize"]} {result.n}
        </span>
      </div>
    </div>
  );
}

export function InsightsPage({
  username: _username,
  onLogout,
  subscription,
  createdAt,
  storageMode,
  region,
}: InsightsPageProps) {
  const { t, locale } = useI18n();
  const storage = useStorage(storageMode);
  const [records, setRecords] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const recs = await storage.loadRecords();
      setRecords(recs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dailyData = useMemo(() => aggregateDailyData(records), [records]);
  const uniqueDays = dailyData.length;
  const hasEnoughData = uniqueDays >= MIN_DAYS;

  const sleepData = useMemo(
    () => getTimeSeriesData(records, "sleep", 30),
    [records]
  );
  const stressData = useMemo(
    () => getTimeSeriesData(records, "stress", 30),
    [records]
  );
  const dietData = useMemo(
    () => getTimeSeriesData(records, "diet", 30),
    [records]
  );

  const correlations = useMemo(
    () => (hasEnoughData ? computeCorrelations(records) : []),
    [records, hasEnoughData]
  );

  const isPremium = subscription === "active";

  const dayCount = Math.max(
    1,
    Math.ceil(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div
      className="min-h-screen bg-page flex flex-col overflow-x-hidden"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-header backdrop-blur-sm border-b border-theme">
        <div className="flex items-center justify-between px-4 md:px-6 py-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-lg">🌱</span>
            <h1 className="text-base font-bold text-theme-primary tracking-tight whitespace-nowrap">
              Bloom Log
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            {subscription === "free" && (
              <a href="/upgrade" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 whitespace-nowrap hover:bg-emerald-100 transition-colors">
                {t["premium.badge"]}
              </a>
            )}
            <button onClick={onLogout} className="text-[10px] text-theme-muted hover:text-theme-secondary transition-colors whitespace-nowrap">
              {t["common.logout"]}
            </button>
            <ThemeToggle />
            <LanguageSelect />
          </div>
        </div>
        <div className="flex items-center gap-1 px-4 md:px-6 pb-2">
          <a href="/" className="text-xs font-medium text-theme-secondary bg-secondary hover:bg-[var(--border)] border border-theme rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap">
            {t["home.home"]}
          </a>
          <a href="/capture" className="text-xs font-medium text-theme-secondary bg-secondary hover:bg-[var(--border)] border border-theme rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap">
            {t["home.capture"]}
          </a>
          <a href="/history" className="text-xs font-medium text-theme-secondary bg-secondary hover:bg-[var(--border)] border border-theme rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap">
            {t["pc.history"]}
          </a>
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 ml-auto whitespace-nowrap">
            {locale === "ja" ? `${dayCount}${t["pc.dayCount"]}` : `Day ${dayCount}`}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        <h2 className="text-2xl font-bold text-theme-primary">{t["insights.title"]}</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Data progress */}
            {!hasEnoughData && (
              <div className="bg-surface border border-theme rounded-2xl p-5 space-y-3">
                <p className="text-base font-semibold text-theme-primary">
                  {t["insights.dataProgress"]}
                </p>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className="bg-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (uniqueDays / MIN_DAYS) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-theme-muted">
                  <span>{t["insights.recordedDays"]}: {uniqueDays}</span>
                  <span>{t["insights.requiredDays"]}: {MIN_DAYS}</span>
                </div>
                <p className="text-sm text-theme-secondary">
                  {t["insights.needMoreData"].replace("{count}", String(MIN_DAYS - uniqueDays))}
                </p>
              </div>
            )}

            {/* Trend Charts */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-theme-primary flex items-center gap-2">
                {t["insights.last30Days"]}
              </h3>

              {/* Sleep trend */}
              {sleepData.length > 0 && (
                <div className="bg-surface border border-theme rounded-2xl p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-theme-secondary">
                    {t["insights.sleepTrend"]}
                  </h4>
                  <SimpleLineChart
                    data={sleepData}
                    color="#059669"
                    yMin={0}
                    yMax={12}
                    yLabel={t["insights.hours"]}
                  />
                </div>
              )}

              {/* Stress trend */}
              {stressData.length > 0 && (
                <div className="bg-surface border border-theme rounded-2xl p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-theme-secondary">
                    {t["insights.stressTrend"]}
                  </h4>
                  <SimpleLineChart
                    data={stressData}
                    color="#ef4444"
                    yMin={1}
                    yMax={5}
                    yLabel={t["insights.level"]}
                  />
                </div>
              )}

              {/* Diet trend */}
              {dietData.length > 0 && (
                <div className="bg-surface border border-theme rounded-2xl p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-theme-secondary">
                    {t["insights.dietTrend"]}
                  </h4>
                  <SimpleLineChart
                    data={dietData}
                    color="#3b82f6"
                    yMin={1}
                    yMax={5}
                    yLabel={t["insights.level"]}
                  />
                </div>
              )}

              {sleepData.length === 0 && stressData.length === 0 && dietData.length === 0 && (
                <div className="bg-surface border border-theme rounded-2xl p-8 text-center">
                  <p className="text-theme-muted">{t["insights.noData"]}</p>
                </div>
              )}
            </div>

            {/* Correlation Analysis */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-theme-primary">
                {t["insights.correlations"]}
              </h3>

              <div className="relative">
                {/* Blur overlay for non-premium */}
                {!isPremium && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/60 backdrop-blur-sm rounded-2xl">
                    <div className="text-center space-y-3 p-6">
                      <div className="w-12 h-12 mx-auto bg-secondary rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-theme-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-theme-primary">
                        {t["insights.premiumRequired"]}
                      </p>
                      <p className="text-sm text-theme-muted max-w-xs">
                        {t["insights.unlockCorrelations"]}
                      </p>
                      <button
                        onClick={() => (window.location.href = "/upgrade")}
                        className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/20"
                      >
                        {t["insights.upgrade"]}
                      </button>
                    </div>
                  </div>
                )}

                {/* Correlation content */}
                <div className={`space-y-3 ${!isPremium ? "min-h-[280px]" : ""}`}>
                  {!hasEnoughData ? (
                    <div className="bg-surface border border-theme rounded-2xl p-8 text-center">
                      <p className="text-theme-muted">
                        {t["insights.needMoreData"].replace("{count}", String(MIN_DAYS - uniqueDays))}
                      </p>
                    </div>
                  ) : correlations.length === 0 ? (
                    <div className="bg-surface border border-theme rounded-2xl p-8 text-center">
                      <p className="text-theme-muted">{t["insights.noData"]}</p>
                    </div>
                  ) : (
                    correlations.map((c, i) => (
                      <CorrelationCard key={i} result={c} t={t} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Ad Banner */}
        <div className="mt-6 lg:mt-8">
          <AdBanner region={region} subscription={subscription} />
        </div>
      </main>
    </div>
  );
}
