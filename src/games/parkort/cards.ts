/** A category of question cards. */
export interface Category {
  id: CategoryId;
  name: string;
}

export type CategoryId =
  | 'os-to'
  | 'taknemmelighed'
  | 'hverdagen'
  | 'minder'
  | 'droemme'
  | 'vaerdier'
  | 'naerhed'
  | 'for-sjov';

/** How personal a card is: light, medium or deep. */
export type Level = 1 | 2 | 3;

export interface QuestionCard {
  /**
   * Stable for good: progress is stored by it. A new card gets the category's next unused
   * number; a card whose question changes is taken out and comes back as a new card.
   */
  id: string;
  category: CategoryId;
  level: Level;
  text: string;
}

/** The levels, lightest first. */
export const levels: readonly Level[] = [1, 2, 3];

export const levelNames: Readonly<Record<Level, string>> = { 1: 'Let', 2: 'Mellem', 3: 'Dyb' };

export const categories: readonly Category[] = [
  { id: 'os-to', name: 'Os to' },
  { id: 'taknemmelighed', name: 'Taknemmelighed' },
  { id: 'hverdagen', name: 'Hverdagen' },
  { id: 'minder', name: 'Minder' },
  { id: 'droemme', name: 'Drømme' },
  { id: 'vaerdier', name: 'Værdier' },
  { id: 'naerhed', name: 'Nærhed' },
  { id: 'for-sjov', name: 'For sjov' },
];

/** Each category by its id. */
export const categoryById = Object.fromEntries(
  categories.map((category) => [category.id, category]),
) as Readonly<Record<CategoryId, Category>>;

/**
 * The numbers of cards taken out of each category, never to be used again: a couple's saved
 * progress may still name them, and a new card under an old number would count as talked about.
 */
export const retired: Readonly<Record<CategoryId, readonly number[]>> = {
  'os-to': [7, 16],
  taknemmelighed: [5, 8, 10, 11, 15, 17, 22],
  hverdagen: [15, 18, 22],
  minder: [],
  droemme: [2, 13, 15, 19],
  vaerdier: [11, 14],
  naerhed: [8, 10, 11, 15, 16, 21, 23],
  'for-sjov': [23, 25],
};

type Entry = readonly [number, Level, string];

const entries: Readonly<Record<CategoryId, readonly Entry[]>> = {
  'os-to': [
    [1, 1, 'Hvad lagde du først mærke til ved mig, da vi mødtes?'],
    [2, 1, 'Hvilken sang minder dig mest om os?'],
    [3, 1, 'Hvad kan du bedst lide at lave sammen med mig?'],
    [4, 1, 'Hvilken lille vane hos mig ville du savne, hvis den forsvandt?'],
    [5, 1, 'Hvis vores forhold var en film, hvilken genre ville det så være – og hvorfor?'],
    [6, 1, 'Hvad er vores bedste interne joke?'],
    [8, 1, 'Hvilken tur eller udflugt med mig vil du helst gentage?'],
    [9, 2, 'Hvornår vidste du, at det her mellem os var noget særligt?'],
    [10, 2, 'Hvad synes du, vi er rigtig gode til som par?'],
    [11, 2, 'Hvad har du lært af mig, siden vi blev sammen?'],
    [12, 2, 'Hvordan har vi ændret os som par, siden vi mødtes?'],
    [13, 2, 'Hvilken af vores traditioner betyder mest for dig?'],
    [14, 2, 'Hvad gør jeg, der får dig til at føle, at vi er et hold?'],
    [15, 2, 'Hvornår har du været allermest stolt af os?'],
    [17, 2, 'Hvilket råd ville du give et nyt par, der gerne vil holde sammen længe?'],
    [18, 2, 'Hvilken ny tradition kunne du tænke dig, at vi startede?'],
    [19, 3, 'Hvornår har du følt dig tættest på mig?'],
    [20, 3, 'Hvad er det sværeste, vi har været igennem sammen, og hvad tog du med dig fra det?'],
    [21, 3, 'Hvad kunne du ønske, at vi talte mere om?'],
    [22, 3, 'Hvad tror du er det vigtigste for, at vi stadig har det godt sammen om 20 år?'],
    [23, 3, 'Hvornår har du følt, at vi var langt fra hinanden, og hvad hjalp os tilbage?'],
    [24, 3, 'Hvad håber du, at vores familie og venner ser, når de ser os sammen?'],
    [25, 3, 'Hvad ved du om mig i dag, som du ikke vidste for et år siden?'],
    [26, 2, 'Hvad er vigtigst for dig, når vi taler om penge sammen?'],
    [27, 1, 'Hvilket spil eller hvilken leg skal vi lave noget mere?'],
    [28, 2, 'Hvad har du lært om mig ved at møde min familie?'],
    [29, 2, 'Hvilke venner får det bedste frem i os som par?'],
  ],
  taknemmelighed: [
    [1, 1, 'Hvad har jeg gjort den seneste måned, der har gjort dig glad?'],
    [2, 1, 'Hvad er det bedste, der er sket for dig i denne uge?'],
    [3, 1, 'Hvilken af mine evner ville du ønske, du selv havde?'],
    [4, 1, 'Hvad gør jeg derhjemme, som du altid bliver glad for?'],
    [6, 1, 'Nævn tre ting, du synes, jeg er god til.'],
    [7, 1, 'Hvad sætter du mest pris på ved vores hjem?'],
    [9, 2, 'Hvornår har jeg overrasket dig positivt?'],
    [12, 2, 'Hvad beundrer du ved den måde, jeg er sammen med andre mennesker på?'],
    [13, 2, 'Hvilken af mine sider ville du ønske, at flere fik lov at se?'],
    [14, 2, 'Hvad har jeg gjort, der har gjort en svær dag lettere for dig?'],
    [16, 2, 'Hvad i dit liv er du mest taknemmelig for lige nu?'],
    [18, 2, 'Hvilken beslutning, vi har truffet sammen, er du gladest for?'],
    [19, 3, 'Hvad ved mig gør dig tryg?'],
    [20, 3, 'Hvornår har du været rigtig stolt af mig?'],
    [21, 3, 'Hvad har jeg givet dig, som du ikke havde, før vi mødtes?'],
    [23, 3, 'Hvad har jeg gjort for dig, som jeg måske ikke selv ved betød så meget?'],
    [24, 3, 'Fortæl om et øjeblik, hvor du tænkte: »Jeg er heldig at have dig.«'],
    [25, 3, 'Sig tre ting, du elsker ved mig – og hvorfor.'],
    [26, 1, 'Hvem uden for os to har gjort din uge bedre, og hvordan?'],
    [27, 3, 'Hvilken svær ting i dit liv er du i dag taknemmelig for?'],
    [28, 2, 'Hvad sætter du pris på ved min familie eller mine venner?'],
    [29, 2, 'Hvilken ting ved vores liv sammen tager du ikke længere for givet?'],
    [30, 2, 'Hvilket venskab er du særligt taknemmelig for lige nu?'],
    [31, 2, 'Hvem i din familie er du mest taknemmelig for i dag?'],
    [32, 1, 'Hvilken duft, lyd eller smag har gjort dig glad for nylig?'],
  ],
  hverdagen: [
    [1, 1, 'Hvad kunne jeg gøre mere af herhjemme, som ville gøre din hverdag lettere?'],
    [2, 1, 'Hvordan ser en perfekt helt almindelig tirsdag ud for dig?'],
    [
      3,
      1,
      'Hvilken opgave derhjemme kan du mindst lide – og hvilken har du egentlig ikke noget imod?',
    ],
    [4, 1, 'Hvad er det bedste tidspunkt på dagen for dig?'],
    [5, 1, 'Hvilken ret skal vi lave noget oftere?'],
    [6, 1, 'Hvordan slapper du bedst af efter en lang dag?'],
    [7, 1, 'Hvilken lille ting i vores hjem kunne gøre hverdagen hyggeligere?'],
    [8, 1, 'Hvad ville du lave med en helt fri lørdag uden planer?'],
    [9, 1, 'Hvilken vane eller ting kunne du ikke undvære i din hverdag?'],
    [10, 2, 'Hvad stresser dig mest i hverdagen lige nu?'],
    [11, 2, 'Hvordan kan jeg bedst støtte dig, når du har travlt?'],
    [12, 2, 'Hvad synes du fungerer godt i den måde, vi fordeler opgaverne på?'],
    [13, 2, 'Hvilken opgave ville du ønske, at vi byttede eller delte anderledes?'],
    [14, 2, 'Hvor meget tid helt for dig selv har du brug for i løbet af en uge?'],
    [16, 2, 'Hvilken af vores faste rutiner holder du mest af?'],
    [17, 2, 'Hvad kunne vi gøre for at få flere gode stunder for os to i hverdagen?'],
    [
      19,
      2,
      'Hvad kunne jeg sige eller gøre om morgenen, som ville give dig en god start på dagen?',
    ],
    [20, 3, 'Hvad tænker du på, når du ligger og ikke kan sove?'],
    [21, 3, 'Hvornår føler du dig mest alene med tingene i hverdagen?'],
    [
      23,
      3,
      'Hvad kunne du tænke dig at sige nej til, så der blev mere plads til det, der betyder noget?',
    ],
    [24, 3, 'Hvordan kan jeg mærke, at du har brug for en pause, før du selv siger det?'],
    [
      25,
      3,
      'Hvad ville gøre den største forskel for, at du har det godt i hverdagen det næste halve år?',
    ],
    [26, 3, 'Hvad gør du i løbet af dine dage, som du er stolt af, men som ingen rigtig ser?'],
    [27, 2, 'Hvad får dig til at have det godt i kroppen i en helt almindelig uge?'],
    [28, 2, 'Hvad giver dig energi i hverdagen, som jeg måske ikke ved?'],
    [29, 1, 'Hvem på dit arbejde eller studie tror du, jeg ville synes rigtig godt om?'],
    [30, 2, 'Hvilken del af dit arbejde eller studie får dig til at glemme tiden?'],
    [31, 3, 'Hvad har du brug for, for at passe godt på dig selv lige nu?'],
    [32, 3, 'Hvad i din hverdag ville du ønske, du kunne give slip på?'],
    [33, 2, 'Hvordan har du det med, hvor meget vi hver især er på telefonen?'],
    [34, 1, 'Hvad skal der til, for at du får en rigtig god nats søvn?'],
  ],
  minder: [
    [1, 1, 'Hvad er dit bedste minde fra din barndom?'],
    [2, 1, 'Hvilket stykke legetøj eller hvilken ting elskede du som barn?'],
    [3, 1, 'Hvad var din yndlingsret, da du var lille?'],
    [4, 1, 'Hvem var din bedste ven i skolen, og hvad lavede I sammen?'],
    [5, 1, 'Hvad er den bedste ferie, du har været på?'],
    [6, 1, 'Hvilken sang eller musik minder dig om dine teenageår?'],
    [7, 1, 'Hvad var dit første job, og hvad lærte du af det?'],
    [8, 1, 'Hvad er det pinligste, der er sket for dig, som du kan grine af i dag?'],
    [9, 1, 'Hvad drømte du om at blive, da du var barn?'],
    [10, 2, 'Hvilken voksen betød mest for dig, da du voksede op?'],
    [11, 2, 'Hvad er dit bedste minde fra vores første år sammen?'],
    [12, 2, 'Hvilken jul, fødselsdag eller højtid husker du bedst – og hvorfor?'],
    [13, 2, 'Hvilken beslutning i dit liv har formet dig mest?'],
    [14, 2, 'Hvad har du taget med fra dit barndomshjem, som du gerne vil give videre?'],
    [15, 2, 'Hvad fra dit barndomshjem vil du helst gøre anderledes?'],
    [16, 2, 'Hvornår i dit liv har du været allermest modig?'],
    [17, 2, 'Hvilket øjeblik med mig ville du ønske, du kunne opleve igen for første gang?'],
    [18, 2, 'Hvad er det sjoveste, du lavede som teenager?'],
    [19, 3, 'Hvad er et minde, der stadig gør dig lidt ked af det?'],
    [20, 3, 'Hvornår har du følt dig rigtig set af et andet menneske?'],
    [21, 3, 'Hvad lærte de voksne, du voksede op med, dig om kærlighed – med ord eller uden?'],
    [22, 3, 'Hvilken periode af dit liv var den sværeste, og hvem hjalp dig igennem den?'],
    [23, 3, 'Hvad ville du sige til dig selv som 15-årig, hvis du kunne?'],
    [24, 3, 'Hvornår i dit liv har du været allermest lykkelig?'],
    [25, 3, 'Hvilket minde ville du gemme, hvis du kun måtte beholde ét?'],
    [26, 1, 'Hvilken årstid elskede du som barn, og hvad lavede du så?'],
  ],
  droemme: [
    [1, 1, 'Hvor i verden kunne du tænke dig, at vi rejste hen næste gang?'],
    [3, 1, 'Hvordan ser dit drømmehus ud?'],
    [4, 1, 'Hvad skal vi lave, når vi bliver gamle sammen?'],
    [5, 1, 'Hvilken oplevelse vil du gerne have krydset af inden for de næste fem år?'],
    [6, 1, 'Hvis du vandt en million i morgen, hvad ville du så gøre først?'],
    [7, 1, 'Hvilken weekendtur kunne du tænke dig, at vi tog på i år?'],
    [8, 1, 'Hvad glæder du dig mest til lige nu?'],
    [9, 2, 'Hvordan ser vores liv ud om ti år, hvis alt går, som du håber?'],
    [10, 2, 'Hvad er en drøm, du har lagt på hylden, men gerne vil tage frem igen?'],
    [11, 2, 'Hvad kunne du tænke dig at blive bedre til, og hvordan kan jeg hjælpe?'],
    [12, 2, 'Hvis arbejde ikke handlede om penge, hvad ville du så lave?'],
    [14, 2, 'Hvilket projekt kunne vi lave sammen, bare for sjov?'],
    [16, 2, 'Hvad drømmer du om for vores familie?'],
    [17, 2, 'Hvilken person – levende eller død – ville du gerne have en lang snak med?'],
    [18, 3, 'Hvad er du bange for, at du ikke når i dit liv?'],
    [20, 3, 'Hvilken drøm har du aldrig fortalt nogen om?'],
    [21, 3, 'Hvad ville du gøre anderledes, hvis du vidste, at du ikke kunne fejle?'],
    [
      22,
      3,
      'Hvad skal der til, for at du om 20 år kan se tilbage og sige, at det var et godt liv?',
    ],
    [23, 3, 'Hvordan kan jeg hjælpe dig med at komme tættere på din største drøm?'],
    [24, 3, 'Hvad tror du bliver vigtigere for dig om ti år, end det er i dag?'],
    [
      25,
      3,
      'Hvis vi startede forfra et helt nyt sted, hvad ville du så tage med, og hvad ville du lade blive tilbage?',
    ],
    [26, 2, 'Hvad vil du gerne kunne med din krop, når du er 80?'],
    [27, 2, 'Hvilke mennesker håber du, vi har tæt på os om ti år?'],
    [28, 3, 'Hvilken drøm har du for mig, som du ikke har sagt højt?'],
    [29, 1, 'Hvad skal vi nå at lave sammen, før den her årstid er forbi?'],
    [30, 2, 'Hvad drømmer du om, at vi bruger vores penge på om nogle år?'],
  ],
  vaerdier: [
    [1, 1, 'Hvornår er du allermest stædig?'],
    [2, 1, 'Hvilken egenskab sætter du størst pris på hos en ven?'],
    [3, 1, 'Hvad bliver du altid glad for at se andre mennesker gøre?'],
    [4, 1, 'Hvilken regel lever du efter, selvom ingen har bedt dig om det?'],
    [5, 1, 'Hvad bruger du gerne penge på, og hvad synes du er spild?'],
    [6, 1, 'Hvilket emne kunne du blive ved med at tale om i timevis?'],
    [7, 1, 'Hvad synes du er god opførsel, som folk glemmer i dag?'],
    [8, 1, 'Hvem ser du op til, og hvorfor?'],
    [9, 2, 'Hvad betyder ærlighed for dig i et forhold?'],
    [10, 2, 'Hvornår har du sagt fra, selvom det var svært?'],
    [12, 2, 'Hvordan ved du, at du har haft en god dag?'],
    [13, 2, 'Hvad har du skiftet mening om i løbet af de sidste år?'],
    [15, 2, 'Hvad gør dig vred, og hvad siger det om, hvad du går op i?'],
    [16, 2, 'Hvad betyder »hjem« for dig?'],
    [17, 2, 'Hvordan vil du gerne være, når du er uenig med nogen, du holder af?'],
    [18, 3, 'Hvad er du mest stolt af ved den person, du er blevet?'],
    [19, 3, 'Hvad er du bange for at miste?'],
    [20, 3, 'Hvad holder du fast i, når livet bliver svært?'],
    [21, 3, 'Hvad tilgiver du let, og hvad har du svært ved at tilgive?'],
    [22, 3, 'Hvilken side af dig selv arbejder du stadig på at acceptere?'],
    [23, 3, 'Hvad giver dit liv mening lige nu?'],
    [24, 3, 'Hvilken værdi deler vi, og hvor er vi forskellige?'],
    [25, 3, 'Hvornår har du gået på kompromis med noget vigtigt, og hvordan havde du det med det?'],
    [26, 2, 'Hvad lærte du om penge som barn, som du stadig mærker i dag?'],
    [27, 2, 'Hvad skal et arbejde eller en hverdag give dig, for at det føles meningsfuldt?'],
    [28, 2, 'Hvornår har du sidst hjulpet en, du ikke kendte – og hvordan føltes det?'],
    [29, 1, 'Hvad har du lært for nylig, som overraskede dig?'],
  ],
  naerhed: [
    [1, 1, 'Hvordan kan du bedst lide at blive krammet?'],
    [2, 1, 'Hvilken besked fra mig bliver du gladest for at få i løbet af dagen?'],
    [3, 1, 'Hvad er det hyggeligste, vi kan lave en regnvejrsaften?'],
    [4, 1, 'Hvornår nyder du allermest bare at sidde ved siden af mig?'],
    [5, 1, 'Hvad får dig til at føle dig savnet?'],
    [6, 1, 'Hvilken gave fra mig har betydet mest for dig?'],
    [7, 1, 'Hvordan ser en perfekt date for os to ud lige nu?'],
    [9, 2, 'Hvordan kan jeg bedst vise dig, at jeg elsker dig?'],
    [12, 2, 'Hvornår i løbet af en uge føler du dig mest forbundet med mig?'],
    [13, 2, 'Hvad har du brug for fra mig, når du er ked af det?'],
    [14, 2, 'Hvad har du brug for fra mig, når du er vred?'],
    [17, 2, 'Hvilket kærligt ord eller kælenavn vil du gerne høre mere af?'],
    [18, 3, 'Hvornår har du følt dig ensom, selvom vi var sammen?'],
    [19, 3, 'Hvad er svært for dig at bede mig om?'],
    [20, 3, 'Hvad ville du ønske, jeg forstod bedre ved dig?'],
    [22, 3, 'Hvad gør det svært for dig at vise, at du er sårbar?'],
    [24, 3, 'Hvad vil du gerne have, at jeg altid husker om dig?'],
    [25, 3, 'Hvad har du lyst til at sige til mig lige nu, som du ikke siger ofte nok?'],
    [26, 2, 'Hvornår på dagen ville det give mest, at vi begge lagde telefonen væk?'],
    [27, 2, 'Hvad gør jeg, som er min måde at sige »jeg elsker dig« på, uden ord?'],
    [28, 2, 'Hvornår har du sidst følt, at jeg virkelig lyttede – og hvad gjorde jeg?'],
    [29, 2, 'Hvordan vil du helst have, at jeg fejrer dig, når noget er gået godt?'],
    [30, 3, 'Hvornår har det været svært for dig at tage imod min hjælp eller kærlighed?'],
    [31, 3, 'Hvordan tager du bedst imod en undskyldning fra mig?'],
    [32, 2, 'Hvad er et lille ritual, der får dig til at føle dig tæt på mig?'],
    [33, 3, 'Hvad har du brug for at høre fra mig, efter vi har været uenige?'],
  ],
  'for-sjov': [
    [1, 1, 'Hvis vi var et superheltepar, hvad skulle vores superkræfter så være?'],
    [2, 1, 'Hvilket dyr minder jeg dig mest om – og hvorfor?'],
    [3, 1, 'Hvis du kun måtte spise én ret resten af livet, hvad skulle det være?'],
    [4, 1, 'Hvilken kendt person skulle spille mig i filmen om vores liv?'],
    [5, 1, 'Hvad er det mærkeligste, du nogensinde har søgt efter på nettet?'],
    [6, 1, 'Hvis du kunne være en anden i en dag, hvem ville du så være?'],
    [7, 1, 'Hvilken tid i historien ville du helst rejse tilbage til?'],
    [8, 1, 'Hvad ville du lave, hvis du var usynlig i en dag?'],
    [9, 1, 'Hvilket talent ville du ønske, du havde – helt uden at øve dig?'],
    [10, 1, 'Hvis vores hjem skulle have et navn, hvad skulle det så hedde?'],
    [11, 1, 'Hvad er den værste gave, du nogensinde har fået?'],
    [12, 1, 'Hvilken film kan du se igen og igen uden at blive træt af den?'],
    [13, 1, 'Hvis vi startede en virksomhed sammen, hvad skulle den så lave?'],
    [14, 1, 'Hvad ville du hedde, hvis du skulle vælge et helt nyt navn?'],
    [15, 1, 'Hvilken ting fra din barndom ville du ønske kom tilbage?'],
    [16, 1, 'Hvis du kunne tale et nyt sprog flydende i morgen, hvilket skulle det så være?'],
    [17, 1, 'Hvad er din mest overraskende evne, som de færreste kender til?'],
    [18, 2, 'Hvad er det sjoveste, der nogensinde er sket for os?'],
    [19, 2, 'Hvilken af mine vaner kunne blive en olympisk disciplin?'],
    [20, 2, 'Hvis vi byttede liv i en uge, hvad ville du så gøre anderledes end mig?'],
    [21, 2, 'Hvad tror du, jeg ville svare, hvis nogen spurgte, hvad jeg elsker mest ved dig?'],
    [22, 2, 'Hvilken skør ting skal vi prøve sammen, før vi bliver for gamle?'],
    [24, 2, 'Hvis vores forhold havde et motto, hvad skulle det så være?'],
    [26, 2, 'Hvilken af mine vaner syntes du var lidt mærkelig i starten, men holder af i dag?'],
    [27, 2, 'Hvilken årstid passer bedst til os som par – og hvorfor?'],
    [28, 1, 'Hvad er det sjoveste, du har set eller læst på det seneste?'],
    [29, 3, 'Hvad tror du, vi griner allermest af, når vi er 85?'],
    [30, 3, 'Hvis du kunne sende en kort besked til os to om ti år, hvad skulle der så stå?'],
    [31, 3, 'Hvilken lille, skør drøm har du aldrig taget helt alvorligt?'],
  ],
};

/** Every card, category by category. */
export const cards: readonly QuestionCard[] = categories.flatMap((category) =>
  entries[category.id].map(([number, level, text]) => ({
    id: `${category.id}-${String(number)}`,
    category: category.id,
    level,
    text,
  })),
);
