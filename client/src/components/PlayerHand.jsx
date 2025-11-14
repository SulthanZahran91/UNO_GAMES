import { useState, useEffect } from 'react';
import Card from './Card';
import { canPlayCard } from '../utils/cardValidation';

/**
 * Player Hand Component
 * Displays the current player's cards in a fan layout
 * Optimized for mobile with horizontal scrolling
 * Supports multi-card selection for number stacking
 */

export default function PlayerHand({
  hand = [],
  onCardClick,
  onMultiCardPlay, // New callback for playing multiple cards
  currentCard,
  activeColor,
  disabled = false,
  loading = false,
  pendingDrawCount = 0
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedIndices, setSelectedIndices] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear selection when disabled or hand changes
  useEffect(() => {
    if (disabled) {
      setSelectedIndices([]);
    }
  }, [disabled]);

  console.log('👋 PlayerHand render:', {
    cardCount: hand.length,
    hand: hand,
    handIsArray: Array.isArray(hand),
    disabled,
    currentCard,
    activeColor,
    loading,
    selectedIndices,
  });

  const handleCardClickInternal = (card, index, event) => {
    // Check if shift/ctrl/cmd key is pressed for multi-selection
    const isMultiSelectKey = event?.shiftKey || event?.ctrlKey || event?.metaKey;

    if (isMultiSelectKey && !disabled) {
      // Multi-select mode
      const isNumberCard = /^[0-9]$/.test(card.value);

      if (!isNumberCard) {
        // Can't stack non-number cards
        onCardClick && onCardClick(card, index);
        return;
      }

      if (selectedIndices.length === 0) {
        // First card selected
        setSelectedIndices([index]);
      } else {
        // Check if this card has the same value as already selected cards
        const firstSelectedCard = hand[selectedIndices[0]];
        if (card.value === firstSelectedCard.value) {
          // Toggle selection
          if (selectedIndices.includes(index)) {
            setSelectedIndices(selectedIndices.filter(i => i !== index));
          } else {
            setSelectedIndices([...selectedIndices, index]);
          }
        } else {
          // Different value, can't stack - clear selection and select this one
          setSelectedIndices([index]);
        }
      }
    } else {
      // Normal click - play the card or selected cards
      if (selectedIndices.length > 0 && selectedIndices.includes(index)) {
        // Play all selected cards
        if (onMultiCardPlay) {
          onMultiCardPlay(selectedIndices);
          setSelectedIndices([]);
        }
      } else {
        // Single card play or clear selection
        setSelectedIndices([]);
        onCardClick && onCardClick(card, index);
      }
    }
  };

  const handlePlaySelected = () => {
    if (selectedIndices.length > 0 && onMultiCardPlay) {
      onMultiCardPlay(selectedIndices);
      setSelectedIndices([]);
    }
  };

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
                          canPlayCard(card, currentCard, activeColor, pendingDrawCount);

          const isSelected = selectedIndices.includes(index);

          return (
            <div
              key={`${card.color}-${card.value}-${index}`}
              style={{
                position: 'relative',
                transform: isSelected ? 'translateY(-10px)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            >
              <Card
                card={card}
                onClick={(e) => handleCardClickInternal(card, index, e)}
                disabled={disabled}
                playable={playable}
                size="normal"
              />
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#4CAF50',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}>
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Play Selected Button */}
      {selectedIndices.length > 1 && (
        <div style={{
          marginTop: 'clamp(0.625rem, 2.5vw, 0.9375rem)',
          textAlign: 'center',
        }}>
          <button
            onClick={handlePlaySelected}
            disabled={disabled}
            style={{
              padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              fontWeight: 'bold',
              color: 'white',
              background: disabled ? '#666' : 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              border: 'none',
              borderRadius: 'clamp(0.375rem, 1.5vw, 0.5rem)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              boxShadow: '0 0.25rem 0.5rem rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 0.375rem 0.75rem rgba(0, 0, 0, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 0.25rem 0.5rem rgba(0, 0, 0, 0.3)';
            }}
          >
            🎴 Play {selectedIndices.length} Cards (Stack)
          </button>
          <div style={{
            marginTop: '0.5rem',
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            color: '#aaa',
          }}>
            💡 Tip: Hold Shift/Ctrl and click cards to select multiple
          </div>
        </div>
      )}

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
