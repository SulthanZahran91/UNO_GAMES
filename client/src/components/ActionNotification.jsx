/**
 * Action Notification Component
 * Shows recent game actions with animations
 * Mobile optimized: Shows max 2 notifications with 4s auto-dismiss
 */

import { useState, useEffect } from 'react';

export default function ActionNotification({ gameLog }) {
  const [recentActions, setRecentActions] = useState([]);

  useEffect(() => {
    if (!gameLog || gameLog.length === 0) return;

    // Get the last 2 actions (reduced for mobile readability)
    const latest = gameLog.slice(-2).reverse();
    setRecentActions(latest);

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      setRecentActions([]);
    }, 4000);

    return () => clearTimeout(timer);
  }, [gameLog]);

  if (recentActions.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '5rem',
      right: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.625rem',
      zIndex: 1000,
      maxWidth: '21.875rem',
      pointerEvents: 'none',
    }}>
      {recentActions.map((action, index) => (
        <div
          key={`${action}-${index}`}
          role="status"
          aria-live="polite"
          style={{
            background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95) 0%, rgba(64, 64, 64, 0.95) 100%)',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.5rem',
            boxShadow: '0 0.25rem 0.75rem rgba(0, 0, 0, 0.5)',
            border: '0.125rem solid rgba(255, 255, 255, 0.2)',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'white',
            animation: `slideIn 0.3s ease-out ${index * 0.1}s both`,
            opacity: 1 - (index * 0.2),
            wordBreak: 'break-word',
          }}
        >
          {action.includes('🏆') && '🏆 '}
          {action.includes('draws') && '🎴 '}
          {action.includes('played') && '🃏 '}
          {action.includes('skipped') && '🚫 '}
          {action.includes('reversed') && '🔄 '}
          {action}
        </div>
      ))}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        /* Mobile responsive - move to top */
        @media (max-width: 48rem) {
          div[style*="top: 5rem"] {
            top: 6.5rem !important;
            right: 0.5rem !important;
            left: 0.5rem !important;
            max-width: calc(100vw - 1rem) !important;
          }
        }
      `}</style>
    </div>
  );
}
