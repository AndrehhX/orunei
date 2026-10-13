# Orunei Private Profile Design

## Goal

Build a usable private profile for the signed-in Orunei user: a personal anime identity page that can be viewed, edited, personalized, and persisted locally in the current browser, while leaving a clean path toward public profiles later.

## Scope

### Included in V1

- A real `Perfil` page reachable from the sidebar and the existing right-panel profile card.
- A private owner view and an edit mode.
- Editable display name, username, biography, status message, avatar, banner, accent color, featured anime, and pinned sections.
- Local persistence in the browser through a versioned profile record.
- An Orunei AnimeList view derived from the existing library data and grouped by its current statuses.
- Favorites, taste summary, recent activity, and custom local lists as profile sections.
- Responsive layout for desktop and mobile, with the visual language of Orunei: soft surfaces, rounded cards, purple brand accent, gradients, dark mode, and restrained motion.
- Image upload for avatar and banner with type/size validation, client-side resizing, graceful fallback, and a reset action.
- Privacy preferences stored now and respected by the future public-profile layer, even though V1 has no public profile route.

### Explicitly deferred

- Public profile routes and shareable profile URLs.
- Cloud accounts, server persistence, cross-device sync, and real authentication.
- Real followers, following, comments, social feed, notifications, and profile discovery.
- Payment, premium customization, or external image hosting.

## Product experience

### Private profile view

The profile opens as the user's own page. The header follows the supplied reference's hierarchy without copying its branding: a wide personalized banner, overlapping avatar, identity block, status, and a primary `Editar perfil` action. The private page may show every owned section regardless of future public visibility settings.

The first content row uses real local data rather than invented social numbers. It prioritizes useful Orunei metrics such as total works in the AnimeList, liked works, custom lists, average rating when available, and top genres. Follower metrics are not displayed in V1 because there is no social system behind them.

The profile content is organized into focused sections:

- `Resumen`: featured anime, top genres, selected stats, pinned list, and recent activity.
- `AnimeList`: `Viendo`, `Planeo ver`, `En pausa`, `Terminado`, and `Favorito`, using the existing library statuses.
- `Favoritos`: liked anime and saved profile highlights when reliable local data exists.
- `Listas`: custom user-created lists with a title, description, accent, and ordered anime IDs.
- `Actividad`: local actions that are already represented by the app, such as adding a work, liking an anime, or changing the profile.

The page should feel like a personal collection, not a generic settings form. Editing is entered through an explicit button and can be cancelled without saving.

### Edit profile

Edit mode is divided into four cards so the user understands what each control changes:

1. `Identidad`: display name, username, biography, and status.
2. `Apariencia`: avatar, banner, accent color, and featured anime.
3. `Contenido`: pinned sections and default profile landing section.
4. `Privacidad`: future visibility toggles for AnimeList, favorites, taste profile, activity, reviews, and custom lists.

The editor previews changes before saving. Save commits the full normalized profile object atomically; cancel discards the draft. A reset action restores the profile's visual defaults without deleting the AnimeList or taste data.

## Data model

Use a new versioned local-storage key, `orunei-profile-v1`, separate from `orunei-user` and `orunei-taste-v1`.

```js
{
  version: 1,
  displayName: '...',
  username: '...',
  bio: '...',
  status: '...',
  avatar: '',
  banner: '',
  accent: '#6d5cff',
  featuredAnimeId: null,
  pinnedSections: ['overview', 'animelist', 'favorites'],
  landingSection: 'overview',
  privacy: {
    animeList: 'private',
    favorites: 'private',
    taste: 'private',
    activity: 'private',
    reviews: 'private',
    lists: 'private'
  },
  customLists: [],
  activity: [],
  updatedAt: 0
}
```

The loader must merge stored values with defaults, ignore malformed fields, and never overwrite authentication or recommendation storage. The existing `orunei-user` record remains the source for the initial display name and email-derived username only when no profile record exists.

Uploaded images are stored as resized data URLs in the profile record for V1. Avatar output is capped at 512px square; banner output is capped at 1600px wide. The editor must reject non-image files and files over 5 MB before processing, and show a recoverable error when browser storage quota is exceeded.

## Component boundaries

- `src/profile/model.js`: defaults, normalization, serialization helpers, image constraints, and profile-derived stats.
- `src/profile/ProfileProvider.jsx`: load/save profile state, draft-safe update actions, and activity recording.
- `src/profile/profileData.js`: selectors that combine profile state with existing library and recommendation data.
- `src/components/ProfilePage.jsx`: private profile view and section navigation.
- `src/components/ProfileEditor.jsx`: edit cards, validation, image upload, preview, save/cancel/reset.
- `src/components/Sidebar.jsx` and `src/components/RightPanel.jsx`: route the existing Profile entry points to the real page.
- `src/App.jsx`: render the profile page without disturbing the existing home and anime catalogue flows.

The profile layer must consume existing recommendation and library context through small selectors rather than duplicating the recommendation engine or hard-coding fake profile counts.

## Error handling and accessibility

- Invalid or oversized images show an inline Spanish error and leave the previous image unchanged.
- Storage failures keep the in-memory draft visible and explain that it could not be persisted.
- A malformed stored profile falls back to defaults without logging the user out or clearing unrelated local data.
- All editor controls have labels, keyboard focus states, and accessible names; image inputs expose the selected filename and a reset button.
- The profile remains usable when images fail to load by using the configured gradient/accent fallback.
- Reduced-motion preferences disable profile entrance and preview transitions.

## Verification targets

- Unit tests cover default profile creation, malformed-storage recovery, normalization, privacy defaults, custom-list updates, and image validation/resizing boundaries.
- A component-level or browser check confirms that Profile opens from both sidebar and right panel, Edit/Cancel/Save behave correctly, and a saved profile survives reload.
- Existing catalogue tests and the production build remain green.
- No public profile or social behavior is implied by V1 UI controls.

