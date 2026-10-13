# Orunei Private Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the private, locally persisted Orunei profile described in the approved design, including an editable identity, personalization, AnimeList sections, custom lists, activity, and future privacy controls.

**Architecture:** Add a small profile domain layer with normalized localStorage state, a React provider for draft-safe updates, selectors that combine profile state with existing library/recommendation data, and focused profile view/editor components. Integrate the profile into the existing in-app page state without introducing a router, backend, or new dependency.

**Tech Stack:** React 18, Vite, Tailwind CSS, lucide-react, browser localStorage/session state, Node's built-in `node:test` for pure domain tests.

**Spec:** `docs/superpowers/specs/2026-10-12-private-profile-design.md`

## Global Constraints

- V1 is private-owner-only; do not add public profile routes, social behavior, followers, or cloud persistence.
- Persist profile data under `orunei-profile-v1`, separate from `orunei-user` and `orunei-taste-v1`.
- Use real existing library/recommendation data for profile metrics; do not invent follower counts.
- Keep avatar and banner uploads local, validated as images no larger than 5 MB before processing, and resized to 512px/1600px limits.
- Preserve the current home, news, anime catalogue, AniList query fix, dark mode, and reduced-motion behavior.
- Run `node --test`, `npm run build`, and `git diff --check` at each relevant task boundary.
- Commit every important task; never include the pre-existing untracked `package-lock.json` unless explicitly requested.

## Review Focus

- Malformed or partial local profile data must recover to defaults without logging the user out; test normalization and storage recovery in Task 1.
- A failed or oversized image upload must leave the previous image unchanged; test validation and draft behavior in Task 4.
- Cancel must discard profile edits while Save must survive a reload; cover provider behavior in Task 2 and browser verification in Task 6.
- Profile metrics must reflect current library and taste state instead of mock follower numbers; test selectors in Task 2.
- Existing home/catalogue rendering must remain available after profile navigation; verify integration and production build in Tasks 3 and 6.

### Task 1: Profile domain model and persistence helpers

**Files:**
- Create: `src/profile/model.js`
- Create: `tests/profile-model.test.mjs`
- Modify: none

**Interfaces:**
- Produces `PROFILE_KEY`, `DEFAULT_PROFILE`, `createProfile(user)`, `normalizeProfile(raw, user)`, `validateImageFile(file, kind)`, `getProfileStats(library, tasteCount, profile)`, and `makeActivity(type, label, at)`.

- [ ] **Step 1: Write failing tests** for default profile creation, malformed storage normalization, private privacy defaults, image-size/type boundaries, custom-list normalization, and stats derived from library/taste inputs.
- [ ] **Step 2: Run `node --test tests/profile-model.test.mjs` and confirm the tests fail because the model module and interfaces do not exist.
- [ ] **Step 3: Implement the pure model helpers in `src/profile/model.js`; keep defaults immutable, sanitize strings/arrays, cap activity/list sizes, and validate image metadata without requiring React.
- [ ] **Step 4: Run the focused test again and confirm all model tests pass.
- [ ] **Step 5: Commit with `feat: add private profile domain model`.**

### Task 2: Profile provider and selectors

**Files:**
- Create: `src/profile/ProfileProvider.jsx`
- Create: `src/profile/profileData.js`
- Create: `tests/profile-data.test.mjs`

**Interfaces:**
- `useProfile()` exposes `{ profile, saveProfile, updateProfile, resetVisuals, recordActivity, updateCustomLists, storageError }`.
- `selectAnimeSections(library)`, `selectProfileStats(library, tasteCount, profile)`, and `selectRecentActivity(profile, library)` provide stable view data.

- [ ] **Step 1: Write failing selector/provider contract tests** for AnimeList grouping, stats, pinned-section normalization, and activity ordering.
- [ ] **Step 2: Run the focused tests and confirm they fail before the selector/provider interfaces exist.
- [ ] **Step 3: Implement normalized loading from `orunei-profile-v1`, draft-safe saves, storage-quota error handling, visual reset, bounded activity recording, and custom-list updates.
- [ ] **Step 4: Implement pure selectors that combine the existing `library` data and recommendation count without duplicating the recommendation engine.
- [ ] **Step 5: Run focused tests plus `node --test` and confirm the full suite passes.
- [ ] **Step 6: Commit with `feat: add private profile state layer`.**

### Task 3: Navigation and app integration

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Sidebar.jsx`
- Modify: `src/components/RightPanel.jsx`
- Modify: `src/main.jsx`

**Interfaces:**
- App page state accepts `profile` and renders `ProfilePage` through `ProfileProvider` without changing existing `home` and `anime` flows.
- Sidebar Profile and right-panel `Ver perfil` both call the same navigation callback.

- [ ] **Step 1: Add a focused integration assertion or DOM-level smoke check for both Profile entry points before wiring them, and verify it fails against the current no-op navigation.
- [ ] **Step 2: Mount `ProfileProvider` for the authenticated shell, wire the two entry points, and render the profile branch while preserving existing providers.
- [ ] **Step 3: Run the integration check and production build; confirm home/catalogue imports still compile.
- [ ] **Step 4: Commit with `feat: connect private profile navigation`.**

### Task 4: Private profile view

**Files:**
- Create: `src/components/ProfilePage.jsx`
- Modify: `src/profile/profileData.js` if view selectors need a bounded addition

**Interfaces:**
- `ProfilePage` accepts `user` and renders the private profile view with `onEdit` state, sections `overview`, `animelist`, `favorites`, `lists`, and `activity`.
- Uses `useProfile()` and `useRec()`; no mock follower metrics or public follow controls.

- [ ] **Step 1: Add a view-level smoke test or stable content check for the profile header, AnimeList sections, and private labeling; confirm it fails before the component exists.
- [ ] **Step 2: Implement the Orunei-styled profile header with banner fallback, overlapping avatar, identity, status, accent styling, real stats, and `Editar perfil`.
- [ ] **Step 3: Implement section navigation and content cards for overview, AnimeList, favorites, custom lists, and local activity with responsive layouts and reduced-motion-safe classes.
- [ ] **Step 4: Run the view check, full tests, and build.
- [ ] **Step 5: Commit with `feat: add private profile view`.**

### Task 5: Profile editor and local image uploads

**Files:**
- Create: `src/components/ProfileEditor.jsx`
- Modify: `src/profile/model.js`
- Modify: `src/profile/ProfileProvider.jsx`
- Create: `tests/profile-images.test.mjs`

**Interfaces:**
- Editor receives `onClose` and uses provider draft/save/cancel behavior.
- Image helper produces resized data URLs in the browser and rejects non-image or over-5-MB files before processing.

- [ ] **Step 1: Write failing tests for accepted image metadata, rejected file types/sizes, and unchanged values after rejected uploads.
- [ ] **Step 2: Run image tests and confirm they fail before the upload validation interfaces exist.
- [ ] **Step 3: Implement the four editor cards: Identidad, Apariencia, Contenido, and Privacidad, with Spanish labels, live preview, cancel, save, reset visuals, and inline errors.
- [ ] **Step 4: Implement client-side image resizing with avatar 512px and banner 1600px caps, storage-error feedback, and gradient fallbacks.
- [ ] **Step 5: Run image/model tests, full suite, and build.
- [ ] **Step 6: Commit with `feat: add editable private profile`.**

### Task 6: Custom lists, activity, and end-to-end verification

**Files:**
- Modify: `src/components/ProfilePage.jsx`
- Modify: `src/components/ProfileEditor.jsx`
- Modify: `src/profile/ProfileProvider.jsx`
- Modify: `README.md`
- Create: `tests/profile-flow.test.mjs` if the existing checks need a dedicated flow test

**Interfaces:**
- Users can create, rename, delete, pin, and reorder local custom lists without affecting AnimeList or recommendation storage.
- Save/cancel/reload behavior is verifiable from the UI.

- [ ] **Step 1: Write failing tests for custom-list CRUD and profile save/cancel semantics.
- [ ] **Step 2: Run the focused tests and confirm they fail before the flow is complete.
- [ ] **Step 3: Implement bounded list controls and activity recording; keep destructive actions confirmable and local.
- [ ] **Step 4: Update README with the private profile behavior and local-storage limitation without claiming public profiles.
- [ ] **Step 5: Run `node --test`, `npm run build`, and `git diff --check`.
- [ ] **Step 6: Perform a browser smoke check: login, open Profile from Sidebar, open Profile from right panel, edit text, upload a valid image, reject an invalid image, cancel, save, reload, verify persistence, and return to Home/Anime.
- [ ] **Step 7: Commit with `feat: complete private profile v1`.**

### Task 7: Whole-branch review and handoff

**Files:**
- Review all files changed by Tasks 1–6 against the spec and plan.

- [ ] **Step 1: Run the final full suite and production build from the committed tree.
- [ ] **Step 2: Perform a separate review for scope leaks, accessibility, malformed local data, image fallback, and regression of Home/Anime.
- [ ] **Step 3: Fix only Critical/Important findings with a failing test first, then rerun the full suite and build.
- [ ] **Step 4: Commit any final fix separately.
- [ ] **Step 5: Keep the approved design MD and this plan in place; do not delete either without the user's explicit confirmation.**

