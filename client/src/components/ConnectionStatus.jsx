import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Connection Status Component
 * Monitors Firestore connection status and displays indicator
 */

export default function ConnectionStatus({ user }) {
  const [connectionState, setConnectionState] = useState('checking'); // 'connected', 'disconnected', 'checking'
  const [lastPing, setLastPing] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    const userStatusRef = doc(db, 'status', user.uid);
    let pingInterval;

    // Monitor connection state using Firestore snapshot metadata
    const unsubscribe = onSnapshot(
      userStatusRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        // Check if data is from cache (offline) or from server (online)
        const isFromCache = snapshot.metadata.fromCache;

        if (!isFromCache) {
          // We're getting data from the server, so we're online
          setConnectionState('connected');
          setLastPing(Date.now());
        } else if (snapshot.metadata.hasPendingWrites) {
          // We have pending writes, which means we're likely offline
          setConnectionState('disconnected');
        }
      },
      (error) => {
        console.error('Connection monitoring error:', error);
        setConnectionState('disconnected');
      }
    );

    // Initial status set
    setDoc(userStatusRef, {
      state: 'online',
      last_changed: serverTimestamp(),
    }, { merge: true }).catch(err => {
      console.error('Failed to set initial status:', err);
      setConnectionState('disconnected');
    });

    // Ping interval to check latency and maintain connection status
    pingInterval = setInterval(() => {
      const pingStart = Date.now();
      setDoc(userStatusRef, {
        state: 'online',
        last_changed: serverTimestamp(),
      }, { merge: true })
        .then(() => {
          const latency = Date.now() - pingStart;
          setLastPing(latency);
          setConnectionState('connected');
        })
        .catch((error) => {
          console.error('Ping failed:', error);
          setConnectionState('disconnected');
        });
    }, 5000); // Check every 5 seconds

    return () => {
      unsubscribe();
      clearInterval(pingInterval);

      // Set user as offline when component unmounts
      setDoc(userStatusRef, {
        state: 'offline',
        last_changed: serverTimestamp(),
      }, { merge: true }).catch(err => {
        console.error('Failed to set offline status:', err);
      });
    };
  }, [user?.uid]);

  const getStatusColor = () => {
    if (connectionState === 'disconnected') return '#ff5555';
    if (connectionState === 'checking') return '#ffaa00';
    if (lastPing !== null && lastPing > 1000) return '#ffaa00'; // Slow connection
    return '#55aa55'; // Good connection
  };

  const getStatusText = () => {
    if (connectionState === 'disconnected') return 'Offline';
    if (connectionState === 'checking') return 'Connecting...';
    if (lastPing !== null && lastPing > 1000) return `Slow (${lastPing}ms)`;
    return 'Online';
  };

  const getStatusIcon = () => {
    if (connectionState === 'disconnected') return '📡';
    if (connectionState === 'checking') return '🔄';
    return '✓';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '1.25rem',
        right: '1.25rem',
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '1.25rem',
        border: `0.125rem solid ${getStatusColor()}`,
        boxShadow: `0 0 0.625rem ${getStatusColor()}40`,
        fontSize: '0.75rem',
        fontWeight: 'bold',
        color: 'white',
        minWidth: '3rem',
        transition: 'all 0.3s ease',
      }}
      role="status"
      aria-label={`Connection status: ${getStatusText()}`}
    >
      {/* Status Icon */}
      <div
        style={{
          width: '0.75rem',
          height: '0.75rem',
          borderRadius: '50%',
          background: getStatusColor(),
          boxShadow: `0 0 0.5rem ${getStatusColor()}`,
          animation: connectionState === 'checking' ? 'blink 1s infinite' : 'none',
        }}
        aria-hidden="true"
      />

      {/* Status Text - Hidden on small screens */}
      <span
        style={{
          display: 'none',
        }}
        className="connection-status-text"
      >
        {getStatusText()}
      </span>

      {/* Reconnecting overlay */}
      {connectionState === 'disconnected' && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10001,
            padding: '2rem',
            background: 'rgba(0, 0, 0, 0.95)',
            borderRadius: '1rem',
            border: '0.125rem solid #ff5555',
            boxShadow: '0 0 2rem rgba(255, 85, 85, 0.5)',
            textAlign: 'center',
            minWidth: '18.75rem',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Connection Lost
          </div>
          <div style={{ fontSize: '0.875rem', color: '#aaa' }}>
            Attempting to reconnect...
          </div>
          <div
            style={{
              marginTop: '1rem',
              width: '100%',
              height: '0.25rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '0.125rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '50%',
                height: '100%',
                background: '#ff5555',
                animation: 'loading 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }

        /* Show text on larger screens */
        @media (min-width: 48rem) {
          .connection-status-text {
            display: inline !important;
          }
        }
      `}</style>
    </div>
  );
}
