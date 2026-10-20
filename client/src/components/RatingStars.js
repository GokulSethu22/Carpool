import { jsx as _jsx } from "react/jsx-runtime";
// RatingStars.tsx — Accessible star rating input and display component.
import { useState } from 'react';
import { Star } from 'lucide-react';
export const RatingStars = ({ score = 0, max = 5, interactive = false, onChange, size = 18, }) => {
    const [hoverScore, setHoverScore] = useState(null);
    const displayScore = hoverScore !== null ? hoverScore : score;
    return (_jsx("div", { className: `rating-stars-container ${interactive ? 'is-interactive' : ''}`, role: interactive ? 'radiogroup' : 'img', "aria-label": `Rating: ${score} out of ${max} stars`, children: Array.from({ length: max }, (_, idx) => {
            const starValue = idx + 1;
            const isFilled = starValue <= displayScore;
            if (interactive) {
                return (_jsx("button", { type: "button", className: "star-button", onClick: () => onChange && onChange(starValue), onMouseEnter: () => setHoverScore(starValue), onMouseLeave: () => setHoverScore(null), role: "radio", "aria-checked": score === starValue, "aria-label": `${starValue} star${starValue > 1 ? 's' : ''}`, children: _jsx(Star, { size: size, className: isFilled ? 'star-filled' : 'star-empty', fill: isFilled ? 'var(--color-accent)' : 'none', stroke: isFilled ? 'var(--color-accent)' : 'var(--color-border)' }) }, starValue));
            }
            return (_jsx(Star, { size: size, className: isFilled ? 'star-filled' : 'star-empty', fill: isFilled ? 'var(--color-accent)' : 'none', stroke: isFilled ? 'var(--color-accent)' : 'var(--color-border)', "aria-hidden": "true" }, starValue));
        }) }));
};
