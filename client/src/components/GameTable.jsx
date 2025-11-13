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
      padding: '30px',
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '12px',
      border: '2px solid rgba(255, 255, 255, 0.1)',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
    }}>
      {/* Game Info */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
      }}>
        <div>
          <div style={{ fontSize: '14px', color: '#aaa' }}>
            Current Player:
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#0ff',
            marginTop: '5px',
          }}>
            {currentPlayer?.displayName || 'Unknown'}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#aaa' }}>
            Direction:
          </div>
          <div style={{ fontSize: '24px', marginTop: '5px' }}>
            {direction === 'clockwise' ? '→' : '←'}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', color: '#aaa' }}>
            Active Color:
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginTop: '5px',
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
        gap: '40px',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Draw Pile */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '14px',
            color: '#aaa',
            marginBottom: '10px',
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
              marginTop: '10px',
              fontSize: '12px',
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
            fontSize: '14px',
            color: '#aaa',
            marginBottom: '10px',
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
