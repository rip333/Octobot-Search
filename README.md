# Octobot Search

THE OCTOBOT!!

Octobot-Search is a Next.js + TypeScript web app that provides a searchable browser for card data powered by an external Cerebro API. The project includes the web UI, data-extraction tooling, and a couple of Photoshop automation scripts used to generate printed image grids.

---

## Table of contents

- [Features](#features)
- [Demo / Screenshots](#demo--screenshots)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Getting started (local development)](#getting-started-local-development)
- [Build & deployment](#build--deployment)
- [Data scripts](#data-scripts)
- [Photoshop scripts](#photoshop-scripts)
- [Routing & pages overview](#routing--pages-overview)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Features

- Searchable card browser UI built with Next.js + TypeScript
- Fetches card sets, packs and query results from Cerebro endpoints:
  - `https://cerebro-beta-bot.herokuapp.com/sets`
  - `https://cerebro-beta-bot.herokuapp.com/packs`
  - `https://cerebro-beta-bot.herokuapp.com/query`
- Static pre-rendering for common routes (Next.js `getStaticProps` / `getStaticPaths`)
- Tailwind CSS styling
- Vercel Analytics and Speed Insights integrated
- Small utility Python script to generate hero IDs JSON
- Photoshop automation scripts to assemble image grids for printing

---

## Demo / Screenshots

(You can add screenshots or a link to a deployed instance here.)

---

## Tech stack

- Next.js (pages directory)
- React + TypeScript
- Tailwind CSS
- Axios for HTTP requests
- Vercel Analytics & Speed Insights
- Python (utility scripts)
- Photoshop scripting (ExtendScript / .js for Photoshop)

---

## Repository structure (high-level)

- src/
  - pages/ - Next.js pages and dynamic routes
    - index.tsx - home page (loads sets & packs)
    - card/[id].tsx - card details page
    - cards/[filter]/[type].tsx - filtered result pages (dynamic)
    - rip.tsx - personal links page
    - _app.tsx - app wrapper (global CSS, analytics)
  - components/ - UI components (header, footer, results, etc.)
  - models/ - TypeScript models (Card, CardSet, CardPack, ...)
  - globals.css - global styles (fonts referenced)
- src/data/
  - extract-hero-ids.py - Python helper to fetch & write hero ids to JSON
- scripts/
  - champions-grid-*-fronts.js - Photoshop script to create front grids
  - champions-grid-*-backs.js - Photoshop script to create back grids
- tailwind.config.ts - Tailwind configuration
- LICENSE - MIT license

---

## Getting started (local development)

Prerequisites:
- Node.js (Recommended: Node 16+ or latest LTS)
- npm or yarn
- Optional: Python 3 for data scripts
- Optional: Photoshop for the scripts in `scripts/`

Install dependencies:

```bash
# using npm
npm install

# or using yarn
yarn install
```

Run the dev server:

```bash
npm run dev
# or
yarn dev
```

Open http://localhost:3000 in your browser.

Notes:
- The app fetches data from external Cerebro endpoints (the public URLs used in the code). If those endpoints are unavailable you will see the app's error/fallback behavior.
- The home page preloads sets & packs with `getStaticProps` and uses revalidation.

---

## Build & deployment

Build for production:

```bash
npm run build
npm run start
```

or with yarn:

```bash
yarn build
yarn start
```

This project is compatible with Vercel hosting and uses the Vercel Analytics and Speed Insights integrations present in `_app.tsx`.

---

## Environment & Configuration

This repository currently uses public API URLs inline in the code (e.g. `https://cerebro-beta-bot.herokuapp.com/...`). If you need to switch to a private or different Cerebro endpoint, consider:

- Adding an `.env.local` for runtime configuration
- Replacing inline URLs in `src/pages/*` with process.env variables, e.g.:

```ts
const API_BASE = process.env.NEXT_PUBLIC_CEREBRO_URL ?? 'https://cerebro-beta-bot.herokuapp.com';
```

Then use `NEXT_PUBLIC_CEREBRO_URL=https://your-api.example` in `.env.local`.

---

## Data scripts

- src/data/extract-hero-ids.py
  - A Python script that fetches hero data and writes `heroes.json`.
  - Run with Python 3: `python src/data/extract-hero-ids.py`
  - Inspect the script to adjust the API URL or output filename.

---

## Photoshop scripts

Located in `scripts/`:

- `champions-grid-*-fronts.js` and `champions-grid-*-backs.js` are ExtendScript/Photoshop automation scripts. They:
  - Prompt to select a folder of PNGs
  - Open a base PSD and lay out images in a grid for printing
  - Create a `print-files` output folder next to the selected images
- Usage:
  - Load the script into Photoshop's Scripts or run via File > Scripts > Browse...
  - Ensure the `baseFile` path inside the script points to a valid base PSD, or modify it to your local path.

---

## Routing & pages overview

Key pages and dynamic routes:

- `/` - Home page that lists card sets, packs, classifications and types (index.tsx).
- `/card/[id]` - Card details (src/pages/card/[id].tsx).
- `/cards/[filter]/[type]` - Filtered card listings (src/pages/cards/[filter]/[type].tsx).
- `/rip` - Personal links page for rip333.

Implementation notes:
- Data is fetched with axios using a `fetcher` helper throughout pages.
- Several pages use `getStaticProps` and `getStaticPaths` with revalidation periods (e.g., index uses `revalidate: 3000`, cards uses `revalidate: 604800`).
- The app shows a Loading component while data loads and a NoResults component when there are no results.

---

## Styling

- Tailwind is configured and used in components.
- Global fonts referenced in `src/globals.css` (e.g., `AvenirNextLTPro-Regular.otf`).

---

## Contributing

Contributions are welcome!

Suggested workflow:
1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes and add tests where applicable
4. Open a pull request describing the change

If you want, I can open a PR that adds this README for you.

---

## Known issues & TODO

- Consider moving API endpoints into environment variables for easier configuration.
- Add automated tests.
- Improve error UI and offline behavior when the Cerebro API is unavailable.
- Add screenshots/hosted demo link to README.

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Contact

Project maintained by Rip Britton (rip333). See the `/rip` page in the app for personal links and additional contact info.
