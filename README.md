# Octobot Search

THE OCTOBOT!!

Octobot-Search is a Next.js + TypeScript web app that provides a searchable browser for card data powered by an external Cerebro API. The project includes the web UI, data-extraction tooling, and a couple of Photoshop automation scripts used to generate printed image grids.

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

## Tech stack

- Next.js (pages directory)
- React + TypeScript
- Tailwind CSS
- Axios for HTTP requests
- Vercel Analytics & Speed Insights
- Python (utility scripts)
- Photoshop scripting (ExtendScript / .js for Photoshop)

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

## Contact

Project maintained by Rip Britton (rip333). See the `/rip` page in the app for personal links and additional contact info.
