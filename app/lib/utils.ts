import {
  Youtube,
  Github,
  Twitter,
  Star,
  Music,
  Film,
  BookOpen,
  ShoppingBag,
  Globe,
} from "lucide-react";

export const COLLECTION_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];
export const COLLECTION_ICONS = ["📁", "🎨", "💻", "📚", "🔖", "⚡", "🎯", "🌟"];

export const detectCategory = (url: string) => {
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

export const getFavicon = (urlStr: string) => {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(urlStr).hostname}&sz=128`;
  } catch {
    return "";
  }
};
export const getDomain = (urlStr: string) => {
  try {
    return new URL(urlStr).hostname.replace("www.", "");
  } catch {
    return urlStr;
  }
};
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
