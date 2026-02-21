"use client";

import { createClient } from "@/lib/supabase-client";
import { useState, useEffect, useRef } from "react";
import { Zap, CheckCircle2, ArrowRight, Sparkles, Globe, Youtube, Github, Star } from "lucide-react";

const DEMO_CARDS = [
  { title: "Awwwards — Website Awards", domain: "awwwards.com", tag: "Design", tagColor: "#f472b6", icon: "🎨", delay: 0 },
  { title: "GitHub Copilot Docs", domain: "github.com", tag: "Code", tagColor: "#60a5fa", icon: "⚡", delay: 0.4 },
  { title: "Figma: The Collaborative Interface", domain: "figma.com", tag: "Design", tagColor: "#f472b6", icon: "✦", delay: 0.8 },
  { title: "Y Combinator Startup School", domain: "youtube.com", tag: "Video", tagColor: "#f87171", icon: "▶", delay: 1.2 },
  { title: "Vercel — Deploy in seconds", domain: "vercel.com", tag: "Tool", tagColor: "#a78bfa", icon: "◆", delay: 1.6 },
];

const ROTATING_WORDS = ["links.", "ideas.", "articles.", "resources.", "everything."];

export default function Home() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [mounted, setMounted] = useState(false);
  const leftRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  
  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setWordIdx(i => (i + 1) % ROTATING_WORDS.length);
        setWordVisible(true);
      }, 350);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!leftRef.current) return;
      const rect = leftRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 700));
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: { prompt: "select_account" },
        redirectTo: "https://smart-bookmark-steel.vercel.app/auth/callback",
      },
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Serif:ital@0;1&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'Bricolage Grotesque', sans-serif; margin: 0; }
        .serif { font-family: 'Instrument Serif', serif; }

        @keyframes reveal-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes reveal-left {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes card-float {
          0%, 100% { transform: translateY(0px) rotate(var(--rot)); }
          50%       { transform: translateY(-10px) rotate(var(--rot)); }
        }
        @keyframes word-in {
          from { opacity: 0; transform: translateY(10px) skewX(-3deg); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0) skewX(0deg); filter: blur(0); }
        }
        @keyframes word-out {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes shimmer-sweep {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50%       { transform: scale(1.5); opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes notification-in {
          0%   { opacity: 0; transform: translateX(60px) scale(0.9); }
          60%  { transform: translateX(-4px) scale(1.02); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10%  { transform: translate(-2%, -3%); }
          30%  { transform: translate(3%, 2%); }
          50%  { transform: translate(-1%, 4%); }
          70%  { transform: translate(4%, -2%); }
          90%  { transform: translate(-3%, 1%); }
        }
        @keyframes badge-slide {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px 0px rgba(99,102,241,0.3); }
          50%       { box-shadow: 0 0 40px 8px rgba(99,102,241,0.5); }
        }

        .reveal-up  { animation: reveal-up  0.65s cubic-bezier(0.22,1,0.36,1) both; }
        .reveal-left { animation: reveal-left 0.65s cubic-bezier(0.22,1,0.36,1) both; }

        .word-in  { animation: word-in  0.35s cubic-bezier(0.22,1,0.36,1) forwards; }
        .word-out { animation: word-out 0.3s ease-in forwards; }

        .card-float { animation: card-float var(--dur, 4s) ease-in-out infinite; }

        .shimmer-btn {
          background: linear-gradient(90deg,
            #1e1b4b 0%, #312e81 20%, #4338ca 40%, #6366f1 50%,
            #4338ca 60%, #312e81 80%, #1e1b4b 100%);
          background-size: 200% 100%;
          animation: shimmer-sweep 2.5s linear infinite;
        }

        .grain-overlay::after {
          content: '';
          position: absolute;
          inset: -50%;
          width: 200%;
          height: 200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.045;
          pointer-events: none;
          animation: grain 0.5s steps(1) infinite;
        }

        .notification-card { animation: notification-in 0.7s cubic-bezier(0.22,1,0.36,1) 1.8s both; }
        .badge-slide { animation: badge-slide 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }

        .google-btn:hover .google-icon { transform: scale(1.15) rotate(-5deg); }
        .google-btn:active { transform: scale(0.97); }

        .feature-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }
      `}</style>

      <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>

        {/* ════════════════════════════════════════════════════════════════
            LEFT SIDE
        ════════════════════════════════════════════════════════════════ */}
        <div
          ref={leftRef}
          className="relative flex flex-col justify-center px-8 md:px-16 lg:px-20 bg-[#fafafa] overflow-hidden min-h-screen"
        >
          {/* Mouse-reactive radial glow */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-700"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(99,102,241,0.07) 0%, transparent 70%)`,
            }}
          />

          {/* Dot grid */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_50%,#000_60%,transparent_100%)] opacity-70" />

          {/* Decorative ring top-left */}
          <div
            className="absolute -top-20 -left-20 w-64 h-64 rounded-full border border-indigo-200/50 pointer-events-none"
            style={{ animation: "spin-slow 20s linear infinite" }}
          />
          <div
            className="absolute -top-12 -left-12 w-40 h-40 rounded-full border border-indigo-300/30 pointer-events-none"
            style={{ animation: "spin-slow 14s linear infinite reverse" }}
          />

          {/* ── Logo ── */}
          <div
            className={`absolute top-8 left-8 md:left-16 lg:left-20 flex items-center gap-2.5 reveal-left`}
            style={{ animationDelay: "0.1s" }}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-300/40 glow-pulse">
              <Zap className="text-white w-4.5 h-4.5 fill-white" style={{ width: 18, height: 18 }} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Smart<span style={{ color: "#6366f1" }}>Mark</span>
            </span>
          </div>

          {/* ── Main content ── */}
          <div className="max-w-sm w-full mx-auto z-10">

            {/* Eyebrow badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-7 badge-slide`}
              style={{
                background: "linear-gradient(135deg, #eef2ff, #f5f3ff)",
                borderColor: "#c7d2fe",
                color: "#4f46e5",
                animationDelay: "0.2s",
              }}
            >
              <Sparkles style={{ width: 11, height: 11 }} />
              Now with AI auto-tagging
            </div>

            <div className="mb-9">
              <h1
                className={`text-[2.6rem] font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-5 reveal-up`}
                style={{ animationDelay: "0.3s" }}
              >
                Welcome back
                <br />
                <span className="text-slate-400 font-light" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "2rem" }}>
                  to your library.
                </span>
              </h1>
              <p
                className={`text-slate-500 text-base leading-relaxed reveal-up`}
                style={{ animationDelay: "0.4s", fontWeight: 500 }}
              >
                Sign in and pick up exactly where you left off — every link, perfectly organised.
              </p>
            </div>

            {/* ── Google Button ── */}
            <div className={`reveal-up`} style={{ animationDelay: "0.55s" }}>
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="google-btn group relative w-full flex items-center justify-center gap-3 bg-white text-slate-800 font-bold py-4 px-5 rounded-2xl transition-all duration-200 disabled:pointer-events-none overflow-hidden"
                style={{
                  border: "2px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#6366f1";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(99,102,241,0.15), 0 1px 4px rgba(0,0,0,0.06)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {/* Hover shimmer overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(135deg, #eef2ff 0%, transparent 60%)" }}
                />

                {isLoading ? (
                  <>
                    <div
                      className="w-5 h-5 rounded-full shimmer-btn"
                      style={{ minWidth: 20, minHeight: 20 }}
                    />
                    <span className="text-slate-500">Signing you in…</span>
                  </>
                ) : (
                  <>
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google"
                      className="google-icon relative z-10 transition-transform duration-200"
                      style={{ width: 20, height: 20 }}
                    />
                    <span className="relative z-10">Continue with Google</span>
                    <ArrowRight
                      className="relative z-10 ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200"
                      style={{ width: 16, height: 16, color: "#6366f1" }}
                    />
                  </>
                )}
              </button>
            </div>

            {/* ── Feature list ── */}
            <div className={`mt-8 space-y-3 reveal-up`} style={{ animationDelay: "0.7s" }}>
              {[
                { text: "Auto-categorises YouTube, GitHub, Pinterest & more", color: "#6366f1" },
                { text: "Real-time sync across all your devices", color: "#10b981" },
                { text: "Lightning-fast search through all your links", color: "#f59e0b" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="feature-dot w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: f.color, animationDelay: `${i * 0.4}s` }}
                  />
                  <span className="text-sm text-slate-500 font-medium">{f.text}</span>
                </div>
              ))}
            </div>

            {/* ── Social proof ── */}
            <div className={`mt-10 pt-8 border-t border-slate-100 reveal-up`} style={{ animationDelay: "0.85s" }}>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b"].map((c, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-[#fafafa] flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: c }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} style={{ width: 10, height: 10, color: "#f59e0b", fill: "#f59e0b" }} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 font-semibold">Loved by 2,400+ developers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-6 left-0 w-full text-center">
            <p className="text-xs text-slate-300 font-medium">© 2026 SmartMark Inc.</p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT SIDE
        ════════════════════════════════════════════════════════════════ */}
        <div className="grain-overlay hidden lg:flex flex-col relative bg-[#080c18] overflow-hidden text-white justify-center p-14">

          {/* Deep layered background blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[550px] h-[550px] rounded-full blur-[130px]" style={{ background: "rgba(99,102,241,0.2)" }} />
            <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: "rgba(139,92,246,0.15)" }} />
            <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full blur-[100px]" style={{ background: "rgba(236,72,153,0.08)" }} />
          </div>

          {/* Grid lines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10 max-w-lg mx-auto w-full">

            {/* ── Headline with rotating word ── */}
            <div className={`mb-12 reveal-up`} style={{ animationDelay: "0.2s" }}>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
                style={{
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "#a5b4fc",
                }}
              >
                <Sparkles style={{ width: 11, height: 11 }} />
                Smart auto-categorisation
              </div>

              <h2 className="text-5xl font-extrabold tracking-tight leading-[1.1] mb-4">
                Stop losing your
                <br />
                <span
                  className={wordVisible ? "word-in" : "word-out"}
                  style={{
                    display: "inline-block",
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: "3.2rem",
                    background: "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {ROTATING_WORDS[wordIdx]}
                </span>
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.7, fontWeight: 500 }}>
                SmartMark turns your chaotic browser tabs into a clean, searchable library — accessible from anywhere.
              </p>
            </div>

            {/* ── Floating bookmark cards ── */}
            <div className={`relative h-[280px] reveal-up`} style={{ animationDelay: "0.4s" }}>
              {DEMO_CARDS.map((card, i) => (
                <div
                  key={i}
                  className="card-float absolute"
                  style={{
                    "--rot": `${(i % 2 === 0 ? 1 : -1) * (i * 0.8)}deg`,
                    "--dur": `${3.5 + i * 0.5}s`,
                    top: `${[0, 60, 120, 40, 100][i]}px`,
                    left: `${[0, 40, 10, 55, 30][i]}%`,
                    width: "52%",
                    animationDelay: `${card.delay}s`,
                    zIndex: 5 - i,
                    opacity: 1 - i * 0.15,
                  } as any}
                >
                  <div
                    className="relative rounded-2xl p-4"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      backdropFilter: "blur(20px)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        {card.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate" style={{ lineHeight: 1.3 }}>{card.title}</p>
                        <p className="text-slate-500 font-mono text-xs mt-0.5">{card.domain}</p>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                        style={{ background: `${card.tagColor}20`, color: card.tagColor, border: `1px solid ${card.tagColor}40` }}
                      >
                        {card.tag}
                      </span>
                    </div>
                    {/* Shimmer line */}
                    <div className="h-px w-full mt-2" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Notification toast ── */}
            <div className="notification-card relative mt-6 flex items-center gap-4 rounded-2xl px-5 py-4 w-72 ml-auto"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(24px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
              >
                <CheckCircle2 style={{ width: 18, height: 18, color: "#10b981" }} />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Bookmark Saved</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: "#64748b" }}>Auto-tagged as <span style={{ color: "#a5b4fc" }}>Design</span></p>
              </div>
              <div
                className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full"
                style={{ background: "#10b981", animation: "pulse-dot 2s ease-in-out infinite" }}
              />
            </div>

            {/* ── Stats row ── */}
            <div
              className={`grid grid-cols-3 gap-4 mt-8 reveal-up`}
              style={{ animationDelay: "0.6s" }}
            >
              {[
                { val: "2.4k+", label: "Users", color: "#818cf8" },
                { val: "98%", label: "Uptime", color: "#34d399" },
                { val: "0ms", label: "Sync delay", color: "#f472b6" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="text-2xl font-extrabold mb-1" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-xs font-semibold" style={{ color: "#475569" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </>
  );
}