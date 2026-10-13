# Orunei Final Product Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish the recommendation, interaction, and performance pass without inventing IMDb data.

**Architecture:** Keep the current React/Vite structure. Move shared behavior into small pure helpers where tests can pin it, keep navigation state in `App`, and remove observer-driven animation work from repeated catalog/news cards. External data remains progressive and failure-tolerant.

**Tech Stack:** React 18, Vite, Tailwind CSS, Node test runner, AniList GraphQL, RSS2JSON.

**Spec:** User request in the active Orunei thread, 2026-10-13.

## Global Constraints

- IMDb must display `No disponible` when OMDb is not configured or returns no usable score.
- No fabricated ratings, news, library entries, or recommendation evidence.
- Every important change must be committed.
- Existing Supabase/profile behavior and reduced-motion support must remain intact.
- Catalog and news interactions must remain usable while remote requests are loading or failing.

## Review Focus

- A missing or invalid IMDb key must not expose setup instructions to end users; test this in the ratings contract.
- Changing catalog search/filter quickly must not let an older response overwrite the newest result; test request cancellation/staleness.
- Hero details and library-row actions must have a real destination; test callback wiring in the component source/behavior contract.
- News reloads must ignore stale responses and avoid observer-per-card work; test the feed and rendering contracts.
- Recommendation learning must weight favorite/watching/planned library states intentionally; test the action mapping.

### Task 1: Ratings and recommendation contracts

**Files:** Modify `src/api/anime.js`, `src/rec/rec.jsx`, `src/rec/engine.js`; test `tests/recommendation.test.mjs`.

- Add failing tests for IMDb unavailable output and library status-to-signal mapping.
- Make the smallest implementation pass: return `{ unavailable: true }` from the IMDb job when no usable source exists, render `No disponible`, and map favorite/watching/planned/completed entries to explicit learning strengths.
- Verify targeted and full tests, then commit.

### Task 2: Functional navigation and controls

**Files:** Modify `src/App.jsx`, `src/components/Hero.jsx`, `src/components/AnimePage.jsx`, `src/components/Rows.jsx`; test `tests/interaction-contract.test.mjs`.

- Add failing tests for hero detail navigation and library-row navigation.
- Add an app-level anime detail entry point, make hero/trending details open the same in-flow detail view, make library-row controls open the library page, and preserve keyboard activation for catalog cards.
- Verify targeted tests and browser flows, then commit.

### Task 3: Catalog/news performance pass

**Files:** Modify `src/api/anime.js`, `src/components/AnimePage.jsx`, `src/components/NewsPage.jsx`, `src/components/Rows.jsx`, `src/components/Poster.jsx`, `src/news.jsx`; test `tests/performance-contract.test.mjs`.

- Add failing tests for signal-aware catalog requests, async image decoding, removal of repeated card reveals, and stale news-load protection.
- Add request cancellation/stale guards, memoized news presentation data, lazy async decoding, content visibility, and lightweight CSS transitions in repeated lists.
- Verify tests, production build, browser performance-sensitive flows, and console output, then commit.

## Final Verification

- Run `rtk npm test`, `rtk npm run build`, and `rtk git diff --check`.
- Verify light/dark mode, catalog filtering, rapid tab/filter changes, hero details, library navigation, news reload/filter/load-more, IMDb unavailable text, and no console errors.
- Confirm a clean worktree and report each commit.
