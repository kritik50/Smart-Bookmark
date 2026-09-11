// DashboardNav — Top navigation bar
// Extracted from dashboard/page.tsx lines 1214-1265

"use client";

import { Zap, LogOut, Command, Folder } from "lucide-react";
import type { Collection } from "@/types";

interface DashboardNavProps {
  userEmail: string | undefined;
  collections: Collection[];
  onOpenCommandPalette: () => void;
  onOpenMobileCollections: () => void;
  onLogout: () => void;
}

export default function DashboardNav({
  userEmail,
  collections,
  onOpenCommandPalette,
  onOpenMobileCollections,
  onLogout,
}: DashboardNavProps) {
  return (
    <nav className="sticky top-4 z-50 max-w-[1400px] mx-auto px-4">
      <div className="bg-white/80 backdrop-blur-2xl border border-white/50 shadow-lg shadow-indigo-100/20 rounded-2xl px-5 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="float-icon bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-300/40">
            <Zap className="text-white w-4 h-4 fill-current" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            Smart<span className="shimmer-text">Mark</span>
          </span>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Command palette trigger (desktop) */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all"
          >
            <Command className="w-3 h-3" />
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Mobile collections trigger */}
          <button
            onClick={onOpenMobileCollections}
            className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all"
          >
            <Folder className="w-3 h-3" />
            <span>Collections</span>
            {collections.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {collections.length}
              </span>
            )}
          </button>

          {/* User email badge */}
          {userEmail && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200/80">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-500">
                {userEmail}
              </span>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
