# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured.

## Architecture

This is a **Next.js 16 App Router** project (`src/app/`), not Pages Router.

- **Routing**: File-based via `src/app/` — add `page.js` files to create routes
- **Styling**: Tailwind CSS v4 — no `tailwind.config.js`; theme is configured inline in `src/app/globals.css`
- **Path alias**: `@/*` resolves to `./src/*`
- **React Compiler**: Enabled in `next.config.mjs` — avoid manual `useMemo`/`useCallback` unless necessary

Stack: Next.js 16, React 19, Tailwind CSS v4, ESLint 9 (flat config).
