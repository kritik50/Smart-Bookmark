import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import * as cheerio from "cheerio";

// ─── YouTube helpers ──────────────────────────────────────────────────────────

function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isYTDomain =
      host.includes("youtube.com") || host.includes("youtu.be");
    if (!isYTDomain) return null;

    if (host.includes("youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean)[0] || null;
    }

    const watchId = parsed.searchParams.get("v");
    if (watchId) return watchId;

    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const routedPrefixes = new Set(["shorts", "embed", "live", "watch", "v"]);
    const idx = pathParts.findIndex((p) => routedPrefixes.has(p));
    if (idx >= 0) return pathParts[idx + 1] || null;

    return null;
  } catch {
    return null;
  }
}

function isYouTubeVideoUrl(url: string): boolean {
  return getYouTubeVideoId(url) !== null;
}

function isYouTubeUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("youtube.com") || host.includes("youtu.be");
  } catch {
    return false;
  }
}

// ─── YouTube Data API v3 (Official, Reliable) ────────────────────────────────

interface YouTubeAPIMetadata {
  title: string;
  description: string;
  channelTitle: string;
  tags: string[];
  thumbnail: string | null;
}

async function fetchYouTubeDataAPI(
  videoId: string,
  apiKey: string
): Promise<YouTubeAPIMetadata | null> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${apiKey}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`YouTube Data API error ${res.status}:`, errText);
      return null;
    }

    const data = await res.json();
    const item = data?.items?.[0]?.snippet;
    if (!item) return null;

    const thumbnails = item.thumbnails;
    const thumb =
      thumbnails?.maxres?.url ||
      thumbnails?.high?.url ||
      thumbnails?.medium?.url ||
      thumbnails?.default?.url ||
      null;

    return {
      title: item.title || "",
      description: item.description || "",
      channelTitle: item.channelTitle || "",
      tags: Array.isArray(item.tags) ? item.tags.slice(0, 15) : [],
      thumbnail: thumb,
    };
  } catch (err) {
    console.error("YouTube Data API fetch failed:", err);
    return null;
  }
}

// ─── YouTube Innertube API — Transcript (Dynamic Key Extraction) ──────────────

async function fetchYouTubeTranscriptInnertube(
  videoId: string
): Promise<string | null> {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Step 1: Fetch YouTube page to extract dynamic INNERTUBE_API_KEY and context
    const pageRes = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!pageRes.ok) {
      console.error(`YouTube page fetch failed: ${pageRes.status}`);
      return null;
    }

    const html = await pageRes.text();

    // Extract dynamic Innertube API key from page
    const apiKeyMatch =
      html.match(/"INNERTUBE_API_KEY":\s*"([^"]+)"/) ||
      html.match(/innertubeApiKey['"]?:\s*['"]([^'"]+)/);
    const innertubeApiKey = apiKeyMatch?.[1];

    if (!innertubeApiKey) {
      console.log("[Transcript] Could not extract INNERTUBE_API_KEY from page");
      return null;
    }

    // Extract client version from page
    const clientVersionMatch = html.match(
      /"INNERTUBE_CONTEXT_CLIENT_VERSION":\s*"([^"]+)"/
    );
    const clientVersion = clientVersionMatch?.[1] || "2.20240101.00.00";

    // Step 2: Call Innertube player API with WEB client
    const playerRes = await fetch(
      `https://www.youtube.com/youtubei/v1/player?key=${innertubeApiKey}&prettyPrint=false`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Origin: "https://www.youtube.com",
          Referer: videoUrl,
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion,
              hl: "en",
              gl: "US",
            },
          },
          videoId,
        }),
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      }
    );

    if (!playerRes.ok) {
      console.error(`[Transcript] Innertube player API error: ${playerRes.status}`);
      return null;
    }

    const playerData = await playerRes.json();
    const captionTracks =
      playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
      console.log("[Transcript] No caption tracks available for video:", videoId);
      return null;
    }

    // Prefer English captions, otherwise take the first available
    const track =
      captionTracks.find(
        (t: { languageCode?: string }) =>
          t.languageCode === "en" || t.languageCode?.startsWith("en")
      ) || captionTracks[0];

    if (!track?.baseUrl) return null;

    // Step 3: Fetch the actual caption JSON
    const captionUrl = `${track.baseUrl}&fmt=json3`;
    const captionRes = await fetch(captionUrl, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!captionRes.ok) return null;

    const captionData = await captionRes.json();
    const events = captionData?.events;

    if (!Array.isArray(events)) return null;

    // Build clean transcript text
    const transcript = events
      .filter((e: { segs?: Array<{ utf8?: string }> }) => e.segs)
      .map((e: { segs?: Array<{ utf8?: string }> }) =>
        e.segs!
          .map((s) => s.utf8 || "")
          .join("")
          .replace(/\n/g, " ")
          .trim()
      )
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (!transcript || transcript.length < 50) return null;

    // Limit to ~4000 chars to keep within prompt budget
    return transcript.substring(0, 4000);
  } catch (err) {
    console.error("[Transcript] Innertube fetch failed:", err);
    return null;
  }
}

// ─── oEmbed fallback (no API key, title + thumbnail only) ────────────────────

interface OEmbedData {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

async function fetchYouTubeOEmbed(videoUrl: string): Promise<OEmbedData | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    const res = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Regular webpage content fetcher ─────────────────────────────────────────

async function fetchPageData(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) return { text: null, metadata: null };

    const html = await response.text();
    const $ = cheerio.load(html);

    const metadata = {
      ogImage:
        $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        null,
      ogTitle:
        $('meta[property="og:title"]').attr("content") ||
        $("title").text() ||
        null,
      ogDescription:
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        null,
    };

    $(
      "script, style, noscript, iframe, img, svg, video, audio, header, footer, nav"
    ).remove();

    const text = $("body").text().replace(/\s+/g, " ").trim();

    return { text: text.substring(0, 6000), metadata };
  } catch (error) {
    console.error(`Failed to fetch content for ${url}:`, error);
    return { text: null, metadata: null };
  }
}

// ─── Main POST handler ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Auth check — middleware handles redirect, but verify here too for safety
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ summary: "Unauthorized" }, { status: 401 });
    }

    const { url, title } = await req.json();

    if (!url) {
      return NextResponse.json({ summary: "Missing URL" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { summary: "Invalid URL format" },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({
        summary:
          "AI summarization is not configured. Add GEMINI_API_KEY to environment variables.",
      });
    }

    // The YouTube Data API can use the same key (enable YouTube Data API v3 on the same GCP project)
    const youtubeApiKey = process.env.YOUTUBE_API_KEY || geminiKey;

    let prompt: string;
    let metadata: {
      ogImage: string | null;
      ogTitle: string | null;
      ogDescription: string | null;
    } | null = null;

    // ── YouTube Video ───────────────────────────────────────────────────────
    if (isYouTubeVideoUrl(url)) {
      const videoId = getYouTubeVideoId(url)!;
      const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

      console.log(`[YT] Processing video ${videoId}`);

      // Fetch metadata & transcript in parallel
      const [ytMeta, transcript, oembed] = await Promise.all([
        fetchYouTubeDataAPI(videoId, youtubeApiKey),
        fetchYouTubeTranscriptInnertube(videoId),
        fetchYouTubeOEmbed(canonicalUrl),
      ]);

      console.log(
        `[YT] Data API: ${ytMeta ? "✓" : "✗"} | Transcript: ${transcript ? `✓ (${transcript.length} chars)` : "✗"} | oEmbed: ${oembed ? "✓" : "✗"}`
      );

      // Resolve best title/author/thumbnail from all sources
      const resolvedTitle =
        ytMeta?.title || oembed?.title || title || null;
      const resolvedAuthor =
        ytMeta?.channelTitle || oembed?.author_name || null;
      const resolvedThumbnail = ytMeta?.thumbnail || oembed?.thumbnail_url || null;
      const resolvedDescription = ytMeta?.description || null;

      if (!resolvedTitle) {
        metadata = {
          ogImage: null,
          ogTitle: title || null,
          ogDescription: null,
        };
        return NextResponse.json({
          summary:
            "Could not fetch YouTube video metadata. The video may be private, age-restricted, or unavailable. Please try again or add the bookmark title manually.",
          tags: ["youtube"],
          metadata,
          embedding: null,
        });
      }

      metadata = {
        ogImage: resolvedThumbnail,
        ogTitle: resolvedTitle,
        ogDescription: resolvedDescription?.slice(0, 200) || null,
      };

      // Build the richest possible prompt
      const descSnippet = resolvedDescription
        ? `\nVideo Description:\n"${resolvedDescription.slice(0, 600)}"`
        : "";

      const keywordsLine = ytMeta?.tags?.length
        ? `\nVideo Tags: ${ytMeta.tags.slice(0, 10).join(", ")}`
        : "";

      const transcriptSection = transcript
        ? `\n\nVideo Transcript (first ~4000 chars):\n"${transcript}"`
        : "\n\n(No transcript/captions were available for this video.)";

      prompt = `You are an expert content analyst. Summarize this YouTube video accurately.
You MUST output a raw JSON object (NO markdown, NO backticks, NO extra text) with exactly two fields:
1. "summary": Exactly 2 concise, specific sentences describing what this video covers. Use information from the transcript if available. Do not invent details not supported by the data below.
2. "tags": An array of 3-5 short, relevant tags.

Video Title: "${resolvedTitle}"
Channel: "${resolvedAuthor || "Unknown"}"${descSnippet}${keywordsLine}
Video URL: "${url}"${transcriptSection}`;

      console.log(`[YT] Prompt built in ${Date.now() - startTime}ms, transcript=${!!transcript}`);
    }

    // ── YouTube non-video URL (channel, playlist, homepage) ────────────────
    else if (isYouTubeUrl(url)) {
      metadata = {
        ogImage: null,
        ogTitle: title || "YouTube",
        ogDescription: null,
      };
      return NextResponse.json({
        summary:
          "This YouTube link does not point to a specific video or short, so I cannot generate an accurate summary from it yet.",
        tags: ["youtube"],
        metadata,
        embedding: null,
      });
    }

    // ── Regular Webpage ─────────────────────────────────────────────────────
    else {
      const { text: pageContent, metadata: pageMetadata } =
        await fetchPageData(url);

      metadata = pageMetadata;

      prompt = `Analyze this webpage based on its title, URL, and the provided content.
You must output a raw JSON object (NO markdown formatting, NO backticks) with two fields:
1. "summary": Exactly 2 concise sentences summarizing the content. Be specific, use active language.
2. "tags": An array of 3 to 5 relevant short string tags (e.g., ["react", "frontend", "tutorial"]).

Title: "${title || pageMetadata?.ogTitle || url}"
URL: "${url}"
`;

      if (pageContent) {
        prompt += `\nPage Content:\n"${pageContent}"`;
      } else {
        prompt += `\n(Note: Could not fetch page content, please infer summary and tags from title and URL only.)`;
      }
    }

    // ── Call Gemini API (with model fallback) ───────────────────────────────
    const modelsToTry = [
      "gemini-2.0-flash-lite",
      "gemini-2.0-flash",
      "gemini-flash-lite-latest",
    ];

    let lastError: { status?: number; model?: string; error?: unknown } | null =
      null;

    for (const model of modelsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 300,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        clearTimeout(timeoutId);

        if (response.status === 429) {
          lastError = { status: 429, model };
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          lastError = { status: response.status, model, error: errorData };
          continue;
        }

        const data = await response.json();

        if (data?.candidates?.[0]?.finishReason === "SAFETY") {
          return NextResponse.json({
            summary: "Content was blocked by AI safety filters.",
            tags: [],
            metadata,
          });
        }

        const rawJsonText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (rawJsonText) {
          try {
            const parsed = JSON.parse(rawJsonText);
            const generatedSummary =
              parsed.summary || "Summary generation failed.";

            // Generate embedding (gemini-embedding-001 — successor to deprecated text-embedding-004)
            let embedding = null;
            try {
              const embedRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    model: "models/gemini-embedding-001",
                    content: { parts: [{ text: generatedSummary }] },
                  }),
                }
              );
              if (embedRes.ok) {
                const embedData = await embedRes.json();
                embedding = embedData?.embedding?.values || null;
              } else {
                console.error("Embedding API failed:", await embedRes.text());
              }
            } catch (err) {
              console.error("Failed to generate embedding:", err);
            }

            console.log(
              `[AI] Processed using ${model} in ${Date.now() - startTime}ms`
            );
            return NextResponse.json({
              summary: generatedSummary,
              tags: parsed.tags || [],
              metadata,
              embedding,
            });
          } catch {
            console.error("Failed to parse JSON from Gemini:", rawJsonText);
          }
        }
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          (error.name === "AbortError" || error.name === "TimeoutError")
        ) {
          lastError = { model, error: "timeout" };
          continue;
        }
        lastError = {
          model,
          error: error instanceof Error ? error.message : "unknown",
        };
      }
    }

    if (lastError?.status === 429) {
      return NextResponse.json({
        summary:
          "AI service is currently rate limited. Please try again in 1 minute.",
        tags: [],
        metadata,
      });
    }

    return NextResponse.json({
      summary:
        "Could not generate summary. All AI models are currently unavailable.",
      tags: [],
      metadata,
    });
  } catch (error: unknown) {
    console.error("Summarize API critical error:", error);
    return NextResponse.json({
      summary: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      tags: [],
      metadata: null,
    });
  }
}
