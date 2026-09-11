// Dashboard — Main page orchestrator
// Reduced from 1,627 lines to ~200 lines by extracting hooks and components.

"use client";

import { createClient } from "@/lib/supabase-client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// Hooks
import { useBookmarks } from "@/app/hooks/useBookmarks";
import { useCollections } from "@/app/hooks/useCollections";
import { useSemanticSearch } from "@/app/hooks/useSemanticSearch";

// Components
import DashboardNav from "./components/DashboardNav";
import Sidebar from "./components/Sidebar";
import BookmarkGrid from "./components/BookmarkGrid";
import CommandPalette from "./components/CommandPalette";
import QuickSaveModal from "./components/QuickSaveModal";
import MobileCollections from "./components/MobileCollections";
import EditBookmarkModal from "@/app/components/EditBookmarkModal";

import { detectCategory } from "@/app/lib/utils";
import type { Bookmark } from "@/types";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  // ── Auth state ──────────────────────────────────────────────────────────────
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  // ── Hooks ───────────────────────────────────────────────────────────────────
  const bm = useBookmarks(user?.id ?? null);
  const col = useCollections(user?.id ?? null);
  const search = useSemanticSearch(user?.id ?? null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [showMobileCollections, setShowMobileCollections] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [dragOverCollectionId, setDragOverCollectionId] = useState<string | null>(null);

  // Quick Save Modal
  const [showQuickSaveModal, setShowQuickSaveModal] = useState(false);
  const [quickSaveUrl, setQuickSaveUrl] = useState("");
  const [quickSaveTitle, setQuickSaveTitle] = useState("");
  const [quickSaveCollectionId, setQuickSaveCollectionId] = useState<string | null>(null);

  // ── Init: auth + data fetching + realtime ───────────────────────────────────
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/");
        return;
      }
      setUser(data.user);

      await Promise.all([
        bm.fetchBookmarks(data.user.id),
        col.fetchCollections(data.user.id),
      ]);

      // Set up real-time subscription
      channel = supabase
        .channel(`bm-rt-${data.user.id}`)
        .on(
          "postgres_changes" as any,
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${data.user.id}`,
          },
          bm.handleRealtimeUpdate
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Global keyboard shortcut (Ctrl+K) ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCmdPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Global paste listener (paste URL outside inputs → Quick Save) ──────────
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || target.isContentEditable)
        return;

      const pasted = e.clipboardData?.getData("text")?.trim() || "";
      if (!pasted || !/^https?:\/\/.{3,}/.test(pasted)) return;

      e.preventDefault();
      openQuickSave(pasted);
    };
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCollectionId]);

  // ── Quick Save helpers ──────────────────────────────────────────────────────
  const openQuickSave = useCallback(
    (url: string) => {
      const domain = (() => {
        try {
          return new URL(url).hostname.replace("www.", "");
        } catch {
          return url;
        }
      })();
      setQuickSaveUrl(url);
      setQuickSaveTitle(domain);
      setQuickSaveCollectionId(selectedCollectionId);
      setShowQuickSaveModal(true);
    },
    [selectedCollectionId]
  );

  const handleQuickSave = useCallback(() => {
    if (!quickSaveTitle.trim() || !quickSaveUrl.trim()) return;
    bm.addBookmark(quickSaveTitle, quickSaveUrl, quickSaveCollectionId);
    setShowQuickSaveModal(false);
  }, [quickSaveTitle, quickSaveUrl, quickSaveCollectionId, bm]);

  // ── Drag-and-drop handlers ─────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, bookmarkId: string) => {
    e.dataTransfer.setData("bookmarkId", bookmarkId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCollectionId(targetId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (
      !(e.currentTarget as Node).contains(e.relatedTarget as Node)
    ) {
      setDragOverCollectionId(null);
    }
  };

  const handleDropToCollection = async (
    e: React.DragEvent,
    collectionId: string
  ) => {
    e.preventDefault();
    setDragOverCollectionId(null);
    const bookmarkId = e.dataTransfer.getData("bookmarkId");
    if (bookmarkId) bm.moveToCollection(bookmarkId, collectionId);
  };

  const handleDropRemoveCollection = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCollectionId(null);
    const bookmarkId = e.dataTransfer.getData("bookmarkId");
    if (bookmarkId) bm.removeFromCollection(bookmarkId);
  };

  // ── Filtering logic ────────────────────────────────────────────────────────
  const filteredBookmarks = bm.bookmarks.filter((b) => {
    // Search filter
    let matchSearch = true;
    if (search.searchQuery.trim()) {
      if (search.semanticSearchIds !== null) {
        matchSearch = search.semanticSearchIds.includes(b.id);
      } else {
        const q = search.searchQuery.toLowerCase();
        matchSearch =
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          (b.summary?.toLowerCase().includes(q) ?? false);
      }
    }

    // Category filter
    const matchCat =
      activeFilter === "All" || detectCategory(b.url).label === activeFilter;

    // Collection filter
    const matchCollection = col.activeCollectionId
      ? b.collection_id === col.activeCollectionId
      : true;

    return matchSearch && matchCat && matchCollection;
  });

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Modals */}
      {showCmdPalette && (
        <CommandPalette
          bookmarks={bm.bookmarks}
          collections={col.collections}
          onClose={() => setShowCmdPalette(false)}
          onOpen={(url) => window.open(url, "_blank")}
          onAddNew={() => setShowCmdPalette(false)}
        />
      )}

      {showMobileCollections && (
        <MobileCollections
          collections={col.collections}
          bookmarks={bm.bookmarks}
          activeCollectionId={col.activeCollectionId}
          onSelectCollection={col.setActiveCollectionId}
          onNewCollection={() => col.setShowNewCollectionForm(true)}
          onClose={() => setShowMobileCollections(false)}
        />
      )}

      {showQuickSaveModal && (
        <QuickSaveModal
          url={quickSaveUrl}
          title={quickSaveTitle}
          collectionId={quickSaveCollectionId}
          collections={col.collections}
          bookmarks={bm.bookmarks}
          onTitleChange={setQuickSaveTitle}
          onCollectionChange={setQuickSaveCollectionId}
          onSave={handleQuickSave}
          onClose={() => setShowQuickSaveModal(false)}
        />
      )}

      <EditBookmarkModal
        bookmark={editingBookmark}
        isOpen={!!editingBookmark}
        onClose={() => setEditingBookmark(null)}
        onSave={bm.updateBookmark}
        collections={col.collections}
      />

      {/* Page */}
      <div className="min-h-screen bg-[#fafafa] selection:bg-indigo-500 selection:text-white overflow-x-hidden">
        {/* Background decorations */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-400 opacity-[0.08] blur-[100px]" />
        </div>

        <DashboardNav
          userEmail={user?.email}
          collections={col.collections}
          onOpenCommandPalette={() => setShowCmdPalette(true)}
          onOpenMobileCollections={() => setShowMobileCollections(true)}
          onLogout={handleLogout}
        />

        <div className="relative z-10 max-w-[1400px] mx-auto px-5 py-6 flex gap-6">
          <Sidebar
            collections={col.collections}
            bookmarks={bm.bookmarks}
            activeCollectionId={col.activeCollectionId}
            dragOverCollectionId={dragOverCollectionId}
            showNewCollectionForm={col.showNewCollectionForm}
            newCollectionName={col.newCollectionName}
            newCollectionColor={col.newCollectionColor}
            newCollectionIcon={col.newCollectionIcon}
            onSelectCollection={col.setActiveCollectionId}
            onDeleteCollection={col.deleteCollection}
            onToggleNewForm={() =>
              col.setShowNewCollectionForm(!col.showNewCollectionForm)
            }
            onNameChange={col.setNewCollectionName}
            onColorChange={col.setNewCollectionColor}
            onIconChange={col.setNewCollectionIcon}
            onCreate={col.createCollection}
            onCancelForm={() => col.setShowNewCollectionForm(false)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDropToCollection={handleDropToCollection}
            onDropRemoveCollection={handleDropRemoveCollection}
          />

          <BookmarkGrid
            bookmarks={bm.bookmarks}
            filteredBookmarks={filteredBookmarks}
            collections={col.collections}
            loading={bm.loading}
            searchQuery={search.searchQuery}
            isSearching={search.isSearching}
            onSearchChange={search.setSearchQuery}
            activeFilter={activeFilter}
            activeCollectionId={col.activeCollectionId}
            onFilterChange={setActiveFilter}
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={setSelectedCollectionId}
            onPasteUrl={openQuickSave}
            isSubmitting={bm.isSubmitting}
            summaries={bm.summaries}
            summarizingId={bm.summarizingId}
            expandedSummary={bm.expandedSummary}
            deletingId={bm.deletingId}
            copiedId={bm.copiedId}
            onDragStart={handleDragStart}
            onSummarize={bm.summarizeBookmark}
            onCopy={bm.handleCopy}
            onRemoveFromCollection={(id) => bm.removeFromCollection(id)}
            onEdit={setEditingBookmark}
            onDelete={bm.deleteBookmark}
          />
        </div>
      </div>
    </>
  );
}
