// ─── Core Data Types ──────────────────────────────────────────────────────────
// Central TypeScript interfaces for the entire app.
// Import from "@/types" everywhere instead of using `any`.

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
  collection_id?: string | null;
  summary?: string | null;
  og_image?: string | null;
  tags?: string[] | null;
  embedding?: number[] | null;
}

export interface Collection {
  id: string;
  name: string;
  color: string;
  icon: string;
  user_id: string;
  created_at: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface SummarizeResponse {
  summary: string;
  tags: string[];
  metadata: {
    ogImage: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
  } | null;
  embedding: number[] | null;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  similarity: number;
}

export interface SearchResponse {
  results: SearchResult[];
  error?: string;
}

// ─── Component Prop Types ─────────────────────────────────────────────────────

export interface BookmarkCardProps {
  bm: Bookmark;
  bmCollection: Collection | undefined;
  hasSummary: boolean;
  isSummarizing: boolean;
  isExpanded: boolean;
  isDeleting: boolean;
  copiedId: string | null;
  summaries: Record<string, string>;
  onDragStart: (e: React.DragEvent, bookmarkId: string) => void;
  onSummarize: () => void;
  onCopy: () => void;
  onRemoveFromCollection?: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export interface EditBookmarkModalProps {
  bookmark: Bookmark | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Bookmark>) => void;
  collections: Collection[];
}

export interface CommandPaletteProps {
  bookmarks: Bookmark[];
  collections: Collection[];
  onClose: () => void;
  onOpen: (url: string) => void;
  onAddNew: () => void;
}

export interface QuickSaveModalProps {
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

// ─── Category Detection ───────────────────────────────────────────────────────

export interface CategoryInfo {
  label: string;
  color: string;
  bg: string;
  icon: React.ComponentType<{ className?: string }>;
}
