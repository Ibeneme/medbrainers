# Fix /dashboard 404

## Cause
`src/proxy.ts` rewrites every path to /en/... 

So /dashboard became /en/dashboard internally, but your pages are at:

    src/app/dashboard/

not

    src/app/[lang]/dashboard/

Next could not find the page -> 404.

## Fix steps

1. Replace src/proxy.ts with proxy.ts from this folder (skips /dashboard rewrite).

2. Keep pages at src/app/dashboard/ (copy app/dashboard from this pack if needed).

3. If Next says missing root layout, copy app/layout.tsx into src/app/.

4. Restart cleanly:

    rm -rf .next && npm run dev

5. Open http://localhost:3000/dashboard

Also update ConditionalLayout so navbar/footer stay hidden on /dashboard.
