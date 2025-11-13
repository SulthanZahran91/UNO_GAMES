import { useState, useEffect } from 'react';

/**
 * Debug panel component for monitoring app state and events
 * Displays in bottom-right corner with real-time logs
 */
export default function DebugPanel({ enabled = true, data = {} }) {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    // Log data changes
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-20), `[${timestamp}] State updated`].slice(-20));

    console.log('📊 Debug Panel - State Update:', data);
  }, [data, enabled]);

  if (!enabled || !isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
          left: 'max(10px, env(safe-area-inset-left, 10px))',
          zIndex: 9999,
          padding: '6px 10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#0f0',
          border: '1px solid #0f0',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '10px',
          minHeight: 'auto',
          minWidth: 'auto',
        }}
      >
        🐛
      </button>
    );
  }

  return (
    <div className="debug-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>🐛 Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            padding: '2px 8px',
            fontSize: '12px',
            background: 'transparent',
            border: '1px solid #666',
          }}
        >
          Hide
        </button>
      </div>

      <div style={{ marginTop: '10px' }}>
        <strong>Current State:</strong>
        <pre style={{ fontSize: '11px', marginTop: '5px' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '10px' }}>
        <strong>Recent Logs:</strong>
        <div style={{ fontSize: '11px', marginTop: '5px' }}>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
