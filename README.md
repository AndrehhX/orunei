# Orunei

Anime / movies / series discovery dashboard ("Para ti" view) built with **React + Vite + Tailwind CSS**.

## Run it
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in /dist
  npm test         # full domain, interaction, and performance test suite
```

## Structure
```
src/
  App.jsx               page layout, search, tabs, theme state
  data.js               curated homepage seeds and visual fallbacks
  components/
    Sidebar.jsx         navigation + light/dark toggle
    Hero.jsx            recommendation + trending banners
    Rows.jsx            library, "because you like", news
    RightPanel.jsx      profile, friends, trends, featured news
    ProfilePage.jsx     private profile, AnimeList, favorites, lists, activity
    ProfileEditor.jsx   private profile editor and profile image uploads
    Poster.jsx          image with gradient fallback
  profile/
    model.js            normalized profile contract and image constraints
    ProfileProvider.jsx authenticated profile state and persistence
    profileData.js      AnimeList and profile selectors
    profileLists.js     custom-list CRUD helpers
```

## Images
Covers and banners load automatically from the public AniList API using the `q` search term of each item in `src/data.js` (cached per session).
To force a specific picture, set `img: "https://..."` on that item. If nothing loads, a gradient placeholder is shown.

## Features
Dark mode (saved in localStorage), lightweight hover/lift animations, responsive layout,
reduced-motion support. The authenticated private profile and read-only public preview are available
from **Perfil**.

## Profile and accounts
Orunei uses Supabase Auth for real sessions and the profile repository for identity, privacy,
profile activity, and custom lists. The owner can edit every section; public visitors only receive
sections allowed by `private`, `friends`, or `public` visibility. The read-only public preview is
available from **Perfil / Vista publica**.

From **Perfil → Editar perfil** you can change the display name, username, bio, status, accent,
featured anime, pinned sections, privacy preferences, avatar, and banner. Images are validated as
image files under 5 MB, resized in the browser for local fallback, or uploaded to the `profile-media`
Supabase Storage bucket when remote accounts are configured.

The private profile exposes each account's remote AnimeList grouped by status, Favorites,
private custom lists with create/edit/delete and add/remove anime actions, and remote activity
history. Malformed stored data is normalized back to safe defaults and persistence failures are
shown as recoverable UI errors.

The social area uses real Supabase data: search public profiles, send/accept/cancel friendship
requests, open friend profiles, and read, publish, edit, or delete profile comments. Public
profiles can be shared with a `#perfil/<username>` link; profile visibility and section privacy
are enforced again by database RLS, not only by the interface.

## Login
Sign up and sign in use Supabase Auth. Copy `.env.example` to `.env` and provide
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before running the app; when either value is
missing, Orunei shows an explicit setup state instead of creating a fake local account. The
mascots follow your cursor, look down while you type your email, shut their eyes when you type the
password and peek when you press the eye icon. Log out with the icon next to your name in the
sidebar.

The complete Supabase migration and two-account verification checklist is in
`docs/SUPABASE_SETUP.md`.

## Animations
Scroll-reveal (`Reveal.jsx`), spring easings, carousel crossfade, sliding tab/theme indicators. All disabled with `prefers-reduced-motion`.

## Live news
`src/news.jsx` reads public RSS feeds (Anime News Network, Crunchyroll News, MyAnimeList News) through the free rss2json API (no key), merges and sorts them, and caches for 10 minutes. The dashboard row, the right panel and the **Noticias** tab all use it. If the feeds can't be reached, the UI reports the unavailable sources and offers a retry instead of inventing articles. Add or remove sources in the `FEEDS` array. Note: rss2json's free tier is rate-limited.

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
Sidebar → **Anime**. Curated filters (12 genres plus expandable AniList tags such as Isekai, Seinen, Shounen and Mecha, format, year, status and sort), the header search box searches AniList, "load more" pagination, and a full detail view:
- **Hero** with banner, cover, genres, next-episode countdown, **Watch on Crunchyroll**, trailer and Like (which trains your taste profile).
- **Ratings** side by side: AniList, MyAnimeList (Jikan), Kitsu and IMDb. IMDb is intentionally shown as **No disponible** until its integration is finalized; no token/setup message is shown in the product UI.
- **Overview:** synopsis in Spanish by default with an English/original toggle, weighted tags (spoiler tags hidden by default), info table and "if you liked it" recommendations.
- **Episodes:** real Crunchyroll episode links when AniList has them, otherwise numbered buttons that open Crunchyroll.
- **Community:** reviews and discussions merged from AniList reviews, AniList forum, MyAnimeList reviews and Reddit, sorted by likes, with source filters, spoiler blur and links to the originals. Sources load independently, so one failing doesn't block the rest.
