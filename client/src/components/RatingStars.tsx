// RatingStars.tsx — Accessible star rating input and display component.
import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  score?: number;
  max?: number;
  interactive?: boolean;
  onChange?: (score: number) => void;
  size?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  score = 0,
  max = 5,
  interactive = false,
  onChange,
  size = 18,
}) => {
  const [hoverScore, setHoverScore] = useState<number | null>(null);

  const displayScore = hoverScore !== null ? hoverScore : score;

  return (
    <div
      className={`rating-stars-container ${interactive ? 'is-interactive' : ''}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`Rating: ${score} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, idx) => {
        const starValue = idx + 1;
        const isFilled = starValue <= displayScore;

        if (interactive) {
          return (
            <button
              key={starValue}
              type="button"
              className="star-button"
              onClick={() => onChange && onChange(starValue)}
              onMouseEnter={() => setHoverScore(starValue)}
              onMouseLeave={() => setHoverScore(null)}
              role="radio"
              aria-checked={score === starValue}
              aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            >
              <Star
                size={size}
                className={isFilled ? 'star-filled' : 'star-empty'}
                fill={isFilled ? 'var(--color-accent)' : 'none'}
                stroke={isFilled ? 'var(--color-accent)' : 'var(--color-border)'}
              />
            </button>
          );
        }

        return (
          <Star
            key={starValue}
            size={size}
            className={isFilled ? 'star-filled' : 'star-empty'}
            fill={isFilled ? 'var(--color-accent)' : 'none'}
            stroke={isFilled ? 'var(--color-accent)' : 'var(--color-border)'}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
};
