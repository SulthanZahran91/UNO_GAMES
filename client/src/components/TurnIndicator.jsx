/**
 * Turn Indicator Component
 * Shows whose turn it is with clear visual feedback, next player preview, and turn sequence
 */

export default function TurnIndicator({
  currentPlayer,
  isMyTurn,
  direction,
  players,
  currentPlayerIndex,
  myUid
}) {
  if (!currentPlayer) return null;

  // Calculate next player
  const getNextPlayerIndex = () => {
    if (!players || players.length < 2) return null;
    const increment = direction === 'clockwise' ? 1 : -1;
    return (currentPlayerIndex + increment + players.length) % players.length;
  };

  const nextPlayerIndex = getNextPlayerIndex();
  const nextPlayer = nextPlayerIndex !== null ? players[nextPlayerIndex] : null;

  // Get turn sequence (current, next, next+1)
  const getTurnSequence = () => {
    if (!players || players.length < 2) return [];
    const sequence = [];
    let index = currentPlayerIndex;
    const increment = direction === 'clockwise' ? 1 : -1;

    for (let i = 0; i < Math.min(3, players.length); i++) {
      const player = players[index];
      sequence.push({
        ...player,
        isMe: player.uid === myUid,
        isCurrent: i === 0
      });
      index = (index + increment + players.length) % players.length;
    }

    return sequence;
  };

  const turnSequence = getTurnSequence();

  return (
    <div style={{
      position: 'fixed',
      top: '1.25rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
      maxWidth: '95vw',
    }}>
      {/* Main Turn Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.9375rem',
        padding: '0.9375rem 1.875rem',
        background: isMyTurn
          ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.9) 0%, rgba(0, 200, 0, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 170, 0, 0.9) 0%, rgba(255, 140, 0, 0.95) 100%)',
        borderRadius: '3.125rem',
        boxShadow: isMyTurn
          ? '0 0 1.875rem rgba(0, 255, 0, 0.6), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.3)'
          : '0 0.25rem 0.75rem rgba(0, 0, 0, 0.3)',
        border: isMyTurn ? '0.1875rem solid white' : '0.125rem solid white',
        animation: isMyTurn ? 'glow 2s infinite, pulse 1s ease-in-out infinite' : 'none',
        backgroundImage: isMyTurn
          ? 'repeating-linear-gradient(45deg, transparent, transparent 0.625rem, rgba(255, 255, 255, 0.1) 0.625rem, rgba(255, 255, 255, 0.1) 1.25rem)'
          : 'none',
      }}>
        {/* Direction Indicator */}
        <div style={{
          fontSize: '1.5rem',
          animation: 'rotate 2s linear infinite',
        }} role="img" aria-label={direction === 'clockwise' ? 'Clockwise direction' : 'Counter-clockwise direction'}>
          {direction === 'clockwise' ? '↻' : '↺'}
        </div>

        {/* Turn Text */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.0625rem',
            color: 'white',
            textShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.3)',
          }}>
            {isMyTurn ? '🎯 YOUR TURN!' : 'CURRENT TURN'}
          </div>
          <div style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.3)',
          }}>
            {currentPlayer.displayName}
          </div>
        </div>

        {/* Player Count */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '0.5rem 0.75rem',
          borderRadius: '1.25rem',
          fontSize: '0.875rem',
          fontWeight: 'bold',
          color: 'white',
        }} aria-label={`${players?.length || 0} players in game`}>
          {players?.length || 0} Players
        </div>
      </div>

      {/* Turn Sequence - Next Players Preview */}
      {turnSequence.length > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '1.5rem',
          border: '0.125rem solid rgba(255, 255, 255, 0.3)',
          fontSize: '0.75rem',
          color: 'white',
        }} role="status" aria-label="Turn sequence">
          <span style={{ color: '#aaa' }}>Next:</span>
          {turnSequence.slice(1).map((player, index) => (
            <span key={player.uid} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}>
              {index > 0 && <span style={{ color: '#666' }}>→</span>}
              <span style={{
                fontWeight: 'bold',
                color: player.isMe ? '#0f0' : 'white',
                textShadow: player.isMe ? '0 0 0.625rem rgba(0, 255, 0, 0.8)' : 'none',
              }}>
                {player.isMe ? 'You' : player.displayName}
              </span>
            </span>
          ))}
        </div>
      )}

      <style>{`
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 1.875rem rgba(0, 255, 0, 0.6), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 0 3.125rem rgba(0, 255, 0, 0.9), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.3);
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Mobile responsive */
        @media (max-width: 48rem) {
          [style*="fontSize: 1.5rem"] {
            font-size: 1.25rem !important;
          }
          [style*="fontSize: 1.125rem"] {
            font-size: 1rem !important;
          }
          [style*="padding: 0.9375rem 1.875rem"] {
            padding: 0.75rem 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
