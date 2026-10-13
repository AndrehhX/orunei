# Social Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace simulated similar users and local follow toggles with real friendships, profile discovery, and comments on public profiles.

**Architecture:** Social domain helpers remain pure and tested separately from Supabase repositories. The UI consumes a `SocialProvider` for current relationship state and mutations, while RLS remains the final authorization boundary for friendships and comments.

**Tech Stack:** React 18, Vite, Tailwind CSS, `@supabase/supabase-js`, Supabase Realtime where useful, Node built-in tests.

**Spec:** `docs/superpowers/specs/2026-10-12-public-profile-news-social-design.md`

## Global Constraints

- No static `similar` users, fake follower counts, or local-only follow state in productive social views.
- Friendship states are `pending`, `accepted`, `declined`, and `blocked`.
- Only the requester can cancel a pending request; only the addressee can accept or decline it.
- Only the comment author can edit/delete their comment; profile owners may hide/delete comments on their own profile.
- Comments and relationship lists must respect authentication, privacy, and RLS.

## Review Focus

- Duplicate friendship requests in opposite directions resolve to one relationship.
- A blocked relationship cannot expose private profile sections or create new comments.
- Empty search, no results, failed mutation, and stale-session states are visible and recoverable.
- Editing a comment cannot change its author or target profile.
- Optimistic UI must roll back when Supabase rejects a mutation.

### Task 1: Social domain model and migration

**Files:**
- Create: `src/social/model.js`
- Create: `tests/social-model.test.mjs`
- Modify: `supabase/migrations/001_profile_social_foundation.sql` or add `supabase/migrations/002_social_relationships.sql`

**Interfaces:**
- Produces `normalizeFriendship`, `getRelationship`, `canComment`, `mergeFriendship`, and `normalizeComment`.
- SQL creates `friendships` and `profile_comments` with uniqueness, checks, indexes, and RLS.

- [ ] **Step 1: Write failing tests** for relationship merging, allowed transitions, blocked users, comment normalization, and ownership rules.
- [ ] **Step 2: Run the focused test and verify it fails.**
- [ ] **Step 3: Implement the pure model and migration policies.**
- [ ] **Step 4: Run focused/full tests and inspect RLS transitions.**
- [ ] **Step 5: Commit** `feat: add social relationship domain`.

### Task 2: Social repositories and provider

**Files:**
- Create: `src/social/socialRepository.js`
- Create: `src/social/SocialProvider.jsx`
- Create: `tests/social-repository.test.mjs`
- Modify: `src/main.jsx`

**Interfaces:**
- Produces `searchProfiles(query)`, `getFriendships(userId)`, `sendFriendRequest(targetId)`, `respondToFriendRequest(id, status)`, `listComments(profileId)`, `createComment(profileId, body)`, `updateComment(id, body)`, and `deleteComment(id)`.
- Provider exposes `{ friends, incoming, outgoing, comments, search, actions, status, error }`.

- [ ] **Step 1: Write failing repository/provider tests** for success, RLS rejection, and mutation rollback results.
- [ ] **Step 2: Run the focused tests and verify failure.**
- [ ] **Step 3: Implement repository calls and provider state with explicit error results.**
- [ ] **Step 4: Run tests/build and verify no static user data enters the provider.**
- [ ] **Step 5: Commit** `feat: connect social repositories`.

### Task 3: Friends and profile discovery UI

**Files:**
- Create: `src/components/FriendsPage.jsx`
- Create: `src/components/ProfileSearch.jsx`
- Modify: `src/components/Sidebar.jsx`, `src/App.jsx`, `src/components/RightPanel.jsx`

- [ ] **Step 1: Add failing interaction tests or a DOM smoke check** for search, open profile, send request, accept, decline, and remove friend.
- [ ] **Step 2: Verify the smoke check fails against the mock-only UI.**
- [ ] **Step 3: Implement the friends page and replace `similar`/`fol` with provider data, including empty/loading/error states.**
- [ ] **Step 4: Run browser QA using two authenticated accounts against the test project.**
- [ ] **Step 5: Commit** `feat: add friends and public profile discovery`.

### Task 4: Profile comments

**Files:**
- Create: `src/components/ProfileComments.jsx`
- Modify: `src/components/PublicProfilePage.jsx`, `src/profile/publicProfile.js`
- Test: `tests/profile-comments.test.mjs`

- [ ] **Step 1: Write failing tests** for visible comments, private-profile denial, create/edit/delete, and rejected unauthenticated mutation.
- [ ] **Step 2: Verify failure.**
- [ ] **Step 3: Implement comments with author identity, timestamps, character limit, own-edit/delete controls, and owner moderation control.**
- [ ] **Step 4: Run tests/build and browser QA for accepted friend, public visitor, and blocked visitor.**
- [ ] **Step 5: Commit** `feat: add comments to public profiles`.

### Task 5: Social release audit

- [ ] **Step 1:** Exercise two-account flows against Supabase: search, request, accept, profile privacy, comment, edit, delete, block.
- [ ] **Step 2:** Confirm no `similar`, `fol`, or demo-login path remains reachable from productive social UI.
- [ ] **Step 3:** Run the full test suite, build, diff check, and RLS review.
- [ ] **Step 4: Commit** `test: verify social release paths` if verification adds tracked coverage or documentation.
