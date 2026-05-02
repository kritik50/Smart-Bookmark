import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client to bypass RLS if using an API key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const title = req.nextUrl.searchParams.get("title") || "";
  const userId = req.nextUrl.searchParams.get("userId"); // Simple auth for bookmarklet

  if (!url || !userId) {
    return NextResponse.json(
      { error: "Missing required parameters: url, userId" },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch metadata and summary via our internal logic (or directly here)
    // For simplicity, we just save the bookmark first. The dashboard will summarize it later.
    
    const { data, error } = await supabaseAdmin
      .from("bookmarks")
      .insert([
        {
          url,
          title: title || new URL(url).hostname,
          user_id: userId,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Failed to save bookmark via API:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return a success page or redirect back to the app
    return new NextResponse(
      `<html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fafafa;">
          <div style="text-align: center; background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; margin-bottom: 0.5rem;">✅ Saved successfully!</h2>
            <p style="color: #64748b; margin-bottom: 1.5rem;">${url}</p>
            <script>
              setTimeout(() => { window.close(); }, 2000);
            </script>
            <p style="font-size: 0.8rem; color: #94a3b8;">This window will close automatically.</p>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
