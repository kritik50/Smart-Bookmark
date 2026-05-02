// app/api/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

async function fetchPageData(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) return { text: null, metadata: null };

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract OpenGraph Metadata
    const metadata = {
      ogImage: $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || null,
      ogTitle: $('meta[property="og:title"]').attr('content') || $('title').text() || null,
      ogDescription: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || null,
    };

    // Remove non-content elements
    $("script, style, noscript, iframe, img, svg, video, audio, header, footer, nav").remove();

    // Extract raw text
    const text = $("body").text().replace(/\s+/g, " ").trim();

    return { text: text.substring(0, 6000), metadata };
  } catch (error) {
    console.error(`Failed to fetch content for ${url}:`, error);
    return { text: null, metadata: null };
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { url, title } = await req.json();

    if (!url) {
      return NextResponse.json(
        { summary: "Missing URL" },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { summary: "Invalid URL format" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        summary: "AI summarization is not configured. Add GEMINI_API_KEY to environment variables.",
      });
    }

    // Attempt to scrape the actual page content and metadata
    const { text: pageContent, metadata } = await fetchPageData(url);

    let prompt = `Analyze this webpage based on its title, URL, and the provided content.
You must output a raw JSON object (NO markdown formatting, NO backticks) with two fields:
1. "summary": Exactly 2 concise sentences summarizing the content. Be specific, use active language.
2. "tags": An array of 3 to 5 relevant short string tags (e.g., ["react", "frontend", "tutorial"]).

Title: "${title || metadata?.ogTitle || url}"
URL: "${url}"
`;

    if (pageContent) {
      prompt += `\nPage Content:\n"${pageContent}"`;
    } else {
      prompt += `\n(Note: Could not fetch page content, please infer summary and tags from title and URL only.)`;
    }

    const modelsToTry = [
      "gemini-2.0-flash-lite",
      "gemini-2.0-flash",
      "gemini-flash-lite-latest",
    ];

    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); 

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 200,
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
            metadata
          });
        }

        const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (rawJsonText) {
          try {
            const parsed = JSON.parse(rawJsonText);
            const generatedSummary = parsed.summary || "Summary generation failed.";
            
            // Generate embedding for Semantic Search
            let embedding = null;
            try {
              const embedRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    model: "models/text-embedding-004",
                    content: { parts: [{ text: generatedSummary }] }
                  })
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

            console.log(`✅ AI processed using ${model} in ${Date.now() - startTime}ms`);
            return NextResponse.json({ 
              summary: generatedSummary,
              tags: parsed.tags || [],
              metadata,
              embedding
            });
          } catch (e) {
            console.error("Failed to parse JSON from Gemini:", rawJsonText);
          }
        }

        continue;
      } catch (error: any) {
        if (error.name === "AbortError") {
          lastError = { model, error: "timeout" };
          continue;
        }
        lastError = { model, error: error.message };
        continue;
      }
    }

    if (lastError?.status === 429) {
      return NextResponse.json({
        summary: "AI service is currently rate limited. Please try again in 1 minute.",
        tags: [],
        metadata
      });
    }

    return NextResponse.json({
      summary: "Could not generate summary. All AI models are currently unavailable.",
      tags: [],
      metadata
    });

  } catch (error: any) {
    console.error("Summarize API critical error:", error);
    return NextResponse.json({
      summary: `Server error: ${error.message || "Unknown error"}`,
      tags: [],
      metadata: null
    });
  }
}