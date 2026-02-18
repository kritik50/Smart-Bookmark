🚀 SmartMark – AI-Powered Bookmark Manager

SmartMark is a modern full-stack bookmark management platform built with Next.js (App Router), Supabase, and Google Gemini AI.
It allows users to securely save, organize, and manage bookmarks with real-time synchronization and optional AI-generated summaries.

🔗 Live Demo: https://smart-bookmark-steel.vercel.app


## ✨ Features

### 🔐 Authentication
- Google OAuth via Supabase Auth
- Secure server-side session handling
- Row Level Security (RLS) — users only ever see their own data

### 📚 Bookmark Management
- Add bookmarks with title + URL
- Auto-detects category (Video, Code, Design, Article, etc.)
- Duplicate URL detection with warning
- Real-time updates via Supabase Realtime
- Delete with smooth animations

### 📁 Collections
- Create named collections with custom color + icon
- Assign bookmarks to collections on save
- Drag & drop cards to reorganize
- Visual collection badges on each card

### 🤖 AI Summaries (Gemini API)
- One-click AI summary for any bookmark
- Concise 2–3 sentence descriptions
- Summaries cached in Supabase — no repeated API calls
- Graceful error handling (rate limits, failures)

### 🎨 UI / UX
- Command palette (⌘K / Ctrl+K) for instant search
- Smooth card animations (enter, exit, hover)
- Skeleton loading states
- Category filter pills
- Fully responsive layout
- Custom fonts (Bricolage Grotesque + JetBrains Mono)



## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TailwindCSS, Lucide Icons |
| Backend | Next.js API Routes |
| Database & Auth | Supabase (Postgres + Auth + Realtime + RLS) |
| AI | Google Gemini API (gemini-2.0-flash, v1beta) |
| Deployment | Vercel |

---

## 🏗 Architecture

### Authentication Flow

User → Google OAuth → Supabase Auth
                           ↓
                   Session stored in cookies
                           ↓
              Server routes validate on each request
                           ↓
                 RLS enforces per-user isolation


### AI Summary Flow

User clicks Summarize
       ↓
POST /api/summarize
       ↓
Auth check (Supabase session)
       ↓
Cache check (existing summary in DB?) → return cached ✓
       ↓
Gemini API call (gemini-2.0-flash)
       ↓
Summary returned to client
       ↓
Saved to Supabase for future cache hits


*Error handling:*
- 401 — unauthenticated request
- 429 — Gemini rate limit (retry after 30s)
- 503 — missing API key
- 504 — request timeout (10s AbortController)
- 500 — general AI failure with logged details



## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone & Install
bash
git clone https://github.com/your-username/smart-bookmark.git
cd smart-bookmark
npm install


### 2. Configure Environment Variables
Create a .env.local file:
env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key


### 3. Set Up Supabase
Run this SQL in your Supabase dashboard:
sql
-- Bookmarks table
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  url text not null,
  summary text,
  collection_id uuid,
  created_at timestamptz default now()
);

-- Collections table
create table collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  color text,
  icon text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table bookmarks enable row level security;
alter table collections enable row level security;

-- RLS Policies
create policy "Users manage own bookmarks" on bookmarks
  for all using (auth.uid() = user_id);

create policy "Users manage own collections" on collections
  for all using (auth.uid() = user_id);


### 4. Run Locally
bash
npm run dev

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Deployment (Vercel)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel project settings
4. Deploy 🎉

---

## 🔒 Security

- *RLS enforced* at the database level — no server-side bypass possible
- *Server-side auth validation* on every API route
- *No secrets exposed* to the client
- *Secure cookie handling* via @supabase/ssr
- *Environment variables* managed via Vercel (never committed)

---

## 🧠 Design Decisions

| Decision | Reason |
|---|---|
| App Router (Next.js 14) | Modern structure, server components, better performance |
| Server-side Supabase client | Secure auth validation without exposing keys |
| Supabase Realtime | Instant UI sync across tabs without polling |
| Optimistic UI updates | Faster perceived performance for add/delete |
| Summary caching in DB | Reduce Gemini API calls and respect free tier limits |
| AbortController timeout | Prevent Vercel function from hanging on slow AI responses |

---


🧩 Challenges Faced & Solutions

1️⃣ Google OAuth Redirect Loop (Production Issue)

Problem:
After deploying to Vercel, users were redirected back to the login page after Google authentication.

Root Cause:--

Mismatch between:
Supabase Site URL
Redirect URL
Production domain
Supabase requires exact redirect URLs to be whitelisted.

Solution:
Updated Supabase → Authentication → URL Configuration
Added production domain and /auth/callback
Ensured correct redirectTo value in OAuth configuration
Redeployed application
Learning:
OAuth flows are extremely sensitive to domain mismatches. Always configure production and development URLs properly.

2️⃣ Server-Side Authentication in Next.js App Router

Problem:
API routes could not detect logged-in users when deployed.

Root Cause:
Server routes do not automatically access browser cookies.

Solution:
Implemented @supabase/ssr
Created a custom supabase-server.ts
Passed cookies manually into createServerClient
Enabled proper session validation inside API routes

Learning:
In Next.js App Router, server-side authentication must explicitly handle cookies.


3️⃣ Gemini API 404 Model Errors

Problem:
AI summary API returned:
models/gemini-2.0-flash-exp not found

Root Cause:
Using deprecated model names and mismatched API versions (v1beta vs v1).

Solution:
Switched to stable model gemini-1.5-flash
Updated endpoint version
Improved error logging to diagnose model availability

Learning:
AI APIs evolve quickly. Always verify model compatibility with API version.

4️⃣ Gemini API Rate Limiting (429 Errors)

Problem:
Frequent 429 Too Many Requests during testing.

Root Cause:
Free-tier quota limits on Gemini API.

Solution:
Implemented proper 429 handling in API route
Returned user-friendly error message
Cached summaries in database to prevent repeated API calls

Learning:
External APIs must be handled defensively. Always implement graceful error handling.

5️⃣ Row Level Security (RLS) Configuration

Problem:
Bookmarks were not appearing for authenticated users.

Root Cause:
RLS policies were not correctly filtering by auth.uid().

Solution:
Configured RLS policies on bookmarks and collections
Ensured all queries filtered by user_id
Verified using authenticated Supabase server client

Learning:
Security rules must be aligned with backend authentication logic.

---

## 📈 Roadmap

- [ ] Full-text search across bookmark content
- [ ] Tag system for flexible organization
- [ ] Pagination / infinite scroll
- [ ] Bookmark preview with Open Graph metadata
- [ ] AI keyword/tag extraction
- [ ] Custom user themes
- [ ] Browser extension for one-click saving
- [ ] Import/export (Netscape bookmark format)

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.