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
- Build to current best practice, without shortcuts or workarounds. When something the owner
  asks for, such as an animation or a gesture, cannot be done cleanly, say so plainly and
  explain what it would cost, rather than building something fragile to get it working.
- Define a value once and use it everywhere it is needed: design tokens in `src/app.css`, motion
  in `src/ui/motion.ts`, the app's name, description and background colours in
  `src/appMeta.ts`, and each game's name and colours in `src/lib/games.ts`. Where best practice
  does not allow one place, say where the copy is and why.
- The games' text is calm and kind, in every language.

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
2. Next: a math game, "Regnespil", for one child alone or several taking turns.
   - Difficulty is set as a level, not a school grade; each level says roughly which grade
     ("ca. 2. klasse") as guidance only, based on what Danish schools teach when.
   - A level decides what the tasks hold (operations, number ranges, and for the higher levels
     mixed operations, parentheses, fractions and powers); "Tilpas" turns parts on or off for
     one child, such as no powers or parentheses.
   - Each player's level, sword and adjustments are saved on their profile (per player, not
     per game), and they continue there next time. Players together each get tasks at their
     own level, and their own sword's costs, on their turn. Grown-ups play too, decided by the
     owner: they start hard (level 13, the flame sword), children gently, so the children see
     the grown-ups struggle.
   - Tasks are generated, never stored, and come in short rounds; each answer shows at once
     whether it was right. Every task has three answers to choose from, the wrong ones made from
     typical mistakes.
   - How time, rounds, rewards and moving between levels are used follows research on what
     motivates children without making them anxious, and is decided with the owner.
3. A turn engine, shared by every turn-based game and built with the first one (the math
   game), so it is never unused:
   - One player is active at a time; "Færdig" passes the turn to the next, who becomes active.
   - Everything is drawn from the active player's point of view: their own hidden things (such
     as a hand of cards) face up, other players' face down or as a count, and the table for all.
   - Between turns: a game with hidden things always shows a cover, "Giv telefonen til <navn>",
     until that player taps "Jeg har fået den – vis mine kort"; a player who gets the phone
     without the cover knows someone looked. An open game (Ludo, the math game) shows a light
     "Nu er det <navn>s tur".
   - In board games each player has a seat, and the board turns with a gentle animation to
     face the active player.
   - The game is saved after every move; a game with hidden things always reopens on the cover.
   - The cover stops accidents and easy peeking, not a determined cheat at the same table.
4. Shared engine as games need it: a setup screen, presets such as Arkade, Party and Rolig, a
   school grade that picks the settings, players and their names, turns, points, a timer and a
   winner screen.
5. Trivia for the car.
6. A separate, more intimate card game for couples. It never mixes with Parkort, and nothing
   about it may be reachable by the children; how it is kept apart is decided with the owner.

## Parkort

- Kind questions that get a couple talking about what matters in their everyday life, without
  anything intimate: that belongs in the separate game above.
- The cards are original, written in natural Danish, informed by research on couples'
  conversation (Aron's 36 questions, Gottman's Love Maps, Danish SNAK cards). Never copy text
  from commercial games. Each question is open, positive, specific, invites a story, and works
  for whoever answers it.
- `src/games/parkort/cards.ts`: 8 categories of at least 25 cards, 217 in all, at three levels
  (Let, Mellem, Dyb). The cards were reviewed for overlap: no two cards may ask the same thing
  in other words, across categories too. Big decks hold 100–150 cards; grow it to fill themes
  that are missing, not to reach a number.
- A card's id is stored as progress, so it never changes. A new card takes the category's next
  unused number. A card whose question changes is taken out and added as a new card; the
  numbers taken out are listed in `retired` and never used again. Only a correction of wording
  keeps the number.
- When every chosen card has been talked about, the end screen suggests a new round some time
  later, as answers change over time, and "Bland og start en ny runde" reshuffles.
- Progress is saved the moment a card is turned: the card face up, the cards talked about, the
  cards put off, the shuffled order, the chosen categories and the order mode (Blandet, or Let
  til dyb). Reopened, the game offers "Fortsæt hvor I slap" or "Start forfra", which asks first.
- "Næste kort" (or throwing the face-up card right) puts the card away as talked about; "Tag den
  senere" puts it at the bottom of the whole pile, after every other card.
- "Forrige" (or throwing the face-up card left) only looks back at the cards put away, face up,
  and "Næste kort" goes forward through them again. Looking back changes nothing and is never
  saved: the game always reopens at the furthest card the couple reached. Changing the
  categories or order starts looking back afresh.

## Regnespil

- `docs/regnespil-design.md` is the game's whole design: what is decided, what is proposed,
  the fight engine for monsters and bosses, biomes, progression, and every idea the owner has
  raised, in a list kept as close to the owner's words as possible. The owner fears losing
  ideas: whenever the owner raises one, add it there in the same change, and move it to
  "Decided" (and into this file) when the owner says yes.
- The owner's design, from the start: the children cannot read yet, so the math drives a
  roguelite adventure told in pictures and sound. Fights are won by answering sums, with heart
  lives. A sword chosen at the start sets how forgiving it is (an easy sword allows many
  mistakes). Side monsters give helper crystals, one chosen of three; bosses end a stretch;
  chests hold three unique treasures to choose from. A branching map with random routes
  (forest, water, sky, lightning), some needing gear such as wings. Mishaps, such as a thief;
  shops and coins; four or five upgrade slots (such as an extra hit each round, or only two
  answers to choose from as a diamond upgrade). Modes: a mission, and a lightning mode on time.
- Time is optional and off by default. Answers show at once as right (green), close (yellow)
  or far off (red), always with the right answer. Siblings play together, not against each
  other.
- Fifteen levels (`src/games/regnespil/levels.ts`), as the owner asked the game to grow hard
  even for grown-ups: 1–8 from the table in `docs/regnespil-research.md` (`basic.ts`); 9–12
  through the school years with decimals, fractions, negative numbers, percent, powers and
  roots; 13 at upper-secondary level, 14 for grown-ups and 15 for masters (`harder.ts`).
  1–12 say roughly which grade, 13–15 whom they suit. Each task is made from its level's kinds
  of sums, mixed, with two wrong answers from typical mistakes (off by one or ten, the smaller
  digit taken from the larger, a neighbour in the table, the wrong operation, left to right
  instead of the order of operations, brackets forgotten, digits lined up wrong, tops and
  bottoms added alike, the sign, a power taken as times, a root as half). Answers below zero
  are offered only where negative numbers are taught. Fractions are exact (`values.ts`), so
  2/4 and 1/2 are one answer. `judge` calls a wrong answer close within a level's nearness:
  2 or a tenth of the answer, and for decimals and fractions 0.1 or a tenth.
- Sums are written as each language does (`text.ts`: `·`, `:` and "af" in Danish, `×`, `÷`
  and "of" in English, percent by Intl), with fractions stacked, powers raised, a negative
  number after an operator in brackets, a true minus sign, and lining figures, which children
  read more easily than the serif's old-style ones; and read in words to screen readers
  (`SumView.tsx`, `ValueView.tsx`).
- The game is built straight into the real game, in beta (owner's decision), stage by stage:
  `Regnespil.tsx` opens on the setup (`Setup.tsx`), where each player has their own level
  (`LevelStepper.tsx`) and sword (`SwordPicker.tsx`), suggested the first time from their age
  (`players.ts`: a child at the first level that suits their school grade, the wooden sword
  until the third grade and iron after, level 1 without a birthday; a grown-up level 13 and
  the flame sword), and "Til kamp!" leads to the first stage (`Fight.tsx`, place `kamp`).
- Difficulty is a sword, apart from the level, so a child who cannot read sees it: wooden
  (Let, one star), iron (Mellem) and flame (Svær), the pack's club, sword and red sword
  (`swords.ts`). It sets what a wrong answer costs and how tough monsters are.
- A fight (`battle.ts`): the hero has five hearts, counted in halves. A right answer is a
  stroke that takes one of the monster's lives; a close answer is parried and costs half a
  heart (nothing with the wooden sword); an answer far off lets the monster bump the hero for
  a heart (half with the wooden sword), so guessing never pays. The slime takes 2, 3 or 4
  strokes, by the hardest sword at the table. No death: out of hearts, the hero rests and
  tries again. The players take turns (`src/lib/turns.ts`, `src/ui/TurnBanner.tsx`: "Nu er
  det Idas tur"). The next sum comes by itself after a short pause (`fightPause`). The fight
  has its music (the pack's "17 - Fight"); the slime speaks in its own light voice before it
  bumps the hero; victory is a fanfare, a puff of smoke, coins and the hero cheering with a
  heart over his head, and then happy music. A fight is not yet saved while it is on.
- Agreed next, after the sounds: the party. Each player chooses a hero, suggested from the
  face on their profile, among figures the story will not use (not `Boy`, `Princess`,
  `Cavegirl`, `Villager3`, `EggBoy`, `EggGirl`, `Woman`, `Child`, `Hunter`, `MaskRacoon`,
  `Master`, `OldMan3`, `OldWoman`, `NinjaMageOrange` or `NinjaMageBlack`, all named in
  `docs/regnespil-story.md`). The heroes stand together on a full-width, taller stage; whose
  turn it is shows in the scene, the hero stepping forward with the player's name small over
  their head, and the hearts are part of the scene, not lines of text around it. The team
  shares its hearts, each player's sword still deciding what their own mistakes cost, and a
  monster has the lives of every player's sword added together, so each gets about as many
  strokes however many play.
- Agreed next, in order: a livelier fight (a "−1" over the monster, a slight shake when the
  hero is hit, a combo of three right for a power stroke, which only red breaks), then the
  monster walking towards the hero while a sum is thought over, at the child's own pace and
  at least 15 seconds, roaring and stepping back with the wooden and iron swords and striking
  only with the flame sword, so time stays off unless chosen; then bosses that fight back
  with the flame sword (a shield only a power stroke breaks, a warned attack, rage at half
  life), and monsters with more lives further on.
- The story is not decided: `docs/regnespil-story.md` is a researched proposal (building on
  H.C. Andersen's _Fyrtøjet_, public domain) for the owner to decide on. Only public-domain
  tales may give plot, names or characters; modern franchises only lessons in how to tell.
- The stage is the forest clearing (`forest.ts`, `clearing.ts`).

## Languages

- The app speaks Danish and English; more languages come later. `src/i18n/locales.ts` lists them.
  The language belongs to the app on this phone, not to a person: it starts as the phone's own
  and is chosen in the corner of the first screen ("Hvem spiller?") or in the settings
  (`src/ui/LanguageSelect.tsx`), saved on the phone under the key `sprog`. The page's `lang`
  follows it. The family shares one language, so there is no language per profile.
- Every text the app shows lives in a `text.ts` beside the screens that use it (`src/ui/text.ts`
  for words every screen uses, `src/family/`, `src/routes/`, and each game's own). The Danish
  messages set the shape, typed as `Translations<typeof da>`, so a message missing or with other
  arguments in another language fails the type check. Components read them with
  `useMessages(...)`; outside the `I18nProvider`, as in most component tests, it is Danish.
- Messages built from values are functions. Numbers, plurals, dates, relative times and language
  names come from `src/i18n/format.ts`, which uses the browser's Intl; never `String(n)` in text.
- A game's name and description are in `about` in `src/lib/games.tsx`, and `languages` says
  which languages its own content is written in; in any other, its screens are translated and
  its tile says the content is not. Parkort's questions, categories and levels are Danish only.
- The manifest, the page's title and `src/appMeta.ts` stay Danish: a web app manifest has one
  language. The app's name, Småspil, is the same in every language.
- A test checks that every message says something and that the English ones hold no Danish.

## The family and players

- The app opens on a start screen (`src/routes/Start.tsx`), like a game's title screen, as the
  owner wants it to feel like an app: its name, what it is for, the games' cards fanned out,
  the language in the corner, and "Opdatér" when a new version waits, so updating never needs
  anyone chosen. Whoever played last is greeted there, with "Fortsæt", which goes back where
  they were, and "Skift spiller". With no one to continue, "Hvem spiller?"
  (`src/family/WhoIsPlaying.tsx`) is asked there instead. The family is saved on the phone
  (`src/family/family.ts`, under the key `familie`). The first time, the first grown-up is
  made there, without being asked for a code.
- The app remembers who is playing and where (`src/family/remembered.ts`, saved under `sted`).
  A reload or an update stays on the screen it was on; opened from its start address, the app
  shows the start screen, and "Fortsæt" goes back. The owner decided this: being asked again
  and again was a nuisance. A grown-up behind the lock is remembered only for `lockedGrace`
  (30 minutes) after the app was last used, so a child opening it the next morning does not
  land on them. Choosing someone on the start screen goes home; "Skift spiller" forgets who
  played.
- A profile is a name, a colour, whether it is a grown-up or a child, and a picture: its
  initial, one of 30 faces from the Ninja Adventure pack (`src/family/faces.ts`, saved by
  id), or a photo from the phone, cut to a small square (`src/family/photo.ts`) and kept only
  on the phone. Profiles have no codes, and anyone may choose anyone. The owner decided this:
  codes per person were a nuisance. A profile may have a birthday, the full day as the owner
  chose (`src/family/age.ts`, kept only on the phone), from which every game may suggest where
  a player starts; it is always changed by hand.
- People are shown by name only, never with "Hej" in front: a greeting every time grows tiresome.
  At the top of the home screen the picture and name are the button that switches player.
- The grown-ups' lock (`src/family/AdultLock.tsx`) is off until a grown-up turns it on in the
  settings with one four-digit code, kept only as a salted hash. While it is on, the code is
  asked for before a grown-up is chosen on "Hvem spiller?"; children still switch freely.
  "Glemt koden?" lets a grown-up in with a sum too hard for children, to choose a new code or
  turn the lock off. Nothing prompts anyone to turn it on.
- Who is on the home screen decides what is offered. Each game says who may play it
  (`audience` in `src/lib/games.tsx`: `voksne`, `børn` or `alle`); children see and open only
  games for children and everyone. Grown-ups open the settings (`src/routes/Settings.tsx`) with
  the cog on the home screen: the language, the family (`src/family/ManageFamily.tsx`, where
  each person opens to change their name, colour and picture, or be taken out), the grown-ups'
  lock, the saved games and backups, "Om Småspil" (that it works offline, and the credits for
  the art and sound), and beta. Children never see the settings.
- Before a game, "Hvem er med?" (`src/family/ChoosePlayers.tsx`) chooses its players from the
  family, without codes, within the game's `players.min` and `players.max`; someone new can be
  added there, but a child can add only children, so no one gets a grown-up's profile that way.
  When there is no choice, as two grown-ups and Parkort, the game starts at once with them.
  Players are chosen so the same game can be played by different groups, each going on where
  they left off.
- A game's progress belongs either to the group (`players.progress: 'sammen'`), saved under
  one key per group whatever the order (`gameSaveKey`), or to each player (`'hver'`), saved
  under `playerSaveKey`. Parkort is for two grown-ups and saved per couple; the deck saved
  before players were chosen went to the first couple to play (`formerSaveKey`).
- The lock works inside the app only; choosing its code tells the owner about the phone's own
  Guided Access (iPhone) and app pinning (Android), which keep children in the app.

## Art, sound and music

- Material from others is kept under `assets/<pack name>/`, each pack with its licence file and
  a note of where it came from; only free material, such as CC0, is used, and its makers are
  credited in the app.
- The owner adds new material through `assets/inbox/` (uploaded on GitHub or with GitHub
  Desktop); it is checked, unpacked into its own folder and the inbox emptied again.
- Only what a game imports is published; the build leaves the rest out.
- `assets/ninja-adventure/`: the Ninja Adventure Asset Pack by Pixel-boy and AAA (CC0), the art
  and sound for the math game's adventure: 95 heroes, 66 monsters and 20 bosses as sprite
  sheets of 16-pixel frames with walk, idle and attack animations, items, weapons, effects,
  tiles and interface, plus 42 minutes of music and 150 sounds converted to AAC (`.m4a`).
  Pixel art is drawn with `image-rendering: pixelated` at whole-number scales.
- No speech at all, decided by the owner: the phone's voices were unnatural, and good AI voices
  are not free. The adventure tells its story with pictures and sound, so it works for a child
  who cannot read and in every language: characters babble in their own voices without words
  and show signs over their heads (!, ?, hearts, tears), speech bubbles hold pictures, music and
  effects set the mood, and whatever can be tapped shows itself (it glows or bounces, and a hand
  points the first time). Text is an extra layer: an "Aa" button in the game, which the child
  taps, shows the bubbles' text and is remembered for that child; a "?" always opens the rules
  in text and pictures. Text is otherwise kept to rules and short labels beside icons. Older
  children get depth from the play (bosses, routes, upgrades, the lightning mode), not text.
- The sound engine (`src/lib/sound/engine.ts`, one `sound` for the app) is Web Audio: music
  fades from one piece to the next, effects are fetched and decoded once, and babbling voices
  (`src/lib/sound/babble.ts`, voices in `voices.ts`) are syllables at a character's pitch and
  pace, made from tones in the phone: the owner heard both and chose tones over the pack's
  recorded voice clips. Sound starts only from a tap.
  An answer is told by a chime of tones (`src/lib/sound/chimes.ts`), the same on every page and
  a shade higher or lower each time, telling how far off it was, as the owner chose by ear: up
  and landing for right; a half step down for close; four notes stepping down, the last
  gliding, for far off; soft in tone, never a buzzer, and all about as loud, so none is missed.
- The sound is mixed, as the owner found the music drowned the sounds and their levels uneven:
  the pack's files were recorded at very different levels, so each plays at a gain from its
  measured loudness (`src/games/regnespil/sounds.ts`): the chimes lead, the fight's own sounds
  a little under, a victory above, and the music far under it all (about 20 dB), as the owner
  found the pack's chiptune music hard on the ears over many sums. The music steps back a
  further 6 dB while a sum waits for its answer and comes forward as it is answered
  (`focusMusic`), and dips under every chime (`ducking` in the engine). Music and effects each have a level from 0 to
  1, set on two sliders behind the speaker in a game's header (`src/ui/SoundMenu.tsx`),
  instead of a slider per sound, as games' accessibility guidelines recommend.
- The owner's choices by ear: a stroke's hit varies between four of the pack's hits, so it is
  never the same over and over (later each weapon and monster may have its own); a victory is
  the pack's "LevelUp2" jingle and then "20 - Good Time". Each monster speaks in a tone voice
  that fits its size (`voices.ts`): the slime light, a troll deep, a giant boss deeper still.
  The "Lyttetest" place (`Listening.tsx`, reached from the setup) compares the monsters'
  voices while they are chosen, and goes once they are.
- The music is the Ninja Adventure pack's, by its composer, not made here. Proposed, not yet
  decided: music whose mood follows the fight (calm, a boss's rage, the hearts nearly gone)
  without changing piece. The pack's music has no separate instruments to fade in and out,
  so it would be the one piece shaped as it plays (darker, brighter, faster), or music with
  separate parts found under a free licence.
  How loud music and effects play is saved on the phone under `lyd`. An iPhone's silent
  switch silences it all. While the app is out of sight (minimised or behind another), all
  sound is paused, not silenced (`src/lib/sound/visibility.ts`, `sleep` and `wake`), so the
  phone shows nothing playing and spends no battery on it; it plays on when the app is back,
  or with the next tap if the phone asks for one.

## Beta

- Games still being built are built straight into the app and tried there, as the owner
  decided, rather than on test pages: a game with `beta: true` in `src/lib/games.tsx` is
  offered only while "Beta" is on in the settings (`src/lib/beta.ts`, saved on the phone under
  `beta`, off until a grown-up turns it on), marked "Under udvikling" on its tile. Then the
  whole family may play it, children too. Regnespil is in beta.

## The puppet theatre

- A scene is data (`src/lib/scene/scene.ts`): a stage of 16-pixel tiles, ground tiles cut from
  a tileset, things such as trees standing on it, and figures from the pack's sprite sheets
  (four columns: down, up, left, right). `drawScene` works out what to draw at a moment, the
  ground first and then what stands, from the back to the front by where each stands.
- `src/ui/SceneCanvas.tsx` draws it on a canvas, enlarged by the largest whole number that
  fits the width, at the phone's own pixel density, so every pixel is sharp; it draws again
  only when the picture changes, to spare the battery, and stands still with reduced motion.
- The pack has no standing animation, so a standing figure breathes by rising one pixel for
  part of each breath (`breath` in `src/ui/motion.ts`). A slime bounces through its sheet's
  four rows. Figures act one act after another (attack on the sheet's fifth row with a lunge,
  hurt as a blink, cheer as a jump, vanish), show signs over their heads (the pack's
  `Ui/Emote` balloons), and effects such as a sword's sweep or a puff play over the stage.
  Times are on the page's clock, so a screen starts an act the moment it happens; with
  reduced motion nothing moves, but what vanished stays gone.

## Saving

- Every game saves through `useSaved` (`src/lib/useSaved.ts`) into IndexedDB
  (`src/lib/saves.ts`, with `idb`), writing with strict durability on every change; never
  localStorage, which is slower, smaller and no safer. A game's saved shape is checked when it
  is read, and an older shape is upgraded rather than thrown away. A change made before the
  save has been read wins over what is read.
- After each save, made from a tap, the app asks the browser to keep its saves
  (`src/lib/persistence.ts`): a browser tab asks only once ever, an installed app until granted.
  It is a request, never a promise, on every platform.
- On an iPhone, the Home Screen app is exempt from Safari's deletion of data unused for seven
  days, but keeps its own saves apart from Safari's. The home screen says so, and offers backups
  (`src/lib/backup.ts`): every save in one JSON file, which also moves games between browsers.

## The app shell

- Every screen has its own address in the location's hash (`src/lib/router.ts`): no hash the
  start screen, `#/` home,
  `#/indstillinger/...` the settings' pages, `#/spil/<game>` choosing players,
  `#/spil/<game>/<id>+<id>` the game with its players, and further parts for where in the
  game (`place` and `go` in `GameProps`; Parkort's table is `kort`). Reloading stays, and the
  phone's back gesture goes back a screen. A new player moves the address; moving about only
  notes it.

- A new version never reloads the app by itself: it waits, and the home screen offers
  "Opdatér" between games (`registerType: 'prompt'`), in a note that rises from the bottom
  over the page (`src/routes/UpdateToast.tsx`), so nothing on the page jumps when it comes.
  It is offered only on the start and home screens, never in a game, as the owner wants no
  interruption while playing, and "Senere" puts it off until the app is next opened. Browsers look for a new version only
  when a page loads, and phones keep the app running, so the app asks itself each time it comes
  back on screen and every hour (`src/lib/updates.ts`); the owner never has to close it.
- A game keeps the screen on while it is played with `useWakeLock` (`src/lib/wakeLock.ts`).
- The browser's install dialog is offered where there is one (`src/lib/install.ts`); elsewhere
  the home screen explains how to add the app. Browsers are never told apart by their name.
- The manifest has an id, scope, description, icons for any purpose and maskable, and phone
  screenshots for Chromium's install dialog; `public/screenshots/` is retaken when the look
  changes. Apple's old meta tags are not used: iOS 26 reads the manifest.
- Everything the games use, music and sounds too, is fetched when the app is first opened
  (Workbox precache), so every game works without the internet; updates fetch only the files
  that changed. "Om Småspil" says whether it is all fetched (`src/lib/offline.ts`). The owner
  chose this while the whole is small (about 3.5 MB now, 10–15 MB expected). If many games
  make it large (50+ MB), the owner wants to fetch only what is needed and the rest per game
  with a button: each game imports its own art and sound in its own lazy chunk, so its files
  can be told apart and cached on their own. A browser cannot reliably tell Wi-Fi from mobile
  data (Safari gives no way), so "only on Wi-Fi" cannot be offered.
- Music plays from memory: an iPhone's music player asks for a file in pieces, which the
  offline store cannot give, so a screen with music reads it in first
  (`sound.prepareMusic`).
- `.github/dependabot.yml` proposes updates to the npm packages and the actions once a week.

## Design

The owner wants it to look and feel modern, exclusive and cosy, like printed cards on a table
rather than a web page. It follows research on premium conversation decks and 2025–26 design:
paper and ink, one colour per game, a fine frame, a classic serif, a faint grain, and no
gradients, glow or glass.

- Light and dark themes follow the phone's setting. Every colour, space, corner, touch size and
  CSS duration is a token in `src/app.css`; colours give both themes at once with
  `light-dark()`. Styles use the tokens, not literal values. Printed cards stay paper in both.
- Type: EB Garamond for headings and card text, Cormorant SC for small-caps labels, Plus
  Jakarta Sans for the app's own text, all bundled with Fontsource so they work offline.
- Each game has a card colour and an accent for its fine lines (`colors` in
  `src/lib/games.tsx`), set as `--game`, `--game-accent` and `--on-game`; buttons and tiles use
  them. Whatever is chosen is marked with `--game-chosen`, the game's colour in the
  light theme and its accent in the dark, as a dark game colour vanishes on a dark page, and
  with a tick, so it never rests on colour alone. The home screen's tiles look like the backs of the game's cards.
- Cards are real card proportions and drawn as SVG in the card's own box, with sizes in `cqw`
  so they scale as one. Parkort's cards (`src/games/parkort/CardFaces.tsx`) are 7:12, like
  tarot cards: an aubergine back with a brass double frame, rays and a medallion with the
  emblem of two linked rings, the same either way up; a paper face with a double frame, the
  category in small caps, the question in EB Garamond, and the card's number and level.
- The grain is one small tiling image (`src/assets/grain.png`) blended with soft light: inside
  cards and tiles as a faint layer, and on the page itself in the body's own background, from
  `src/assets/grain-page.png`, the same grain already faded by `--grain-strength`. Never as a
  layer over the whole page: where an iPhone's browser draws its bars, such a layer has nothing
  to blend with and shows as a grainy band.
- Motion is springy and quick, and anything tapped gives way under the finger. Motion's
  settings are in `src/ui/motion.ts`. `prefers-reduced-motion` turns it off.
- A game's name that joins two words is shown with the first a little heavier (`stress` in its
  `about`, drawn by `src/ui/GameName.tsx`): "**Par**kort", so it is not read as parkour.
- Every screen of a game shows the game's icon in its header, and the players' pictures small
  and overlapping beside it (`src/ui/GameFrame.tsx`, given by the app around the game), so it
  is always clear which game is open and whose it is, even when the phone is picked up later.
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
