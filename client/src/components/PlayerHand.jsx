import { useState, useEffect } from 'react';
import Card from './Card';
import { isValidMove } from '../utils/cardValidation';

/**
 * Player Hand Component
 * Displays the current player's cards in a fan layout
 * Optimized for mobile with horizontal scrolling
 */

export default function PlayerHand({
  hand = [],
  onCardClick,
  currentCard,
  activeColor,
  disabled = false,
  loading = false
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  console.log('👋 PlayerHand render:', {
    cardCount: hand.length,
    hand: hand,
    handIsArray: Array.isArray(hand),
    disabled,
    currentCard,
    activeColor,
    loading,
  });

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#aaa',
      }}>
        Loading your cards...
      </div>
    );
  }

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
      padding: 'clamp(0.75rem, 3vw, 1.25rem)',
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 'clamp(0.5rem, 2vw, 0.75rem)',
      border: '0.125rem solid rgba(255, 255, 255, 0.1)',
    }}>
      <h3 style={{
        marginBottom: 'clamp(0.625rem, 2.5vw, 0.9375rem)',
        fontSize: 'clamp(0.875rem, 3vw, 1rem)',
        color: '#aaa',
        textAlign: 'center',
      }}>
        Your Hand ({hand.length} cards)
      </h3>

      <div style={{
        display: 'flex',
        justifyContent: isMobile ? 'flex-start' : 'center',
        alignItems: 'flex-end',
        gap: 'clamp(0.375rem, 2vw, 0.625rem)',
        flexWrap: isMobile ? 'nowrap' : 'wrap',
        minHeight: 'clamp(6rem, 20vw, 8.75rem)',
        overflowX: isMobile ? 'auto' : 'visible',
        overflowY: 'visible',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
        paddingBottom: '0.5rem',
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
          marginTop: 'clamp(0.625rem, 2.5vw, 0.9375rem)',
          padding: 'clamp(0.5rem, 2vw, 0.75rem)',
          background: 'rgba(255, 170, 0, 0.2)',
          borderRadius: 'clamp(0.25rem, 1vw, 0.375rem)',
          textAlign: 'center',
          fontSize: 'clamp(0.8125rem, 2.5vw, 0.875rem)',
          color: '#ffaa00',
        }}>
          ⏳ Wait for your turn
        </div>
      )}
    </div>
  );
}
