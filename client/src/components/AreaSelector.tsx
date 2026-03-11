import { useI18n } from "../hooks/useI18n";
import { type ScalpArea } from "../types";

interface AreaSelectorProps {
  selected: ScalpArea;
  onChange: (area: ScalpArea) => void;
}

const AREAS: ScalpArea[] = ["top", "front", "side"];

const AREA_ICONS: Record<ScalpArea, string> = {
  top: "⬆",
  front: "▲",
  side: "◀",
};

export function AreaSelector({ selected, onChange }: AreaSelectorProps) {
  const { t } = useI18n();
  const areaLabels: Record<ScalpArea, string> = {
    top: t["area.top"],
    front: t["area.front"],
    side: t["area.side"],
  };

  return (
    <div className="flex gap-2">
      {AREAS.map((area) => (
        <button
          key={area}
          onClick={() => onChange(area)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-base font-medium transition-all ${
            selected === area
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm scale-105"
              : "bg-secondary text-theme-muted border border-theme hover:bg-[var(--border)] hover:text-theme-secondary"
          }`}
        >
          <span className="text-sm opacity-70">{AREA_ICONS[area]}</span>
          {areaLabels[area]}
        </button>
      ))}
    </div>
  );
}
