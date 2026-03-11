import { useState } from "react";
import { useI18n } from "../hooks/useI18n";
import { type CapturedPhoto, type NoteData, type ScalpArea } from "../types";

interface PhotoSaveDialogProps {
  photo: CapturedPhoto;
  onSave: (notes: NoteData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

function ToggleButton({
  active,
  label,
  onToggle,
}: {
  active: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-3 py-2.5 rounded-xl text-base font-medium border transition-all ${
        active
          ? "bg-emerald-600/15 text-emerald-600 border-emerald-400/50"
          : "bg-input border-theme text-theme-muted"
      }`}
    >
      {label}
    </button>
  );
}

export function PhotoSaveDialog({
  photo,
  onSave,
  onCancel,
  isSaving,
}: PhotoSaveDialogProps) {
  const { t, locale } = useI18n();
  const [shampoo, setShampoo] = useState("");
  const [treatment, setTreatment] = useState("");
  const [sleep, setSleep] = useState("");
  const [stress, setStress] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [exercise, setExercise] = useState(false);
  const [exerciseType, setExerciseType] = useState("");
  const [diet, setDiet] = useState("");
  const [alcohol, setAlcohol] = useState(false);
  const [supplements, setSupplements] = useState("");
  const [scalpMassage, setScalpMassage] = useState(false);

  const areaLabels: Record<ScalpArea, string> = {
    top: t["area.top"],
    front: t["area.front"],
    side: t["area.side"],
  };

  const handleSave = () => {
    onSave({
      shampoo: shampoo.trim() || undefined,
      treatment: treatment.trim() || undefined,
      sleep: sleep !== "" ? Number(sleep) : undefined,
      stress: stress !== "" ? Number(stress) : undefined,
      exercise: exercise || undefined,
      exerciseType: (exercise && exerciseType.trim()) || undefined,
      diet: diet !== "" ? Number(diet) : undefined,
      alcohol: alcohol || undefined,
      supplements: supplements.trim() || undefined,
      scalpMassage: scalpMassage || undefined,
    });
  };

  const dateLocale = locale === "ja" ? "ja-JP" : "en-US";

  const inputClass =
    "w-full text-base bg-input border border-theme rounded-xl px-3 py-2.5 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 placeholder-[var(--text-faint)] transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Sheet / Card */}
      <div className="relative w-full sm:max-w-md bg-surface sm:rounded-3xl rounded-t-3xl shadow-2xl animate-fade-in-up overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-theme-faint" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-theme">
          <div>
            <h2 className="text-lg font-bold text-theme-primary">{t["save.title"]}</h2>
            <p className="text-sm text-theme-muted mt-0.5">
              {areaLabels[photo.area]} &middot;{" "}
              {photo.timestamp.toLocaleString(dateLocale, {
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-[var(--border)] text-theme-muted text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Photo preview */}
        <div className="px-6 pt-4">
          <img
            src={photo.dataUrl}
            alt={t["save.photoAlt"]}
            className="w-full rounded-2xl object-cover max-h-44 shadow-sm ring-1 ring-theme"
          />
        </div>

        {/* Primary Notes */}
        <div className="px-6 pt-4 pb-2 space-y-3">
          <p className="text-sm font-semibold text-theme-muted uppercase tracking-wide">
            {t["save.notesLabel"]}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: t["save.shampoo"], placeholder: t["save.shampooPlaceholder"], value: shampoo, setValue: setShampoo, type: "text", isSleep: false },
              { label: t["save.treatment"], placeholder: t["save.treatmentPlaceholder"], value: treatment, setValue: setTreatment, type: "text", isSleep: false },
              { label: t["save.sleep"], placeholder: "7", value: sleep, setValue: setSleep, type: "number", isSleep: true },
              { label: t["save.stress"], placeholder: "3", value: stress, setValue: setStress, type: "number", isSleep: false },
            ].map(({ label, placeholder, value, setValue, type, isSleep }) => (
              <div key={label}>
                <label className="block text-sm text-theme-secondary mb-1">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  min={type === "number" ? (isSleep ? "0" : "1") : undefined}
                  max={type === "number" ? (isSleep ? "24" : "5") : undefined}
                  step={type === "number" && isSleep ? "0.5" : undefined}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Expand toggle */}
        <div className="px-6 py-2">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors flex items-center gap-1"
          >
            <span className={`inline-block transition-transform ${showMore ? "rotate-90" : ""}`}>
              ▶
            </span>
            {showMore ? t["save.lessDetails"] : t["save.moreDetails"]}
          </button>
        </div>

        {/* Expanded Notes */}
        {showMore && (
          <div className="px-6 pb-2 space-y-2.5 animate-fade-in">
            {/* Exercise toggle + type */}
            <div>
              <label className="block text-sm text-theme-secondary mb-1">{t["save.exercise"]}</label>
              <div className="flex gap-2">
                <ToggleButton
                  active={exercise}
                  label={t["save.yes"]}
                  onToggle={() => setExercise(true)}
                />
                <ToggleButton
                  active={!exercise}
                  label={t["save.no"]}
                  onToggle={() => { setExercise(false); setExerciseType(""); }}
                />
                {exercise && (
                  <input
                    type="text"
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value)}
                    placeholder={t["save.exerciseTypePlaceholder"]}
                    className={`flex-1 ${inputClass}`}
                  />
                )}
              </div>
            </div>

            {/* Diet + Alcohol row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-sm text-theme-secondary mb-1">{t["save.diet"]}</label>
                <input
                  type="number"
                  value={diet}
                  onChange={(e) => setDiet(e.target.value)}
                  placeholder="3"
                  min="1"
                  max="5"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-theme-secondary mb-1">{t["save.alcohol"]}</label>
                <div className="flex gap-2">
                  <ToggleButton
                    active={alcohol}
                    label={t["save.yes"]}
                    onToggle={() => setAlcohol(true)}
                  />
                  <ToggleButton
                    active={!alcohol}
                    label={t["save.no"]}
                    onToggle={() => setAlcohol(false)}
                  />
                </div>
              </div>
            </div>

            {/* Supplements */}
            <div>
              <label className="block text-sm text-theme-secondary mb-1">{t["save.supplements"]}</label>
              <input
                type="text"
                value={supplements}
                onChange={(e) => setSupplements(e.target.value)}
                placeholder={t["save.supplementsPlaceholder"]}
                className={inputClass}
              />
            </div>

            {/* Scalp Massage */}
            <div>
              <label className="block text-sm text-theme-secondary mb-1">{t["save.scalpMassage"]}</label>
              <div className="flex gap-2">
                <ToggleButton
                  active={scalpMassage}
                  label={t["save.yes"]}
                  onToggle={() => setScalpMassage(true)}
                />
                <ToggleButton
                  active={!scalpMassage}
                  label={t["save.no"]}
                  onToggle={() => setScalpMassage(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 flex gap-2.5">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 py-3 rounded-xl bg-secondary text-theme-secondary text-base font-medium hover:bg-[var(--border)] border border-theme disabled:opacity-50 transition-colors"
          >
            {t["common.cancel"]}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-base font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {isSaving ? t["save.saving"] : t["common.save"]}
          </button>
        </div>
      </div>
    </div>
  );
}
