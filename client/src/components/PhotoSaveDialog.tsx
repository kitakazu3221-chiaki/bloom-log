import { useState } from "react";
import { SCALP_AREA_LABELS, type CapturedPhoto, type NoteData } from "../types";

interface PhotoSaveDialogProps {
  photo: CapturedPhoto;
  onSave: (notes: NoteData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function PhotoSaveDialog({
  photo,
  onSave,
  onCancel,
  isSaving,
}: PhotoSaveDialogProps) {
  const [shampoo, setShampoo] = useState("");
  const [treatment, setTreatment] = useState("");
  const [sleep, setSleep] = useState("");
  const [stress, setStress] = useState("");

  const handleSave = () => {
    onSave({
      shampoo: shampoo.trim() || undefined,
      treatment: treatment.trim() || undefined,
      sleep: sleep !== "" ? Number(sleep) : undefined,
      stress: stress !== "" ? Number(stress) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Sheet / Card */}
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl animate-fade-in-up overflow-hidden">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-800">写真を保存</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {SCALP_AREA_LABELS[photo.area]} &middot;{" "}
              {photo.timestamp.toLocaleString("ja-JP", {
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
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Photo preview */}
        <div className="px-6 pt-4">
          <img
            src={photo.dataUrl}
            alt="撮影した写真"
            className="w-full rounded-2xl object-cover max-h-44 shadow-sm ring-1 ring-gray-200"
          />
        </div>

        {/* Notes */}
        <div className="px-6 pt-4 pb-2 space-y-3">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            補助データ（任意）
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "シャンプー", placeholder: "〇〇シャンプー", value: shampoo, setValue: setShampoo, type: "text" },
              { label: "育毛剤", placeholder: "ミノキシジル", value: treatment, setValue: setTreatment, type: "text" },
              { label: "睡眠（時間）", placeholder: "7", value: sleep, setValue: setSleep, type: "number" },
              { label: "ストレス（1〜5）", placeholder: "3", value: stress, setValue: setStress, type: "number" },
            ].map(({ label, placeholder, value, setValue, type }) => (
              <div key={label}>
                <label className="block text-sm text-gray-500 mb-1">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  min={type === "number" ? (label.includes("睡") ? "0" : "1") : undefined}
                  max={type === "number" ? (label.includes("睡") ? "24" : "5") : undefined}
                  step={type === "number" && label.includes("睡") ? "0.5" : undefined}
                  className="w-full text-base bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 placeholder-gray-300 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-2.5">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-500 text-base font-medium hover:bg-gray-200 border border-gray-200 disabled:opacity-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-base font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
