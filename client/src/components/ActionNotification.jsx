/**
 * Action Notification Component
 * Shows recent game actions with animations
 */

import { useState, useEffect } from 'react';

export default function ActionNotification({ gameLog }) {
  const [recentActions, setRecentActions] = useState([]);

  useEffect(() => {
    if (!gameLog || gameLog.length === 0) return;

    // Get the last 3 actions
    const latest = gameLog.slice(-3).reverse();
    setRecentActions(latest);
  }, [gameLog]);

  if (recentActions.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 1000,
      maxWidth: '350px',
    }}>
      {recentActions.map((action, index) => (
        <div
          key={`${action}-${index}`}
          style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            fontSize: '14px',
            fontWeight: '500',
            color: 'white',
            animation: `slideIn 0.3s ease-out ${index * 0.1}s both`,
            opacity: 1 - (index * 0.2),
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
      `}</style>
    </div>
  );
}
