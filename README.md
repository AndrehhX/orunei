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

## Adding images
Open `src/data.js` and paste any Google/Pinterest image URL into the `img` field of each item.
If `img` is empty or fails to load, a gradient placeholder with the title is shown.

## Features
Dark mode (saved in localStorage), hover/lift animations, staggered entrance, responsive layout,
reduced-motion support. Only the "Para ti" page is implemented; other nav items are placeholders.
