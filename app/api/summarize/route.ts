// app/api/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url, title } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { summary: "No API key configured." },
        { status: 500 },
      );
    }

    const prompt = `
You are an assistant that generates useful bookmark descriptions.

Based only on the title and URL, generate a concise but meaningful 2–3 sentence summary explaining what this link likely contains.

Do not repeat the title.
Do not say "This webpage".
Make it useful for someone saving bookmarks.

Title: "${title}"
URL: "${url}"
`;

    // ✅ FIX: Using "gemini-2.5-flash" which IS in your specific model list.
    // Your list confirms this is the "Stable version".
    const modelName = "gemini-2.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 150,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini Error:", data);

      // Handle Rate Limits (429) gracefully
      if (response.status === 429) {
        return NextResponse.json({
          summary: "AI is busy (Rate Limit). Try again in a minute.",
        });
      }

      return NextResponse.json({
        summary: `Error: ${data?.error?.message || "Unknown error"}`,
      });
    }

    const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return NextResponse.json({
      summary: summary || "No summary generated.",
    });
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ summary: "Server connection failed." });
  }
}
