// MobileCollections — Bottom sheet for mobile collection navigation
// Extracted from dashboard/page.tsx MobileCollectionsModal

"use client";

import { X, Bookmark, FolderPlus } from "lucide-react";
import type { Bookmark as BookmarkType, Collection } from "@/types";

interface MobileCollectionsProps {
  collections: Collection[];
  bookmarks: BookmarkType[];
  activeCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
  onNewCollection: () => void;
  onClose: () => void;
}

export default function MobileCollections({
  collections,
  bookmarks,
  activeCollectionId,
  onSelectCollection,
  onNewCollection,
  onClose,
}: MobileCollectionsProps) {
  return (
    <div
      className="lg:hidden fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-slate-900">Collections</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* All Bookmarks */}
        <button
          onClick={() => {
            onSelectCollection(null);
            onClose();
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold mb-3 ${
            activeCollectionId === null
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          All Bookmarks
          <span className="ml-auto text-xs">{bookmarks.length}</span>
        </button>

        {/* Collection list */}
        <div className="space-y-2">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => {
                onSelectCollection(col.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${
                activeCollectionId === col.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <span className="text-lg">{col.icon}</span>
              <span className="flex-1 text-left truncate">{col.name}</span>
              <span className="text-xs">
                {bookmarks.filter((b) => b.collection_id === col.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* New collection button */}
        <button
          onClick={() => {
            onNewCollection();
            onClose();
          }}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 rounded-xl"
        >
          <FolderPlus className="w-4 h-4" />
          New Collection
        </button>
      </div>
    </div>
  );
}
