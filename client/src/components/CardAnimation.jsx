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
  fromPosition, // 'opponent-top', 'opponent-left', 'opponent-right', 'you', 'draw', or 'opponent-{index}-{angle}'
  onComplete
}) {
  const [isAnimating, setIsAnimating] = useState(true);

  // Determine if this is a power card
  const isPowerCard = card && ['skip', 'reverse', 'draw2', 'wild', 'draw4'].includes(card.value);

  // Extended animation time for power cards
  const animationDuration = isPowerCard ? 1500 : 1000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      if (onComplete) onComplete();
    }, animationDuration);

    return () => clearTimeout(timer);
  }, [onComplete, animationDuration]);

  if (!isAnimating) return null;

  // Calculate positions for circular layout
  const getPosition = (positionKey) => {
    const staticPositions = {
      'opponent-top': { x: '50%', y: '10%' },
      'opponent-left': { x: '10%', y: '30%' },
      'opponent-right': { x: '90%', y: '30%' },
      'you': { x: '50%', y: '90%' },
      'draw': { x: '30%', y: '50%' },
      'center': { x: '50%', y: '50%' }
    };

    // Check for static positions first
    if (staticPositions[positionKey]) {
      return staticPositions[positionKey];
    }

    // Handle circular positioning: 'opponent-{index}-{angle}'
    if (positionKey.startsWith('opponent-')) {
      const parts = positionKey.split('-');
      if (parts.length === 3) {
        const angle = parseFloat(parts[2]);
        const radiusX = 45;
        const radiusY = 40;
        const angleRad = (angle * Math.PI) / 180;
        const x = 50 + radiusX * Math.sin(angleRad);
        const y = 5 + radiusY * (1 - Math.cos(angleRad));
        return { x: `${x}%`, y: `${y}%` };
      }
    }

    return staticPositions.you;
  };

  const startPos = getPosition(fromPosition);
  const endPos = type === 'play' ? getPosition('center') : startPos;

  // Get power card specific effects
  const getPowerCardEffect = () => {
    if (!isPowerCard) return null;

    const effects = {
      'skip': { emoji: '🚫', color: '#ff5555', text: 'SKIP!', glow: 'rgba(255, 85, 85, 0.8)' },
      'reverse': { emoji: '🔄', color: '#5555ff', text: 'REVERSE!', glow: 'rgba(85, 85, 255, 0.8)' },
      'draw2': { emoji: '➕2️⃣', color: '#ff9500', text: 'DRAW 2!', glow: 'rgba(255, 149, 0, 0.8)' },
      'wild': { emoji: '🌈', color: '#aa55ff', text: 'WILD!', glow: 'rgba(170, 85, 255, 0.8)' },
      'draw4': { emoji: '⚡➕4️⃣', color: '#ff0000', text: 'WILD DRAW 4!', glow: 'rgba(255, 0, 0, 0.9)' },
    };

    return effects[card.value] || null;
  };

  const powerEffect = getPowerCardEffect();

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
      {/* Power card screen flash effect */}
      {isPowerCard && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: powerEffect?.glow || 'rgba(255, 255, 255, 0.5)',
          animation: 'flashScreen 0.5s ease-out',
        }} />
      )}

      {/* Animation notification */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: isPowerCard
          ? `linear-gradient(135deg, ${powerEffect?.color || '#000'} 0%, rgba(0, 0, 0, 0.9) 100%)`
          : 'rgba(0, 0, 0, 0.8)',
        padding: isPowerCard ? '30px 50px' : '20px 40px',
        borderRadius: '12px',
        fontSize: isPowerCard ? '32px' : '24px',
        fontWeight: 'bold',
        color: 'white',
        animation: isPowerCard ? 'powerCardNotification 1.5s ease-in-out' : 'fadeInOut 1s ease-in-out',
        textAlign: 'center',
        border: isPowerCard ? `4px solid ${powerEffect?.color || 'white'}` : 'none',
        boxShadow: isPowerCard ? `0 0 40px ${powerEffect?.glow || 'rgba(255, 255, 255, 0.5)'}` : 'none',
      }}>
        {type === 'play' && !isPowerCard && `🃏 ${playerName} played`}
        {type === 'play' && isPowerCard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <div style={{ fontSize: '48px' }}>{powerEffect?.emoji}</div>
            <div>{playerName} played</div>
            <div style={{
              fontSize: '36px',
              textShadow: `0 0 20px ${powerEffect?.glow}`,
              animation: 'pulse 0.5s ease-in-out infinite'
            }}>
              {powerEffect?.text}
            </div>
          </div>
        )}
        {type === 'draw' && `🎴 ${playerName} drew a card`}
      </div>

      {/* Animated card with trail effect */}
      {card && type === 'play' && (
        <>
          {/* Card trail for more dramatic effect */}
          <div style={{
            position: 'absolute',
            top: startPos.y,
            left: startPos.x,
            transform: 'translate(-50%, -50%)',
            animation: isPowerCard ? 'cardPlayPower 1.5s ease-in-out' : 'cardPlay 1s ease-in-out',
            animationFillMode: 'forwards',
            filter: isPowerCard ? `drop-shadow(0 0 30px ${powerEffect?.glow})` : 'none',
          }}>
            <div style={{
              animation: isPowerCard ? 'cardRotatePower 1.5s ease-in-out' : 'none',
            }}>
              <Card card={card} size="large" />
            </div>
          </div>

          {/* Particle effects for power cards */}
          {isPowerCard && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'particleBurst 1.5s ease-out',
            }}>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: powerEffect?.color || 'white',
                    animation: `particle${i} 1.5s ease-out`,
                    animationFillMode: 'forwards',
                  }}
                />
              ))}
            </div>
          )}
        </>
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

        @keyframes powerCardNotification {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
          25% { transform: translate(-50%, -50%) scale(0.95); }
          30% { transform: translate(-50%, -50%) scale(1.1); }
          85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }

        @keyframes flashScreen {
          0% { opacity: 0.8; }
          50% { opacity: 0.4; }
          100% { opacity: 0; }
        }

        @keyframes cardPlay {
          0% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -200%) scale(1.5) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes cardPlayPower {
          0% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
          30% {
            transform: translate(-50%, -300%) scale(2) rotate(180deg);
            opacity: 1;
          }
          60% {
            transform: translate(-50%, -100%) scale(1.8) rotate(360deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.2) rotate(540deg);
            opacity: 0;
          }
        }

        @keyframes cardRotatePower {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-15deg) scale(1.1); }
          75% { transform: rotate(15deg) scale(1.1); }
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

        @keyframes particleBurst {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes particle0 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(100px, -100px) scale(0); opacity: 0; }
        }

        @keyframes particle1 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(140px, 0) scale(0); opacity: 0; }
        }

        @keyframes particle2 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(100px, 100px) scale(0); opacity: 0; }
        }

        @keyframes particle3 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(0, 140px) scale(0); opacity: 0; }
        }

        @keyframes particle4 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-100px, 100px) scale(0); opacity: 0; }
        }

        @keyframes particle5 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-140px, 0) scale(0); opacity: 0; }
        }

        @keyframes particle6 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-100px, -100px) scale(0); opacity: 0; }
        }

        @keyframes particle7 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(0, -140px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
