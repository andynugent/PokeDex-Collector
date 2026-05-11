# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A standalone single-file HTML app (`index.html`) for a 10-year-old to track his Pokémon card collection. No build step, no dependencies to install — just open `index.html` in a browser (Chrome on Android works great).

## Running the app

Open `index.html` directly in a browser. No server required. To test on Android, copy the file to the device and open it in Chrome.

## Architecture

Everything lives in `index.html` — inline CSS, then React loaded from CDN, then the app as a `<script type="text/babel">` block compiled in-browser by Babel Standalone.

**Key sections inside the script block (in order):**

1. **`GENERATIONS` constant** — hardcoded Gen I–IX data (dex ranges, species counts from Wikipedia). Used to map a Pokédex number to its generation.
2. **`SETS` constant** — hardcoded TCG set list (Scarlet & Violet, Sword & Shield, Sun & Moon) with set IDs matching the Pokémon TCG API. `SERIES_COLORS` maps series names to gradient colors.
3. **Storage** — `localStorage` under key `pokecollection_v2`. `loadCollection()` / `saveCollection()` are the only persistence functions.
4. **`searchCards(query, setId)`** — calls `https://api.pokemontcg.io/v2/cards`. Fetches `nationalPokedexNumbers` alongside card data so generation can be assigned at add-time.
5. **`fetchDexNumbers(cardIds)`** — batch API lookup used only during migration (see below).
6. **`App` component** — single root component; all state lives here. Tabs: `browse`, `sets`, `mycards`, `gens`.
7. **Migration `useEffect`** — runs once on mount; finds cards where `dexNumber === undefined` (saved before dexNumber was added) and backfills from the API in batches of 20.

## Data model

Each collected card stored in the collection object (keyed by card ID):

```js
{
  id, name, set, setName, number, rarity,
  dexNumber,   // null for Trainer/Energy, number for Pokémon, undefined = needs migration
  generation,  // 1–9 or null
  added        // timestamp
}
```

## JSON export format

Exported file is backward-compatible — old importers ignore unknown top-level keys:

```json
{
  "exported": "<ISO timestamp>",
  "totalCards": 42,
  "setProgress":       [{ "set": "...", "owned": 12, "total": 191, "percent": 6 }],
  "generationStats":   [{ "gen": 1, "species": 5, "totalCards": 7, "variants": 2 }],
  "cards": [{ "id": "...", "name": "...", ... }]
}
```

Keep this format stable. New top-level keys are fine; removing or renaming existing ones is a breaking change.

## Key design constraints

- **Mobile-first**: max-width 480px, large tap targets, sticky header + tabbar.
- **No API key required**: the Pokémon TCG API (`api.pokemontcg.io/v2`) works unauthenticated (rate-limited but sufficient).
- **No Trainer/Energy dex numbers**: these cards have no `nationalPokedexNumbers`; store `dexNumber: null` so the migration won't re-fetch them.
- **Generation counts unique species** (not total cards): 3 Pikachu cards = 1 species toward Gen I progress.
