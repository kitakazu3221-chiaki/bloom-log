import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useStorage } from "../hooks/useStorage";
import { useI18n } from "../hooks/useI18n";

import { type ScalpArea, type PhotoRecord } from "../types";

const AREAS: ScalpArea[] = ["top", "front", "side"];

const AREA_DOT_COLORS: Record<ScalpArea, string> = {
  top: "bg-emerald-500",
  front: "bg-sky-500",
  side: "bg-amber-500",
};

const AREA_PILL_COLORS: Record<ScalpArea, string> = {
  top: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  front: "bg-sky-50 text-sky-700 border border-sky-200",
  side: "bg-amber-50 text-amber-700 border border-amber-200",
};

function groupByDate(records: PhotoRecord[]): Map<string, PhotoRecord[]> {
  const map = new Map<string, PhotoRecord[]>();
  for (const r of records) {
    const list = map.get(r.date) ?? [];
    list.push(r);
    map.set(r.date, list);
  }
  return map;
}

function useAreaLabels(): Record<ScalpArea, string> {
  const { t } = useI18n();
  return {
    top: t["area.top"],
    front: t["area.front"],
    side: t["area.side"],
  };
}

// ── Calendar ─────────────────────────────────────────────────────────────────
function PhotoCalendar({
  records,
  selectedDate,
  onSelectDate,
}: {
  records: PhotoRecord[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}) {
  const { t, locale } = useI18n();
  const areaLabels = useAreaLabels();

  const { initYear, initMonth } = useMemo(() => {
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    if (sorted.length > 0) {
      const d = new Date(sorted[0].date + "T00:00:00");
      return { initYear: d.getFullYear(), initMonth: d.getMonth() };
    }
    const now = new Date();
    return { initYear: now.getFullYear(), initMonth: now.getMonth() };
  }, []); // eslint-disable-line

  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);

  const dateAreaMap = useMemo(() => {
    const map = new Map<string, Set<ScalpArea>>();
    for (const r of records) {
      const set = map.get(r.date) ?? new Set<ScalpArea>();
      set.add(r.area);
      map.set(r.date, set);
    }
    return map;
  }, [records]);

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const goToPrev = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const goToNext = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const dayHeaders = [
    t["calendar.sun"], t["calendar.mon"], t["calendar.tue"], t["calendar.wed"],
    t["calendar.thu"], t["calendar.fri"], t["calendar.sat"],
  ];

  const monthLabel = locale === "ja"
    ? `${year}年${month + 1}月`
    : `${month + 1}/${year}`;

  return (
    <div className="card rounded-2xl p-5">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={goToPrev}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-xl font-light transition-colors"
        >
          ‹
        </button>
        <span className="text-base font-bold text-gray-800">
          {monthLabel}
        </span>
        <button
          onClick={goToNext}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-xl font-light transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-2">
        {dayHeaders.map((d, i) => (
          <div
            key={d}
            className={`text-center text-sm font-semibold py-1 ${
              i === 0 ? "text-red-400" : i === 6 ? "text-sky-400" : "text-gray-400"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const areas = dateAreaMap.get(dateStr);
          const hasPhotos = !!areas;
          const isSelected = selectedDate === dateStr;
          const dow = new Date(year, month, day).getDay();

          const textColor = !hasPhotos
            ? "text-gray-300"
            : isSelected
            ? "text-emerald-600"
            : dow === 0
            ? "text-red-400"
            : dow === 6
            ? "text-sky-400"
            : "text-gray-700";

          return (
            <button
              key={day}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              disabled={!hasPhotos}
              className={`flex flex-col items-center py-1.5 rounded-xl text-sm transition-all ${
                isSelected
                  ? "bg-emerald-50 ring-1 ring-emerald-300"
                  : hasPhotos
                  ? "hover:bg-gray-50"
                  : "cursor-default"
              }`}
            >
              <span className={`leading-none mb-1 ${hasPhotos ? "font-semibold" : ""} ${textColor}`}>
                {day}
              </span>
              {hasPhotos && (
                <div className="flex gap-0.5 h-1.5 items-center">
                  {(["top", "front", "side"] as ScalpArea[]).map((a) =>
                    areas.has(a) ? (
                      <span key={a} className={`w-1.5 h-1.5 rounded-full ${AREA_DOT_COLORS[a]}`} />
                    ) : null
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200 justify-center">
        {(["top", "front", "side"] as ScalpArea[]).map((area) => (
          <span key={area} className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className={`w-2 h-2 rounded-full ${AREA_DOT_COLORS[area]}`} />
            {areaLabels[area]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Before/After slider ───────────────────────────────────────────────────────
function CompareSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const { t } = useI18n();
  const [pos, setPos] = useState(50);
  const [beforeOff, setBeforeOff] = useState({ x: 0, y: 0 });
  const [afterOff, setAfterOff] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragTarget = useRef<"slider" | "before" | "after" | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  const hasMoved = beforeOff.x !== 0 || beforeOff.y !== 0 || afterOff.x !== 0 || afterOff.y !== 0;

  const getClientPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { x, y } = getClientPos(e);
    const relX = x - rect.left;
    const sliderX = (pos / 100) * rect.width;

    if (Math.abs(relX - sliderX) < 20) {
      dragTarget.current = "slider";
    } else if (relX < sliderX) {
      dragTarget.current = "before";
      dragStart.current = { x, y };
      offsetStart.current = { ...beforeOff };
    } else {
      dragTarget.current = "after";
      dragStart.current = { x, y };
      offsetStart.current = { ...afterOff };
    }
  };

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragTarget.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const { x, y } = "touches" in e
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX, y: e.clientY };

    if (dragTarget.current === "slider") {
      const relX = Math.max(0, Math.min(x - rect.left, rect.width));
      setPos((relX / rect.width) * 100);
    } else {
      const dx = x - dragStart.current.x;
      const dy = y - dragStart.current.y;
      const newOff = { x: offsetStart.current.x + dx, y: offsetStart.current.y + dy };
      if (dragTarget.current === "before") setBeforeOff(newOff);
      else setAfterOff(newOff);
    }
  }, []);

  const handleUp = () => { dragTarget.current = null; };

  const handleDoubleClick = () => {
    setBeforeOff({ x: 0, y: 0 });
    setAfterOff({ x: 0, y: 0 });
  };

  const cursor = dragTarget.current === "slider" ? "cursor-col-resize"
    : dragTarget.current ? "cursor-grabbing" : "cursor-grab";

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video rounded-2xl overflow-hidden select-none shadow-md ${cursor}`}
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onTouchStart={handleDown}
      onTouchMove={handleMove}
      onTouchEnd={handleUp}
      onDoubleClick={handleDoubleClick}
    >
      <img
        src={beforeUrl} alt="Before" draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: `calc(50% + ${beforeOff.x}px) calc(50% + ${beforeOff.y}px)` }}
      />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <img
          src={afterUrl} alt="After" draggable={false}
          className="w-full h-full object-cover"
          style={{ objectPosition: `calc(50% + ${afterOff.x}px) calc(50% + ${afterOff.y}px)` }}
        />
      </div>
      {/* Divider */}
      <div className="absolute inset-y-0 w-0.5 bg-white/80 shadow-xl pointer-events-none" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
          <span className="text-gray-500 text-sm font-bold">⇔</span>
        </div>
      </div>
      <span className="absolute top-3 left-3 text-sm bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">Before</span>
      <span className="absolute top-3 right-3 text-sm bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">After</span>
      {hasMoved && (
        <button
          onClick={(e) => { e.stopPropagation(); handleDoubleClick(); }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 text-sm bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full hover:bg-black/70 transition-colors"
        >
          {t["history.resetPosition"]}
        </button>
      )}
    </div>
  );
}

// ── HistoryPage ───────────────────────────────────────────────────────────────
interface HistoryPageProps {
  username: string;
  onLogout: () => void;
  subscription: "trialing" | "active";
  trialDaysLeft: number;
  createdAt: string;
  storageMode: "cloud" | "local";
}

export function HistoryPage({ username, onLogout, subscription, trialDaysLeft, createdAt, storageMode }: HistoryPageProps) {
  const { t, locale, setLocale } = useI18n();
  const areaLabels = useAreaLabels();
  const storage = useStorage(storageMode);
  const [records, setRecords] = useState<PhotoRecord[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [selectedArea, setSelectedArea] = useState<ScalpArea>("top");
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [calendarDate, setCalendarDate] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const urlsRef = useRef<Record<string, string>>({});

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await storage.deletePhoto(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setConfirmDeleteId(null);
      if (compareIds && (compareIds[0] === id || compareIds[1] === id)) {
        setCompareIds(null);
      }
    } catch {
      alert(t["history.deleteFailed"]);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!storage.isReady) return;
    storage.loadRecords().then(setRecords);
  }, [storage.isReady]); // eslint-disable-line

  // Load URLs for list mode (selected area)
  useEffect(() => {
    if (!storage.isReady || viewMode !== "list") return;
    const areaRecords = records.filter((r) => r.area === selectedArea);
    let cancelled = false;
    Promise.all(
      areaRecords.map(async (r) => {
        if (urlsRef.current[r.id]) return;
        const url = await storage.loadPhotoUrl(r.area, r.filename, r.id);
        if (!cancelled && url) {
          urlsRef.current[r.id] = url;
          setPhotoUrls((prev) => ({ ...prev, [r.id]: url }));
        }
      })
    );
    return () => { cancelled = true; };
  }, [records, selectedArea, viewMode, storage.isReady]); // eslint-disable-line

  // Load URLs for calendar selected date
  useEffect(() => {
    if (!storage.isReady || !calendarDate) return;
    const dateRecords = records.filter((r) => r.date === calendarDate);
    let cancelled = false;
    Promise.all(
      dateRecords.map(async (r) => {
        if (urlsRef.current[r.id]) return;
        const url = await storage.loadPhotoUrl(r.area, r.filename, r.id);
        if (!cancelled && url) {
          urlsRef.current[r.id] = url;
          setPhotoUrls((prev) => ({ ...prev, [r.id]: url }));
        }
      })
    );
    return () => { cancelled = true; };
  }, [records, calendarDate, storage.isReady]); // eslint-disable-line

  const areaRecords = records
    .filter((r) => r.area === selectedArea)
    .sort((a, b) => a.date.localeCompare(b.date));

  const byDate = groupByDate(records);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (!prev) return [id, id];
      if (prev[0] === prev[1]) return [prev[0], id];
      return null;
    });
  };

  const compareBeforeUrl = compareIds ? (photoUrls[compareIds[0]] ?? null) : null;
  const compareAfterUrl = compareIds ? (photoUrls[compareIds[1]] ?? null) : null;
  const calendarDateRecords = calendarDate ? records.filter((r) => r.date === calendarDate) : [];

  const dayCount = Math.max(1, Math.ceil((Date.now() - new Date(createdAt).getTime()) / 86400000));
  const dateLocale = locale === "ja" ? "ja-JP" : "en-US";

  const formatNotesInfo = (r: PhotoRecord) => {
    const parts: string[] = [];
    if (r.notes.sleep !== undefined) parts.push(`${t["history.sleepLabel"]}${r.notes.sleep}h`);
    if (r.notes.stress !== undefined) parts.push(`${t["history.stressLabel"]}${r.notes.stress}`);
    return parts.join(" · ");
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-6 py-3.5 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌱</span>
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">{t["history.title"]}</h1>
        </div>
        <a
          href="/"
          className="text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          {t["home.home"]}
        </a>
        <a
          href="/capture"
          className="text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          {t["home.capture"]}
        </a>
        <span className="text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
          {locale === "ja" ? `${dayCount}${t["pc.dayCount"]}` : `Day ${dayCount}`}
        </span>
        <div className="ml-auto flex items-center gap-3">
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
                onClick={() => window.location.href = "/paywall"}
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md px-2 py-1 transition-colors"
              >
                {t["trial.selectPlan"]}
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <span className="text-sm text-gray-400">{username}</span>
            <button onClick={onLogout} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              {t["common.logout"]}
            </button>
          </div>
        </div>
      </header>

      {/* Trial banner - now inline in header */}

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-5">
        {/* Growth milestone bar */}
        {(() => {
          const milestones = [
            { day: 1, label: "Day 1" },
            { day: 30, label: "Day 30" },
            { day: 90, label: "Day 90" },
            { day: 180, label: "Day 180" },
            { day: 365, label: "Day 365" },
          ];
          const maxDay = milestones[milestones.length - 1].day;
          const progress = Math.min((dayCount / maxDay) * 100, 100);
          return (
            <section className="card rounded-2xl p-4">
              <h2 className="text-base font-bold text-gray-800 mb-3">{t["history.growthTimeline"]}</h2>
              <div className="relative">
                {/* Progress bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                {/* Milestones */}
                <div className="flex justify-between mt-2">
                  {milestones.map((m) => {
                    const reached = dayCount >= m.day;
                    return (
                      <div key={m.day} className="flex flex-col items-center" style={{ width: "20%" }}>
                        <div className={`w-3 h-3 rounded-full border-2 -mt-[18px] mb-1 ${
                          reached ? "bg-emerald-500 border-emerald-500" : "bg-white border-gray-300"
                        }`} />
                        <span className={`text-sm font-medium ${reached ? "text-emerald-600" : "text-gray-400"}`}>
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })()}

        {records.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📷</p>
            <p className="text-gray-400 text-base">{t["history.noRecords"]}</p>
          </div>
        ) : (
          <>
            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-2xl p-1 text-sm self-start">
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
                  viewMode === "calendar" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {t["history.calendar"]}
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
                  viewMode === "list" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {t["history.list"]}
              </button>
            </div>

            {viewMode === "calendar" ? (
              <>
                <PhotoCalendar
                  records={records}
                  selectedDate={calendarDate}
                  onSelectDate={setCalendarDate}
                />

                {calendarDate && calendarDateRecords.length > 0 && (
                  <div className="card rounded-2xl p-5 animate-fade-in-up">
                    <h2 className="text-base font-bold text-gray-800 mb-4">
                      {new Date(calendarDate + "T00:00:00").toLocaleDateString(dateLocale, {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </h2>
                    <div className="flex gap-4 flex-wrap">
                      {calendarDateRecords.map((r) => (
                        <div key={r.id} className="flex flex-col items-center gap-2">
                          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200">
                            {photoUrls[r.id] ? (
                              <img src={photoUrls[r.id]} alt={areaLabels[r.area]} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                          <span className={`text-sm font-semibold px-3 py-1 rounded-full shadow-sm ${AREA_PILL_COLORS[r.area]}`}>
                            {areaLabels[r.area]}
                          </span>
                          {(r.notes.sleep !== undefined || r.notes.stress !== undefined) && (
                            <span className="text-sm text-gray-400">
                              {formatNotesInfo(r)}
                            </span>
                          )}
                          {(r.notes.shampoo || r.notes.treatment) && (
                            <span className="text-sm text-gray-400 text-center max-w-[8rem] leading-relaxed">
                              {[r.notes.shampoo, r.notes.treatment].filter(Boolean).join(" / ")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Area tabs */}
                <div className="flex gap-2 flex-wrap">
                  {AREAS.map((area) => (
                    <button
                      key={area}
                      onClick={() => { setSelectedArea(area); setCompareIds(null); }}
                      className={`px-4 py-2.5 rounded-xl text-base font-medium transition-all ${
                        selectedArea === area
                          ? `${AREA_PILL_COLORS[area]} scale-105`
                          : "bg-gray-100 text-gray-400 border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {areaLabels[area]}
                      <span className="ml-1.5 text-sm opacity-60">
                        ({records.filter((r) => r.area === area).length})
                      </span>
                    </button>
                  ))}
                </div>

                {/* Before/After compare */}
                {compareIds && compareBeforeUrl && compareAfterUrl && compareIds[0] !== compareIds[1] && (
                  <section className="card rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-gray-800">{t["history.compareTitle"]}</h2>
                      <button onClick={() => setCompareIds(null)} className="text-sm text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors">
                        {t["common.close"]}
                      </button>
                    </div>
                    <CompareSlider beforeUrl={compareBeforeUrl} afterUrl={compareAfterUrl} />
                    <p className="text-sm text-center text-gray-400 mt-2">{t["history.compareHint"]}</p>
                  </section>
                )}

                {/* Photo grid */}
                {areaRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-3xl mb-3">📷</p>
                    <p className="text-base text-gray-400">{areaLabels[selectedArea]}{t["history.noAreaRecords"]}</p>
                  </div>
                ) : (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-gray-800">{areaLabels[selectedArea]}</h2>
                      {areaRecords.length >= 2 && (
                        <p className="text-sm text-gray-400">
                          {t["history.selectTwo"]}({compareIds
                            ? `${compareIds.filter((id, i, arr) => arr.indexOf(id) === i).length}${t["history.selected"]}`
                            : t["history.unselected"]})
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {areaRecords.map((record) => {
                        const url = photoUrls[record.id];
                        const isSelected = compareIds?.includes(record.id) ?? false;
                        return (
                          <div key={record.id} className="relative group">
                          <button
                            onClick={() => toggleCompare(record.id)}
                            className={`relative w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                              isSelected
                                ? "border-emerald-500 ring-2 ring-emerald-200 scale-[1.02]"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {url ? (
                              <img src={url} alt={record.date} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                              <p className="text-sm text-white/90">{record.date}</p>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                                <span className="text-white text-sm font-bold">✓</span>
                              </div>
                            )}
                          </button>
                          {confirmDeleteId === record.id ? (
                            <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center gap-2 z-10">
                              <p className="text-white text-base font-bold">{t["history.confirmDelete"]}</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDelete(record.id)}
                                  disabled={deletingId === record.id}
                                  className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-xl font-bold disabled:opacity-50"
                                >
                                  {deletingId === record.id ? "..." : t["common.delete"]}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-3 py-1.5 bg-white/20 text-white text-sm rounded-xl"
                                >
                                  {t["common.back"]}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(record.id)}
                              className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/40 text-white text-base flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              title={t["common.delete"]}
                            >
                              ×
                            </button>
                          )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Timeline */}
                <section>
                  <h2 className="text-base font-bold text-gray-800 mb-3">{t["history.timeline"]}</h2>
                  <div className="space-y-3">
                    {Array.from(byDate.entries())
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([date, dayRecords]) => (
                        <div key={date} className="card rounded-2xl p-4">
                          <p className="text-sm font-semibold text-gray-400 mb-3">
                            {new Date(date + "T00:00:00").toLocaleDateString(dateLocale, {
                              year: "numeric", month: "long", day: "numeric",
                            })}
                          </p>
                          <div className="flex gap-3 flex-wrap">
                            {dayRecords.map((r) => (
                              <div key={r.id} className="relative flex flex-col items-center gap-1.5 group">
                                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 relative">
                                  {photoUrls[r.id] ? (
                                    <img src={photoUrls[r.id]} alt={r.area} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                                    </div>
                                  )}
                                  {/* Delete button */}
                                  {confirmDeleteId === r.id ? (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 rounded-xl">
                                      <p className="text-white text-sm font-bold">{t["history.confirmDelete"]}</p>
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => handleDelete(r.id)}
                                          disabled={deletingId === r.id}
                                          className="px-2.5 py-1 bg-red-500 text-white text-sm rounded-lg font-bold disabled:opacity-50"
                                        >
                                          {deletingId === r.id ? "..." : t["common.delete"]}
                                        </button>
                                        <button
                                          onClick={() => setConfirmDeleteId(null)}
                                          className="px-2.5 py-1 bg-white/20 text-white text-sm rounded-lg"
                                        >
                                          {t["common.back"]}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(r.id); }}
                                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/40 text-white text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-0 active:opacity-100"
                                      title={t["common.delete"]}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                                <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${AREA_PILL_COLORS[r.area]}`}>
                                  {areaLabels[r.area]}
                                </span>
                                {(r.notes.sleep !== undefined || r.notes.stress !== undefined) && (
                                  <span className="text-sm text-gray-400">
                                    {formatNotesInfo(r)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
