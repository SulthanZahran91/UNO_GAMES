/**
 * UNO Card Component
 * Displays a single UNO card with proper styling and colors
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
  if (!card) {
    console.warn('⚠️ Card component: No card provided');
    return null;
  }

  const { color, value } = card;
  const bgColor = CARD_COLORS[color] || '#666';

  // Determine display value
  const displayValue = CARD_SYMBOLS[value] || value.toUpperCase();

  // Size variants
  const sizes = {
    small: { width: '60px', height: '90px', fontSize: '14px' },
    normal: { width: '80px', height: '120px', fontSize: '20px' },
    large: { width: '120px', height: '180px', fontSize: '32px' },
  };

  const cardSize = sizes[size] || sizes.normal;

  const handleClick = () => {
    if (!disabled && onClick) {
      console.log('🃏 Card clicked:', card);
      onClick(card);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: cardSize.width,
        height: cardSize.height,
        background: bgColor,
        borderRadius: '8px',
        border: playable ? '3px solid #0f0' : '2px solid rgba(255, 255, 255, 0.3)',
        boxShadow: playable
          ? '0 0 15px rgba(0, 255, 0, 0.5)'
          : '0 4px 6px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : (onClick ? 'pointer' : 'default'),
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        position: 'relative',
        userSelect: 'none',
        transform: playable ? 'translateY(-8px)' : 'translateY(0)',
      }}
      onMouseEnter={(e) => {
        if (!disabled && onClick) {
          e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && onClick) {
          e.currentTarget.style.transform = playable ? 'translateY(-8px)' : 'translateY(0)';
        }
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
        borderRadius: '6px',
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
        top: '5px',
        left: '5px',
        fontSize: '10px',
        color: 'white',
        fontWeight: 'bold',
      }}>
        {value === 'wild' || value === 'draw4' ? '★' : displayValue}
      </div>
    </div>
  );
}
