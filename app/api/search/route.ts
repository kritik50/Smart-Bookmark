// /api/search — Semantic vector search
// Fixed: uses server auth (no userId in body), standardized embedding model.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Missing search query" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Generate query embedding — MUST match the model used in /api/summarize
    const embedRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text: query }] },
        }),
      }
    );

    if (!embedRes.ok) {
      const errTxt = await embedRes.text();
      console.error("Embedding generation failed:", errTxt);
      return NextResponse.json(
        { error: "Failed to generate query embedding" },
        { status: 500 }
      );
    }

    const embedData = await embedRes.json();
    const embedding = embedData?.embedding?.values;

    if (!embedding) {
      return NextResponse.json(
        { error: "No embedding returned" },
        { status: 500 }
      );
    }

    // Search via Supabase RPC — user_id is passed from the verified session
    const { data: matchedBookmarks, error } = await supabase.rpc(
      "match_bookmarks",
      {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5,
        p_user_id: user.id,
      }
    );

    if (error) {
      console.error("RPC Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ results: matchedBookmarks });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Search API Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
