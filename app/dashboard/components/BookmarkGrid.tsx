// BookmarkGrid — Main content area with search, filters, URL input, and card grid
// Extracted from dashboard/page.tsx lines 1416-1619

"use client";

import { useRef } from "react";
import {
  Plus,
  Search,
  Loader2,
  LayoutGrid,
  Clock,
  X,
} from "lucide-react";
import { detectCategory } from "@/app/lib/utils";
import BookmarkCard from "./BookmarkCard";
import type { Bookmark, Collection } from "@/types";

// Skeleton loading card
const SkeletonCard = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="bg-white/60 border border-white/60 rounded-2xl p-5 animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 bg-slate-200 rounded-xl" />
      <div className="w-16 h-5 bg-slate-200 rounded-full" />
    </div>
    <div className="h-4 bg-slate-200 rounded-lg w-3/4 mb-2" />
    <div className="h-3 bg-slate-100 rounded-lg w-full mb-5" />
    <div className="h-9 bg-slate-100 rounded-xl w-full" />
  </div>
);

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  filteredBookmarks: Bookmark[];
  collections: Collection[];
  loading: boolean;
  // Search
  searchQuery: string;
  isSearching: boolean;
  onSearchChange: (query: string) => void;
  // Filters
  activeFilter: string;
  activeCollectionId: string | null;
  onFilterChange: (filter: string) => void;
  // URL input
  selectedCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
  onPasteUrl: (url: string) => void;
  isSubmitting: boolean;
  // Card interactions
  summaries: Record<string, string>;
  summarizingId: string | null;
  expandedSummary: string | null;
  deletingId: string | null;
  copiedId: string | null;
  onDragStart: (e: React.DragEvent, bookmarkId: string) => void;
  onSummarize: (bm: Bookmark) => void;
  onCopy: (url: string, id: string) => void;
  onRemoveFromCollection: (id: string) => void;
  onEdit: (bm: Bookmark) => void;
  onDelete: (id: string) => void;
}

export default function BookmarkGrid({
  bookmarks,
  filteredBookmarks,
  collections,
  loading,
  searchQuery,
  isSearching,
  onSearchChange,
  activeFilter,
  activeCollectionId,
  onFilterChange,
  selectedCollectionId,
  onSelectCollection,
  onPasteUrl,
  isSubmitting,
  summaries,
  summarizingId,
  expandedSummary,
  deletingId,
  copiedId,
  onDragStart,
  onSummarize,
  onCopy,
  onRemoveFromCollection,
  onEdit,
  onDelete,
}: BookmarkGridProps) {
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Derive categories from current bookmarks
  const categories = [
    "All",
    ...Array.from(
      new Set(bookmarks.map((b) => detectCategory(b.url).label))
    ),
  ];

  return (
    <div className="flex-1 min-w-0">
      {/* Header: title + search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2 leading-none">
            {activeCollectionId
              ? (() => {
                  const c = collections.find(
                    (x) => x.id === activeCollectionId
                  );
                  return c ? `${c.icon} ${c.name}` : "Collection";
                })()
              : "My Library"}
          </h1>
          <div className="flex items-center gap-4 text-slate-400 text-sm font-semibold">
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" />
              {filteredBookmarks.length} items
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Live sync
            </span>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search
              className={`h-4 w-4 transition-colors ${
                isSearching
                  ? "text-indigo-400 animate-pulse"
                  : "text-slate-400 group-focus-within:text-indigo-500"
              }`}
            />
          </div>
          <input
            type="text"
            placeholder="Search semantically (e.g. 'react tutorials')..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-11 pr-10 py-3 bg-white/80 backdrop-blur-md rounded-2xl text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all placeholder:text-slate-400 font-semibold text-sm outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Category filter pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {categories.map((cat) => {
            const isActive = activeFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => onFilterChange(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                    : "bg-white/80 text-slate-500 border-slate-200 hover:border-slate-300"
                }`}
              >
                {cat}
                {cat !== "All" && (
                  <span
                    className={`ml-1.5 ${
                      isActive ? "text-white/50" : "text-slate-400"
                    }`}
                  >
                    {
                      filteredBookmarks.filter(
                        (b) => detectCategory(b.url).label === cat
                      ).length
                    }
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* URL input bar */}
      <div className="bg-white border border-slate-200/60 shadow-sm shadow-slate-200/20 rounded-2xl p-2 mb-8 mt-2 flex items-center gap-3 w-full transition-all focus-within:shadow-md focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
        <div className="flex-1 relative">
          <input
            ref={urlInputRef}
            type="text"
            onPaste={(e) => {
              const pasted = e.clipboardData.getData("text").trim();
              const isUrl = /^https?:\/\/.{3,}/.test(pasted);
              if (isUrl) {
                e.preventDefault();
                onPasteUrl(pasted);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const input = e.currentTarget.value.trim();
                if (input) {
                  e.preventDefault();
                  onPasteUrl(input);
                  e.currentTarget.value = "";
                }
              }
            }}
            placeholder="Paste any URL to save..."
            className="w-full bg-transparent pl-4 pr-4 py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
          />
        </div>

        {collections.length > 0 && (
          <div className="hidden sm:block border-l border-slate-100 pl-3">
            <select
              value={selectedCollectionId || ""}
              onChange={(e) =>
                onSelectCollection(e.target.value || null)
              }
              className="bg-transparent text-xs font-bold text-slate-500 outline-none cursor-pointer hover:text-slate-800"
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

        <button
          onClick={() => {
            const input = urlInputRef.current;
            if (input && input.value.trim()) {
              onPasteUrl(input.value.trim());
              input.value = "";
            }
          }}
          disabled={isSubmitting}
          className="bg-slate-900 hover:bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Save</span>
            </>
          )}
        </button>
      </div>

      {/* Bookmark grid */}
      <div className="w-full">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} delay={i * 80} />
            ))}
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-24 flex flex-col items-center text-center shadow-sm">
            <div className="bg-slate-50 p-6 rounded-3xl mb-5 shadow-sm border border-slate-100">
              <LayoutGrid className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-extrabold text-xl">
              {searchQuery ? "No results found" : "Your library is empty"}
            </h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">
              {searchQuery
                ? `We couldn't find any bookmarks matching "${searchQuery}". Try a different search.`
                : "Paste a URL in the bar above to start building your brilliant library."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookmarks.map((bm) => {
              const bmCollection = collections.find(
                (c) => c.id === bm.collection_id
              );

              return (
                <BookmarkCard
                  key={bm.id}
                  bm={bm}
                  bmCollection={bmCollection}
                  hasSummary={!!summaries[bm.id]}
                  isSummarizing={summarizingId === bm.id}
                  isExpanded={expandedSummary === bm.id}
                  isDeleting={deletingId === bm.id}
                  copiedId={copiedId}
                  summaries={summaries}
                  onDragStart={onDragStart}
                  onSummarize={() => onSummarize(bm)}
                  onCopy={() => onCopy(bm.url, bm.id)}
                  onRemoveFromCollection={
                    activeCollectionId
                      ? () => onRemoveFromCollection(bm.id)
                      : undefined
                  }
                  onEdit={() => onEdit(bm)}
                  onDelete={() => onDelete(bm.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
