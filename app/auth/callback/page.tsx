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

      if (error) {
        console.error("Session error:", error.message);
        router.push("/");
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
      } else {
        router.push("/");
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Logging you in...</p>
    </div>
  );
}
