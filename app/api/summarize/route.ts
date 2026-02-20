// app/api/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Parse and validate input
    const { url, title } = await req.json();

    if (!url || !title) {
      return NextResponse.json(
        { summary: "Missing URL or title" },
        { status: 400 }
      );
    }

    // 2. Validate URL format
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

    const prompt = `Summarize this webpage in exactly 2 concise sentences based on its title and URL.
Be specific about what content or value it provides.
Do not use phrases like "This page" or "This website".
Use active, informative language.

Title: "${title}"
URL: "${url}"

Summary:`;

    // 5. Try models in order (faster → slower, handles rate limits)
    const modelsToTry = [
      "gemini-2.0-flash-lite",    // Fastest, free tier friendly
      "gemini-2.0-flash",          // Backup if lite is rate limited
      "gemini-flash-lite-latest",  // Fallback alias
    ];

    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 150,
                topP: 0.9,
              },
            }),
          }
        );

        clearTimeout(timeoutId);

        // Handle rate limit - try next model
        if (response.status === 429) {
          console.log(`${model} rate limited, trying next model...`);
          lastError = { status: 429, model };
          continue;
        }

        // Handle other API errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`${model} error:`, response.status, errorData);
          lastError = { status: response.status, model, error: errorData };
          continue;
        }

        // Parse successful response
        const data = await response.json();

        // Handle safety blocks
        if (data?.candidates?.[0]?.finishReason === "SAFETY") {
          return NextResponse.json({
            summary: "Content was blocked by AI safety filters.",
          });
        }

        // Extract summary text
        const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (summary) {
          console.log(`✅ Summary generated using ${model} in ${Date.now() - startTime}ms`);
          return NextResponse.json({ summary });
        }

        // Empty response from this model, try next
        console.log(`${model} returned empty response, trying next...`);
        continue;

      } catch (error: any) {
        // Timeout or network error
        if (error.name === "AbortError") {
          console.log(`${model} timed out, trying next model...`);
          lastError = { model, error: "timeout" };
          continue;
        }

        console.error(`${model} threw error:`, error.message);
        lastError = { model, error: error.message };
        continue;
      }
    }

    // All models failed
    if (lastError?.status === 429) {
      return NextResponse.json({
        summary: "AI service is currently rate limited. Please try again in 1 minute.",
      });
    }

    return NextResponse.json({
      summary: "Could not generate summary. All AI models are currently unavailable.",
    });

  } catch (error: any) {
    console.error("Summarize API critical error:", error);
    return NextResponse.json({
      summary: `Server error: ${error.message || "Unknown error"}`,
    });
  }
}