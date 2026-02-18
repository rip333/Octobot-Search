# Octobot-Search Context

## Project Overview
Octobot-Search is a Next.js + TypeScript web application designed to provide a searchable browser for card data. It consumes data from an external API (Cerebro) and presents it in a user-friendly interface. The project also includes utility scripts for data extraction (Python) and image processing for printing (Photoshop/ExtendScript).

## Key Features
- **Card Browser:** specialized UI for browsing and searching card sets and packs.
- **Cerebro API Integration:** Fetches data from `https://cerebro-beta-bot.herokuapp.com`.
- **Static Generation:** Utilizes Next.js `getStaticProps` and `getStaticPaths` for performance.
- **Styling:** Built with Tailwind CSS.
- **Analytics:** Integrated with Vercel Analytics and Speed Insights.
- **Automation:** Includes Python scripts for data extraction and Photoshop scripts for print layout.

## Tech Stack
- **Framework:** Next.js 14 (Pages directory)
- **Language:** TypeScript, Python (scripts), ExtendScript (Photoshop)
- **Styling:** Tailwind CSS, PostCSS
- **State/Fetching:** SWR, Axios
- **Deployment:** Vercel

## Key Directories & Files
- `src/pages`: Next.js routes and page components.
- `src/components`: Reusable UI components.
- `src/cerebro-api.ts`: API interaction layer.
- `src/models`: TypeScript interfaces and type definitions.
- `scripts/`: Photoshop automation scripts (`.js` for ExtendScript).
- `src/data/`: Data utility scripts (e.g., `extract-hero-ids.py`).

## API Endpoints (Cerebro)
- Base URL: `https://cerebro-beta-bot.herokuapp.com`
- `/sets`: Retreives card sets.
- `/packs`: Retrieves card packs.
- `/query`: Search endpoint for cards.

## AI Notes
- **Routing:** This project uses the older Next.js `pages` router, not the `app` router.
- **Data Fetching:** Look for `getStaticProps` in pages for build-time fetching and `SWR` or `useEffect` for client-side fetching.
- **Styling:** Tailwind classes are used throughout. Ensure consistency when adding new UI elements.
- **Automation:** When working on `scripts/`, remember they are for external tools (Photoshop) or pre-processing (Python), not part of the Next.js runtime.

## Current status
- Active development/maintenance.
