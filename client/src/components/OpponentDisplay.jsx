import CardBack from './CardBack';

/**
 * Opponent Display Component
 * Shows other players with their card counts and status
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

  // Calculate opponent positions based on player count
  const getPosition = (index, total) => {
    if (total === 1) return 'top';
    if (total === 2) return index === 0 ? 'top-left' : 'top-right';
    // 3 opponents: left, top, right
    if (index === 0) return 'left';
    if (index === 1) return 'top';
    return 'right';
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '200px',
      marginBottom: '20px',
    }}>
      {opponents.map((opponent, index) => {
        const position = getPosition(index, opponents.length);
        const isCurrentPlayer = players[currentPlayerIndex]?.uid === opponent.uid;
        const playerIndex = players.findIndex(p => p.uid === opponent.uid);

        // Position styles
        const positionStyles = {
          'top': { top: '0', left: '50%', transform: 'translateX(-50%)' },
          'top-left': { top: '0', left: '20%' },
          'top-right': { top: '0', right: '20%' },
          'left': { top: '50%', left: '0', transform: 'translateY(-50%)' },
          'right': { top: '50%', right: '0', transform: 'translateY(-50%)' },
        };

        return (
          <div
            key={opponent.uid}
            style={{
              position: 'absolute',
              ...positionStyles[position],
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '15px',
              background: isCurrentPlayer
                ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.2) 0%, rgba(0, 200, 0, 0.3) 100%)'
                : 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              border: isCurrentPlayer ? '3px solid #0f0' : '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: isCurrentPlayer
                ? '0 0 20px rgba(0, 255, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)'
                : '0 4px 12px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
              minWidth: '140px',
              animation: isCurrentPlayer ? 'pulse 2s infinite' : 'none',
            }}
          >
            {/* Player Avatar/Icon */}
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              border: '3px solid white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}>
              {opponent.displayName.charAt(0).toUpperCase()}
            </div>

            {/* Player Name */}
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: isCurrentPlayer ? '#0f0' : 'white',
            }}>
              {opponent.displayName}
            </div>

            {/* Card Count Display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <CardBack size="small" />
              <div style={{
                fontSize: '20px',
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
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                animation: 'blink 1s infinite',
              }}>
                UNO!
              </div>
            )}

            {/* Turn Indicator */}
            {isCurrentPlayer && (
              <div style={{
                fontSize: '12px',
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

      {/* Add keyframe animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3); }
          50% { box-shadow: 0 0 40px rgba(0, 255, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.3); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
