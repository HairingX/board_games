# Conventions for this repository

Small offline-first games played in a web browser on a phone: question cards for couples,
trivia for the car, and the like. Served as static files by GitHub Pages and installable as a
Progressive Web App, so every game works without a connection once it has been opened.

## Authorship

- Nothing in this repository, its history or on GitHub names the assistant or the tool that
  helped write it: no `Co-Authored-By` or session trailers in commit messages, no "Generated
  with" lines or footers in pull requests, issues or comments, no assistant names in branch
  names, files, code, comments or documentation. Commits are authored as the owner.

## Working with the owner

- Talk with the owner in Danish. What is committed stays in English, as the conventions say.
- This file is where anything every session must know is written down: a decision the owner
  has made, a rule, or how something is set up outside the code. When the owner decides
  something that lasts, add it here in the same change, so the next session starts from it.

## How it is set up on GitHub

- The repository is public, so GitHub Pages can publish it on a free account. Pages' source
  is "GitHub Actions": the workflow builds and publishes, and built files are never committed.
- The app is live at `https://hairingx.github.io/board_games/`.
- Only `.github/rulesets/branch-names.json` is imported as a ruleset.

## Plan

1. The game engine every game shares: a setup screen built from each game's settings, presets
   such as Arkade, Party and Rolig, a school grade that picks settings for the children,
   players and their names, turns, points, time per answer, a winner screen, and a card that
   flips when tapped.
2. A math game: the operations, the range of the numbers and the grade chosen in setup, one to
   three answers to choose from, points and time per answer.
3. Question cards for couples, and trivia for the car, with the questions in data files.

The framework is under review: Svelte 5, as now, or React with Motion for gesture-driven
animation. Decide it with the owner before the game engine is built.

## How it is built

- Svelte 5 and TypeScript, bundled by Vite into one single-page app. `vite-plugin-pwa` makes it
  installable and precaches every file, so all games work offline once the app has been opened.
- The app is served from `/board_games/` (Vite's `base`). Screens are addressed by the location
  hash (`#/spil/<id>`), so GitHub Pages needs no server-side routing.
- Each game is registered in `src/lib/games.ts` and loaded on demand from its own module.
- `.github/workflows/pages.yml` runs lint, type check, tests and build on every push and pull
  request, and publishes `dist/` to GitHub Pages from `main`.

## Design

The owner wants it to look and feel modern, like a polished app rather than a web page.

- Light and dark themes follow the phone's setting; every colour is a custom property in
  `src/app.css`, set for both themes.
- Type: Bricolage Grotesque for headings, Plus Jakarta Sans for text, both bundled with
  Fontsource so they work offline.
- A soft, light background with faint colour glows; each game has its own two-colour gradient
  (`colors` in `src/lib/games.ts`) on large, rounded tiles with frosted-glass details.
- Motion is springy and quick: elements rise in, and anything tapped gives way under the
  finger. `prefers-reduced-motion` turns it off.
- Large touch targets, no hover-only behaviour, and room for the phone's safe areas.

## Conventions

- npm installs exactly what the committed `package-lock.json` locks: `npm ci`. The scripts the
  workflow runs: `npm run lint` (eslint and prettier's check), `npm run typecheck`
  (svelte-check, strict), `npm test` (vitest with jsdom) and `npm run build`.
- TypeScript is strict and reports 0 errors, as does eslint: no `@ts-ignore`,
  `@ts-expect-error`, `@ts-nocheck`, `eslint-disable` or `any`, and no rule turned off.
- The tests cover every line, branch, function and statement under `src/` except `main.ts`;
  vitest fails below 100%. Every problem found gets a test that fails without the fix.
- All documentation, comments and commit messages are in English. The games' own text is in
  Danish.
- No real IP addresses, hostnames, serial numbers, email addresses or credentials in tracked
  files.

## Branches and pull requests

- During initial development, changes are pushed directly to `main`; never force push. The
  ruleset in `.github/rulesets/main.json`, which takes changes to `main` only through pull
  requests, is kept for later and is not imported yet.
- Name every branch by the kind of change; `.github/rulesets/branch-names.json` refuses any
  other name. `feature/<what>` for a new game or what a player sees, `fix/<what>` for a bug,
  `docs/<what>` for documentation, and `chore/<what>` for CI, tooling, anything that stays in
  the repository.
- A pull request's text, when there is one, describes only its own change: what it does and how it was tested.
