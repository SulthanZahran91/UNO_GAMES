import Card from './Card';
import { isValidMove } from '../utils/cardValidation';

/**
 * Player Hand Component
 * Displays the current player's cards in a fan layout
 */

export default function PlayerHand({
  hand = [],
  onCardClick,
  currentCard,
  activeColor,
  disabled = false
}) {
  console.log('👋 PlayerHand render:', {
    cardCount: hand.length,
    disabled,
    currentCard,
    activeColor,
  });

  if (!hand || hand.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#aaa',
      }}>
        No cards in hand
      </div>
    );
  }

  return (
    <div style={{
      padding: '1.25rem',
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '0.75rem',
      border: '0.125rem solid rgba(255, 255, 255, 0.1)',
    }}>
      <h3 style={{
        marginBottom: '0.9375rem',
        fontSize: '1rem',
        color: '#aaa',
        textAlign: 'center',
      }}>
        Your Hand ({hand.length} cards)
      </h3>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: '0.625rem',
        flexWrap: 'wrap',
        minHeight: '8.75rem',
      }}>
        {hand.map((card, index) => {
          // Check if this card can be played
          const playable = !disabled &&
                          currentCard &&
                          activeColor &&
                          isValidMove(card, currentCard, activeColor);

          return (
            <Card
              key={`${card.color}-${card.value}-${index}`}
              card={card}
              onClick={() => onCardClick && onCardClick(card, index)}
              disabled={disabled}
              playable={playable}
              size="normal"
            />
          );
        })}
      </div>

      {disabled && (
        <div style={{
          marginTop: '0.9375rem',
          padding: '0.75rem',
          background: 'rgba(255, 170, 0, 0.2)',
          borderRadius: '0.375rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#ffaa00',
        }}>
          ⏳ Wait for your turn
        </div>
      )}
    </div>
  );
}
