# Fix: Missing <html> and <body> tags

## Cause
Next.js requires `app/layout.tsx` (root) to define <html> and <body>.
When /dashboard was added outside [lang], a root layout was needed.
If root layout is missing those tags, or [lang] still owns them alone, you get this error.

## Apply

1. Copy root layout (HAS html/body):
   src/app/layout.tsx  <- from this pack app/layout.tsx

2. Replace [lang] layout (NO html/body, providers only):
   src/app/[lang]/layout.tsx  <- from this pack app/[lang]/layout.tsx

3. Dashboard layout (ThemeProvider + Redux):
   src/app/dashboard/layout.tsx  <- from this pack

4. Restart:
   rm -rf .next && npm run dev
