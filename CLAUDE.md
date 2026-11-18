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

The owner wants many kinds of games over time: flipping and swiping cards, rolling dice (such as
Meyer), passing the phone round (such as a drawing game), and board games where pieces move
from square to square (such as Ludo). Shared pieces go in `src/ui/` and `src/lib/` so each new
game builds on them, and everything must stay smooth on a phone.

1. Done: Parkort, question cards for couples (`src/games/parkort/`).
2. Next: a math game. The tasks are generated, never stored: the operations (plus, minus,
   times, division), the range of the numbers and the school grade are chosen in setup, and the
   higher grades mix operations in one expression and add fractions, powers and parentheses.
   Every task has three answers to choose from, the wrong ones made from typical mistakes.
   Points and time per answer, so children can compete, with a winner at the end.
3. Shared engine as games need it: a setup screen, presets such as Arkade, Party and Rolig, a
   school grade that picks the settings, players and their names, turns, points, a timer and a
   winner screen.
4. Trivia for the car.
5. A separate, more intimate card game for couples. It never mixes with Parkort, and nothing
   about it may be reachable by the children; how it is kept apart is decided with the owner.

## Parkort

- Kind questions that get a couple talking about what matters in their everyday life, without
  anything intimate: that belongs in the separate game above.
- The cards are original, written in natural Danish, informed by research on couples'
  conversation (Aron's 36 questions, Gottman's Love Maps, Danish SNAK cards). Never copy text
  from commercial games. Each question is open, positive, specific, invites a story, and works
  for whoever answers it.
- `src/games/parkort/cards.ts`: 8 categories of 25 cards, at three levels (Let, Mellem, Dyb).
  A card's id is stored as progress, so it never changes; a new card takes the category's next
  unused number, and a removed card's number is not reused.
- Progress is kept on the phone: the cards talked about, the shuffled order, the chosen
  categories and the order mode (Blandet, or Let til dyb). The couple continues where they left
  off; a skipped card goes to the bottom; "Start forfra" asks first, then reshuffles.

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
  workflow runs: `npm run lint` (eslint with the React Hooks rules, and prettier's check),
  `npm run typecheck` (tsc, strict), `npm test` (vitest with jsdom and Testing Library) and
  `npm run build`.
- TypeScript is strict and reports 0 errors, as does eslint: no `@ts-ignore`,
  `@ts-expect-error`, `@ts-nocheck`, `eslint-disable` or `any`, and no rule turned off.
- The tests cover every line, branch, function and statement under `src/` except `main.tsx`;
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
- A pull request's text, when there is one, describes only its own change: what it does and how
  it was tested.
