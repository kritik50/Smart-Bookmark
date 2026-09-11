// QuickSaveModal — Modal for quickly saving a pasted URL
// Extracted from dashboard/page.tsx lines 996-1198

"use client";

import { Sparkles, X, Plus, AlertTriangle } from "lucide-react";
import { getFavicon, detectCategory } from "@/app/lib/utils";
import type { Bookmark, Collection } from "@/types";

interface QuickSaveModalProps {
  url: string;
  title: string;
  collectionId: string | null;
  collections: Collection[];
  bookmarks: Bookmark[];
  onTitleChange: (title: string) => void;
  onCollectionChange: (id: string | null) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function QuickSaveModal({
  url,
  title,
  collectionId,
  collections,
  bookmarks,
  onTitleChange,
  onCollectionChange,
  onSave,
  onClose,
}: QuickSaveModalProps) {
  // Check for duplicate
  const duplicate = (() => {
    try {
      const normalized = new URL(url).href;
      return bookmarks.find((b) => {
        try {
          return new URL(b.url).href === normalized;
        } catch {
          return false;
        }
      });
    } catch {
      return undefined;
    }
  })();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && title.trim() && url.trim()) {
      e.preventDefault();
      onSave();
    }
    if (e.key === "Escape") onClose();
  };

  const cat = detectCategory(url);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl shadow-slate-900/30 border border-slate-200 overflow-hidden cmd-palette-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-300/40">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Quick Save
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                New bookmark
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL preview */}
        <div className="mx-6 mb-4 flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          <img
            src={getFavicon(url)}
            alt=""
            className="w-5 h-5 rounded"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <span className="text-xs font-mono text-slate-500 truncate flex-1">
            {url}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}
          >
            {cat.label}
          </span>
        </div>

        {/* Form */}
        <div className="px-6 pb-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Give it a name..."
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              autoFocus
              onKeyDown={handleKeyDown}
            />
          </div>

          {collections.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                Collection
              </label>
              <select
                value={collectionId || ""}
                onChange={(e) =>
                  onCollectionChange(e.target.value || null)
                }
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all cursor-pointer"
              >
                <option value="">No collection</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Duplicate warning */}
          {duplicate && (
            <div className="warn-in flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs font-bold text-amber-700">
                Already saved as &ldquo;{duplicate.title}&rdquo;
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              disabled={!title.trim() || !url.trim()}
              onClick={onSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Save Bookmark
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
