# Public Profile and Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the owner-only local profile with authenticated Supabase profiles and a privacy-aware public profile view.

**Architecture:** Supabase Auth owns sessions, Postgres owns profile identity and section visibility, and Storage owns avatar/banner files. The React shell receives one session provider; profile repositories return normalized `{ data, error }` results and public selectors decide what a viewer may see before rendering.

**Tech Stack:** React 18, Vite, Tailwind CSS, `@supabase/supabase-js`, Supabase Auth/Postgres/Storage, Node built-in tests.

**Spec:** `docs/superpowers/specs/2026-10-12-public-profile-news-social-design.md`

## Global Constraints

- Never ship a Supabase service key in the client bundle.
- `private`, `friends`, and `public` are the only visibility values.
- The owner can see/edit all own sections; a visitor never receives edit controls or the `Solo tú` marker.
- Missing Supabase configuration must show an explicit setup state instead of pretending localStorage is a remote account.
- Use tests first for each domain/repository behavior and commit each independently testable task.

## Review Focus

- A malformed or incomplete remote profile must retain the authenticated identity and safe defaults.
- A friend request must not grant access to a `friends` section before acceptance.
- A visitor must not receive private list/activity payloads even if the UI hides the tab.
- Avatar/banner upload failure must preserve the prior URL and expose a recoverable error.
- Signing out must clear the remote session and prevent the previous profile from remaining visible.

### Task 1: Supabase client and authenticated session boundary

**Files:**
- Create: `src/auth/supabaseClient.js`
- Create: `src/auth/AuthProvider.jsx`
- Create: `tests/auth-config.test.mjs`
- Modify: `.env.example`, `package.json`, `src/main.jsx`, `src/App.jsx`

**Interfaces:**
- Produces `supabase`, `AuthProvider`, and `useAuth()` returning `{ session, user, status, error, signIn, signUp, signOut }`.
- `status` is `loading`, `ready`, `unauthenticated`, or `misconfigured`.

- [ ] **Step 1: Write failing tests** for missing env configuration and the normalized auth status contract.
- [ ] **Step 2: Run `rtk proxy node --test tests/auth-config.test.mjs` and verify the new module/contract fails.**
- [ ] **Step 3: Install `@supabase/supabase-js`, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.example`, and implement the client/provider without service keys.**
- [ ] **Step 4: Run the focused test and the existing suite; verify configuration failures are explicit.**
- [ ] **Step 5: Commit** `feat: add authenticated supabase session boundary`.

### Task 2: Remote profile schema, storage policies, and repository

**Files:**
- Create: `supabase/migrations/001_profile_social_foundation.sql`
- Create: `src/profile/profileRepository.js`
- Create: `tests/profile-repository.test.mjs`
- Modify: `src/profile/model.js`, `src/profile/profileStorage.js`

**Interfaces:**
- Produces `getOwnProfile(userId)`, `getPublicProfile(username, viewerId)`, `saveProfile(userId, patch)`, and `uploadProfileImage(userId, kind, file)`; each returns `{ data, error }`.
- SQL creates `profiles`, `profile_privacy`, `profile_activity`, profile image bucket policies, and RLS for owner/public identity reads plus friendship-based access to shared sections.

- [ ] **Step 1: Write failing repository tests** for normalized own profile data, public filtering, and image upload error preservation.
- [ ] **Step 2: Run the focused tests and verify they fail before the repository exists.**
- [ ] **Step 3: Add the migration with explicit RLS policies and implement the repository against the Supabase client.**
- [ ] **Step 4: Run focused and full tests; inspect the SQL for owner, friend, and unrelated-viewer paths.**
- [ ] **Step 5: Commit** `feat: add remote profile repository and privacy policies`.

### Task 3: Public profile selectors and read-only view

**Files:**
- Create: `src/profile/publicProfile.js`
- Create: `src/components/PublicProfilePage.jsx`
- Create: `tests/public-profile.test.mjs`
- Modify: `src/components/ProfilePage.jsx`, `src/App.jsx`, `src/profile/navigation.js`

**Interfaces:**
- `selectVisibleProfile(profile, viewer)` returns only allowed identity/sections and `{ canEdit, relationship }`.
- `PublicProfilePage` accepts `{ username, onBack }` and renders loading, not-found, private, and ready states.

- [ ] **Step 1: Write failing selector tests** for owner, public visitor, accepted friend, pending friend, and unrelated visitor.
- [ ] **Step 2: Run the focused test and verify it fails with missing selector behavior.**
- [ ] **Step 3: Implement selectors and the read-only profile layout using the existing Orunei visual language; remove `Solo tú` from visitor mode.**
- [ ] **Step 4: Run the focused/full tests and build.**
- [ ] **Step 5: Commit** `feat: add privacy-aware public profile view`.

### Task 4: Replace demo login and local-only profile writes

**Files:**
- Modify: `src/components/Login.jsx`, `src/profile/ProfileProvider.jsx`, `src/components/ProfileEditor.jsx`, `src/App.jsx`, `README.md`
- Test: `tests/profile-provider.test.mjs`

- [ ] **Step 1: Write failing tests** for session loading, remote save success, remote save failure, sign-out cleanup, and explicit misconfiguration state.
- [ ] **Step 2: Run the focused test and verify the current local-only behavior fails the remote contract.**
- [ ] **Step 3: Wire `AuthProvider`, migrate the private profile draft explicitly, and remove demo authentication from the productive path.**
- [ ] **Step 4: Run tests/build and perform browser QA for sign-up, sign-in, edit, reload, sign-out, and public profile navigation.**
- [ ] **Step 5: Commit** `feat: connect profile to authenticated persistence`.

### Task 5: Public profile release verification

- [ ] **Step 1:** Apply the Supabase migration in a test project with two accounts.
- [ ] **Step 2:** Verify owner, accepted friend, pending friend, and unrelated viewer behavior for every privacy section.
- [ ] **Step 3:** Verify Storage upload, replacement, failed upload, and prior-image preservation.
- [ ] **Step 4:** Run `rtk proxy node --test`, `rtk npm run build`, and `rtk git diff --check`.
- [ ] **Step 5: Commit** `test: verify public profile release paths` if the release verification adds tracked tests or docs.
