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
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-base font-medium transition-all ${
            selected === area
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm scale-105"
              : "bg-gray-100 text-gray-400 border border-gray-200 hover:bg-gray-200 hover:text-gray-600"
          }`}
        >
          <span className="text-sm opacity-70">{AREA_ICONS[area]}</span>
          {SCALP_AREA_LABELS[area]}
        </button>
      ))}
    </div>
  );
}
