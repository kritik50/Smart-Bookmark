-- ============================================================
-- Smart Bookmark App — Complete Supabase Schema
-- Run this in Supabase → SQL Editor
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Tables ───────────────────────────────────────────────────

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  color       text NOT NULL DEFAULT '#6366f1',
  icon        text NOT NULL DEFAULT '📁',
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title           text NOT NULL,
  url             text NOT NULL,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id   uuid REFERENCES collections(id) ON DELETE SET NULL,
  summary         text,
  og_image        text,
  tags            text[],
  embedding       vector(3072),  -- gemini-embedding-001 outputs 3072 dimensions
  created_at      timestamptz DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────

-- Fast lookup by user
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_collection_id ON bookmarks(collection_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

-- Fast ordering
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(user_id, created_at DESC);

-- Vector similarity search (HNSW index for cosine distance)
-- This makes semantic search fast even with thousands of bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_embedding ON bookmarks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─── RPC: Semantic Search Function ───────────────────────────

CREATE OR REPLACE FUNCTION match_bookmarks(
  query_embedding  vector(3072),
  match_threshold  float DEFAULT 0.5,
  match_count      int DEFAULT 5,
  p_user_id        uuid DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  title       text,
  url         text,
  summary     text,
  similarity  float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.title,
    b.url,
    b.summary,
    1 - (b.embedding <=> query_embedding) AS similarity
  FROM bookmarks b
  WHERE
    b.user_id = p_user_id
    AND b.embedding IS NOT NULL
    AND 1 - (b.embedding <=> query_embedding) > match_threshold
  ORDER BY b.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─── Row Level Security ───────────────────────────────────────

-- Bookmarks RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can update own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;

CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON bookmarks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Collections RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own collections" ON collections;
DROP POLICY IF EXISTS "Users can insert own collections" ON collections;
DROP POLICY IF EXISTS "Users can update own collections" ON collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON collections;

CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Enable Realtime ──────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
ALTER PUBLICATION supabase_realtime ADD TABLE collections;

-- ============================================================
-- NOTE: After deploying the embedding model fix (gemini-embedding-001),
-- existing bookmark embeddings from the old model are incompatible.
-- To re-generate, trigger the "AI Summarize" button on each bookmark,
-- or build a one-off migration script that re-embeds all summaries.
-- ============================================================
