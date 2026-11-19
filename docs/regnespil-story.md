# Regnespil: a story for the adventure

A proposal for the story of the math game's adventure, written in November 2026 for the owner
to decide on. Nothing here is decided until it is written into `CLAUDE.md`. Asset paths are
relative to `assets/ninja-adventure/`.

## Findings

**Which tales Danish children know.** No survey ranks which tales Danish children aged 4–9
know best, so this rests on what is clearly widespread. At least one Andersen text is on the
compulsory reading list in Danish schools
([Fælles Mål dansk](https://www.uvm.dk/-/media/filer/uvm/udd/folke/pdf24/maj/240513-faellesmaal-dansk.pdf)).
_Fyrtøjet_ opened Andersen's first booklet, _Eventyr, fortalte for Børn_, in 1835
([Wikipedia](https://en.wikipedia.org/wiki/The_Tinderbox)). It became the first Danish
feature-length cartoon in 1946
([Wikipedia](<https://en.wikipedia.org/wiki/The_Tinderbox_(film)>), [DFI](https://dfi.dk/en/viden-om-film/filmdatabasen/film/fyrtojet-0)),
and Odense named its children's culture house after it
([visithcandersen.dk](https://www.visithcandersen.dk/boernekulturhuset_fyrtoejet.htm)).
_Tommelise_ (1835, [Wikipedia](https://en.wikipedia.org/wiki/Thumbelina)) and _Klods-Hans_ (1855,
retold by Andersen from a Danish folk tale) are just as common in picture books. Older children
meet the Norse myths at school, and through the _Valhalla_ comics and films, whose own designs
are copyrighted.

**Public domain.** Andersen died in 1875, so his tales are public domain. So are the Grimm
tales, the Eddas, Danish folk tales, Aesop and the Arabian Nights. Modern retellings and
translations are not: the 1946 _Fyrtøjet_ film, the Tivoli ballet, _Valhalla_, the 1994
_Thumbelina_ film and Frozen (loosely after _Snedronningen_). We write our own retelling from
the Danish text, and take nothing from their pictures or wording.

**Story recipes worth borrowing**

- **Propp's folk-tale functions.** A hero leaves home and meets a donor who gives a magical
  helper. The hero is tested, gets help, wins, and comes home changed. This is the shape of a
  roguelite run, almost slot for slot ([Propp](https://en.wikipedia.org/wiki/Vladimir_Propp)).
  _Fyrtøjet_ is tale type ATU 562, "The Spirit in the Blue Light": a magic object that calls
  helpers.
- **Home, away, home.** Picture books leave home and come back to it, the "voyage and return"
  shape. They also lean on the rule of three: three tries, three helpers, three rooms
  ([slaphappylarry](https://www.slaphappylarry.com/picturebook-study-home-away-from-home-stories),
  [rule of three](https://writelinks.booklinks.org.au/2021/04/the-rule-of-three-in-picture-books/)).
- **Pixar's story spine.** "Once upon a time… every day… until one day… because of that… until
  finally…" ([Coats' rule 4](https://www.aerogrammestudio.com/2013/03/07/pixars-22-rules-of-storytelling/)).
  It is the hero's journey cut down to a size a 5-year-old can hold.
- **Kishōtenketsu.** Four parts: introduce, develop, twist, reconcile. It needs no villain, and
  Nintendo has used it to shape single levels: show a thing, practise it, twist it, conclude
  ([Wikipedia](https://en.wikipedia.org/wiki/Kish%C5%8Dtenketsu),
  [Hayashida via MCV](https://www.mcvuk.com/development/video-nintendos-level-design-secrets-in-four-steps)).
  For us, the twist is the reason a "monster" is grumpy.
- **The five-room dungeon.** Five rooms in order: an entrance with a guardian, a puzzle, a trick
  or setback, the climax, then a reward or revelation. It need not be a dungeon: five places in
  a forest work as well ([RPGBOT with Johnn Four](https://rpgbot.net/5-room-dungeons-with-johnn-four-rpgbot-podcast-s2e72),
  [summary](https://bestiarumgames.com/blogs/news/better-ttrpg-dungeon-design-with-five-room-dungeon)).
- **Roguelites.** In Hades the story moves forward when you fail. The people at home react to
  the last run, so losing feels like progress
  ([Kasavin in Inlander](https://inlander.com/culture/hades-writer-greg-kasavin-on-how-he-made-video-game-deaths-drive-a-feel-good-story-22725237),
  [Inverse](https://inverse.com/gaming/hades-god-mode-interview)). Dead Cells and Slay the
  Spire scatter small pieces of lore across many runs instead of telling one long plot.

**Wordless storytelling**

- **Silent heroes.** Link never speaks. In _The Wind Waker_ his eyes carry the feeling, and his
  gaze points at what matters, which doubles as a hint
  ([Iwata Asks](https://iwataasks.nintendo.com/interviews/wiiu/wind-waker/0/2)).
- **Babble.** Animal Crossing's "animalese" is short syllables with a pitch and pace per
  character, shifted by mood ([Nookipedia](https://nookipedia.com/wiki/Animalese)).
  Pingu's "Penguinese" is the theatre's grammelot
  ([Wikipedia](https://en.wikipedia.org/wiki/Pingu)).
- **Journey.** Its only voice is one chirp, and players build whole relationships from it
  ([Wikipedia](<https://en.wikipedia.org/wiki/Journey_(2012_video_game)>)).
- **Shaun the Sheep.** It is all pantomime, the characters' own noises and a vivid score, and
  young children everywhere follow it
  ([AV Club](https://www.avclub.com/animation-fans-may-enjoy-the-relative-silence-of-aardma-1798184552)).
- **Animation basics for sprites.** The principles that matter most at this size are timing,
  anticipation, and squash and stretch. A pose must read from its key frames alone
  ([Game Developer](https://www.gamedeveloper.com/game-platforms/12-principles-for-game-animation),
  [Slynyrd](https://www.slynyrd.com/blog/2018/8/19/pixelblog-8-intro-to-animation)).
- **Emote balloons.** These are the 16-pixel RPG convention, and the pack ships 30 of them in
  `Ui/Emote`.

**Story in math games**

- **Integration.** Children learned more, and played seven times longer by choice, when the
  math _was_ the game's action rather than a toll between bits of game (Habgood & Ainsworth
  2011, [doi](https://doi.org/10.1080/10508406.2010.508029)).
- **Narrative.** A meta-analysis found narrative gave no significant learning gain, with a trend
  in favour of games without it. Games worked better with several sessions and played in
  groups (Wouters et al. 2013, [doi](https://doi.org/10.1037/a0031311)).
- **Seductive details.** Interesting but irrelevant material lowers learning, most of all in
  short sessions and for novices
  ([WSU on Sundararajan & Adesope 2020](https://news.wsu.edu/press-release/2020/03/19/seductive-details-inhibit-learning/)).
- **Prodigy as a warning.** Its story engages children, but independent evidence of learning is
  weak, and critics count more ads and upsell than math
  ([NEPC](https://www.nepc.colorado.edu/sites/default/files/publications/Newsletter%20prodigy.pdf),
  [Fairplay](https://fairplayforkids.org/pf/prodigy/)).

The rule that follows: **story frames the run, and the math is the action inside it.** Scenes
last seconds, can always be skipped, and never sit between a task and its answer.

## Three concepts

### A. Fyrtøjet: under the hollow tree (recommended)

**Premise.** The hero marches home along the road ("én, to! én, to!"). At a huge hollow tree an
old woman in a pointed hat asks them, in pictures, to climb down and fetch the old tinderbox.
Below are three halls, each with a chest of coins and a dog guarding it: eyes as big as
teacups (copper), as mill wheels (silver), and as the Round Tower (gold). In our telling the
dogs are not fierce. They are bored, lonely or bothered by something, and each one the hero
wins over becomes a friend. Whoever holds the tinderbox can strike it and call the dogs. The
town above has gone dim and cold since the tinderbox was lost, and every spark carried home
lights it up a little more.

**Why it works**

- Danish children know the dogs' eyes by heart. Showing a teacup, then a mill wheel, then a
  tower tells the whole build-up with no words.
- The tale already is a dungeon: three rooms, rising guardians, three chests.
- The soldier's choice is our chest rule. He empties his pockets of copper to take silver, then
  of silver to take gold: you carry one of three.
- The tinderbox is literally a helper you call, and its sparks give us the lightning mode
  ("Gnister").

**Mapped to the run**

| Run part       | In the story                                                                                                                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start, sword   | The hero's sword: a wooden stick (gentlest), a sabre, a big sword (`Items/Weapons/Stick`, `Sword`, `BigSword`)                                                                                                                |
| Map            | Roots branch under the tree. Forest roots, an underground river with a mill (water), up through the crown and over the roofs (sky, needs the gold dog's back or a feather), the spark tunnels (lightning, timed and optional) |
| Side monsters  | Grumpy cave and forest critters. Calmed, each gives a spark crystal: pick 1 of 3                                                                                                                                              |
| Bosses         | The three dogs, one per hall, at growing size. Each ends as a friend who follows the hero                                                                                                                                     |
| Chests         | Copper, silver and gold chests; three treasures, take one                                                                                                                                                                     |
| Thief          | The old woman's masked raccoon snatches a coin bag and scampers off. It always turns up again later in the run, bag and all                                                                                                   |
| Shop           | A pedlar at a lantern in the roots; coins are copper, silver and gold                                                                                                                                                         |
| Upgrade slots  | The soldier's kit: knapsack, boots, cap, amulet, ring                                                                                                                                                                         |
| Hearts run out | The teacup dog carries the hero home to the attic room. No death, no game-over screen                                                                                                                                         |
| Modes          | Mission: "fetch the tinderbox". Lightning: run the spark tunnels before the spark fades. Off by default                                                                                                                       |

**Cast**

| Role                    | Asset folder                                                                                                                                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero(es)                | The child's own pick among `Actor/Character/Boy`, `Princess`, `Cavegirl`, `Villager3`, `EggBoy`, `EggGirl`, `Woman` (all have `SeparateAnim`; `Child` has none)                                                                                                   |
| The old woman           | `Actor/Character/NinjaMageOrange` (pointed hat; the `Black` one looks harsher), or `OldWoman` (no extra animations)                                                                                                                                               |
| Her raccoon, the thief  | `Actor/Monster/Racoon` (the mask reads "thief" anywhere)                                                                                                                                                                                                          |
| Teacup dog (copper)     | `Actor/Animal/DogOrange`, drawn ×2                                                                                                                                                                                                                                |
| Mill-wheel dog (silver) | `Actor/Animal/DogBlack/SpriteSheetWhite.png`, drawn ×3                                                                                                                                                                                                            |
| Round Tower dog (gold)  | `Actor/Animal/DogYellow`, drawn ×4. Alternative bosses with full animations: `Actor/Boss/GiantRacoon` and `GiantRacoonGold` (a raccoon dog, _mårhund_)                                                                                                            |
| Side monsters           | `Actor/Monster/Slime`, `Mushroom`, `Mole`, `Butterfly` (forest); `Axolot`, `KappaGreen`, `Fish` (water); `BlueBat`, `Owl` (sky); `Flam`, `Spirit`, `LanternRed` (sparks)                                                                                          |
| Pedlar                  | `Actor/Character/OldMan3`                                                                                                                                                                                                                                         |
| Princess, king          | `Actor/Character/Princess` (a second one for a sibling hero), `Master` as the king                                                                                                                                                                                |
| The old woman's cat     | `Actor/Animal/CatBlack`                                                                                                                                                                                                                                           |
| Places                  | `Backgrounds/Tilesets/TilesetNature` and `TilesetFloor` (road, tree); `TilesetDungeon`, `TilesetHole` (halls); `TilesetWater`, `Backgrounds/Animated/WaterMill`, `Waterfall` (river); `TilesetTowers` (Round Tower, spark crystals); `TilesetHouse` (town, attic) |
| Items                   | `Items/Treasure/Coin2`, `SilverCoin`, `GoldCoin`, `LittleTreasureChest`, `BigTreasureChest`, `SilverCup` (the teacup); `Items/Resource/Gem*` (crystals); `Ui/Skill Icon/Items & Weapon` (slots); `Items/Object/Bag` (knapsack)                                    |
| Effects                 | `FX/Magic/Spark`, `FX/Particle/Spark`, `FX/Elemental/Thunder` (sparks); `FX/Smoke` (the raccoon's exit); `FX/Particle/Leaf`, `Snow`                                                                                                                               |

**Told without words.** Picture bubbles carry the plot: tree → arrow down → tinderbox, and cup
→ wheel → tower. The changing town tells the meta story, a window lit after each run. Every
character has its own babble voice: the dogs low and slow, the old woman crackly, the raccoon
quick giggles.

**To drop from the original:** the witch beheaded, the soldier jailed and sentenced, the king
and queen thrown to their deaths, the princess carried off at night, and the marriage.

### B. Tommelise: the swallow's way south

**Premise.** The hero is as small as a thumb. They find a swallow too cold to fly and nurse it
back to health, and together they travel to the warm land where flowers have people in them.
Everything is huge, so a sum is the way across a puddle.

**Why it works.** It is one of Andersen's best-known tales, gentle, and full of animals. The
tale's own stations map straight onto routes:

- the toad's lily pad (water: `Actor/Boss/GiantFrog`, `Actor/Animal/Frog`)
- the field mouse's burrow and the mole's tunnels (underground: `Actor/Monster/Mouse`, `Mole`)
- the meadow (forest: `Butterfly`, `Larva` for the cockchafer)
- the swallow's back (sky: `Actor/Animal/Parrot`, blue, as the swallow; wings are the gear)
- winter (`FX/Particle/Snow`, `Actor/Boss/GiantSpirit` as a frost spirit)

**Mapping.** The bosses are the creatures who want to keep the hero: the toad, the mole. Win
them over and they let the hero go. Chests hold seeds, petals and dewdrops. The thief is a
magpie. The ending is the flower land in spring, and the meta story is the seasons turning and
the swallow flying a little further south each run.

**Weaknesses.** The original heroine is passive and its plot is suitors (cut). The pack has no
real swallow or beetle, and "tiny" is hard to show with 16-pixel tiles drawn at normal scale.

### C. Tjalfe and Røskva: Thor's hammer is gone

**Premise.** From the Eddas: the farm children Tjalfe and Røskva travel with Thor. The giant
Trym has hidden the hammer, so there is no thunder and the crops will not grow. The children
cross Jotunheim to get it back, and on the way pass Utgard-Loke's contests. Those are
illusions: Tjalfe races Thought itself, and Thor tries to drink the sea.

**Why it works**

- A brother and sister on a quest: siblings playing together see themselves at once.
- Lightning is the theme itself.
- The myth already holds the gear and treasures: Freja's falcon cloak (wings), the dwarves'
  treasures (chests: Draupnir, Skidbladner), Loke as a trickster thief.
- Utgard-Loke's contests are ready-made kishōtenketsu twists: "you were tricked, and you were
  amazing".

**Cast**

- Tjalfe and Røskva: `Actor/Character/Boy`, `Cavegirl`
- Thor: `Actor/Character/Hunter`
- Loke: `Actor/Character/MaskRacoon`
- Trym: `Actor/Boss/GiantBlueSamurai`
- The Midgard serpent: `Actor/Boss/DragonGreen`, a segmented body
- Mjølner: `Items/Weapons/Hammer`
- Places and effects: `FX/Elemental/Thunder`, `Ice`; snow trees in `TilesetNature`

**Weaknesses.** Children of 4–5 rarely know it. Many children know a Marvel Thor, which we must
not resemble. The myths are full of fights. And the pack's Japanese look (ninjas, samurai,
tengu) fits Jotunheim poorly. It would make a good second book later, for older children and
the lightning mode.

## Recommendation: Fyrtøjet

Choose A. It is the best-known of the three for the youngest players. Its shape already is our
run: three rooms, rising guardians, three chests, carry one. It has a magic helper you call, and
sparks that give the lightning mode. Dogs are the friendliest bosses a 4-year-old could meet.
It also fits the pack best: dogs, a pointed-hat witch, copper, silver and gold coins, cups,
chests, a water mill and towers.

### Opening scene (about 40 seconds; one tap skips it)

1. **Road at dusk.** Music `Audio/Musics/1 - Adventure Begin`. The hero marches in from the left
   on the Walk frames. Each step gives two babble syllables, high then low, in time with the
   march: "én, to". Children who know the tale's first line hear it without words.
2. **The hollow tree.** The camera stops on a huge tree. The hero stops too: they sink 1 px for
   2 frames (anticipation), then `Ui/Emote/emote21` ("!") pops up, with
   `Sounds/Alert/Alert.m4a` played softly.
3. **The old woman.** She steps out from behind the trunk and her raccoon peeks from her hem.
   Her babble is low and crackly. She shows a picture bubble: tree, arrow down, tinderbox.
4. **The bargain.** A second bubble shows copper, silver and gold coins. The hero shows
   `emote1` (surprise), then `emote8` (a cheeky wink), and does a quick double hop on the Jump
   frames.
5. **The warning.** A third bubble shows cup, wheel, tower: three dogs, each bigger. The hero
   gulps: `emote17` (worried), a 1-px tremble, and a quick, rising babble. The raccoon giggles.
   The old woman pats the hero's head (`emote27`, a heart) and hands over her checked apron:
   the dogs calm down when they sit on it.
6. **Courage.** The hero faces the camera and breathes in, rising 1 px twice. They show
   `emote19` (gritted, determined), then the Attack frame with the sword raised and a firm
   two-syllable babble.
7. **Down.** The Jump frame into the hole, with `Sounds/Whoosh & Slash/Whoosh.m4a`. The music
   crossfades to `2 - The Cave`. A single torch lights the roots.
8. **The first dog.** Asleep on a copper chest, with `emote28` (Zz) rising. The hero tiptoes,
   walking at half speed with held frames. One dog eye opens (`emote1` on the dog), then a
   happy bark: the dog's babble, low and slow, two syllables.
9. **The map.** The roots fan out as the run's branching map, and the first task begins.

### A boss: the mill-wheel dog (silver hall)

1. **Before it appears.** A water wheel creaks (`Backgrounds/Animated/WaterMill`, water
   sounds), with music `28 - Tension` low. Two round glints (`FX/Magic/Spark`) shine behind
   the wheel. The hero shows `emote23` ("?") and glances at the teacup dog, who wags:
   `emote27`. The companion is the child's emotional anchor.
2. **Entrance.** The dog steps out at ×3 size and shakes off water (`FX/Particle/RainOnFloor`).
   Its babble is deep and slow. It shows `emote4` (grumpy) and a picture bubble: the silver
   chest and a cross. Mine.
3. **Tasks.** Each right answer is a treat tossed in an arc, with `Sounds/Bonus/Bonus.m4a`. The
   dog catches it on a hop, and a heart fills above its head.
4. **Wrong answer.** The dog gives a playful pounce, a 2-px lunge, and splashes the hero. The
   hero shows `emote3` (dizzy) for half a second and loses half a heart. The right answer shows
   at once, as the research asks.
5. **Twist, halfway.** The dog whimpers (`emote16`) and shows a bubble: its ball is stuck in the
   mill wheel. That is why it is grumpy. The next task is the hero helping: each right answer
   turns the wheel a notch.
6. **The ball comes free.** The dog bounds after it, flops onto the apron and rolls over, with
   `emote27` and the jingle `Jingles/Success1`.
7. **Reward.** The chest opens (`Jingles/Secret1`). The hero holds the key aloft on the Item
   frame, arms up, and chooses one of three treasures. The dog now follows the hero.

### Ending (the final chapter)

- **The spark.** The hero strikes the tinderbox, sparks fly (`FX/Magic/Spark`) and all three
  dogs come bounding.
- **The snatch and the twist.** The raccoon snatches the tinderbox, and the old woman catches
  it. Twist: her bubble shows a cold, empty stove and her black cat shivering. She was never
  wicked, only cold. The hero lights her stove with one spark, and she smiles for the first
  time (`emote18`).
- **The town lights up.** Window after window lights up and the gate of the copper castle
  opens. The princess runs out to meet the dogs.
- **The feast.** Everyone eats together, music `20 - Good Time`, and the dogs sit at the table
  "making big eyes", the tale's own last line, kept as a wink for grown-ups. Fireworks of
  sparks follow, then `8 - End Theme` and the credits as a parade of every character met.

### Story between runs

The hub is the hero's little attic room, as in the tale, with a window over the town. Every run
ends there, won or not, and something has changed, the Hades way:

- another window in town is lit;
- a befriended dog sleeps at the foot of the bed;
- the raccoon peeks in, holding a coin (a running gag);
- the princess waves from her tower and shows a new picture bubble each time, like a pen pal.

Chapters unlock in order: Copper → Silver → Gold → the Tinderbox → the Princess in the Copper
Castle → the Old Woman's Cold Stove → the Feast. After the feast, the tree "grows new roots":
remixed runs in autumn and snow, new dogs to befriend, and later new books on the same engine
(Tommelise, then Tjalfe and Røskva).

Siblings are a team: their heroes walk together, and the dogs are the team's friends. On each
child's turn their own hero steps forward.

## The hero's expression kit

Every hero sprite in `Actor/Character/<name>/SeparateAnim` has the same frames:

- Idle, one frame per direction
- Walk, 4×4
- Jump and Attack, one frame per direction
- Item (arms raised overhead)
- Special1 (head bowed, eyes closed)
- Special2 (hand to mouth)
- Dead (lying down: used only for a nap, never for death)

The code adds whole-pixel offsets, held frames and timing. Squash and stretch on a 16-pixel
sprite is a 1-pixel drop or rise, never a scale. Babble values below are relative to the hero's
voice in `src/lib/sound/voices.ts`.

| Feeling        | Pose and motion                                                                           | Emote                                                | Babble                                                   | Sound                                             |
| -------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| Happy          | Two quick hops on the Jump frame, 3 px up, landing 1 px low for one frame                 | `emote6` (grin)                                      | +4 semitones, pace ×1.3, 3–4 syllables, rise then fall   | `Sounds/Jump & Bounce/Bounce.m4a`                 |
| Proud          | Faces the player, Item frame (arms up) held 1 s, sparkle `FX/Particle/Spark`              | `emote18` (eyes closed, smiling) or `emote29` (star) | +2, pace ×0.9, 2 syllables, second higher ("ta-daa")     | `Jingles/Success1` or `Sounds/Bonus/PowerUp1.m4a` |
| Scared, mildly | Steps back 2 px still facing it, trembles ±1 px for 0.5 s, then the companion comforts    | `emote17` (worried); never `emote15`                 | +5, pace ×1.6, 4 short syllables, wide spread            | none, or a soft `Sounds/Menu/Cancel.m4a`          |
| Curious        | Turns to face the thing, leans 1 px toward it, pauses                                     | `emote23` ("?") or `emote7` (raised brow)            | +0 → +5, 2–3 syllables, last one rising (a question)     | `Sounds/Menu/Move1.m4a`                           |
| Sad            | Special1 (head bowed), sinks 1 px, slow; lasts at most 1.5 s, then the companion comforts | `emote13`; `emote16` for tears                       | −4, pace ×0.6, 3 long syllables, falling                 | none (a short phrase of `7 - Sad Theme` at most)  |
| Determined     | Small crouch (1 px down) then up, Attack frame held with the sword raised                 | `emote19` (gritted) or `emote22` (red "!")           | ±0, firm, 2 even syllables, accent on the second         | `Sounds/Whoosh & Slash/Sword2.m4a`                |
| Surprised      | A "take": freezes 4 frames, then a 4-px jump on the Jump frame                            | `emote1` (open mouth) or `emote21` ("!")             | one short syllable, +7                                   | `Sounds/Jump & Bounce/Jump.m4a`                   |
| Cheeky         | Special2 (hand to mouth, giggling), glances at the player                                 | `emote8` (wink) or `emote9` (smirk)                  | +3, quick staccato, 3 syllables, up-down-up ("hi-hi-hi") | `Sounds/Jump & Bounce/Bounce3.m4a`                |

**Rules for the kit**

- The emote pops up 2 frames after the pose (overlapping action) and stays about 1 s.
- Every big action has a 2–4 frame anticipation.
- A feeling is never shown by sound alone, as an iPhone's silent switch removes it.
- The companion dog mirrors the hero's feeling and comforts sad or scared moments. The child
  never sees the hero left alone with a bad feeling.

**Code the kit needs.** The babble engine has pitch, pace and spread, and always falls at the
end (`endFall`). The kit needs a mood argument that shifts pitch, scales pace and chooses the
ending: rise, fall or flat. New voices are also needed for the dogs, the old woman and the
raccoon.

## What to avoid for small children

- **Death and the frightening.** No death, Dead pose, graves or skulls. Leave out
  `Actor/Monster/Skull`, `SkullBlue`, `Actor/Character/Skeleton`, `SkeletonDemon`, `DemonRed`,
  `DemonGreen`, `Actor/Boss/DemonCyclop` and `emote30` (a cross that can read as a grave). No
  game-over jingles: the `GameOver` sounds are replaced by being carried home.
- **Shocks.** No jump scares and no loud sudden sounds. Darkness lasts seconds and always has a
  light in it. Lightning and spark effects never flash more than three times a second, and stop
  with reduced motion.
- **The original's grim parts.** No cruelty, capture or romance taken from the tales (see the
  list under concept A). Friendship replaces marriage. The princess "can't come out to play"
  rather than being imprisoned.
- **Stereotypes.** "Ugly old woman = evil" is the tale's trope. Ours is grumpy, and has a reason.
- **Losses.** Nothing is lost for good: the thief always gives the bag back. Siblings are never
  compared, and time is off by default.
- **Scenes in the way.** No scene longer than about 15 seconds, and every scene can be skipped.
  Nothing animates under a task except the answer's feedback; this guards against seductive
  details.
- **Borrowed looks.** Nothing from the 1946 film, Frozen, Marvel or _Valhalla_.

## Open questions for the owner

- **New art.** The pack has no tinderbox, apron or swallow. A tinderbox and a checked apron
  would be two small 16-pixel drawings in the pack's style. Alternatively, use flint and spark
  (`Items/Resource/Rock` with `FX/Particle/Spark`) and treats (`Items/Weapons/Bone`).
- **Pixel sizes.** Dogs drawn at ×2, ×3 and ×4 mix pixel sizes in one scene. That is a
  deliberate joke, but it breaks pixel purity. `GiantRacoon` and `GiantRacoonGold` are the
  alternative: proper boss animations, but they read less as dogs.
- **Music.** The music moods above are chosen by track title and have not been listened to.
- **Shop.** The research note advises against shops and loot. Here, shops spend only in-run
  coins that never cost anything outside the game.
