import CardBack from './CardBack';

/**
 * Opponent Display Component
 * Shows other players with their card counts and status
 * Now with responsive positioning and touch-friendly design
 */

const PLAYER_COLORS = ['#ff5555', '#5555ff', '#55aa55', '#ffaa00'];

export default function OpponentDisplay({
  players,
  currentPlayerIndex,
  myUid,
  direction
}) {
  // Get opponents (all players except me)
  const opponents = players.filter(p => p.uid !== myUid);

  // Calculate opponent positions in a circular layout
  // For up to 11 opponents (12 players total with you at the bottom)
  const getPosition = (index, total) => {
    if (total === 1) return { type: 'top', angle: 0 };
    if (total === 2) return { type: index === 0 ? 'top-left' : 'top-right', angle: index === 0 ? -45 : 45 };

    // For 3+ opponents, distribute them in a semi-circle from left to right
    // Angle ranges from -90° (left) to 90° (right)
    const angleStep = 180 / (total + 1);
    const angle = -90 + (angleStep * (index + 1));

    return { type: 'circular', angle };
  };

  return (
    <div className="opponent-display-container" style={{
      position: 'relative',
      width: '100%',
      minHeight: '12.5rem',
      marginBottom: '1.25rem',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '1rem',
      padding: '0.5rem',
    }}>
      {opponents.map((opponent, index) => {
        const position = getPosition(index, opponents.length);
        const isCurrentPlayer = players[currentPlayerIndex]?.uid === opponent.uid;
        const playerIndex = players.findIndex(p => p.uid === opponent.uid);

        // Calculate position styles based on circular layout
        const getPositionStyle = () => {
          if (position.type === 'top') {
            return {
              position: 'absolute',
              top: '0',
              left: '50%',
              transform: 'translateX(-50%)',
            };
          }

          if (position.type === 'top-left') {
            return {
              position: 'absolute',
              top: '0',
              left: 'clamp(0.5rem, 10%, 5rem)',
            };
          }

          if (position.type === 'top-right') {
            return {
              position: 'absolute',
              top: '0',
              right: 'clamp(0.5rem, 10%, 5rem)',
            };
          }

          // Circular positioning for 3+ opponents
          // Use a semi-circle arc with center at bottom
          const radiusX = 45; // percentage from center
          const radiusY = 40; // percentage from center
          const angleRad = (position.angle * Math.PI) / 180;

          // Calculate position on the arc
          const x = 50 + radiusX * Math.sin(angleRad);
          const y = 5 + radiusY * (1 - Math.cos(angleRad));

          return {
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
          };
        };

        const positionStyle = getPositionStyle();

        return (
          <div
            key={opponent.uid}
            className="opponent-card"
            style={{
              ...positionStyle,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.9375rem',
              background: isCurrentPlayer
                ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.2) 0%, rgba(0, 200, 0, 0.3) 100%)'
                : 'rgba(0, 0, 0, 0.3)',
              borderRadius: '0.75rem',
              border: isCurrentPlayer ? '0.1875rem solid #0f0' : '0.125rem solid rgba(255, 255, 255, 0.2)',
              boxShadow: isCurrentPlayer
                ? '0 0 1.25rem rgba(0, 255, 0, 0.5), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.3)'
                : '0 0.25rem 0.75rem rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
              minWidth: '8.75rem',
              animation: isCurrentPlayer ? 'pulse 2s infinite' : 'none',
            }}
            role="status"
            aria-label={`${opponent.displayName}, ${opponent.hand?.length || 0} cards${isCurrentPlayer ? ', current turn' : ''}`}
          >
            {/* Player Avatar/Icon */}
            <div style={{
              width: '3.125rem',
              height: '3.125rem',
              minWidth: '3.125rem',
              minHeight: '3.125rem',
              borderRadius: '50%',
              background: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white',
              border: '0.1875rem solid white',
              boxShadow: '0 0.125rem 0.5rem rgba(0, 0, 0, 0.3)',
            }} aria-hidden="true">
              {opponent.displayName.charAt(0).toUpperCase()}
            </div>

            {/* Player Name */}
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 'bold',
              textAlign: 'center',
              color: isCurrentPlayer ? '#0f0' : 'white',
              wordBreak: 'break-word',
              maxWidth: '100%',
            }}>
              {opponent.displayName}
            </div>

            {/* Card Count Display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <CardBack size="small" />
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: opponent.hand?.length === 1 ? '#ff5555' : 'white',
              }}>
                × {opponent.hand?.length || 0}
              </div>
            </div>

            {/* UNO Warning */}
            {opponent.hand?.length === 1 && (
              <div style={{
                background: '#ff5555',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.75rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                animation: 'blink 1s infinite',
              }} role="alert">
                UNO!
              </div>
            )}

            {/* Turn Indicator */}
            {isCurrentPlayer && (
              <div style={{
                fontSize: '0.75rem',
                color: '#0f0',
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
                {direction === 'clockwise' ? '→' : '←'} Their Turn
              </div>
            )}
          </div>
        );
      })}

      {/* Add keyframe animations and responsive styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 1.25rem rgba(0, 255, 0, 0.5), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.3); }
          50% { box-shadow: 0 0 2.5rem rgba(0, 255, 0, 0.8), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.3); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Mobile: Stack opponents in a row */
        @media (max-width: 48rem) {
          .opponent-display-container {
            min-height: auto !important;
            padding: 0.5rem !important;
          }

          .opponent-card {
            position: relative !important;
            transform: none !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            min-width: 7rem !important;
            padding: 0.75rem !important;
          }
        }

        /* Very small screens - compact layout */
        @media (max-width: 30rem) {
          .opponent-card {
            min-width: 6rem !important;
            padding: 0.5rem !important;
            gap: 0.375rem !important;
          }
        }
      `}</style>
    </div>
  );
}
