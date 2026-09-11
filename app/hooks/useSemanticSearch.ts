// useSemanticSearch — Debounced AI-powered semantic search
// Extracted from the monolithic dashboard/page.tsx

"use client";

import { useState, useEffect } from "react";

export function useSemanticSearch(userId: string | null) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [semanticSearchIds, setSemanticSearchIds] = useState<string[] | null>(
    null
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSemanticSearchIds(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (!userId) return;
      setIsSearching(true);

      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.results) {
            setSemanticSearchIds(
              json.results.map((r: { id: string }) => r.id)
            );
          }
        }
      } catch (err) {
        console.error("Semantic search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, userId]);

  return {
    searchQuery,
    setSearchQuery,
    isSearching,
    semanticSearchIds,
  };
}
