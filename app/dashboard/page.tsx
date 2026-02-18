"use client";

import { createClient } from "@/lib/supabase-client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Plus,
  ExternalLink,
  Trash2,
  Zap,
  LayoutGrid,
  Search,
  Loader2,
  Copy,
  Check,
  TrendingUp,
  Clock,
  Youtube,
  Globe,
  Github,
  Twitter,
  BookOpen,
  ShoppingBag,
  Music,
  Film,
  Code2,
  Coffee,
  Flame,
  Sparkles,
  ChevronRight,
  X,
  ArrowUpRight,
  FolderPlus,
  Folder,
  FolderOpen,
  Hash,
  Command,
  AlertTriangle,
  Wand2,
  ChevronDown,
  GripVertical,
  Star,
  Bookmark,
  AlignLeft,
  CheckCircle2,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Collection {
  id: string;
  name: string;
  color: string;
  icon: string;
  user_id: string;
  created_at: string;
}
interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
  collection_id?: string | null;
  summary?: string | null;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const COLLECTION_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];
const COLLECTION_ICONS = ["📁", "🎨", "💻", "📚", "🔖", "⚡", "🎯", "🌟"];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const detectCategory = (url: string) => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("youtube") || host.includes("youtu.be"))
      return {
        label: "Video",
        color: "text-red-600",
        bg: "bg-red-50 border-red-100",
        icon: Youtube,
      };
    if (host.includes("github"))
      return {
        label: "Code",
        color: "text-slate-700",
        bg: "bg-slate-100 border-slate-200",
        icon: Github,
      };
    if (host.includes("twitter") || host.includes("x.com"))
      return {
        label: "Social",
        color: "text-sky-600",
        bg: "bg-sky-50 border-sky-100",
        icon: Twitter,
      };
    if (host.includes("pinterest"))
      return {
        label: "Design",
        color: "text-pink-600",
        bg: "bg-pink-50 border-pink-100",
        icon: Star,
      };
    if (host.includes("spotify") || host.includes("soundcloud"))
      return {
        label: "Music",
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-100",
        icon: Music,
      };
    if (host.includes("netflix") || host.includes("primevideo"))
      return {
        label: "Watch",
        color: "text-purple-600",
        bg: "bg-purple-50 border-purple-100",
        icon: Film,
      };
    if (
      host.includes("medium") ||
      host.includes("substack") ||
      host.includes("dev.to")
    )
      return {
        label: "Article",
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-100",
        icon: BookOpen,
      };
    if (host.includes("amazon") || host.includes("shop"))
      return {
        label: "Shop",
        color: "text-orange-600",
        bg: "bg-orange-50 border-orange-100",
        icon: ShoppingBag,
      };
    return {
      label: "Link",
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-100",
      icon: Globe,
    };
  } catch {
    return {
      label: "Link",
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-100",
      icon: Globe,
    };
  }
};

const getFavicon = (urlStr: string) => {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(urlStr).hostname}&sz=128`;
  } catch {
    return "";
  }
};
const getDomain = (urlStr: string) => {
  try {
    return new URL(urlStr).hostname.replace("www.", "");
  } catch {
    return urlStr;
  }
};
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ─── SKELETON ─────────────────────────────────────────────────────────────────
const SkeletonCard = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="bg-white/60 border border-white/60 rounded-2xl p-5 animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 bg-slate-200 rounded-xl" />
      <div className="w-16 h-5 bg-slate-200 rounded-full" />
    </div>
    <div className="h-4 bg-slate-200 rounded-lg w-3/4 mb-2" />
    <div className="h-3 bg-slate-100 rounded-lg w-full mb-5" />
    <div className="h-9 bg-slate-100 rounded-xl w-full" />
  </div>
);

// ─── COMMAND PALETTE ──────────────────────────────────────────────────────────
const CommandPalette = ({
  bookmarks,
  collections,
  onClose,
  onOpen,
  onAddNew,
}: {
  bookmarks: BookmarkItem[];
  collections: Collection[];
  onClose: () => void;
  onOpen: (url: string) => void;
  onAddNew: () => void;
}) => {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = query.trim()
    ? bookmarks
        .filter(
          (b) =>
            b.title.toLowerCase().includes(query.toLowerCase()) ||
            b.url.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 8)
    : bookmarks.slice(0, 6);

  const actions = [{ label: "Add new bookmark", icon: Plus, action: onAddNew }];
  const allItems = [
    ...results.map((r) => ({ type: "bookmark", data: r })),
    ...actions.map((a) => ({ type: "action", data: a })),
  ];

  useEffect(() => {
    setCursor(0);
  }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, allItems.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    }
    if (e.key === "Escape") {
      onClose();
    }
    if (e.key === "Enter") {
      const item = allItems[cursor];
      if (!item) return;
      if (item.type === "bookmark") {
        onOpen((item.data as BookmarkItem).url);
        onClose();
      } else {
        (item.data as any).action();
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl shadow-slate-900/30 border border-slate-200 overflow-hidden cmd-palette-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookmarks or type a command..."
            className="flex-1 text-slate-900 placeholder:text-slate-400 outline-none text-sm font-semibold bg-transparent"
          />
          <kbd className="px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length > 0 && (
            <>
              <div className="px-4 py-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Bookmarks
                </span>
              </div>
              {results.map((bm, i) => {
                const cat = detectCategory(bm.url);
                const CatIcon = cat.icon;
                const isCursor = cursor === i;
                return (
                  <button
                    key={bm.id}
                    onClick={() => {
                      onOpen(bm.url);
                      onClose();
                    }}
                    onMouseEnter={() => setCursor(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${isCursor ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                  >
                    <img
                      src={getFavicon(bm.url)}
                      className="w-5 h-5 rounded"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold truncate ${isCursor ? "text-indigo-700" : "text-slate-800"}`}
                      >
                        {bm.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate font-mono">
                        {getDomain(bm.url)}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}
                    >
                      {cat.label}
                    </span>
                    {isCursor && (
                      <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Quick actions */}
          <div className="px-4 py-1.5 mt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Actions
            </span>
          </div>
          {actions.map((action, i) => {
            const idx = results.length + i;
            const isCursor = cursor === idx;
            return (
              <button
                key={action.label}
                onClick={() => {
                  action.action();
                  onClose();
                }}
                onMouseEnter={() => setCursor(idx)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${isCursor ? "bg-indigo-50" : "hover:bg-slate-50"}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${isCursor ? "bg-indigo-100" : "bg-slate-100"}`}
                >
                  <action.icon
                    className={`w-3.5 h-3.5 ${isCursor ? "text-indigo-600" : "text-slate-500"}`}
                  />
                </div>
                <span
                  className={`text-sm font-bold ${isCursor ? "text-indigo-700" : "text-slate-700"}`}
                >
                  {action.label}
                </span>
              </button>
            );
          })}

          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-slate-400 text-sm font-medium">
                No bookmarks found for "{query}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
          {[
            ["↑↓", "navigate"],
            ["↵", "open"],
            ["esc", "close"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500 bg-white rounded border border-slate-200">
                {key}
              </kbd>
              <span className="text-[10px] text-slate-400 font-medium">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null,
  );
  const [animatedCards, setAnimatedCards] = useState<Set<string>>(new Set());
  const [showCmdPalette, setShowCmdPalette] = useState(false);

  // Duplicate detection
  const [duplicateWarning, setDuplicateWarning] = useState<BookmarkItem | null>(
    null,
  );

  // AI Summary
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);

  // Collections sidebar
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState(
    COLLECTION_COLORS[0],
  );
  const [newCollectionIcon, setNewCollectionIcon] = useState(
    COLLECTION_ICONS[0],
  );
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [dragOverCollection, setDragOverCollection] = useState<string | null>(
    null,
  );
  const [draggingBookmark, setDraggingBookmark] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const addedCountRef = useRef(0);

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCmdPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Real-time URL duplicate check
  useEffect(() => {
    if (!url.trim()) {
      setDuplicateWarning(null);
      return;
    }
    try {
      const normalized = new URL(url).href;
      const dup = bookmarks.find((b) => {
        try {
          return new URL(b.url).href === normalized;
        } catch {
          return false;
        }
      });
      setDuplicateWarning(dup || null);
    } catch {
      setDuplicateWarning(null);
    }
  }, [url, bookmarks]);

  useEffect(() => {
    let channel: any;
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/");
        return;
      }
      setUser(data.user);
      await Promise.all([
        fetchBookmarks(data.user.id),
        fetchCollections(data.user.id),
      ]);
      channel = supabase
        .channel("bm-rt")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${data.user.id}`,
          },
          handleRealtimeUpdate,
        )
        .subscribe();
    };
    init();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === "INSERT") {
      setBookmarks((prev) =>
        prev.find((b) => b.id === payload.new.id)
          ? prev
          : [payload.new, ...prev],
      );
    } else if (payload.eventType === "DELETE") {
      setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
    } else if (payload.eventType === "UPDATE") {
      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === payload.new.id ? { ...b, ...payload.new } : b,
        ),
      );
    }
  };

  const fetchBookmarks = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookmarks(data);
      const storedSummaries: Record<string, string> = {};
      data.forEach((b: BookmarkItem) => {
        if (b.summary) {
          storedSummaries[b.id] = b.summary;
        }
      });
      setSummaries(storedSummaries);
    }
    setLoading(false);
  };

  const fetchCollections = async (userId: string) => {
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) console.error("fetchCollections error:", error);
    if (data) setCollections(data);
  };

  // ── Add bookmark ────────────────────────────────────────────────────────────
  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;
    setIsSubmitting(true);

    const tempId = `temp-${Date.now()}`;
    const newBm: BookmarkItem = {
      id: tempId,
      title,
      url,
      user_id: user.id,
      created_at: new Date().toISOString(),
      collection_id: selectedCollectionId,
    };
    setBookmarks((prev) => [newBm, ...prev]);
    requestAnimationFrame(() =>
      setAnimatedCards((p) => new Set([...p, tempId])),
    );

    const t = title;
    const u = url;
    const cid = selectedCollectionId;
    setTitle("");
    setUrl("");
    setDuplicateWarning(null);
    addedCountRef.current += 1;

    const { data, error } = await supabase
      .from("bookmarks")
      .insert([{ title: t, url: u, user_id: user.id, collection_id: cid }])
      .select()
      .single();

    if (error) {
      setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
    } else {
      setBookmarks((prev) => prev.map((b) => (b.id === tempId ? data : b)));
      setAnimatedCards((p) => {
        const s = new Set(p);
        s.delete(tempId);
        s.add(data.id);
        return s;
      });
    }
    setIsSubmitting(false);
  };

  // ── Delete bookmark ─────────────────────────────────────────────────────────
  const deleteBookmark = async (id: string) => {
    setDeletingId(id);
    await new Promise((r) => setTimeout(r, 280));
    const prev = [...bookmarks];
    setBookmarks((b) => b.filter((x) => x.id !== id));
    setAnimatedCards((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
    setDeletingId(null);
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) setBookmarks(prev);
  };

  // ── AI Summarise ────────────────────────────────────────────────────────────
  const summarizeBookmark = async (bm: BookmarkItem) => {
    if (summaries[bm.id]) {
      setExpandedSummary(expandedSummary === bm.id ? null : bm.id);
      return;
    }

    setSummarizingId(bm.id);
    setExpandedSummary(bm.id);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: bm.url, title: bm.title }),
      });

      const json = await res.json();
      const summary = json.summary || "Could not generate summary.";

      setSummaries((prev) => ({ ...prev, [bm.id]: summary }));

      const { error } = await supabase
        .from("bookmarks")
        .update({ summary })
        .eq("id", bm.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to save summary:", error.message);
      }
    } catch (err) {
      console.error("Summarize error:", err);
      setSummaries((prev) => ({
        ...prev,
        [bm.id]: "Failed to fetch summary. Check your API key.",
      }));
    }

    setSummarizingId(null);
  };

  // ── Collections CRUD ────────────────────────────────────────────────────────
  const createCollection = async () => {
    if (!newCollectionName.trim()) return;
    const { data } = await supabase
      .from("collections")
      .insert([
        {
          name: newCollectionName,
          color: newCollectionColor,
          icon: newCollectionIcon,
          user_id: user.id,
        },
      ])
      .select()
      .single();
    if (data) {
      setCollections((p) => [...p, data]);
      setNewCollectionName("");
      setShowNewCollectionForm(false);
    }
  };

  const deleteCollection = async (id: string) => {
    await supabase.from("collections").delete().eq("id", id);
    setCollections((p) => p.filter((c) => c.id !== id));
    if (activeCollectionId === id) setActiveCollectionId(null);
  };

  // ── Drag & Drop ──────────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, bookmarkId: string) => {
    setDraggingBookmark(bookmarkId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    setDragOverCollection(collectionId);
  };
  const handleDrop = async (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    if (!draggingBookmark) return;
    const bmId = draggingBookmark;
    setDragOverCollection(null);
    setDraggingBookmark(null);
    setBookmarks((prev) =>
      prev.map((b) =>
        b.id === bmId ? { ...b, collection_id: collectionId } : b,
      ),
    );
    const { error } = await supabase
      .from("bookmarks")
      .update({ collection_id: collectionId })
      .eq("id", bmId)
      .eq("user_id", user.id);
    if (error) {
      console.error("Drag-drop error:", error.message);
      setBookmarks((prev) =>
        prev.map((b) => (b.id === bmId ? { ...b, collection_id: null } : b)),
      );
    }
  };
  const handleDragLeave = () => setDragOverCollection(null);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const categories = [
    "All",
    ...Array.from(new Set(bookmarks.map((b) => detectCategory(b.url).label))),
  ];

  const filteredBookmarks = bookmarks.filter((b) => {
    const matchSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat =
      activeFilter === "All" || detectCategory(b.url).label === activeFilter;
    const matchCollection = activeCollectionId
      ? b.collection_id === activeCollectionId
      : true;
    return matchSearch && matchCat && matchCollection;
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { font-family: 'Bricolage Grotesque', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace !important; }

        @keyframes card-in  { from { opacity:0; transform:translateY(18px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes card-out { from { opacity:1; transform:scale(1); }  to { opacity:0; transform:scale(0.88) translateY(-6px); } }
        @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes float    { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-7px) rotate(1.5deg)} }
        @keyframes badge-pop{ 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes warn-in  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes summary-in{ from{opacity:0;transform:scaleY(0.8);transform-origin:top} to{opacity:1;transform:scaleY(1)} }
        @keyframes cmd-in   { from{opacity:0;transform:translateY(-12px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes drag-pulse{ 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)} 50%{box-shadow:0 0 0 6px rgba(99,102,241,0)} }
        @keyframes gradient-text { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        .card-enter  { animation: card-in  0.42s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .card-exit   { animation: card-out 0.28s cubic-bezier(0.55,0,1,0.45) forwards; }
        .badge-pop   { animation: badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .warn-in     { animation: warn-in 0.3s ease-out forwards; }
        .summary-in  { animation: summary-in 0.3s ease-out forwards; }
        .cmd-palette-in { animation: cmd-in 0.25s cubic-bezier(0.22,1,0.36,1) forwards; }
        .float-icon  { animation: float 4s ease-in-out infinite; }
        .drag-over   { animation: drag-pulse 1s ease-in-out infinite; border-color:#6366f1 !important; background:rgba(99,102,241,0.08) !important; }
        .shimmer-text { background:linear-gradient(90deg,#6366f1,#a855f7,#ec4899,#6366f1); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:#c7d2fe; border-radius:10px; }
      `}</style>

      {/* ── Command Palette ──────────────────────────────────────────────────── */}
      {showCmdPalette && (
        <CommandPalette
          bookmarks={bookmarks}
          collections={collections}
          onClose={() => setShowCmdPalette(false)}
          onOpen={(url) => window.open(url, "_blank")}
          onAddNew={() => {
            setShowCmdPalette(false);
            titleInputRef.current?.focus();
          }}
        />
      )}

      <div className="min-h-screen bg-[#f4f4f8] selection:bg-indigo-500 selection:text-white overflow-x-hidden">
        {/* ── Background ──────────────────────────────────────────────────── */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(#ddd6fe_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />
          <div className="absolute top-[-15%] left-[-5%]  w-[600px] h-[600px] bg-violet-400/10 rounded-full blur-[130px]" />
          <div className="absolute top-[30%] right-[-8%]  w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-5%] left-[25%] w-[700px] h-[400px] bg-pink-300/8  rounded-full blur-[140px]" />
        </div>

        {/* ── Navbar ──────────────────────────────────────────────────────── */}
        <nav className="sticky top-4 z-50 max-w-[1400px] mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/50 shadow-lg shadow-indigo-100/20 rounded-2xl px-5 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="float-icon bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-300/40">
                <Zap className="text-white w-4 h-4 fill-current" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Smart<span className="shimmer-text">Mark</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCmdPalette(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                <Command className="w-3 h-3" />
                <span>Search</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-400">
                  ⌘K
                </kbd>
              </button>

              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200/80">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-500">
                    {user.email}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>

        {/* ── Layout: Sidebar + Main ───────────────────────────────────────── */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-5 py-6 flex gap-6">
          {/* ════ COLLECTIONS SIDEBAR ════════════════════════════════════════ */}
          <aside className="w-64 flex-shrink-0 sticky top-24 h-fit">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg shadow-indigo-100/20 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
                  Collections
                </h3>
                <button
                  onClick={() => setShowNewCollectionForm((p) => !p)}
                  className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all"
                  title="New collection"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setActiveCollectionId(null)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-all mb-1 ${
                  activeCollectionId === null
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                All Bookmarks
                <span className="ml-auto text-xs font-bold text-slate-400">
                  {bookmarks.length}
                </span>
              </button>

              <div className="space-y-1 mt-2">
                {collections.map((col) => {
                  const count = bookmarks.filter(
                    (b) => b.collection_id === col.id,
                  ).length;
                  const isActive = activeCollectionId === col.id;

                  return (
                    <div
                      key={col.id}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                      <button
                        onClick={() =>
                          setActiveCollectionId(isActive ? null : col.id)
                        }
                        className="flex items-center gap-2.5 flex-1 text-left"
                      >
                        <span className="text-base">{col.icon}</span>
                        <span className="text-xs font-semibold truncate">
                          {col.name}
                        </span>
                      </button>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            isActive ? "text-white/70" : "text-slate-400"
                          }`}
                        >
                          {count}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCollection(col.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {showNewCollectionForm && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <input
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Collection name..."
                    className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                    onKeyDown={(e) => e.key === "Enter" && createCollection()}
                    autoFocus
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {COLLECTION_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewCollectionColor(c)}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${newCollectionColor === c ? "border-slate-700 scale-110" : "border-transparent"}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLLECTION_ICONS.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewCollectionIcon(icon)}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${newCollectionIcon === icon ? "bg-indigo-100 ring-2 ring-indigo-400" : "hover:bg-slate-200"}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={createCollection}
                      className="flex-1 bg-slate-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setShowNewCollectionForm(false)}
                      className="px-3 text-xs text-slate-500 hover:text-slate-700 font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {collections.length > 0 && (
                <p className="text-[10px] text-slate-400 font-medium text-center mt-4 flex items-center justify-center gap-1">
                  <GripVertical className="w-3 h-3" />
                  Drag cards to organize
                </p>
              )}
            </div>
          </aside>

          {/* ════ MAIN CONTENT ══════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
              <div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2 leading-none">
                  {activeCollectionId
                    ? (() => {
                        const c = collections.find(
                          (x) => x.id === activeCollectionId,
                        );
                        return c ? `${c.icon} ${c.name}` : "Collection";
                      })()
                    : "My Library"}
                </h1>
                <div className="flex items-center gap-4 text-slate-400 text-sm font-semibold">
                  <span className="flex items-center gap-1.5">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    {filteredBookmarks.length} items
                  </span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Live sync
                  </span>
                </div>
              </div>

              <div className="relative w-full md:w-80 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search links..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-11 pr-10 py-3 bg-white/80 backdrop-blur-md rounded-2xl text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all placeholder:text-slate-400 font-semibold text-sm outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {categories.length > 1 && (
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {categories.map((cat) => {
                  const isActive = activeFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        isActive
                          ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                          : "bg-white/80 text-slate-500 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {cat}
                      {cat !== "All" && (
                        <span
                          className={`ml-1.5 ${isActive ? "text-white/50" : "text-slate-400"}`}
                        >
                          {
                            bookmarks.filter(
                              (b) => detectCategory(b.url).label === cat,
                            ).length
                          }
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ── ADD FORM ──────────────────────────────────────────────── */}
              <div className="lg:col-span-4 sticky top-28 space-y-4">
                <div className="relative bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-xl shadow-indigo-100/20 p-6 overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-indigo-500/8 to-purple-500/8 rounded-bl-[100px] -z-10" />

                  <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2.5">
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-1.5 rounded-lg shadow-sm">
                      <Plus className="w-3.5 h-3.5 text-white" />
                    </div>
                    New Bookmark
                  </h2>

                  <form onSubmit={addBookmark} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
                        Title
                      </label>
                      <input
                        ref={titleInputRef}
                        required
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Design Inspiration"
                        className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 focus:bg-white outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
                        URL
                      </label>
                      <input
                        required
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className={`w-full bg-slate-50/80 border rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:bg-white outline-none transition-all ${
                          duplicateWarning
                            ? "border-amber-400 ring-2 ring-amber-200 bg-amber-50/50"
                            : "border-slate-200 focus:ring-indigo-400/30 focus:border-indigo-400"
                        }`}
                      />

                      {duplicateWarning && (
                        <div className="mt-2 warn-in flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-bold text-amber-800">
                              Already saved!
                            </p>
                            <p className="text-[11px] text-amber-700 mt-0.5">
                              "
                              <span className="font-bold">
                                {duplicateWarning.title}
                              </span>
                              " · {formatDate(duplicateWarning.created_at)}
                            </p>
                          </div>
                        </div>
                      )}

                      {url && !duplicateWarning && (
                        <div className="mt-2 badge-pop flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <img
                            src={getFavicon(url)}
                            className="w-4 h-4"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                          <span className="text-xs font-bold text-slate-600 font-mono">
                            {getDomain(url)}
                          </span>
                          {(() => {
                            const cat = detectCategory(url);
                            const Icon = cat.icon;
                            return (
                              <span
                                className={`ml-auto flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}
                              >
                                <Icon className="w-2.5 h-2.5" />
                                {cat.label}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {collections.length > 0 && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
                          Collection
                        </label>
                        <select
                          value={selectedCollectionId || ""}
                          onChange={(e) =>
                            setSelectedCollectionId(e.target.value || null)
                          }
                          className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 outline-none transition-all"
                        >
                          <option value="">No collection</option>
                          {collections.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      disabled={isSubmitting}
                      className="w-full mt-1 bg-slate-900 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Save to Library <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Total",
                      val: bookmarks.length,
                      color: "text-indigo-600",
                    },
                    {
                      label: "Collections",
                      val: collections.length,
                      color: "text-violet-600",
                    },
                  ].map(({ label, val, color }) => (
                    <div
                      key={label}
                      className="bg-white/70 backdrop-blur rounded-2xl border border-white/60 p-4 shadow-sm text-center"
                    >
                      <div className={`text-2xl font-extrabold ${color}`}>
                        {val}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── CARDS GRID ────────────────────────────────────────────── */}
              <div className="lg:col-span-8">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[0, 1, 2, 3].map((i) => (
                      <SkeletonCard key={i} delay={i * 80} />
                    ))}
                  </div>
                ) : filteredBookmarks.length === 0 ? (
                  <div className="bg-white/40 backdrop-blur-md border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center text-center">
                    <div className="float-icon bg-white p-5 rounded-2xl mb-4 shadow-md">
                      <LayoutGrid className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-extrabold text-lg">
                      {searchQuery ? "No results found" : "Empty here"}
                    </h3>
                    <p className="text-slate-400 text-sm mt-2 max-w-xs">
                      {searchQuery
                        ? `Nothing matched "${searchQuery}"`
                        : "Add your first bookmark using the form."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {filteredBookmarks.map((bm) => {
                      const cat = detectCategory(bm.url);
                      const CatIcon = cat.icon;
                      const isDeleting = deletingId === bm.id;
                      const isVisible = animatedCards.has(bm.id);
                      const bmCollection = collections.find(
                        (c) => c.id === bm.collection_id,
                      );
                      const hasSummary = !!summaries[bm.id];
                      const isSummarizing = summarizingId === bm.id;
                      const isExpanded = expandedSummary === bm.id;

                      return (
                        <div
                          key={bm.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, bm.id)}
                          className={`group relative bg-white/75 backdrop-blur-md border border-white/70 p-5 rounded-2xl shadow-sm
                            hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1.5 hover:border-indigo-200
                            transition-all duration-300 cursor-pointer active:cursor-grabbing overflow-hidden
                            ${isDeleting ? "card-exit" : ""}
                          `}
                        >
                          {/* Hover glow */}
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-violet-50/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />

                          {/* Collection badge */}
                          {bmCollection && (
                            <div
                              className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                              style={{ background: bmCollection.color }}
                            />
                          )}

                          {/* Top row */}
                          <div className="relative flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-11 h-11 bg-white rounded-xl p-2 border border-slate-100 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                                <img
                                  src={getFavicon(bm.url)}
                                  alt=""
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                                  }}
                                />
                                <span className="hidden text-base font-extrabold text-indigo-600">
                                  {bm.title[0]?.toUpperCase()}
                                </span>
                              </div>
                              <span
                                className={`badge-pop flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cat.bg} ${cat.color}`}
                              >
                                <CatIcon className="w-2.5 h-2.5" />
                                {cat.label}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                              <button
                                onClick={() => summarizeBookmark(bm)}
                                className={`p-1.5 rounded-lg transition-all ${hasSummary || isSummarizing ? "text-violet-600 bg-violet-50" : "text-slate-400 hover:text-violet-600 hover:bg-violet-50"}`}
                                title="AI Summary"
                              >
                                {isSummarizing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Wand2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleCopy(bm.url, bm.id)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Copy URL"
                              >
                                {copiedId === bm.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => deleteBookmark(bm.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Card body */}
                          <div className="relative">
                            {bmCollection && (
                              <div className="flex items-center gap-1 mb-1.5">
                                <span className="text-xs">{bmCollection.icon}</span>
                                <span
                                  className="text-[10px] font-bold"
                                  style={{ color: bmCollection.color }}
                                >
                                  {bmCollection.name}
                                </span>
                              </div>
                            )}
                            <h3 className="font-bold text-slate-900 text-base truncate mb-1 group-hover:text-indigo-700 transition-colors">
                              {bm.title}
                            </h3>
                            <p className="text-[11px] font-mono text-slate-400 truncate mb-1">
                              {getDomain(bm.url)}
                            </p>
                            <p className="text-[10px] text-slate-300 font-medium mb-4">
                              {formatDate(bm.created_at)}
                            </p>

                            {/* AI Summary panel */}
                            {isExpanded && (
                              <div className="summary-in mb-4 p-3 bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-xl">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Wand2 className="w-3 h-3 text-violet-500" />
                                  <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">
                                    AI Summary
                                  </span>
                                </div>
                                {isSummarizing ? (
                                  <div className="space-y-2">
                                    <div className="h-2.5 bg-violet-100 rounded animate-pulse w-full" />
                                    <div className="h-2.5 bg-violet-100 rounded animate-pulse w-4/5" />
                                    <div className="h-2.5 bg-violet-100 rounded animate-pulse w-3/5" />
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    {summaries[bm.id]}
                                  </p>
                                )}
                              </div>
                            )}

                            <a
                              href={bm.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/btn inline-flex items-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl w-full justify-center hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-lg transition-all duration-200"
                            >
                              Visit Website
                              <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                            </a>
                          </div>

                          {/* Corner accent */}
                          <div
                            className={`absolute bottom-0 right-0 w-14 h-14 rounded-tl-[36px] opacity-20 group-hover:opacity-50 transition-opacity ${cat.bg}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}