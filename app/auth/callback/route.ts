// Auth callback — Route Handler (server-side)
// Handles OAuth code exchange on the server, then redirects to /dashboard.
// Replaces the old client-side page component that showed a loading spinner.

import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // If there was an error or no code, redirect to login
  return NextResponse.redirect(new URL("/", request.url));
}
