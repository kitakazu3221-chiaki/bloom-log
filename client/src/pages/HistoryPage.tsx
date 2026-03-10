import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useStorage } from "../hooks/useStorage";
import { TrialBanner } from "../components/TrialBanner";
import { SCALP_AREA_LABELS, type ScalpArea, type PhotoRecord } from "../types";

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
        <span className="text-sm font-bold text-gray-800">
          {year}年{month + 1}月
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
        {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-semibold py-1 ${
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
              className={`flex flex-col items-center py-1.5 rounded-xl text-xs transition-all ${
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
          <span key={area} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${AREA_DOT_COLORS[area]}`} />
            {SCALP_AREA_LABELS[area]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Before/After slider ───────────────────────────────────────────────────────
function CompareSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPos((x / rect.width) * 100);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden cursor-col-resize select-none shadow-md"
      onMouseDown={(e) => { dragging.current = true; updatePos(e.clientX); }}
      onMouseMove={(e) => { if (dragging.current) updatePos(e.clientX); }}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchStart={(e) => { dragging.current = true; updatePos(e.touches[0].clientX); }}
      onTouchMove={(e) => { if (dragging.current) updatePos(e.touches[0].clientX); }}
      onTouchEnd={() => (dragging.current = false)}
    >
      <img src={beforeUrl} alt="Before" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <img src={afterUrl} alt="After" className="w-full h-full object-cover" draggable={false} />
      </div>
      {/* Divider */}
      <div className="absolute inset-y-0 w-0.5 bg-white/80 shadow-xl pointer-events-none" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
          <span className="text-gray-500 text-xs font-bold">⇔</span>
        </div>
      </div>
      <span className="absolute top-3 left-3 text-xs bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">Before</span>
      <span className="absolute top-3 right-3 text-xs bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">After</span>
    </div>
  );
}

// ── HistoryPage ───────────────────────────────────────────────────────────────
interface HistoryPageProps {
  username: string;
  onLogout: () => void;
  subscription: "trialing" | "active";
  trialDaysLeft: number;
}

export function HistoryPage({ username, onLogout, subscription, trialDaysLeft }: HistoryPageProps) {
  const storage = useStorage();
  const [records, setRecords] = useState<PhotoRecord[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [selectedArea, setSelectedArea] = useState<ScalpArea>("top");
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [calendarDate, setCalendarDate] = useState<string | null>(null);
  const urlsRef = useRef<Record<string, string>>({});

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
        const url = await storage.loadPhotoUrl(r.area, r.filename);
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
        const url = await storage.loadPhotoUrl(r.area, r.filename);
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

  return (
    <div className="min-h-screen bg-[#F8FAF8] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-6 py-3.5 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <a
          href="/"
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 border border-gray-200 transition-colors text-sm"
          aria-label="戻る"
        >
          ←
        </a>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <span className="text-xs">🌱</span>
          </div>
          <h1 className="text-base font-bold text-gray-800 tracking-tight">撮影履歴</h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <span className="text-xs text-gray-400">{username}</span>
            <button onClick={onLogout} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Trial banner */}
      {subscription === "trialing" && (
        <div className="px-6 pt-3 max-w-3xl mx-auto w-full">
          <TrialBanner daysLeft={trialDaysLeft} />
        </div>
      )}

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-5">
        {records.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📷</p>
            <p className="text-gray-400 text-sm">撮影記録がありません</p>
          </div>
        ) : (
          <>
            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-2xl p-1 text-xs self-start">
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === "calendar" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                カレンダー
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  viewMode === "list" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                一覧
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
                    <h2 className="text-sm font-bold text-gray-800 mb-4">
                      {new Date(calendarDate + "T00:00:00").toLocaleDateString("ja-JP", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </h2>
                    <div className="flex gap-4 flex-wrap">
                      {calendarDateRecords.map((r) => (
                        <div key={r.id} className="flex flex-col items-center gap-2">
                          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200">
                            {photoUrls[r.id] ? (
                              <img src={photoUrls[r.id]} alt={SCALP_AREA_LABELS[r.area]} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${AREA_PILL_COLORS[r.area]}`}>
                            {SCALP_AREA_LABELS[r.area]}
                          </span>
                          {(r.notes.sleep !== undefined || r.notes.stress !== undefined) && (
                            <span className="text-xs text-gray-400">
                              {r.notes.sleep !== undefined && `睡眠${r.notes.sleep}h`}
                              {r.notes.sleep !== undefined && r.notes.stress !== undefined && " · "}
                              {r.notes.stress !== undefined && `ストレス${r.notes.stress}`}
                            </span>
                          )}
                          {(r.notes.shampoo || r.notes.treatment) && (
                            <span className="text-xs text-gray-400 text-center max-w-[8rem] leading-relaxed">
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
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedArea === area
                          ? `${AREA_PILL_COLORS[area]} scale-105`
                          : "bg-gray-100 text-gray-400 border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {SCALP_AREA_LABELS[area]}
                      <span className="ml-1.5 text-xs opacity-60">
                        ({records.filter((r) => r.area === area).length})
                      </span>
                    </button>
                  ))}
                </div>

                {/* Before/After compare */}
                {compareIds && compareBeforeUrl && compareAfterUrl && compareIds[0] !== compareIds[1] && (
                  <section className="card rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-gray-800">Before / After 比較</h2>
                      <button onClick={() => setCompareIds(null)} className="text-xs text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors">
                        閉じる
                      </button>
                    </div>
                    <CompareSlider beforeUrl={compareBeforeUrl} afterUrl={compareAfterUrl} />
                    <p className="text-xs text-center text-gray-400 mt-2">スライダーを左右にドラッグして比較</p>
                  </section>
                )}

                {/* Photo grid */}
                {areaRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-3xl mb-3">📷</p>
                    <p className="text-sm text-gray-400">{SCALP_AREA_LABELS[selectedArea]}の記録はありません</p>
                  </div>
                ) : (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-gray-800">{SCALP_AREA_LABELS[selectedArea]}</h2>
                      {areaRecords.length >= 2 && (
                        <p className="text-xs text-gray-400">
                          2枚選んで比較（{compareIds
                            ? `${compareIds.filter((id, i, arr) => arr.indexOf(id) === i).length}枚選択中`
                            : "未選択"})
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {areaRecords.map((record) => {
                        const url = photoUrls[record.id];
                        const isSelected = compareIds?.includes(record.id) ?? false;
                        return (
                          <button
                            key={record.id}
                            onClick={() => toggleCompare(record.id)}
                            className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
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
                              <p className="text-xs text-white/90">{record.date}</p>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                                <span className="text-white text-xs font-bold">✓</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Timeline */}
                <section>
                  <h2 className="text-sm font-bold text-gray-800 mb-3">タイムライン</h2>
                  <div className="space-y-3">
                    {Array.from(byDate.entries())
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([date, dayRecords]) => (
                        <div key={date} className="card rounded-2xl p-4">
                          <p className="text-xs font-semibold text-gray-400 mb-3">
                            {new Date(date + "T00:00:00").toLocaleDateString("ja-JP", {
                              year: "numeric", month: "long", day: "numeric",
                            })}
                          </p>
                          <div className="flex gap-3 flex-wrap">
                            {dayRecords.map((r) => (
                              <div key={r.id} className="flex flex-col items-center gap-1.5">
                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
                                  {photoUrls[r.id] ? (
                                    <img src={photoUrls[r.id]} alt={r.area} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                                    </div>
                                  )}
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${AREA_PILL_COLORS[r.area]}`}>
                                  {SCALP_AREA_LABELS[r.area]}
                                </span>
                                {(r.notes.sleep !== undefined || r.notes.stress !== undefined) && (
                                  <span className="text-xs text-gray-400">
                                    {r.notes.sleep !== undefined && `睡眠${r.notes.sleep}h`}
                                    {r.notes.sleep !== undefined && r.notes.stress !== undefined && " · "}
                                    {r.notes.stress !== undefined && `ストレス${r.notes.stress}`}
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
