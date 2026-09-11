// Sidebar — Collections sidebar with drag-and-drop targets
// Extracted from dashboard/page.tsx lines 1269-1414

"use client";

import { Bookmark, FolderPlus, GripVertical, X } from "lucide-react";
import type { Bookmark as BookmarkType, Collection } from "@/types";
import NewCollectionForm from "./NewCollectionForm";

interface SidebarProps {
  collections: Collection[];
  bookmarks: BookmarkType[];
  activeCollectionId: string | null;
  dragOverCollectionId: string | null;
  // Collection form state
  showNewCollectionForm: boolean;
  newCollectionName: string;
  newCollectionColor: string;
  newCollectionIcon: string;
  // Actions
  onSelectCollection: (id: string | null) => void;
  onDeleteCollection: (id: string) => void;
  onToggleNewForm: () => void;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onIconChange: (icon: string) => void;
  onCreate: () => void;
  onCancelForm: () => void;
  // Drag handlers
  onDragOver: (e: React.DragEvent, targetId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDropToCollection: (e: React.DragEvent, collectionId: string) => void;
  onDropRemoveCollection: (e: React.DragEvent) => void;
}

export default function Sidebar({
  collections,
  bookmarks,
  activeCollectionId,
  dragOverCollectionId,
  showNewCollectionForm,
  newCollectionName,
  newCollectionColor,
  newCollectionIcon,
  onSelectCollection,
  onDeleteCollection,
  onToggleNewForm,
  onNameChange,
  onColorChange,
  onIconChange,
  onCreate,
  onCancelForm,
  onDragOver,
  onDragLeave,
  onDropToCollection,
  onDropRemoveCollection,
}: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 sticky top-24 h-fit">
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg shadow-indigo-100/20 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
            Collections
          </h3>
          <button
            onClick={onToggleNewForm}
            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all"
            title="New collection"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* All Bookmarks (drop target to remove from collection) */}
        <div
          className={`drop-target mb-1 ${
            dragOverCollectionId === "__all__" ? "is-dragging-over" : ""
          }`}
          onDragOver={(e) => onDragOver(e, "__all__")}
          onDragLeave={onDragLeave}
          onDrop={onDropRemoveCollection}
        >
          <button
            onClick={() => onSelectCollection(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
              activeCollectionId === null
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            All Bookmarks
            <span className="ml-auto text-xs font-bold text-slate-400">
              {bookmarks.length}
            </span>
          </button>
        </div>

        {/* Collection list */}
        <div className="space-y-1 mt-2">
          {collections.map((col) => {
            const count = bookmarks.filter(
              (b) => b.collection_id === col.id
            ).length;
            const isActive = activeCollectionId === col.id;
            const isDragOver = dragOverCollectionId === col.id;

            return (
              <div
                key={col.id}
                className={`drop-target group flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                  isDragOver
                    ? "is-dragging-over"
                    : isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "hover:bg-slate-100 text-slate-600"
                }`}
                onDragOver={(e) => onDragOver(e, col.id)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDropToCollection(e, col.id)}
              >
                <button
                  onClick={() =>
                    onSelectCollection(isActive ? null : col.id)
                  }
                  className="flex items-center gap-2.5 flex-1 text-left"
                >
                  <span className="text-base">{col.icon}</span>
                  <span className="text-xs font-semibold truncate">
                    {col.name}
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isActive ? "text-white/70" : "text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCollection(col.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* New collection form */}
        {showNewCollectionForm && (
          <NewCollectionForm
            name={newCollectionName}
            color={newCollectionColor}
            icon={newCollectionIcon}
            onNameChange={onNameChange}
            onColorChange={onColorChange}
            onIconChange={onIconChange}
            onCreate={onCreate}
            onCancel={onCancelForm}
          />
        )}

        {collections.length > 0 && (
          <p className="text-[10px] text-slate-400 font-medium text-center mt-4 flex items-center justify-center gap-1">
            <GripVertical className="w-3 h-3" />
            Drag cards to organize
          </p>
        )}
      </div>
    </aside>
  );
}
