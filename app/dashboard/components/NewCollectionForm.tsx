// NewCollectionForm — Inline form for creating a new collection
// Extracted from dashboard/page.tsx Sidebar section

"use client";

import { COLLECTION_COLORS, COLLECTION_ICONS } from "@/app/lib/utils";

interface NewCollectionFormProps {
  name: string;
  color: string;
  icon: string;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onIconChange: (icon: string) => void;
  onCreate: () => void;
  onCancel: () => void;
}

export default function NewCollectionForm({
  name,
  color,
  icon,
  onNameChange,
  onColorChange,
  onIconChange,
  onCreate,
  onCancel,
}: NewCollectionFormProps) {
  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Collection name..."
        className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        onKeyDown={(e) => e.key === "Enter" && onCreate()}
        autoFocus
      />

      {/* Color picker */}
      <div className="flex gap-1.5 flex-wrap">
        {COLLECTION_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              color === c ? "border-slate-700 scale-110" : "border-transparent"
            }`}
            style={{ background: c }}
          />
        ))}
      </div>

      {/* Icon picker */}
      <div className="flex gap-1.5 flex-wrap">
        {COLLECTION_ICONS.map((ic) => (
          <button
            key={ic}
            onClick={() => onIconChange(ic)}
            className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
              icon === ic
                ? "bg-indigo-100 ring-2 ring-indigo-400"
                : "hover:bg-slate-200"
            }`}
          >
            {ic}
          </button>
        ))}
      </div>

      {/* Create / Cancel */}
      <div className="flex gap-2">
        <button
          onClick={onCreate}
          className="flex-1 bg-slate-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create
        </button>
        <button
          onClick={onCancel}
          className="px-3 text-xs text-slate-500 hover:text-slate-700 font-bold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
