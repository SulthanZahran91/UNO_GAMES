/**
 * Turn Indicator Component
 * Shows whose turn it is with clear visual feedback
 */

export default function TurnIndicator({
  currentPlayer,
  isMyTurn,
  direction,
  players
}) {
  if (!currentPlayer) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '15px 30px',
      background: isMyTurn
        ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.9) 0%, rgba(0, 200, 0, 0.95) 100%)'
        : 'linear-gradient(135deg, rgba(255, 170, 0, 0.9) 0%, rgba(255, 140, 0, 0.95) 100%)',
      borderRadius: '50px',
      boxShadow: isMyTurn
        ? '0 0 30px rgba(0, 255, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3)'
        : '0 4px 12px rgba(0, 0, 0, 0.3)',
      border: '3px solid white',
      animation: isMyTurn ? 'glow 2s infinite' : 'none',
    }}>
      {/* Direction Indicator */}
      <div style={{
        fontSize: '24px',
        animation: 'rotate 2s linear infinite',
      }}>
        {direction === 'clockwise' ? '↻' : '↺'}
      </div>

      {/* Turn Text */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'white',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        }}>
          {isMyTurn ? 'YOUR TURN!' : 'CURRENT TURN'}
        </div>
        <div style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        }}>
          {currentPlayer.displayName}
        </div>
      </div>

      {/* Player Count */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '8px 12px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: 'white',
      }}>
        {players?.length || 0} Players
      </div>

      <style>{`
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 0 50px rgba(0, 255, 0, 0.9), 0 4px 12px rgba(0, 0, 0, 0.3);
          }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
