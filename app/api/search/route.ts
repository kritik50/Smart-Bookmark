import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { query, userId } = await req.json();

    if (!query || !userId) {
      return NextResponse.json({ error: "Missing query or userId" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    // 1. Convert user's text query into a vector embedding using Gemini
    const embedRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: query }] }
        })
      }
    );

    if (!embedRes.ok) {
      const errTxt = await embedRes.text();
      console.error("Embedding generation failed:", errTxt);
      return NextResponse.json({ error: "Failed to generate query embedding" }, { status: 500 });
    }

    const embedData = await embedRes.json();
    const embedding = embedData?.embedding?.values;

    if (!embedding) {
      return NextResponse.json({ error: "No embedding returned" }, { status: 500 });
    }

    // 2. Search Supabase using the match_bookmarks RPC function we created in sql
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: matchedBookmarks, error } = await supabaseAdmin.rpc('match_bookmarks', {
      query_embedding: embedding,
      match_threshold: 0.5, // How similar the match must be (0.5 is somewhat loose)
      match_count: 5,       // Max results
      p_user_id: userId
    });

    if (error) {
      console.error("RPC Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ results: matchedBookmarks });

  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
