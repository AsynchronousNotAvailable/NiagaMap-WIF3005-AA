import { useState } from 'react';

const StarRating = ({ rating = 0, onRate, size = 20, readonly = false, darkMode = false }) => {
    const [hover, setHover] = useState(0);

    const handleClick = (value) => {
        if (!readonly && onRate) {
            onRate(value);
        }
    };

    return (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= (hover || rating);
                return (
                    <button
                        key={star}
                        onClick={() => handleClick(star)}
                        onMouseEnter={() => !readonly && setHover(star)}
                        onMouseLeave={() => !readonly && setHover(0)}
                        disabled={readonly}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: readonly ? 'default' : 'pointer',
                            transition: 'transform 0.15s ease',
                            fontSize: size,
                            lineHeight: 1,
                        }}
                        onMouseDown={(e) => !readonly && (e.currentTarget.style.transform = 'scale(0.9)')}
                        onMouseUp={(e) => !readonly && (e.currentTarget.style.transform = 'scale(1)')}
                        aria-label={`Rate ${star} stars`}
                    >
                        <span style={{
                            display: 'inline-block',
                            color: isFilled
                                ? '#FBBF24' // Yellow for filled
                                : darkMode
                                    ? 'rgba(148, 163, 184, 0.3)' // Dark mode unfilled
                                    : 'rgba(203, 213, 225, 1)', // Light mode unfilled
                            transition: 'color 0.15s ease',
                        }}>
                            {isFilled ? '★' : '☆'}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default StarRating;
