// useCollections — Collection CRUD operations
// Extracted from the monolithic dashboard/page.tsx

"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import type { Collection } from "@/types";
import { COLLECTION_COLORS, COLLECTION_ICONS } from "@/app/lib/utils";

export function useCollections(userId: string | null) {
  const supabase = createClient();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null
  );
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState(
    COLLECTION_COLORS[0]
  );
  const [newCollectionIcon, setNewCollectionIcon] = useState(
    COLLECTION_ICONS[0]
  );

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchCollections = useCallback(
    async (uid: string) => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: true });

      if (error) console.error("fetchCollections error:", error);
      if (data) setCollections(data);
    },
    [supabase]
  );

  // ── Create ──────────────────────────────────────────────────────────────────

  const createCollection = useCallback(async () => {
    if (!newCollectionName.trim() || !userId) return;

    const { data } = await supabase
      .from("collections")
      .insert([
        {
          name: newCollectionName,
          color: newCollectionColor,
          icon: newCollectionIcon,
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (data) {
      setCollections((p) => [...p, data]);
      setNewCollectionName("");
      setShowNewCollectionForm(false);
    }
  }, [
    newCollectionName,
    newCollectionColor,
    newCollectionIcon,
    userId,
    supabase,
  ]);

  // ── Delete ──────────────────────────────────────────────────────────────────

  const deleteCollection = useCallback(
    async (id: string) => {
      await supabase.from("collections").delete().eq("id", id);
      setCollections((p) => p.filter((c) => c.id !== id));
      if (activeCollectionId === id) setActiveCollectionId(null);
    },
    [activeCollectionId, supabase]
  );

  return {
    collections,
    activeCollectionId,
    setActiveCollectionId,
    showNewCollectionForm,
    setShowNewCollectionForm,
    newCollectionName,
    setNewCollectionName,
    newCollectionColor,
    setNewCollectionColor,
    newCollectionIcon,
    setNewCollectionIcon,
    fetchCollections,
    createCollection,
    deleteCollection,
  };
}
