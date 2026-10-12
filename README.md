# Orunei

Anime / movies / series discovery dashboard ("Para ti" view) built with **React + Vite + Tailwind CSS**.

## Run it
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in /dist
```

## Structure
```
src/
  App.jsx               page layout, search, tabs, theme state
  data.js               all mock content (edit here)
  components/
    Sidebar.jsx         navigation + light/dark toggle
    Hero.jsx            recommendation + trending banners
    Rows.jsx            library, "because you like", news
    RightPanel.jsx      profile, similar users, trends, featured news
    Poster.jsx          image with gradient fallback
```

## Images
Covers and banners load automatically from the public AniList API using the `q` search term of each item in `src/data.js` (cached per session).
To force a specific picture, set `img: "https://..."` on that item. If nothing loads, a gradient placeholder is shown.

## Features
Dark mode (saved in localStorage), hover/lift animations, staggered entrance, responsive layout,
reduced-motion support. Only the "Para ti" page is implemented; other nav items are placeholders.

## Login
Any valid email + password (4+ chars) signs you in (demo auth, stored in localStorage). The mascots follow your cursor, look down while you type your email, shut their eyes when you type the password and peek when you press the eye icon. Log out with the icon next to your name in the sidebar.

## Animations
Scroll-reveal (`Reveal.jsx`), spring easings, carousel crossfade, sliding tab/theme indicators. All disabled with `prefers-reduced-motion`.

## Live news
`src/news.jsx` reads public RSS feeds (Anime News Network, Crunchyroll News, MyAnimeList News) through the free rss2json API (no key), merges and sorts them, and caches for 10 minutes. The dashboard row, the right panel and the **Noticias** tab all use it. If the feeds can't be reached, demo data is shown with a retry button. Add or remove sources in the `FEEDS` array. Note: rss2json's free tier is rate-limited.

## Recommendation engine (`src/rec/`)
Runs 100% in the browser, no accounts or servers needed.
- **Candidates:** ~110 anime from AniList (popular, trending, top rated), cached 30 min.
- **Features:** genres, weighted tags, studio, format and decade, weighted by TF-IDF so rare traits matter more than "Action".
- **Taste profile:** every signal moves it (like +1, add to library +1.6, news like +0.6, not interested −0.6) and old taste decays with a 45-day half-life, so it follows you as your interests change.
- **Ranking:** cosine similarity to your taste, blended with quality, trend, popularity and freshness. The weight of your taste grows with confidence (cold start = quality-based).
- **Diversity:** MMR re-ranking avoids ten near-identical recommendations; one slot is reserved to explore outside your known taste.
- **Explainability:** each card says why it's recommended ("Porque te gusta X"). A toast shows what the system just learned and the "Tus gustos" panel shows the profile.
- Liked news posts that mention an anime nudge your taste towards it.

## Anime catalogue
Sidebar → **Anime**. Curated filters (12 genres, format, year, status, sort), the header search box searches AniList, "load more" pagination, and a full detail view:
- **Hero** with banner, cover, genres, next-episode countdown, **Watch on Crunchyroll**, trailer and Like (which trains your taste profile).
- **Ratings** side by side: AniList, MyAnimeList (Jikan), Kitsu and IMDb. IMDb has no free keyless API, so it needs a free OMDb key: copy `.env.example` to `.env` and fill `VITE_OMDB_KEY`.
- **Overview:** synopsis, weighted tags (spoiler tags hidden by default), info table and "if you liked it" recommendations.
- **Episodes:** real Crunchyroll episode links when AniList has them, otherwise numbered buttons that open Crunchyroll.
- **Community:** reviews and discussions merged from AniList reviews, AniList forum, MyAnimeList reviews and Reddit, sorted by likes, with source filters, spoiler blur and links to the originals. Sources load independently, so one failing doesn't block the rest.
