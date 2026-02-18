// app/api/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate user (await the client creation)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Validate input
    const body = await req.json();
    const { url, title, bookmarkId } = body;

    if (!url || !title) {
      return NextResponse.json(
        { error: "Missing required fields: url and title" },
        { status: 400 },
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 },
      );
    }

    // 3. Check cache (Supabase) - avoid re-summarizing
    if (bookmarkId) {
      const { data: existing } = await supabase
        .from("bookmarks")
        .select("summary")
        .eq("id", bookmarkId)
        .single();

      if (existing?.summary) {
        return NextResponse.json({
          summary: existing.summary,
          cached: true,
          processingTime: Date.now() - startTime,
        });
      }
    }

    // 4. Generate summary with Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 503 },
      );
    }

    const prompt = `You are a bookmark summarization assistant.

Given:
- Title: "${title}"
- URL: "${url}"

Generate a concise, useful 2-3 sentence description that:
1. Explains what content/value this link provides
2. Uses active, specific language
3. Helps the user remember why they saved it
4. Does NOT repeat the exact title
5. Does NOT use phrases like "This webpage" or "This link"

Summary:`;

    const modelName = "gemini-1.5-flash-latest";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 200,
          topP: 0.8,
          topK: 40,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 429) {
        return NextResponse.json(
          {
            error: "AI service is busy. Please try again in a moment.",
            retryAfter: 30,
          },
          { status: 429 },
        );
      }

      console.error("Gemini API Error:", {
        status: response.status,
        error: errorData,
      });

      return NextResponse.json(
        { error: "AI generation failed" },
        { status: 500 },
      );
    }

    const data = await response.json();
    const summary =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Unable to generate summary.";

    return NextResponse.json({
      summary,
      cached: false,
      processingTime: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error("Summary API Error:", error);

    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - AI took too long to respond" },
        { status: 504 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}