# Mermaid Vibe Editor

This app is built for "vibe coding" Mermaid flows with coding engines like Codex, Claude Code, Gemini CLI, Open Code, and similar tools, while live previewing changes in the browser.

It reads from `diagram.mermaid` in the project root and hot-reloads whenever that file changes on disk.

## Requirements

- Node.js 20+
- npm

## Run

```bash
npm install
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`).

## How it works

- The dev server watches `diagram.mermaid`.
- On file add/change/delete, it pushes an HMR custom event to the browser.
- The browser re-renders the SVG immediately.
- On first load, the app fetches `/__diagram-source` to render the current file state.

## Canvas controls

- **Scroll wheel:** zoom at cursor position.
- **Left-click + drag:** pan around the canvas.
- **Double-click:** reset view (scale and offsets).
- Zoom is unbounded in practice (only constrained to stay positive).

## File layout

- `diagram.mermaid` — source diagram to edit.
- `vite.config.ts` — watcher + snapshot endpoint (`/__diagram-source`).
- `src/main.ts` — rendering, zoom, pan, and live update handling.
- `src/style.css` — full-screen canvas styling.

## Commands

- `npm run dev` — start local development server.
- `npm run build` — typecheck and production build.
- `npm run preview` — preview production build locally.
- `npm run test` — run tests.
