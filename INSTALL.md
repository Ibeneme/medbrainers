# MedBrainers update: how to install (2 minutes)

1. Stop the dev server (Ctrl+C).
2. In your project, DELETE the whole `src` folder (this removes the old files that cause the errors).
3. Copy these from this zip into your project root:
     - `src/`            (replaces the one you deleted)
     - `scripts/`
     - `package.json`    (replace yours; it only adds the auto-cleanup scripts)
   Keep your own `public/`, `node_modules/`, `.env`, `next.config.ts`, etc.
4. Delete the `.next` folder, then run:  npm run dev

Afterwards `src/app` must contain only: [lang]/  globals.css  robots.ts  sitemap.ts
(no src/app/layout.tsx, page.tsx, pricing, solutions or (auth)).

## What was fixed
- Duplicate navbar/footer and the "blocking-prerender-metadata-runtime" error (old src/app/layout.tsx + old pages removed)
- Language switcher: active language shown, full page load on switch (fixes hydration error), navbar + footer follow the language
- Shared flag icons (unique ids), "Select Language"/"All rights reserved." translated
- ThemeProvider no longer renders nothing on the server
- Footer year no longer breaks prerender (CurrentYear component)
- Invalid `key=<T>..</T>` in forgot-password.tsx and get-started.tsx
