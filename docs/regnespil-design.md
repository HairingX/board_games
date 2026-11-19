# Regnespil: the game design

The whole design of the math game's adventure in one place: what is decided, what is proposed,
and every idea the owner has raised, so nothing is lost between sessions. `CLAUDE.md` holds the
decisions in short; this document holds the thinking behind them and the ideas still open.
Research on what Danish schools teach and on what motivates children is in
`docs/regnespil-research.md`; the story proposal is in `docs/regnespil-story.md`.

Each part is marked **Decided** (the owner has said yes; also in `CLAUDE.md`), **Proposed**
(written up, waiting for the owner), or **Idea** (raised, not yet worked out).

## 1. What the game is for

- **Decided.** The sums are the point; the adventure is the reason to do them. A child should
  look at a sum and want to solve it, because of what happens when they do.
- **Decided.** It must grip children up to about the fifth or sixth grade, and work for a child
  who cannot read: everything that matters is told in pictures, sound and colour; text is an
  extra layer ("Aa"), and the rules open in text and pictures ("?").
- **Decided.** Siblings play together, not against each other. Grown-ups play too, at a hard
  setting, so children see them struggle.
- **Decided.** Calm and kind: no death, no game over, mistakes cost a little and always show the
  right answer. Time is off unless chosen.

### Where the eyes are

The owner's observation, and the rule that follows from it:

- Between sums, the children watch the scene: the hero steps forward, strikes, the monster
  answers. This is where the spectacle belongs.
- When a sum appears, their eyes go to the sum. Nothing there may pull at their attention
  (no animation, no moving numbers), but it must say **why** this sum matters right now: what
  happens if it is right, and what if it is wrong.
- **Decided and built** (the owner chose it from a mock-up). The sum sits in a battle panel
  whose tab says what the player is doing: "Angreb" (orange, the player's own weapon) when it
  is their turn to strike. **Proposed:** "Forsvar" (blue, a shield) when the monster has
  announced an attack. Under the tab, the stakes as pictures: ✓ the player's
  own weapon hitting the monster, ✗ a heart with "−½" or "−1". A mock-up was shown to the owner;
  the music steps back while a sum waits (decided, built).

## 2. Motivation, from research

From `docs/regnespil-research.md` and the wider literature on games for learning:

- **Self-determination theory** (Deci and Ryan): children keep playing when they feel
  _competent_ (sums at their level, visible progress), _autonomous_ (real choices: which road,
  which treasure, which upgrade) and _related_ (playing together). Every system below should
  feed one of these three.
- **Flow**: challenge just above skill. About 80–90 % right is a good target. The level per
  child and the sword per child keep each player in their own band.
- **Feedback**: immediate, with the right answer, never shaming. Done (green, yellow, red, the
  chimes).
- **Rewards**: small, tied to the play, never bought with money. The research warns against
  streaks that can be lost and loot that feels like gambling. Where the owner's design has a
  combo or coins, they are kept gentle (see section 9, open decisions).
- **Novelty**: something must happen in every fight. The owner asks for one or two events per
  fight that change it, so the children stay glued to the screen. This is the job of the
  monster engine below.

## 3. The shape of a run

- **Decided (owner's design).** A run is a mission through a branching map. Each node is one
  of: a fight with a common monster, a stronger monster, a chest (three unique treasures, one
  chosen), a shop (coins from the run), a mishap (such as a thief), a rest, and at the end of
  each stretch a boss.
- **Decided.** Roads fork, and some need gear: wings for the sky, a boat for water, and so on.
  Not every road can be taken on the first run, which gives a reason to come back.
- **Idea (owner).** Biomes: forest, water, sky, lightning, lava, and more. About ten biomes,
  each with about ten bosses, makes about a hundred bosses; together with many common monsters,
  the game keeps feeling new.
- **Proposed.** A biome is data: its tiles and stage, its music, its common monsters, its
  bosses, the gear it needs to enter, and one rule of its own that colours every fight there
  (water: the tide rises and falls; lava: the floor is hot every few turns; sky: the wind pushes;
  snow: slippery, a missed stroke slides; cave: dark until a light is lit). See section 6.

## 4. Progression

Two kinds, never mixed up:

- **The math level** (1–15, per child, decided). It changes only by the child's own choice or,
  later, a suggestion when they get nearly everything right for a while. It never depends on how
  far the adventure has come.
- **The adventure's progress.** **Idea (owner).** Finishing the game takes the player to the
  next world tier ("next level" of the adventure), which brings something new: better weapons,
  new upgrades, roads that were closed; and the enemies have more life, while the heroes hit
  harder thanks to what they won. **Proposed.** Within a run: crystals from side monsters (one
  of three chosen), treasures from chests, coins for the shop, and four or five upgrade slots
  (owner's examples: an extra hit each round; only two answers to choose from, a diamond
  upgrade). Across runs: what is unlocked stays (weapons, heroes, roads); what was found in a
  run is that run's alone, so every run starts fresh but not from nothing.

## 5. The fight engine

The owner wants an engine ready for every special case: monsters that behave differently, that
change as they lose life, and that weigh what to do rather than repeat one move. This is the
proposed structure.

### 5.1 Principles

- **Rules apart from drawing.** As `battle.ts` already is: the rules are pure functions from a
  fight's state and an answer to the next state and a list of events. The scene, the sounds and
  the music only show the events. This keeps the rules testable and every fight replayable.
- **A seeded random source** for every choice a monster makes, so a fight can be repeated in a
  test, and bugs can be found.
- **Monsters are data, not code.** A monster is a short description built from a shared library
  of moves, conditions and phases. A hundred bosses means a hundred descriptions, not a hundred
  programs.
- **Telegraph before acting.** A monster shows what it will do next (a sign over its head, a
  sound) before the sum it applies to, so the stakes in the battle panel are always true, and a
  child can see it coming. Fair, and exciting.
- **At least one moment per fight.** Every monster has at least one thing that changes the fight
  (a phase, a special move); a boss has two or three. The engine can check this when monsters
  are written.

### 5.2 A turn

1. The monster chooses its next action and announces it (intent shown over its head).
2. The battle panel shows the active player's sum, with "Angreb" or "Forsvar" and the stakes,
   from that intent.
3. The player answers. The answer resolves: a stroke, a parry, a dodge, a hit.
4. The monster carries out its action, as changed by the answer (a dodged blow misses).
5. Triggers run: a phase reached at a share of its life, a counter reaching its turn, an object
   on the stage used up. Events go to the scene and the sound.
6. The turn passes to the next player.

### 5.3 What a monster is made of

- **Stats**: lives (scaled by the team's swords and the world tier), how hard it hits.
- **Moves**: from the library, each with its effects and what it shows. Examples:
  - _strike_: hits next turn; a defence sum avoids it.
  - _heavy strike_: two turns of wind-up, warned with "!"; hits for more.
  - _burrow_ (owner's example): digs down, can't be hit for a turn or two, pops up somewhere and
    hits one of the heroes.
  - _eat berries_ (owner's example): walks to a berry bush on the stage and heals; the bush has
    a few berries and grows them back every few rounds.
  - _shield_: blocks strokes until a power stroke (combo) breaks it.
  - _fetch a weapon_ (owner's example): hides behind a tree and comes back with a spear, hitting
    harder from then on.
  - _call help_: brings a small monster that must be dealt with too.
  - _steal_ (the thief): takes a coin and runs; caught with a quick right answer.
  - _dodge_, _taunt_, _roar_ (scares the music up for a moment), _sleep_ (an easy turn).
- **Behaviour**: how it chooses among its moves. **Proposed: utility scoring**, the method many
  modern games use for creatures that weigh choices. Each move gets a score from the situation,
  the highest score wins, with a little randomness so it is not predictable. The owner's berry
  example as scores:
  - _attack_: a steady base score.
  - _eat berries_: zero at full life, rising steeply as life falls (life lost, squared), lowered
    each time it has eaten recently, and zero when the bush is empty. So a monster at full life
    never eats, a wounded one eats once or twice, then attacks again, as the owner described.
  - _burrow_: high once every few turns, never twice in a row.
- **Phases**: at shares of its life (such as two thirds and one third) a monster changes: new
  moves, new stats, a new look (bigger, angrier), a new music mood. The owner's examples: it gets
  harder to beat at a certain life; it runs behind a tree and draws a spear.
- **Reactions**: things that happen on events: on being hit twice in a row it gets angry; on a
  red answer it laughs; every fifth turn it calls help.

### 5.4 Stage objects

The stage holds things the fight can use: a berry bush, a tree to hide behind, a rock to burrow
under, a puddle that makes a slime bigger. They are part of the scene data, with their own state
(berries left), so monsters' moves can refer to them.

### 5.5 Difficulty knobs

- **Per player**: the sword (what that player's mistakes cost, decided) and the math level.
- **Per team**: shared hearts; monster lives from every player's sword added together (decided).
- **Per world tier**: monsters' lives and hits up, heroes' upgrades stronger.
- **Flame sword only** (decided): the monster walking towards the hero while a sum is thought
  over, at the child's own pace and at least 15 seconds, striking when it arrives; bosses that
  fight back (shield, warned attack, rage at half life). With the wooden and iron swords the
  walking monster roars and steps back.

### 5.6 How a boss reads as data (sketch)

```ts
const berryTroll: MonsterDefinition = {
  sprite: 'Boss/GiantRacoon',
  voice: 'troll',
  lives: 6,
  moves: ['strike', 'heavyStrike', 'eatBerries'],
  behaviour: { strike: base(3), heavyStrike: every(3), eatBerries: hungerWhenHurt({ max: 2 }) },
  phases: [{ atLife: 1 / 2, become: { add: ['fetchSpear'], hits: 2, music: 'rage' } }],
  stage: { objects: [{ kind: 'berryBush', berries: 3, regrowEvery: 4 }] },
};
```

### 5.7 Generated monsters and bosses

**Proposed (owner's idea).** Monsters and bosses are not all written by hand: the game puts
them together from pools, so two runs never feel the same.

- **Families, written by hand.** A family is a kind of creature: slime, wolf, troll, bat, frog,
  dragon and so on. It says what the creature _is_, as tags: its body (`small`, `big`, `giant`),
  how it moves (`hops`, `runs`, `flies`, `swims`, `burrows`), what it is made of or carries
  (`slime`, `fire`, `ice`, `water`, `plant`, `stone`, `metal`), its sprite, its voice, and
  which biomes it lives in. Families are few (perhaps thirty) and carefully made.
- **Moves, phases and quirks, from pools.** Every move, phase and special behaviour in the
  library says what it needs, also as tags: _lava spit_ needs `fire`; _dive from the sky_ needs
  `flies`; _burrow_ needs `burrows`; _eat berries_ needs a berry bush on the stage; _grow_ needs
  `slime`. A generated monster may only take what its family's tags allow, so a slime never
  spits lava and a wolf never flies, as the owner asked. Some tags can be given by the biome
  (a slime in the lava world is a `fire` slime, and then may spit lava), which multiplies the
  variety without nonsense.
- **A budget, so it is fair.** Each move and phase costs points by how hard it makes the
  fight; a common monster has a small budget, a side boss more, a biome's end boss most, and
  the world tier raises it. The generator spends the budget, so every generated monster is about
  as hard as its place in the run should be, never a surprise wall for a small child.
- **Rules every generated monster must pass**: at least one moment that changes the fight
  (two or three for a boss), every attack announced before it lands, at least one weakness the
  children can see, and nothing it does may make a child lose more than the sword allows.
- **Names from two pools** (owner's example: "Slimy Bob", "Hulking Wolf"), per language and
  per family, silly and kind, never frightening: a first part that describes (_Slimede_,
  _Brølende_, _Søvnige_, _Pjuskede_, _Glubske_) and a second that names (_Bob_, _Bertil_,
  _Ulven_, _Klatten_). Alliteration is preferred when it can be had (_Brølende Bjørn_, _Sure
  Snegl_), as children like the sound. A name is made in each language from the same seed, so
  the same monster has a fitting name in Danish and English rather than a translation.
- **One seed per run.** Everything is drawn from a seeded random source, so a run can be
  reopened the same, a bug can be replayed, and a fun run could later be shared.
- **Handmade where it matters.** Story bosses (chapter ends, the story's own characters) are
  written by hand and only varied a little; the generator fills the roads between them.

## 6. Biomes and the cast

**Proposed.** About ten biomes, each with a rule of its own, its music and its monsters. What the
Ninja Adventure pack has (66 monsters, 20 bosses, tilesets for forest, field, water, desert,
dungeon, relief and an abandoned village) covers most of them; the rest need more free art.

| Biome             | Its rule                               | Needs           | From the pack                                             |
| ----------------- | -------------------------------------- | --------------- | --------------------------------------------------------- |
| Forest            | berry bushes, trees to hide behind     | –               | Slime, Mushroom, Mole, Butterfly; GiantSlime, GiantBamboo |
| Meadow and farm   | a scarecrow helps or hinders           | –               | Mouse, Snake, Larva; GiantRacoon                          |
| Lake              | the tide rises and falls               | a boat          | Axolot, Fish, Kappa, Octopus; GiantFrog, Squid            |
| Cave              | dark until a light is lit              | a lantern       | Bat, Spider, Skull, Mollusc; DemonCyclop                  |
| Desert            | sand sinks the slow                    | –               | Lizard, Reptile, Snake; GiantSpirit                       |
| Mountain and snow | slippery: a miss slides                | warm boots      | Bear, Beast, Owl; Tengu                                   |
| Lava              | the floor is hot every few turns       | a fire cloak    | Flam, Dragon; GiantFlam, DragonGreen                      |
| Sky               | the wind pushes                        | wings           | Owl, Butterfly, Bat; DragonBlue                           |
| Storm             | lightning strikes at random, both ways | a lightning rod | Spirit, Eye; GiantRedSamurai                              |
| Ruins             | traps and old guardians                | a key           | Cyclope, Skull, statue figures; GiantBlueSamurai          |

A hundred bosses from twenty boss sprites: a common monster drawn two to four times larger
becomes a boss (the pack's pixel art scales by whole numbers), colour variants are made by
shifting a sprite's palette, and above all the bosses differ by their moves, phases and stage
objects, which the engine makes cheap to vary. More free art packs can be added through
`assets/inbox/`.

## 7. The fight screen

- **Decided (owner).** The scene fills the full width and more of the height; the hearts, the
  monster's life and whose turn it is are part of the scene, not lines of text around it.
- **Decided and built**, as in the mock-up the owner liked, then changed on the owner's word:
  a top bar outside the scene, framed in the biome's look (wood in the forest), with the way
  back, the speaker, and what the heroes fight: its portrait and a big life bar in pieces that
  shake and break off at each stroke. No place's name: a child does not care what an area is
  called in a fight. The hearts and the active hero's name plate lie in the scene; the battle
  panel below, the answers low for the thumbs. On a low phone the scene gets smaller.
- **Idea (owner).** On the road between fights, the top bar can show how far the heroes have
  come and how much is left of the stretch, for the satisfaction of progress.
- **Decided (owner).** The party: each player chooses a hero among figures the story will not
  use; the heroes stand together; the team shares its hearts.
- **Idea (owner).** A livelier fight: a "−1" over the monster, a slight shake when a hero is hit,
  a power stroke after three right in a row.

## 8. Sound and music

- **Decided and built.** The mix, the chimes, the sliders, music stepping back while a sum
  waits, all sound paused while the app is away. See `CLAUDE.md`.
- **Idea (owner).** Each weapon and each monster has its own sounds; each monster its own voice
  by size (slime light, troll deep, giant deeper; built for the slime).
- **Idea (owner).** Music whose mood follows the fight without changing piece: calm at first,
  wilder when a boss rages, desperate when the hearts are nearly gone, and swelling just before
  the monster comes at the hero, for a "wow". **Proposed.** The pack's music is one finished mix
  without separate instruments, so: shape the one piece as it plays (darker, brighter, faster),
  and look for free music made in separate parts that can be faded in and out.

## 9. Text that children can read

- **Raised by the owner.** The text is not pretty and not easy for a child to read; it may be
  too small.
- **Proposed.** In the game, text a child reads is larger: at least 18 px for anything to read,
  20–24 px for labels on buttons and tabs, and the sums as large as now. The game's text uses a
  typeface made for children who are learning to read, with the one-storey "a" and "g" they
  learn in school, such as Andika (SIL, free under the Open Font License, with æ, ø and å). The
  app around the games keeps its printed-card look. The pack's pixel font is used only for a
  short decorative word, if at all, as it draws some letters poorly. To be shown to the owner
  before it is built.

## 10. Open decisions

1. The rhythm of attack and defence (the fight screen itself is decided and built).
2. The order of work: overlays (sheets and dialogs), the design review, the party, the fight
   screen, the monster engine.
3. A typeface for children's reading (section 9).
4. Mood-following music (section 8).
5. The story (`docs/regnespil-story.md`).
6. How gentle the combo is: the research warns against streaks that can be lost; a power
   stroke after three right that a close answer does not break, and a red only halves.
7. Coins and the shop: within a run only, never real money, and no random loot.
8. When the game suggests a higher math level to a child, and how it says so kindly.

## 11. The owner's ideas, as raised

Kept as close to the owner's words as possible, newest last, so none is forgotten.

- A sword chosen at the start sets how forgiving the game is; side monsters give helper crystals;
  bosses end a stretch; chests with three unique treasures; a branching map with forest, water,
  sky and lightning routes, some needing gear such as wings; mishaps such as a thief; shops and
  coins; four or five upgrade slots (an extra hit each round, only two answers as a diamond
  upgrade); a mission mode and a lightning mode on time.
- Yellow should cost a little, red more, so guessing does not pay; ten half hearts.
- Victory should feel like victory: music, the hero cheering.
- Monsters start with few lives and get more further on.
- The monster walks towards the hero while a sum is thought over, so time matters, but not
  tightly; on medium it runs over now and then and shouts; the music swells just before.
- Difficulty as a mode beside the level: easy, medium, hard, where hard gives resistance from
  the bosses; chosen per person, children gently and grown-ups hard.
- A birthday on the profile, to suggest where each player starts, in every game.
- The party: four players, four heroes, each with their own gear; choose your hero at the start.
- Whose turn it is shown in the scene, not as text; the scene full width and taller; the hearts
  part of the scene.
- Different sounds by weapon and by monster; different voices by monster: a troll deep, a weaker
  enemy lighter, a giant boss quite different.
- Music lower while thinking, up when attacking; louder just before a monster scares the heroes.
- Music that changes mood smoothly with the fight: calm, aggressive when a boss rages, desperate
  when nearly beaten.
- The sum should say why it matters: show the weapon about to swing, or the dodge; the children's
  eyes are on the sum when they must act.
- Overlays done properly and alike: dim the rest, a clear layer above, professional like a game
  made by experienced developers with a design background.
- No notes or dialogs in the middle of a game.
- A monster engine: monsters that burrow and pop up to hit one of the heroes; that walk to a
  berry bush to heal every few rounds; that weigh healing against attacking by how much life
  they have; that change when their life falls (harder to beat, a spear fetched from behind a
  tree); one or two events in every fight that change it.
- About a hundred bosses across ten biomes; roads that need upgrades; finishing the game leads
  to the next level of the adventure, with new and better things, enemies with more life and
  heroes who hit harder.
- Everything thought through and written down, so nothing is lost.
- The music steady at its low level, not stepped up and down (it lagged).
- The monster on a wrong answer runs over and pushes or kicks the hero, who falls over and gets
  up: teasing, never killing, so the children are annoyed and want to beat it. It roars or
  squeals when struck, to show it is cross; the hero cries out when knocked over.
- Game information belongs in the scene, not in the top bar, so no one has to look up while
  playing; the top bar should be interesting, not informative.
- Monsters, bosses, their moves, behaviour and specials generated from big pools, so two runs
  never feel alike; names put together from two pools ("Slimy Bob", "Hulking Wolf"); limits by
  kind, so a slime does not spit lava and a wolf does not fly.
- Children's text larger and easier to read.
