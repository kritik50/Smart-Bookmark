"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        // If something went wrong, send user back to login
        router.replace("/");
        return;
      }

      // If session exists, go to dashboard
      router.replace("/dashboard");
    };

    handleAuth();
  }, [router, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Logging you in...</p>
    </div>
  );
}
