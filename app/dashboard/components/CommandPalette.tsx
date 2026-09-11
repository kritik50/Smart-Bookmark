// CommandPalette — Keyboard-driven bookmark search (Ctrl+K / Cmd+K)
// Extracted from dashboard/page.tsx lines 97-294

"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, ArrowUpRight } from "lucide-react";
import { detectCategory, getFavicon, getDomain } from "@/app/lib/utils";
import type { Bookmark, Collection, CommandPaletteProps } from "@/types";

export default function CommandPalette({
  bookmarks,
  collections,
  onClose,
  onOpen,
  onAddNew,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = query.trim()
    ? bookmarks
        .filter(
          (b) =>
            b.title.toLowerCase().includes(query.toLowerCase()) ||
            b.url.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8)
    : bookmarks.slice(0, 6);

  const actions = [{ label: "Add new bookmark", icon: Plus, action: onAddNew }];
  const allItems = [
    ...results.map((r) => ({ type: "bookmark" as const, data: r })),
    ...actions.map((a) => ({ type: "action" as const, data: a })),
  ];

  useEffect(() => {
    setCursor(0);
  }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, allItems.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    }
    if (e.key === "Escape") onClose();
    if (e.key === "Enter") {
      const item = allItems[cursor];
      if (!item) return;
      if (item.type === "bookmark") {
        onOpen((item.data as Bookmark).url);
        onClose();
      } else {
        (item.data as { action: () => void }).action();
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl shadow-slate-900/30 border border-slate-200 overflow-hidden cmd-palette-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookmarks or type a command..."
            className="flex-1 text-slate-900 placeholder:text-slate-400 outline-none text-sm font-semibold bg-transparent"
          />
          <kbd className="px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length > 0 && (
            <>
              <div className="px-4 py-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Bookmarks
                </span>
              </div>
              {results.map((bm, i) => {
                const cat = detectCategory(bm.url);
                const CatIcon = cat.icon;
                const isCursor = cursor === i;
                return (
                  <button
                    key={bm.id}
                    onClick={() => {
                      onOpen(bm.url);
                      onClose();
                    }}
                    onMouseEnter={() => setCursor(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
                      isCursor ? "bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <img
                      src={getFavicon(bm.url)}
                      className="w-5 h-5 rounded"
                      onError={(e) =>
                        (e.currentTarget.style.display = "none")
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold truncate ${
                          isCursor ? "text-indigo-700" : "text-slate-800"
                        }`}
                      >
                        {bm.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate font-mono">
                        {getDomain(bm.url)}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}
                    >
                      {cat.label}
                    </span>
                    {isCursor && (
                      <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Actions section */}
          <div className="px-4 py-1.5 mt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Actions
            </span>
          </div>
          {actions.map((action, i) => {
            const idx = results.length + i;
            const isCursor = cursor === idx;
            return (
              <button
                key={action.label}
                onClick={() => {
                  action.action();
                  onClose();
                }}
                onMouseEnter={() => setCursor(idx)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  isCursor ? "bg-indigo-50" : "hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isCursor ? "bg-indigo-100" : "bg-slate-100"
                  }`}
                >
                  <action.icon
                    className={`w-3.5 h-3.5 ${
                      isCursor ? "text-indigo-600" : "text-slate-500"
                    }`}
                  />
                </div>
                <span
                  className={`text-sm font-bold ${
                    isCursor ? "text-indigo-700" : "text-slate-700"
                  }`}
                >
                  {action.label}
                </span>
              </button>
            );
          })}

          {/* No results */}
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-slate-400 text-sm font-medium">
                No bookmarks found for &ldquo;{query}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
          {[
            ["↑↓", "navigate"],
            ["↵", "open"],
            ["esc", "close"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500 bg-white rounded border border-slate-200">
                {key}
              </kbd>
              <span className="text-[10px] text-slate-400 font-medium">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
