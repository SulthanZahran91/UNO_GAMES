/**
 * Card Animation Component
 * Shows animations for card plays and draws
 */

import { useState, useEffect } from 'react';
import Card from './Card';

export default function CardAnimation({
  type, // 'play' or 'draw'
  card,
  playerName,
  fromPosition, // 'opponent-top', 'opponent-left', 'opponent-right', 'you', 'draw'
  onComplete
}) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      if (onComplete) onComplete();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isAnimating) return null;

  // Determine start and end positions
  const positions = {
    'opponent-top': { x: '50%', y: '10%' },
    'opponent-left': { x: '10%', y: '30%' },
    'opponent-right': { x: '90%', y: '30%' },
    'you': { x: '50%', y: '90%' },
    'draw': { x: '30%', y: '50%' },
    'center': { x: '50%', y: '50%' }
  };

  const startPos = positions[fromPosition] || positions.you;
  const endPos = type === 'play' ? positions.center : positions[fromPosition];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 10000,
    }}>
      {/* Animation notification */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '20px 40px',
        borderRadius: '12px',
        fontSize: '24px',
        fontWeight: 'bold',
        color: 'white',
        animation: 'fadeInOut 1s ease-in-out',
        textAlign: 'center',
      }}>
        {type === 'play' && `🃏 ${playerName} played`}
        {type === 'draw' && `🎴 ${playerName} drew a card`}
      </div>

      {/* Animated card */}
      {card && type === 'play' && (
        <div style={{
          position: 'absolute',
          top: startPos.y,
          left: startPos.x,
          transform: 'translate(-50%, -50%)',
          animation: `cardPlay 1s ease-in-out`,
          animationFillMode: 'forwards',
        }}>
          <Card card={card} size="large" />
        </div>
      )}

      {/* Card back for draw animation */}
      {type === 'draw' && (
        <div style={{
          position: 'absolute',
          top: positions.draw.y,
          left: positions.draw.x,
          transform: 'translate(-50%, -50%)',
          animation: `cardDraw 1s ease-in-out`,
          animationFillMode: 'forwards',
          '--end-x': endPos.x,
          '--end-y': endPos.y,
        }}>
          <div style={{
            width: '80px',
            height: '120px',
            background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
            borderRadius: '8px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ff5555',
            fontSize: '16px',
            fontWeight: 'bold',
          }}>
            UNO
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }

        @keyframes cardPlay {
          0% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -200%) scale(1.3) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes cardDraw {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(var(--end-x) - 50%), calc(var(--end-y) - 50%)) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
