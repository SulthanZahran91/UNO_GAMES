/**
 * Card Back Component
 * Shows the back of a UNO card (for opponent hands and draw pile)
 */

export default function CardBack({ onClick, size = 'normal', label = '' }) {
  const sizes = {
    small: { width: '60px', height: '90px', fontSize: '12px' },
    normal: { width: '80px', height: '120px', fontSize: '16px' },
    large: { width: '120px', height: '180px', fontSize: '24px' },
  };

  const cardSize = sizes[size] || sizes.normal;

  const handleClick = () => {
    if (onClick) {
      console.log('🎴 Card back clicked');
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: cardSize.width,
        height: cardSize.height,
        background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
        borderRadius: '8px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* UNO logo pattern */}
      <div style={{
        color: '#ff5555',
        fontSize: cardSize.fontSize,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
      }}>
        UNO
      </div>

      {label && (
        <div style={{
          position: 'absolute',
          bottom: '5px',
          fontSize: '10px',
          color: '#aaa',
        }}>
          {label}
        </div>
      )}
    </div>
  );
}
