# Theming & Design Tokens

This document is the reference for the **UI and color scheme** used across the
application. The theme is defined once and is **replicable to other projects**:
everything lives in a single, portable CSS file plus the docs you are reading now.

- **Single source of truth:** `resources/css/theme.css`
- **Loaded by:** `resources/css/app.css` (via `@import './theme.css';`)
- **Appearance hook:** `resources/js/hooks/use-appearance.tsx`
- **UI primitives:** shadcn/ui style components in `resources/js/components/ui/`

---

## 1. How the theme is structured

The theme uses Tailwind CSS **v4 CSS-first configuration** (`@theme` directive —
no `tailwind.config.js` needed). It is organised in three layers:

| Layer                | Where                            | Purpose                                                                     |
| -------------------- | -------------------------------- | --------------------------------------------------------------------------- |
| **Raw tokens**       | `:root { … }` and `.dark { … }`  | Light and dark palette values (HSL)                                         |
| **Semantic mapping** | `@theme { … }`                   | Maps raw tokens to Tailwind color utilities (`bg-primary`, `text-muted`, …) |
| **Variant + base**   | `@custom-variant`, `@layer base` | Dark-mode gating and global default styling                                 |

`theme.css` is self-documenting: each token carries a comment explaining its
role, and the header explains how to copy the file into a new project.

### Naming convention

Every raw token (`--primary`) maps to a semantic utility (`bg-primary`). Use the
**semantic** names in markup — never hard-code `hsl(...)` values.

| Raw token                            | Example utility                          |
| ------------------------------------ | ---------------------------------------- |
| `--background`                       | `bg-background`                          |
| `--foreground`                       | `text-foreground`                        |
| `--card` / `--card-foreground`       | `bg-card` / `text-card-foreground`       |
| `--primary` / `--primary-foreground` | `bg-primary` / `text-primary-foreground` |
| `--muted-foreground`                 | `text-muted-foreground`                  |
| `--border`                           | `border-border`                          |
| `--ring`                             | `ring-ring`, `focus-visible:ring-ring`   |

---

## 2. Design-token vocabulary

The full palette, by role. All values are HSL intentionally (hand-tunable across
light/dark).

### Surfaces (backgrounds & elevation)

| Token          | Light               | Dark                 |
| -------------- | ------------------- | -------------------- |
| `--background` | `hsl(0, 0%, 100%)`  | `hsl(225, 62%, 10%)` |
| `--foreground` | `hsl(0, 0%, 3.9%)`  | `hsl(210, 28%, 95%)` |
| `--card`       | `hsl(0, 0%, 100%)`  | `hsl(225, 55%, 18%)` |
| `--popover`    | `hsl(0, 0%, 100%)`  | `hsl(225, 55%, 18%)` |
| `--secondary`  | `hsl(0, 0%, 96.1%)` | `hsl(225, 55%, 22%)` |
| `--muted`      | `hsl(0, 0%, 96.1%)` | `hsl(225, 35%, 25%)` |

### Brand & emphasis

| Token                  | Light                  | Dark                 | Role                                  |
| ---------------------- | ---------------------- | -------------------- | ------------------------------------- |
| `--primary`            | `hsl(168, 74%, 42%)`   | `hsl(168, 74%, 42%)` | Primary buttons, links, active states |
| `--primary-foreground` | `hsl(0, 0%, 98%)`      | `hsl(0, 0%, 98%)`    | Text/icon on primary                  |
| `--accent`             | `hsl(0, 0%, 96.1%)`    | `hsl(225, 55%, 22%)` | Hover/active highlights               |
| `--destructive`        | `hsl(0, 84.2%, 60.2%)` | `hsl(0, 84%, 60%)`   | Danger actions, delete                |

### Inputs & focus

| Token      | Light                | Dark                 |
| ---------- | -------------------- | -------------------- |
| `--border` | `hsl(0, 0%, 92.8%)`  | `hsl(225, 45%, 28%)` |
| `--input`  | `hsl(0, 0%, 89.8%)`  | `hsl(225, 45%, 28%)` |
| `--ring`   | `hsl(168, 74%, 42%)` | `hsl(168, 74%, 42%)` |

### Charts (categorical, for Recharts / SVG)

`--chart-1` … `--chart-5` (teal ramp: `hsl(168, 74%, 42%)`, `hsl(168, 60%, 35%)`,
`hsl(168, 50%, 28%)`, `hsl(180, 70%, 50%)`, `hsl(160, 65%, 38%)`).

### Sidebar

`--sidebar-background`, `--sidebar-foreground`, `--sidebar-primary`,
`--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` — a dedicated surface so
the navigation rail can differ from the main canvas (lighter or darker chrome).
Use `bg-sidebar`, `text-sidebar-foreground`, etc.

---

## 3. Brand palette (PHCCI)

The product brand palette. The primary is a **teal**; it is reused across
surfaces, focus rings, and charts so the whole UI feels cohesive.

| Name               | Hex                   | HSL                  | Notes                                      |
| ------------------ | --------------------- | -------------------- | ------------------------------------------ |
| Brand primary      | `#1FB382`             | `hsl(168, 74%, 42%)` | Buttons, links, active states, focus rings |
| Brand (chart ramp) | `#1FA06E` → `#185F45` | teal ramp            | `--chart-1…5`                              |
| Canvas (light)     | `#FFFFFF`             | `hsl(0,0%,100%)`     | App background                             |
| Ink (light)        | `#0A0A0A`             | `hsl(0,0%,3.9%)`     | Body text                                  |
| Canvas (dark)      | `#0B1435`             | `hsl(225,62%,10%)`   | Dark app background                        |
| Ink (dark)         | `#E9F0FA`             | `hsl(210,28%,95%)`   | Dark body text                             |

### Auth screens (fixed brand surface)

Auth screens use a **fixed** dark brand palette (not theme-switchable) so the
login/register experience is always on-brand. Tokens: `bg-auth-bg`,
`bg-auth-surface`, `text-auth-foreground`, `text-auth-muted`, `text-auth-accent`.

| Token                     | Value     |
| ------------------------- | --------- |
| `--color-auth-bg`         | `#0a1128` |
| `--color-auth-surface`    | `#131f42` |
| `--color-auth-foreground` | `#f4f6f9` |
| `--color-auth-muted`      | `#8c9a9e` |
| `--color-auth-accent`     | `#20e2cd` |

---

## 4. Typography & radii

- **Font stack:** `Instrument Sans` (brand font), falling back to
  `ui-sans-serif, system-ui, sans-serif`. Registered as `--font-sans` and applied
  by Tailwind's `font-sans` utility on `body`.
- **Radius scale:** seeded from `--radius: 0.5rem`; `--radius-lg`, `--radius-md`,
  `--radius-sm` derive from it (see `theme.css`).

---

## 5. Light / dark mode

Dark mode is **class-based** (mirrors Tailwind v3 behaviour):

```css
@custom-variant dark (&:is(.dark *));
```

- Adding the `.dark` class to `<html>` (or any ancestor) swaps the token palette.
- The app exposes **Light / Dark / System** via `use-appearance.tsx`, which:
    1. reads the saved preference (`localStorage['appearance']`),
    2. resolves `system` against `prefers-color-scheme`,
    3. toggles the `.dark` class on `document.documentElement`,
    4. listens for system theme changes while running.

### Replicating appearance handling

Copy `resources/js/hooks/use-appearance.tsx`, call `initializeTheme()` once at app
boot (before first paint, to avoid a flash), and use `useAppearance()` in a
settings UI. The exported `Appearance` type is `'light' | 'dark' | 'system'`.

---

## 6. Porting the theme to another project

`theme.css` is the portable artifact. To replicate the UI and color scheme:

1. **Copy the tokens** — copy `resources/css/theme.css` into the new project as
   `resources/css/theme.css`.
2. **Import it** — in the app stylesheet, import it ahead of app-specific CSS:
    ```css
    @import 'tailwindcss';
    @import './theme.css';
    ```
    (This also installs the `@custom-variant dark` and the Tailwind v4 border
    compatibility layer.)
3. **Add the Tailwind Vite plugin** — ensure `@tailwindcss/vite` is configured
   (this project wires it in `vite.config.js`).
4. **Wire appearance** — copy `resources/js/hooks/use-appearance.tsx` and call
   `initializeTheme()` at boot.
5. **Rebrand (optional)** — edit `--font-sans` (font) and the `--color-auth-*`
   values (auth palette) in `theme.css`. Update:
    - the brand primary `--primary` / `--ring` / `--chart-*` tokens, or
    - delete the auth block entirely if unused.
6. **Swap the logo** — replace `/phccilogo.png` references
   (`resources/js/components/app-logo.tsx`, auth layouts).

### What does _not_ port automatically

- App-specific overrides in `app.css` (Gantt/chart dark-mode fixes, native
  select/date-picker tweaks, calendar icon filters).
- The Radix/shadcn component layer (`resources/js/components/ui/`). The theme
  tokens are consumed by those components, but the components themselves must be
  copied or re-generated (e.g. via `shadcn add` with `cssVariables: true`).

---

## 7. Changing the scheme

Always edit **`resources/css/theme.css`** (never hard-coded colors in markup or
`app.css`). Then:

- Run `npm run format:check` / `npm run lint` on touched files.
- Run the production build to confirm the CSS compiles:
  `npm run build` (or `node node_modules/vite/bin/vite.js build`).
