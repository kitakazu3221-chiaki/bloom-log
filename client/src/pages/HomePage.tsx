import { useState, useEffect } from "react";
import { useI18n } from "../hooks/useI18n";
import { useStorage } from "../hooks/useStorage";
import type { ScalpArea, PhotoRecord } from "../types";

const AREAS: ScalpArea[] = ["top", "front", "side"];

const AREA_LABELS_JA: Record<ScalpArea, string> = {
  top: "頭頂部",
  front: "前頭部",
  side: "側頭部",
};
const AREA_LABELS_EN: Record<ScalpArea, string> = {
  top: "Crown",
  front: "Frontal",
  side: "Temporal",
};

function calculateStreak(records: PhotoRecord[]): number {
  const dates = [...new Set(records.map((r) => r.date))].sort().reverse();
  if (dates.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0];

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const curr = new Date(dates[i] + "T00:00:00").getTime();
    const prev = new Date(dates[i + 1] + "T00:00:00").getTime();
    if (curr - prev === 86400000) streak++;
    else break;
  }
  return streak;
}

function getLast7Days(locale: string) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push({
      dateStr: d.toISOString().split("T")[0],
      dayLabel: d.toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US", {
        weekday: "short",
      }),
      isToday: i === 0,
    });
  }
  return days;
}

interface HomePageProps {
  username: string;
  onLogout: () => void;
  subscription: "trialing" | "active";
  trialDaysLeft: number;
  createdAt: string;
  storageMode: "cloud" | "local";
}

export function HomePage({
  username,
  onLogout,
  subscription,
  trialDaysLeft,
  createdAt,
  storageMode,
}: HomePageProps) {
  const { t, locale, setLocale } = useI18n();
  const storage = useStorage(storageMode);
  const [records, setRecords] = useState<PhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestPhotos, setLatestPhotos] = useState<
    Record<ScalpArea, string | null>
  >({ top: null, front: null, side: null });

  const dayCount = Math.max(
    1,
    Math.ceil(
      (Date.now() - new Date(createdAt).getTime()) / 86400000
    )
  );

  // Load records
  useEffect(() => {
    if (!storage.isReady) return;
    storage.loadRecords().then((recs) => {
      setRecords(recs);
      setLoading(false);
    });
  }, [storage.isReady]);

  // Load latest photo URLs per area
  useEffect(() => {
    if (records.length === 0) return;
    AREAS.forEach(async (area) => {
      const areaRecs = records
        .filter((r) => r.area === area)
        .sort((a, b) => a.date.localeCompare(b.date));
      const latest = areaRecs[areaRecs.length - 1];
      if (!latest) return;
      const url = await storage.loadPhotoUrl(
        latest.area,
        latest.filename,
        latest.id
      );
      setLatestPhotos((prev) => ({ ...prev, [area]: url }));
    });
  }, [records, storage]);

  // Derived data
  const today = new Date().toISOString().split("T")[0];
  const todayAreas = new Set(
    records.filter((r) => r.date === today).map((r) => r.area)
  );
  const capturedCount = todayAreas.size;
  const streak = calculateStreak(records);
  const totalPhotos = records.length;
  const recordingDays = new Set(records.map((r) => r.date)).size;
  const last7 = getLast7Days(locale);
  const recordDates = new Set(records.map((r) => r.date));
  const areaLabels = locale === "ja" ? AREA_LABELS_JA : AREA_LABELS_EN;

  const todayFormatted = new Date().toLocaleDateString(
    locale === "ja" ? "ja-JP" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div
      className="min-h-screen bg-[#F8FAF8] flex flex-col"
      style={{ fontFamily: "'Kosugi Maru', sans-serif" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight">
              Bloom Log
            </h1>
          </div>
          <a
            href="/capture"
            className="text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            {t["home.capture"]}
          </a>
          <a
            href="/history"
            className="text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            {t["pc.history"]}
          </a>
          <span className="text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
            {locale === "ja"
              ? `${dayCount}${t["pc.dayCount"]}`
              : `Day ${dayCount}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocale(locale === "ja" ? "en" : "ja")}
            className="text-sm font-medium text-gray-400 hover:text-gray-600 bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1 transition-colors"
          >
            {locale === "ja" ? "EN" : "JA"}
          </button>
          {subscription === "trialing" && (
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <span className="text-sm text-amber-600">
                {locale === "ja"
                  ? `${t["trial.label"]} ${t["trial.remaining"]} ${trialDaysLeft} ${t["trial.days"]}`
                  : `${t["trial.label"]} ${trialDaysLeft} ${t["trial.days"]}`}
              </span>
              <button
                onClick={() => (window.location.href = "/paywall")}
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md px-2 py-1 transition-colors"
              >
                {t["trial.selectPlan"]}
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <span className="text-sm text-gray-400">{username}</span>
            <button
              onClick={onLogout}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t["common.logout"]}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 lg:px-8 xl:px-12 py-6 lg:py-8 w-full animate-fade-in-up">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_1fr] gap-5 lg:gap-8">
            {/* Left Column */}
            <div className="space-y-5 lg:space-y-6">
              {/* Today's Status Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-800 font-bold text-xl lg:text-2xl">
                    {username}
                    {t["home.greeting"]}
                  </p>
                  <span className="text-base lg:text-lg text-gray-400">
                    {todayFormatted}
                  </span>
                </div>
                <p className="text-base lg:text-lg font-bold text-gray-500 mb-5">
                  {t["home.todayStatus"]}
                </p>
                <div className="flex items-center gap-6 lg:gap-8 mb-5">
                  {AREAS.map((area) => {
                    const done = todayAreas.has(area);
                    return (
                      <div key={area} className="flex items-center gap-3">
                        <span
                          className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-base lg:text-lg ${
                            done
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-100 text-gray-300 border border-gray-200"
                          }`}
                        >
                          {done ? "✓" : ""}
                        </span>
                        <span
                          className={`text-base lg:text-lg ${done ? "text-gray-700" : "text-gray-400"}`}
                        >
                          {areaLabels[area]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-base lg:text-lg text-gray-500">
                  {capturedCount === 3
                    ? t["home.allCaptured"]
                    : capturedCount === 0
                      ? t["home.notCaptured"]
                      : locale === "ja"
                        ? `${capturedCount}/3 ${t["home.captured"]}`
                        : `${capturedCount}/3${t["home.captured"]}`}
                </p>
              </div>

              {/* Main CTA */}
              <a
                href="/capture"
                className={`block text-center py-5 lg:py-6 rounded-2xl font-bold text-xl lg:text-2xl transition-all active:scale-[0.98] ${
                  capturedCount === 3
                    ? "bg-white text-emerald-600 border-2 border-emerald-200 hover:bg-emerald-50"
                    : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500"
                }`}
              >
                {capturedCount === 3
                  ? t["home.additionalCapture"]
                  : t["home.startCapture"]}
              </a>

              {/* Streak + Stats in a row */}
              <div className="grid grid-cols-4 gap-4 lg:gap-5">
                {/* Streak */}
                {streak > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-6 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl lg:text-4xl mb-1">🔥</span>
                    <span className="text-gray-800 font-bold text-lg lg:text-xl">
                      {streak}
                    </span>
                    <span className="text-sm text-gray-400">
                      {locale === "ja" ? "日連続" : "day streak"}
                    </span>
                  </div>
                )}
                {/* Stats */}
                {[
                  {
                    label: t["home.totalPhotos"],
                    value: `${totalPhotos}`,
                    unit: locale === "ja" ? t["home.photos"] : "",
                  },
                  {
                    label: t["home.recordingDays"],
                    value: `${recordingDays}`,
                    unit: locale === "ja" ? t["home.days"] : "",
                  },
                  {
                    label:
                      locale === "ja"
                        ? `${dayCount}${t["pc.dayCount"]}`
                        : `Day ${dayCount}`,
                    value: "",
                    unit: "",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-6 text-center flex flex-col items-center justify-center"
                  >
                    <p className="text-sm lg:text-base text-gray-400 mb-1">{stat.label}</p>
                    {stat.value && (
                      <p className="text-3xl lg:text-4xl font-bold text-gray-800">
                        {stat.value}
                        <span className="text-base lg:text-lg text-gray-400 ml-0.5">
                          {stat.unit}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5 lg:space-y-6">
              {/* Weekly View */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
                <p className="text-base lg:text-lg font-bold text-gray-500 mb-6">
                  {t["home.weekView"]}
                </p>
                <div className="flex items-center justify-between">
                  {last7.map((day) => {
                    const hasRecord = recordDates.has(day.dateStr);
                    return (
                      <div
                        key={day.dateStr}
                        className="flex flex-col items-center gap-2.5"
                      >
                        <span
                          className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center text-sm lg:text-base font-bold ${
                            hasRecord
                              ? "bg-emerald-500 text-white"
                              : day.isToday
                                ? "bg-white text-gray-400 border-2 border-emerald-300"
                                : "bg-gray-100 text-gray-300"
                          }`}
                        >
                          {hasRecord ? "✓" : ""}
                        </span>
                        <span
                          className={`text-sm lg:text-base ${day.isToday ? "text-emerald-600 font-bold" : "text-gray-400"}`}
                        >
                          {day.dayLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Latest Photos */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-base lg:text-lg font-bold text-gray-500">
                    {t["home.latestPhotos"]}
                  </p>
                  <a
                    href="/history"
                    className="text-base lg:text-lg text-emerald-600 hover:text-emerald-500 font-medium transition-colors"
                  >
                    {t["home.viewHistory"]} →
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-4 lg:gap-6">
                  {AREAS.map((area) => (
                    <a
                      key={area}
                      href="/history"
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="w-full aspect-square rounded-xl bg-gray-100 overflow-hidden">
                        {latestPhotos[area] ? (
                          <img
                            src={latestPhotos[area]!}
                            alt={areaLabels[area]}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                            📷
                          </div>
                        )}
                      </div>
                      <span className="text-sm lg:text-base text-gray-500">
                        {areaLabels[area]}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
