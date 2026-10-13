# Recommendation Engine Super Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Orunei’s recommendation profile and ranking so “Para ti” reflects real AnimeList activity, updates deterministically, balances affinity with discovery, and remains resilient when AniList is unavailable.

**Architecture:** Keep recommendation state local-first. Move deterministic profile derivation and ranking primitives into `src/rec/engine.js`, isolate AniList candidate loading in `src/rec/pool.js`, and let `src/rec/rec.jsx` coordinate persistence, synchronization, actions, and the UI-facing selectors. Existing UI components continue to consume `useRec`, with explicit result metadata for explanations and filtered sections.

**Tech Stack:** React 18, Vite, JavaScript ES modules, AniList GraphQL, browser `localStorage`/`sessionStorage`, Node’s built-in test runner.

**Spec:** `docs/superpowers/specs/2026-10-13-recommendation-engine-design.md`

## Global Constraints

- The system remains local-first and must not send the user’s taste profile to third parties.
- Adding a work to the library must not mark it as watched or create a confirmed taste signal.
- Completed, watching, favorite, paused, and planned states must retain distinct weights.
- AniList failures must preserve the last valid pool and must never generate fake recommendations.
- Existing catalog, profile, trend, performance, and build tests must continue to pass.
- Run project commands through the repository’s RTK wrapper: `rtk <command>`.

## Review Focus

- A library with the same entries synchronized twice must produce the same profile; test this in Task 1.
- A status change from planned to completed must replace the old contribution rather than stack another contribution; test this in Task 2.
- A candidate already in the library, favorites, hidden list, or explicit exclusions must not be returned; test this in Task 3.
- A cold-start profile must return useful current results without claiming they are personalized; test this in Task 3.
- AniList returning an error or an empty response must preserve the last valid pool and avoid a UI crash; test this in Task 4.

---

### Task 1: Deterministic taste profile and hybrid ranking primitives

**Files:**
- Modify: `src/rec/engine.js`
- Test: `tests/recommendation.test.mjs`

**Interfaces:**
- Consumes: normalized AnimeList entries with `id`, `status`, `favorite`, `genres`, and optional `updatedAt`; existing AniList-derived items with normalized vectors.
- Produces: `STATUS_WEIGHTS`, `buildTasteProfile(entries, explicitState, now)`, `profileSignature(entries)`, `scoreCandidate(item, profile, context)`, and an expanded `recommend(pool, profile, options)` contract returning `reasonKey`, `reasonData`, and `reason`.

- [x] **Step 1: Write failing tests** for the exact status weights, deterministic profile rebuild, order independence, temporal decay, hybrid score components, and structured recommendation reasons.
- [x] **Step 2: Run focused tests** with `rtk node --test tests/recommendation.test.mjs` and confirm the new exports/expectations fail.
- [x] **Step 3: Implement the engine primitives** in `src/rec/engine.js`. Rebuild the feature weights from entries in a stable order, apply the approved status weights, preserve explicit positive/negative actions, and keep existing vectorization and diversity behavior compatible.
- [x] **Step 4: Run focused tests** again and confirm all new and existing recommendation assertions pass.
- [x] **Step 5: Commit** with `rtk git add src/rec/engine.js tests/recommendation.test.mjs` and `rtk git commit -m "feat: rebuild recommendation taste profile"`.

### Task 2: Versioned provider synchronization and interaction state

**Files:**
- Modify: `src/rec/rec.jsx`
- Modify: `src/components/Rows.jsx`
- Test: `tests/recommendation.test.mjs`
- Test: `tests/home-tabs.test.mjs`

**Interfaces:**
- Consumes: Task 1’s `buildTasteProfile`, `profileSignature`, and structured `recommend` result.
- Produces: `RecProvider` state version `orunei-taste-v3`, idempotent `syncLibrary(entries)`, explicit exclusion composition, and UI selectors for `recs`, `affinityRecs`, `trendingRecs`, `exploreRecs`, `latest`, and `trends`.

- [x] **Step 1: Write failing tests** proving that sync uses a derived profile, status changes do not double-count, all library IDs are excluded, and the provider-facing sections remain stable when the library changes.
- [x] **Step 2: Run the focused tests** and confirm the current incremental sync behavior fails the new assertions.
- [x] **Step 3: Update `rec.jsx`** to migrate compatible explicit interactions from `orunei-taste-v2`, derive the profile from the current library, persist `orunei-taste-v3`, and keep `like`, `dismiss`, `likeMedia`, and `likeNews` as explicit signals.
- [x] **Step 4: Update `Rows.jsx`** to consume the structured selectors and show the appropriate empty/cold-start messages without labeling trend-based results as personalized.
- [x] **Step 5: Run focused tests and the relevant home/profile suite** with `rtk node --test tests/recommendation.test.mjs tests/home-tabs.test.mjs tests/home-layout.test.mjs`.
- [x] **Step 6: Commit** with `rtk git add src/rec/rec.jsx src/components/Rows.jsx tests/recommendation.test.mjs tests/home-tabs.test.mjs` and `rtk git commit -m "feat: synchronize recommendations with library state"`.

### Task 3: Larger live AniList candidate pool with safe fallback

**Files:**
- Create: `src/rec/pool.js`
- Modify: `src/rec/rec.jsx`
- Test: `tests/recommendation.test.mjs`

**Interfaces:**
- Consumes: AniList GraphQL responses and the current library’s relevant IDs/genres.
- Produces: `CANDIDATE_CACHE_KEY`, `loadRecommendationPool({ force, library, fetchImpl })`, and a deduplicated vectorized pool with `source` metadata.

- [x] **Step 1: Write failing tests** for deduplication across popularity/trending/score/recent/related sources, exclusion of malformed entries, cache reuse, and preservation of the last valid pool after a request failure.
- [x] **Step 2: Run focused tests** and verify the pool module does not yet exist or does not satisfy the cases.
- [x] **Step 3: Implement `src/rec/pool.js`** with one bounded GraphQL request strategy, stable deduplication by AniList ID, vectorization through Task 1, a short session cache, and an injectable fetch for tests.
- [x] **Step 4: Wire `RecProvider`** to the pool loader without blocking the initial render; keep the prior pool in memory when refresh fails.
- [x] **Step 5: Run pool and recommendation tests** with `rtk node --test tests/recommendation.test.mjs`.
- [x] **Step 6: Commit** with `rtk git add src/rec/pool.js src/rec/rec.jsx tests/recommendation.test.mjs` and `rtk git commit -m "feat: expand live recommendation pool"`.

### Task 4: Recommendation sections and explanations in “Para ti”

**Files:**
- Modify: `src/rec/rec.jsx`
- Modify: `src/components/Rows.jsx`
- Modify: `src/components/Hero.jsx`
- Test: `tests/home-tabs.test.mjs`
- Test: `tests/home-layout.test.mjs`

**Interfaces:**
- Consumes: Task 2’s selectors and Task 3’s resilient pool.
- Produces: visible sections for primary recommendations, taste anchor, compatible trends, controlled exploration, and recent works; all explanation text comes from structured reason data.

- [x] **Step 1: Write failing UI-source tests** for the five sections, cold-start copy, real explanation rendering, and no hardcoded anime recommendations.
- [x] **Step 2: Run the focused home tests** and confirm the existing single-row implementation fails the new section expectations.
- [x] **Step 3: Update the recommendation selectors and rows** so each section has a bounded result set, stable keys, lazy/deferred image behavior, and no duplicate IDs across sections where possible.
- [x] **Step 4: Update hero/recommendation copy** to use the structured explanation and ensure a trend-based cold-start result is not described as a personal match.
- [x] **Step 5: Run the home, catalog-performance, and recommendation suites** with `rtk node --test tests/recommendation.test.mjs tests/home-tabs.test.mjs tests/home-layout.test.mjs tests/catalog-performance.test.mjs`.
- [x] **Step 6: Commit** with `rtk git add src/rec/rec.jsx src/components/Rows.jsx src/components/Hero.jsx tests/recommendation.test.mjs tests/home-tabs.test.mjs tests/home-layout.test.mjs` and `rtk git commit -m "feat: add explainable recommendation sections"`.

### Task 5: Full verification, migration audit, and release

**Files:**
- Modify: `docs/superpowers/plans/2026-10-13-recommendation-engine-update.md`
- Test: all existing tests under `tests/`

**Interfaces:**
- Consumes: completed Tasks 1–4 and their commits.
- Produces: verified build, clean diff, final integration commit if needed, pushed branch, and production deployment tied to the final commit.

- [x] **Step 1: Run the complete test suite** with `rtk npm test`; expected result is zero failures.
- [x] **Step 2: Run the production build** with `rtk npm run build`; expected result is a successful Vite build.
- [x] **Step 3: Run formatting/diff checks** with `rtk git diff --check` and inspect `rtk git status --short --branch`.
- [x] **Step 4: Mark completed plan steps and commit the plan state** if the plan itself changed.
- [x] **Step 5: Push `master`** with `rtk git push`.
- [x] **Step 6: Verify Vercel** shows the final commit as Ready on Production and verify `https://www.orunei.fun/` loads with title `Orunei`.

