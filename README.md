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
