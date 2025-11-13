import Card from './Card';
import CardBack from './CardBack';

/**
 * Game Table Component
 * Shows the center area with current card, draw pile, and game info
 */

export default function GameTable({
  currentCard,
  activeColor,
  direction,
  currentPlayerIndex,
  players,
  onDrawCard,
  canDraw = false,
  drawPileCount = 0,
}) {
  console.log('🎯 GameTable render:', {
    currentCard,
    activeColor,
    direction,
    currentPlayerIndex,
    canDraw,
  });

  const currentPlayer = players?.[currentPlayerIndex];

  return (
    <div style={{
      padding: 'clamp(0.75rem, 3vw, 1.875rem)',
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 'clamp(0.5rem, 2vw, 0.75rem)',
      border: '2px solid rgba(255, 255, 255, 0.1)',
      minHeight: 'clamp(200px, 40vh, 300px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'clamp(0.75rem, 2.5vw, 1.25rem)',
    }}>
      {/* Game Info */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'clamp(0.5rem, 2vw, 0.9375rem)',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 'clamp(0.375rem, 1.5vw, 0.5rem)',
        gap: 'clamp(0.5rem, 2vw, 1rem)',
      }}>
        <div>
          <div style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.875rem)', color: '#aaa' }}>
            Current Player:
          </div>
          <div style={{
            fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)',
            fontWeight: 'bold',
            color: '#0ff',
            marginTop: 'clamp(0.25rem, 1vw, 0.3125rem)',
          }}>
            {currentPlayer?.displayName || 'Unknown'}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.875rem)', color: '#aaa' }}>
            Direction:
          </div>
          <div style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', marginTop: 'clamp(0.25rem, 1vw, 0.3125rem)' }}>
            {direction === 'clockwise' ? '→' : '←'}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.875rem)', color: '#aaa' }}>
            Active Color:
          </div>
          <div style={{
            fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)',
            fontWeight: 'bold',
            marginTop: 'clamp(0.25rem, 1vw, 0.3125rem)',
            color: activeColor === 'red' ? '#ff5555'
                 : activeColor === 'blue' ? '#5555ff'
                 : activeColor === 'green' ? '#55aa55'
                 : activeColor === 'yellow' ? '#ffaa00'
                 : '#fff',
          }}>
            {activeColor ? activeColor.toUpperCase() : 'N/A'}
          </div>
        </div>
      </div>

      {/* Card Area */}
      <div style={{
        display: 'flex',
        gap: 'clamp(1rem, 4vw, 2.5rem)',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {/* Draw Pile */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'clamp(0.625rem, 2.5vw, 0.875rem)',
            color: '#aaa',
            marginBottom: 'clamp(0.375rem, 1.5vw, 0.625rem)',
          }}>
            Draw Pile
          </div>
          <CardBack
            onClick={canDraw ? onDrawCard : null}
            size="large"
            label={`${drawPileCount} left`}
          />
          {canDraw && (
            <div style={{
              marginTop: 'clamp(0.375rem, 1.5vw, 0.625rem)',
              fontSize: 'clamp(0.625rem, 2vw, 0.75rem)',
              color: '#0f0',
              animation: 'pulse 2s infinite',
            }}>
              ↑ Click to draw
            </div>
          )}
        </div>

        {/* Current Card */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 'clamp(0.625rem, 2.5vw, 0.875rem)',
            color: '#aaa',
            marginBottom: 'clamp(0.375rem, 1.5vw, 0.625rem)',
          }}>
            Current Card
          </div>
          {currentCard ? (
            <Card
              card={currentCard}
              size="large"
            />
          ) : (
            <div style={{
              width: '120px',
              height: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #666',
              borderRadius: '8px',
              color: '#666',
            }}>
              No card
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
