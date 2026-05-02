import { useState } from "react";
import {
  Trash2,
  Copy,
  Check,
  ArrowUpRight,
  FolderOpen,
  Wand2,
  Edit2,
  Loader2,
} from "lucide-react";
import { detectCategory, getFavicon, getDomain, formatDate } from "@/app/lib/utils";

export default function BookmarkCard({
  bm,
  bmCollection,
  hasSummary,
  isSummarizing,
  isExpanded,
  isDeleting,
  copiedId,
  summaries,
  onDragStart,
  onSummarize,
  onCopy,
  onRemoveFromCollection,
  onDelete,
  onEdit,
}: any) {
  const cat = detectCategory(bm.url);
  const CatIcon = cat.icon;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, bm.id)}
      className={`group relative bg-white/75 backdrop-blur-md border border-white/70 p-5 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1.5 hover:border-indigo-200 transition-all duration-300 cursor-pointer active:cursor-grabbing overflow-hidden ${isDeleting ? "card-exit" : ""}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-violet-50/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
      {bmCollection && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
          style={{ background: bmCollection.color }}
        />
      )}

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
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
          <button
            onClick={onSummarize}
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
            onClick={onCopy}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="Copy URL"
          >
            {copiedId === bm.id ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          {onRemoveFromCollection && (
            <button
              onClick={onRemoveFromCollection}
              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
              title="Remove from this collection"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="Edit Bookmark"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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
        {bm.og_image && (
          <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
            <img src={bm.og_image} alt={bm.title} className="w-full h-full object-cover" />
          </div>
        )}
        <h3 className="font-bold text-slate-900 text-base truncate mb-1 group-hover:text-indigo-700 transition-colors">
          {bm.title}
        </h3>
        <p className="text-[11px] font-mono text-slate-400 truncate mb-1">
          {getDomain(bm.url)}
        </p>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] text-slate-300 font-medium">
            {formatDate(bm.created_at)}
          </p>
          {bm.tags && bm.tags.length > 0 && (
            <div className="flex gap-1 overflow-hidden">
              {bm.tags.slice(0, 3).map((tag: string) => (
                <span key={tag} className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[60px]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

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

      <div
        className={`absolute bottom-0 right-0 w-14 h-14 rounded-tl-[36px] opacity-20 group-hover:opacity-50 transition-opacity ${cat.bg}`}
      />
    </div>
  );
}
