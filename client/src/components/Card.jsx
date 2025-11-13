import { useState } from 'react';

/**
 * UNO Card Component
 * Displays a single UNO card with proper styling and colors
 * Optimized for touch interactions
 */

const CARD_COLORS = {
  red: '#ff5555',
  blue: '#5555ff',
  green: '#55aa55',
  yellow: '#ffaa00',
  wild: '#2a2a2a',
};

const CARD_SYMBOLS = {
  skip: '🚫',
  reverse: '🔄',
  draw2: '+2',
  wild: '🌈',
  draw4: '🌈+4',
};

export default function Card({ card, onClick, disabled = false, playable = false, size = 'normal' }) {
  const [isPressed, setIsPressed] = useState(false);

  if (!card) {
    console.warn('⚠️ Card component: No card provided');
    return null;
  }

  const { color, value } = card;
  const bgColor = CARD_COLORS[color] || '#666';

  // Determine display value
  const displayValue = CARD_SYMBOLS[value] || value.toUpperCase();

  // Size variants - responsive using clamp() for mobile optimization
  const sizes = {
    small: {
      width: 'clamp(2.5rem, 15vw, 3.75rem)',
      height: 'clamp(3.75rem, 22.5vw, 5.625rem)',
      fontSize: 'clamp(0.625rem, 2vw, 0.875rem)'
    },
    normal: {
      width: 'clamp(3.5rem, 18vw, 5rem)',
      height: 'clamp(5.25rem, 27vw, 7.5rem)',
      fontSize: 'clamp(0.875rem, 3vw, 1.25rem)'
    },
    large: {
      width: 'clamp(5rem, 22vw, 7.5rem)',
      height: 'clamp(7.5rem, 33vw, 11.25rem)',
      fontSize: 'clamp(1.25rem, 4vw, 2rem)'
    },
  };

  const cardSize = sizes[size] || sizes.normal;

  const handleClick = () => {
    if (!disabled && onClick) {
      console.log('🃏 Card clicked:', card);
      onClick(card);
    }
  };

  const handleTouchStart = () => {
    if (!disabled && onClick) {
      setIsPressed(true);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role={onClick ? 'button' : 'img'}
      aria-label={`${color} ${value} card${playable ? ', playable' : ''}${disabled ? ', disabled' : ''}`}
      tabIndex={onClick && !disabled ? 0 : -1}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      style={{
        width: cardSize.width,
        height: cardSize.height,
        minWidth: cardSize.width,
        minHeight: cardSize.height,
        background: bgColor,
        borderRadius: '0.5rem',
        border: playable ? '0.1875rem solid #0f0' : '0.125rem solid rgba(255, 255, 255, 0.3)',
        boxShadow: playable
          ? '0 0 0.9375rem rgba(0, 255, 0, 0.5)'
          : '0 0.25rem 0.375rem rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : (onClick ? 'pointer' : 'default'),
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        position: 'relative',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        transform: (playable || isPressed) ? 'translateY(-0.5rem) scale(1.05)' : 'translateY(0)',
      }}
    >
      {/* Card background pattern */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        right: '10%',
        bottom: '10%',
        background: 'white',
        borderRadius: '0.375rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          color: bgColor,
          fontSize: cardSize.fontSize,
          fontWeight: 'bold',
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif',
        }}>
          {displayValue}
        </div>
      </div>

      {/* Small corner indicators */}
      <div style={{
        position: 'absolute',
        top: '0.3125rem',
        left: '0.3125rem',
        fontSize: '0.625rem',
        color: 'white',
        fontWeight: 'bold',
      }} aria-hidden="true">
        {value === 'wild' || value === 'draw4' ? '★' : displayValue}
      </div>
    </div>
  );
}
