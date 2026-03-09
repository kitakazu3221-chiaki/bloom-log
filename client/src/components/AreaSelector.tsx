import { SCALP_AREA_LABELS, type ScalpArea } from "../types";

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
  return (
    <div className="flex gap-2">
      {AREAS.map((area) => (
        <button
          key={area}
          onClick={() => onChange(area)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            selected === area
              ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/30 shadow-lg shadow-emerald-400/10 scale-105"
              : "bg-white/[0.04] text-slate-500 border border-white/[0.08] hover:bg-white/[0.08] hover:text-slate-300"
          }`}
        >
          <span className="text-xs opacity-70">{AREA_ICONS[area]}</span>
          {SCALP_AREA_LABELS[area]}
        </button>
      ))}
    </div>
  );
}
