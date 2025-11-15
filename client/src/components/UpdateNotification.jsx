import React from 'react';

/**
 * Component to display a notification when a new version is available
 * @param {boolean} show - Whether to show the notification
 * @param {function} onRefresh - Callback when user clicks refresh
 * @param {function} onDismiss - Callback when user dismisses the notification
 */
export default function UpdateNotification({ show, onRefresh, onDismiss }) {
  if (!show) return null;

  const handleRefresh = () => {
    // Clear all caches and reload
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }

    // Clear localStorage app version so it gets fresh version
    localStorage.removeItem('appVersion');

    // Hard reload the page
    window.location.reload(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        maxWidth: '90%',
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <style>
        {`
          @keyframes slideDown {
            from {
              transform: translateX(-50%) translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(-50%) translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={{ flex: 1 }}>
        <strong>🎉 New version available!</strong>
        <div style={{ fontSize: '14px', marginTop: '4px' }}>
          Refresh to get the latest features and fixes.
        </div>
      </div>
      <button
        onClick={handleRefresh}
        style={{
          backgroundColor: 'white',
          color: '#4CAF50',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Refresh Now
      </button>
      <button
        onClick={onDismiss}
        style={{
          backgroundColor: 'transparent',
          color: 'white',
          border: '1px solid white',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Later
      </button>
    </div>
  );
}
