# The Ultimate Guitar Masterclass

A self-contained guitar education site — single HTML file, no server required. Three roadmaps (Guitar & Musicianship, Live Performance, Production & Songwriting) rendered into one warm-themed app with a sidebar, table of contents, and per-section practice songs + affiliate gear.

## Build

Source content lives in `roadmap-*/README.md`. The single-file app is assembled with:

```bash
npm install   # marked (build-time only)
node build.js
```

The served artifact is the pre-built `index.html`. Deploys to Cloudflare via `wrangler.jsonc` (Workers Static Assets, directory `.`).
