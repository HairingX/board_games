import { categoryById, levelNames, type QuestionCard } from './cards';
import { Emblem } from './Emblem';
import './CardFaces.css';

/*
 * Parkort's cards, drawn in a 350 × 600 box, the card's 7:12 proportion, as tarot cards are.
 * The back is the same either way up, as playing cards are, so no card looks upside down.
 */
const width = 350;
const height = 600;
const centre = { x: width / 2, y: height / 2 };

/** The rays behind the medallion, one every 3.75 degrees. */
const rays = Array.from({ length: 96 }, (_, index) => {
  const angle = (index / 96) * 2 * Math.PI;
  return { x: centre.x + Math.cos(angle) * height, y: centre.y + Math.sin(angle) * height };
});

/** The diamonds in the corners of the back's inner frame. */
const corners = [
  { x: 40, y: 40 },
  { x: width - 40, y: 40 },
  { x: 40, y: height - 40 },
  { x: width - 40, y: height - 40 },
];

/** The back: the card colour, a double frame, rays and a medallion with the emblem. */
export function CardBack() {
  return (
    <div className="pk-back">
      <svg
        className="pk-card-art"
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        aria-hidden="true"
      >
        <defs>
          <clipPath id="pk-back-inside">
            <rect x="26" y="26" width={width - 52} height={height - 52} rx="4" />
          </clipPath>
        </defs>
        <rect className="pk-back-fill" width={width} height={height} />
        <g clipPath="url(#pk-back-inside)" className="pk-back-rays">
          {rays.map((ray) => (
            <line
              key={`${String(ray.x)},${String(ray.y)}`}
              x1={centre.x}
              y1={centre.y}
              x2={ray.x}
              y2={ray.y}
            />
          ))}
        </g>
        <g className="pk-back-lines">
          <rect x="19" y="19" width={width - 38} height={height - 38} rx="8" strokeWidth="1.6" />
          <rect x="26" y="26" width={width - 52} height={height - 52} rx="4" strokeWidth="0.7" />
          <circle cx={centre.x} cy={centre.y} r="78" className="pk-back-fill" strokeWidth="1.6" />
          <circle cx={centre.x} cy={centre.y} r="71" strokeWidth="0.7" />
        </g>
        <g className="pk-back-ornaments">
          {corners.map((corner) => (
            <path
              key={`${String(corner.x)},${String(corner.y)}`}
              d={`M${String(corner.x)} ${String(corner.y - 6)} l6 6 l-6 6 l-6 -6 z`}
            />
          ))}
        </g>
        <g className="pk-back-mark">
          <circle cx={centre.x - 11} cy={centre.y} r="17" />
          <circle cx={centre.x + 11} cy={centre.y} r="17" />
        </g>
        <text className="pk-back-name" x={centre.x} y={centre.y + 52}>
          Parkort
        </text>
        <text
          className="pk-back-name"
          x={centre.x}
          y={centre.y + 52}
          transform={`rotate(180 ${String(centre.x)} ${String(centre.y)})`}
        >
          Parkort
        </text>
      </svg>
    </div>
  );
}

/** The face: paper with a double frame, the category, the question, and the card's number. */
export function CardFront({ card }: { card: QuestionCard }) {
  const number = card.id.slice(card.id.lastIndexOf('-') + 1);
  return (
    <div className="pk-front">
      <svg
        className="pk-card-art pk-front-lines"
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        aria-hidden="true"
      >
        <rect x="18" y="18" width={width - 36} height={height - 36} rx="8" strokeWidth="1.5" />
        <rect x="24" y="24" width={width - 48} height={height - 48} rx="4" strokeWidth="0.6" />
      </svg>
      <p className="pk-front-category">{categoryById[card.category].name}</p>
      <span className="pk-front-star" aria-hidden="true">
        ✦
      </span>
      <p className="pk-front-text">{card.text}</p>
      <div className="pk-front-foot">
        <span className="pk-front-rule" />
        <Emblem size={30} />
        <span className="pk-front-rule" />
      </div>
      <p className="pk-front-number">
        Nº {number} · {levelNames[card.level]}
      </p>
    </div>
  );
}
