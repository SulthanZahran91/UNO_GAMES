import { useState } from 'react';

console.log('🏠 Lobby component loaded');

export default function Lobby({ user }) {
  const [status, setStatus] = useState('ready');

  console.log('🏠 Lobby render:', { user: user?.uid, status });

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>
          🎮 UNO Game Lobby
        </h1>

        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '14px', color: '#aaa' }}>
            Status: <span style={{ color: '#0f0' }}>{status}</span>
          </div>
          <div style={{ fontSize: '14px', color: '#aaa', marginTop: '5px' }}>
            User ID: <span style={{ color: '#0ff', fontFamily: 'monospace' }}>{user?.uid}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '20px', color: '#ddd' }}>
            Firebase authentication is working! ✅
          </p>
          <p style={{ fontSize: '14px', color: '#aaa' }}>
            Game functionality will be implemented next...
          </p>
        </div>
      </div>
    </div>
  );
}
