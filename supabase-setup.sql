-- Run this in your Supabase SQL Editor

-- 1. Add OpenGraph and Tags columns to the bookmarks table
ALTER TABLE bookmarks 
ADD COLUMN IF NOT EXISTS og_image TEXT,
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Add an embedding column for Semantic Search (RAG)
-- First, enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add the embedding column (Gemini uses 768 dimensions for text-embedding-004)
ALTER TABLE bookmarks 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create a function to search bookmarks by similarity
CREATE OR REPLACE FUNCTION match_bookmarks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  url text,
  summary text,
  og_image text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    bookmarks.id,
    bookmarks.title,
    bookmarks.url,
    bookmarks.summary,
    bookmarks.og_image,
    1 - (bookmarks.embedding <=> query_embedding) AS similarity
  FROM bookmarks
  WHERE bookmarks.user_id = p_user_id
    AND 1 - (bookmarks.embedding <=> query_embedding) > match_threshold
  ORDER BY bookmarks.embedding <=> query_embedding
  LIMIT match_count;
$$;
