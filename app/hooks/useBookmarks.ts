// useBookmarks — All bookmark CRUD operations and real-time sync
// Extracted from the monolithic dashboard/page.tsx

"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import { toast } from "react-hot-toast";
import type { Bookmark, SummarizeResponse } from "@/types";

export function useBookmarks(userId: string | null) {
  const supabase = createClient();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [animatedCards, setAnimatedCards] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recentlyUpdatedRef = useRef<Set<string>>(new Set());

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchBookmarks = useCallback(
    async (uid: string) => {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBookmarks(data);
        const stored: Record<string, string> = {};
        data.forEach((b: Bookmark) => {
          if (b.summary) stored[b.id] = b.summary;
        });
        setSummaries(stored);
      }
      setLoading(false);
    },
    [supabase]
  );

  // ── Real-time handler ───────────────────────────────────────────────────────

  const handleRealtimeUpdate = useCallback(
    (payload: any) => {
      if (payload.eventType === "INSERT" && payload.new) {
        setBookmarks((prev) =>
          prev.find((b) => b.id === payload.new!.id)
            ? prev
            : [payload.new!, ...prev]
        );
      } else if (payload.eventType === "DELETE" && payload.old) {
        setBookmarks((prev) => prev.filter((b) => b.id !== payload.old!.id));
      } else if (payload.eventType === "UPDATE" && payload.new) {
        // Skip realtime overwrite if we just made an optimistic update
        if (recentlyUpdatedRef.current.has(payload.new.id)) return;
        setBookmarks((prev) =>
          prev.map((b) =>
            b.id === payload.new!.id ? { ...b, ...payload.new! } : b
          )
        );
      }
    },
    []
  );

  // ── Add bookmark ────────────────────────────────────────────────────────────

  const addBookmark = useCallback(
    async (title: string, url: string, collectionId: string | null) => {
      if (!userId || !title || !url) return;
      setIsSubmitting(true);

      const tempId = `temp-${Date.now()}`;
      const newBm: Bookmark = {
        id: tempId,
        title,
        url,
        user_id: userId,
        created_at: new Date().toISOString(),
        collection_id: collectionId,
      };

      setBookmarks((prev) => [newBm, ...prev]);
      requestAnimationFrame(() =>
        setAnimatedCards((p) => new Set([...p, tempId]))
      );

      const { data, error } = await supabase
        .from("bookmarks")
        .insert([
          { title, url, user_id: userId, collection_id: collectionId },
        ])
        .select()
        .single();

      if (error) {
        setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
        toast.error("Failed to save bookmark.");
      } else {
        setBookmarks((prev) =>
          prev.map((b) => (b.id === tempId ? data : b))
        );
        setAnimatedCards((p) => {
          const s = new Set(p);
          s.delete(tempId);
          s.add(data.id);
          return s;
        });
        toast.success("Bookmark saved to library!");
      }

      setIsSubmitting(false);
    },
    [userId, supabase]
  );

  // ── Delete bookmark ─────────────────────────────────────────────────────────

  const deleteBookmark = useCallback(
    async (id: string) => {
      if (!userId) return;
      setDeletingId(id);
      await new Promise((r) => setTimeout(r, 280));

      const prev = [...bookmarks];
      setBookmarks((b) => b.filter((x) => x.id !== id));
      setAnimatedCards((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      setDeletingId(null);

      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        setBookmarks(prev);
        toast.error("Failed to delete bookmark.");
      } else {
        toast.success("Bookmark deleted");
      }
    },
    [userId, bookmarks, supabase]
  );

  // ── Update bookmark (edit modal) ────────────────────────────────────────────

  const updateBookmark = useCallback(
    async (id: string, updates: Partial<Bookmark>) => {
      if (!userId) return;

      const prevBookmarks = [...bookmarks];
      setBookmarks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
      );

      recentlyUpdatedRef.current.add(id);
      setTimeout(() => recentlyUpdatedRef.current.delete(id), 8000);

      const { data: confirmed, error } = await supabase
        .from("bookmarks")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error || !confirmed) {
        setBookmarks(prevBookmarks);
        recentlyUpdatedRef.current.delete(id);
        console.error("Edit failed:", error?.message || "0 rows updated");
        toast.error(
          error?.message ||
            "Save failed — update was blocked. Check Supabase RLS policies."
        );
        return;
      }

      setBookmarks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...confirmed } : b))
      );
      toast.success("Bookmark updated successfully!");
    },
    [userId, bookmarks, supabase]
  );

  // ── Summarize bookmark ──────────────────────────────────────────────────────

  const summarizeBookmark = useCallback(
    async (bm: Bookmark) => {
      if (!userId) return;

      // Toggle if already summarized
      if (summaries[bm.id]) {
        setExpandedSummary(expandedSummary === bm.id ? null : bm.id);
        return;
      }

      setSummarizingId(bm.id);
      setExpandedSummary(bm.id);

      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: bm.url, title: bm.title }),
        });
        const json: SummarizeResponse = await res.json();
        const summary = json.summary || "Could not generate summary.";

        setSummaries((prev) => ({ ...prev, [bm.id]: summary }));

        const updates: Partial<Bookmark> = {
          summary,
          tags: json.tags || [],
          og_image: json.metadata?.ogImage || null,
          embedding: json.embedding || null,
        };

        setBookmarks((prev) =>
          prev.map((b) => (b.id === bm.id ? { ...b, ...updates } : b))
        );

        const { error } = await supabase
          .from("bookmarks")
          .update(updates)
          .eq("id", bm.id)
          .eq("user_id", userId);

        if (error) {
          console.error("Failed to save summary:", error.message);
          toast.error("Failed to save AI summary.");
        } else {
          toast.success("AI Summary & Auto-tags generated!");
        }
      } catch {
        setSummaries((prev) => ({
          ...prev,
          [bm.id]: "Failed to fetch summary.",
        }));
        toast.error("AI service error.");
      }

      setSummarizingId(null);
    },
    [userId, summaries, expandedSummary, supabase]
  );

  // ── Move to / remove from collection ────────────────────────────────────────

  const moveToCollection = useCallback(
    async (bookmarkId: string, collectionId: string) => {
      if (!userId) return;
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === bookmarkId ? { ...b, collection_id: collectionId } : b
        )
      );

      const { error } = await supabase
        .from("bookmarks")
        .update({ collection_id: collectionId })
        .eq("id", bookmarkId)
        .eq("user_id", userId);

      if (error) {
        console.error("Move error:", error.message);
        setBookmarks((prev) =>
          prev.map((b) =>
            b.id === bookmarkId ? { ...b, collection_id: null } : b
          )
        );
      }
    },
    [userId, supabase]
  );

  const removeFromCollection = useCallback(
    async (bookmarkId: string) => {
      if (!userId) return;
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === bookmarkId ? { ...b, collection_id: null } : b
        )
      );

      const { error } = await supabase
        .from("bookmarks")
        .update({ collection_id: null })
        .eq("id", bookmarkId)
        .eq("user_id", userId);

      if (error) {
        console.error("Remove from collection error:", error);
        if (userId) fetchBookmarks(userId);
      }
    },
    [userId, supabase, fetchBookmarks]
  );

  // ── Copy URL ────────────────────────────────────────────────────────────────

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return {
    bookmarks,
    loading,
    summaries,
    expandedSummary,
    setExpandedSummary,
    summarizingId,
    deletingId,
    copiedId,
    animatedCards,
    isSubmitting,
    fetchBookmarks,
    handleRealtimeUpdate,
    addBookmark,
    deleteBookmark,
    updateBookmark,
    summarizeBookmark,
    moveToCollection,
    removeFromCollection,
    handleCopy,
  };
}
