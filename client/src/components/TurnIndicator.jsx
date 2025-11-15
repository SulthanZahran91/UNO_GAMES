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
  myUid,
  timeRemaining
}) {
  if (!currentPlayer) return null;

  // Format time remaining
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    return seconds > 0 ? `${seconds}s` : 'Time\'s up!';
  };

  // Determine timer color based on urgency
  const getTimerColor = (seconds) => {
    if (seconds === null || seconds === undefined) return 'white';
    if (seconds <= 5) return '#ff4444'; // Red for last 5 seconds
    if (seconds <= 10) return '#ffaa00'; // Orange for 6-10 seconds
    return '#00ff00'; // Green for 11+ seconds
  };

  // Calculate next player (skipping eliminated players with 0 cards)
  const getNextPlayerIndex = () => {
    if (!players || players.length < 2) return null;
    const increment = direction === 'clockwise' ? 1 : -1;
    let nextIndex = (currentPlayerIndex + increment + players.length) % players.length;

    // Skip eliminated players (those with 0 cards)
    let attempts = 0;
    const maxAttempts = players.length;
    while (attempts < maxAttempts && players[nextIndex]?.cardCount === 0) {
      nextIndex = (nextIndex + increment + players.length) % players.length;
      attempts++;
    }

    return nextIndex;
  };

  const nextPlayerIndex = getNextPlayerIndex();
  const nextPlayer = nextPlayerIndex !== null ? players[nextPlayerIndex] : null;

  // Get turn sequence (current, next, next+1) - skip eliminated players
  const getTurnSequence = () => {
    if (!players || players.length < 2) return [];
    const sequence = [];
    let index = currentPlayerIndex;
    const increment = direction === 'clockwise' ? 1 : -1;
    const playersWithCards = players.filter(p => p.cardCount > 0).length;
    const maxSequence = Math.min(3, playersWithCards);

    for (let i = 0; i < maxSequence; i++) {
      const player = players[index];

      // Only add players with cards
      if (player && (i === 0 || player.cardCount > 0)) {
        sequence.push({
          ...player,
          isMe: player.uid === myUid,
          isCurrent: i === 0
        });
      }

      // Move to next player, skipping eliminated ones (except for first iteration)
      if (i < maxSequence - 1) {
        index = (index + increment + players.length) % players.length;
        let attempts = 0;
        while (attempts < players.length && players[index]?.cardCount === 0) {
          index = (index + increment + players.length) % players.length;
          attempts++;
        }
      }
    }

    return sequence;
  };

  const turnSequence = getTurnSequence();

  return (
    <>
      {/* Full screen border flash when it's your turn */}
      {isMyTurn && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: '6px solid #0f0',
          pointerEvents: 'none',
          zIndex: 999,
          animation: 'borderFlash 2s ease-in-out infinite',
          borderRadius: '8px',
        }} />
      )}

      <div style={{
        position: 'fixed',
        top: 'clamp(0.5rem, 2vh, 1.25rem)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'clamp(0.375rem, 1.5vh, 0.75rem)',
        maxWidth: '95vw',
        width: 'fit-content',
      }}>
      {/* Main Turn Indicator */}
      <div
        className="turn-indicator-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(0.375rem, 2vw, 0.75rem)',
          padding: 'clamp(0.5rem, 2vh, 0.75rem) clamp(0.75rem, 3vw, 1.25rem)',
          background: isMyTurn
            ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.9) 0%, rgba(0, 200, 0, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 170, 0, 0.9) 0%, rgba(255, 140, 0, 0.95) 100%)',
          borderRadius: 'clamp(1.5rem, 5vw, 3.125rem)',
          boxShadow: isMyTurn
            ? '0 0 1.875rem rgba(0, 255, 0, 0.6), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.3)'
            : '0 0.25rem 0.75rem rgba(0, 0, 0, 0.3)',
          border: isMyTurn ? '0.1875rem solid white' : '0.125rem solid white',
          animation: isMyTurn ? 'glow 2s infinite, pulse 1s ease-in-out infinite' : 'none',
          backgroundImage: isMyTurn
            ? 'repeating-linear-gradient(45deg, transparent, transparent 0.625rem, rgba(255, 255, 255, 0.1) 0.625rem, rgba(255, 255, 255, 0.1) 1.25rem)'
            : 'none',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}>
        {/* Direction Indicator */}
        <div style={{
          fontSize: 'clamp(0.875rem, 3vw, 1.25rem)',
          animation: 'rotate 2s linear infinite',
          flexShrink: 0,
        }} role="img" aria-label={direction === 'clockwise' ? 'Clockwise direction' : 'Counter-clockwise direction'}>
          {direction === 'clockwise' ? '↻' : '↺'}
        </div>

        {/* Turn Text */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: 0,
          flex: 1,
          overflow: 'hidden',
        }}>
          <div
            className="turn-indicator-label"
            style={{
              fontSize: 'clamp(0.5rem, 1.8vw, 0.7rem)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.0625rem',
              color: 'white',
              textShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.3)',
              whiteSpace: 'nowrap',
            }}>
            {isMyTurn ? '🎯 YOUR TURN!' : 'CURRENT TURN'}
          </div>
          <div style={{
            fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}>
            {currentPlayer.displayName}
          </div>
          {/* Timer Display */}
          {timeRemaining !== null && timeRemaining !== undefined && (
            <div style={{
              fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
              fontWeight: 'bold',
              color: getTimerColor(timeRemaining),
              textShadow: `0 0 0.5rem ${getTimerColor(timeRemaining)}`,
              marginTop: '0.125rem',
              animation: timeRemaining <= 5 ? 'timerPulse 0.5s ease-in-out infinite' : 'none',
            }}>
              ⏱️ {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        {/* Player Count */}
        <div
          className="player-count-badge"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: 'clamp(0.25rem, 1.5vh, 0.4rem) clamp(0.375rem, 2vw, 0.625rem)',
            borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
            fontSize: 'clamp(0.625rem, 2vw, 0.8rem)',
            fontWeight: 'bold',
            color: 'white',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
          aria-label={`${players?.length || 0} players in game`}>
          {players?.length || 0} Players
        </div>
      </div>

      {/* Turn Sequence - Next Players Preview */}
      {turnSequence.length > 1 && (
        <div
          className="turn-sequence-preview"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(0.25rem, 1.5vw, 0.4rem)',
            padding: 'clamp(0.25rem, 1.5vh, 0.4rem) clamp(0.5rem, 2.5vw, 0.8rem)',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 'clamp(0.75rem, 3vw, 1.25rem)',
            border: '0.125rem solid rgba(255, 255, 255, 0.3)',
            fontSize: 'clamp(0.5rem, 1.8vw, 0.7rem)',
            color: 'white',
            maxWidth: '90vw',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
          role="status"
          aria-label="Turn sequence">
          <span style={{ color: '#aaa', flexShrink: 0 }}>Next:</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(0.25rem, 1vw, 0.4rem)',
            overflow: 'hidden',
            minWidth: 0,
            flex: 1,
          }}>
            {turnSequence.slice(1).map((player, index) => (
              <span key={player.uid} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                minWidth: 0,
                overflow: 'hidden',
              }}>
                {index > 0 && <span style={{ color: '#666', flexShrink: 0 }}>→</span>}
                <span style={{
                  fontWeight: 'bold',
                  color: player.isMe ? '#0f0' : 'white',
                  textShadow: player.isMe ? '0 0 0.625rem rgba(0, 255, 0, 0.8)' : 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '15ch',
                }}>
                  {player.isMe ? 'You' : player.displayName}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes timerPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.8;
          }
        }

        @keyframes borderFlash {
          0%, 100% {
            opacity: 0.4;
            border-color: #0f0;
            box-shadow: inset 0 0 40px rgba(0, 255, 0, 0.5), 0 0 40px rgba(0, 255, 0, 0.5);
          }
          50% {
            opacity: 0.8;
            border-color: #5f5;
            box-shadow: inset 0 0 80px rgba(0, 255, 0, 0.8), 0 0 80px rgba(0, 255, 0, 0.8);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 2rem rgba(0, 255, 0, 0.8), 0 0 4rem rgba(0, 255, 0, 0.4), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.3);
          }
          33% {
            box-shadow: 0 0 3rem rgba(0, 255, 0, 1), 0 0 6rem rgba(0, 255, 0, 0.6), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.3);
          }
          66% {
            box-shadow: 0 0 4rem rgba(50, 255, 50, 1), 0 0 8rem rgba(50, 255, 50, 0.8), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.3);
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1) translateX(-50%);
          }
          25% {
            transform: scale(1.05) translateX(-50%);
          }
          50% {
            transform: scale(1.08) translateX(-50%);
          }
          75% {
            transform: scale(1.05) translateX(-50%);
          }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Mobile responsive - Hide turn sequence on very small screens */
        @media (max-width: 30rem) {
          .turn-sequence-preview {
            display: none !important;
          }

          .turn-indicator-card {
            padding: 0.4rem 0.6rem !important;
            gap: 0.3rem !important;
          }

          .turn-indicator-label {
            font-size: 0.5rem !important;
            letter-spacing: 0.03rem !important;
          }

          .player-count-badge {
            padding: 0.25rem 0.4rem !important;
            font-size: 0.6rem !important;
          }
        }

        /* Medium mobile - Simplify turn sequence */
        @media (max-width: 48rem) and (min-width: 30.0625rem) {
          .turn-sequence-preview {
            max-width: 85vw !important;
            padding: 0.3rem 0.6rem !important;
            font-size: 0.55rem !important;
          }

          .turn-indicator-card {
            padding: 0.5rem 0.75rem !important;
          }
        }

        /* Landscape mode optimization */
        @media (max-height: 30rem) {
          .turn-sequence-preview {
            display: none !important;
          }
        }
      `}</style>
      </div>
    </>
  );
}
