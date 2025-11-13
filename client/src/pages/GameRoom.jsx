import { useParams } from 'react-router-dom';

console.log('🎯 GameRoom component loaded');

export default function GameRoom({ user }) {
  const { gameId } = useParams();

  console.log('🎯 GameRoom render:', { user: user?.uid, gameId });

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>
          🎯 Game Room
        </h1>

        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '14px', color: '#aaa' }}>
            Game ID: <span style={{ color: '#0ff', fontFamily: 'monospace' }}>{gameId}</span>
          </div>
          <div style={{ fontSize: '14px', color: '#aaa', marginTop: '5px' }}>
            User ID: <span style={{ color: '#0ff', fontFamily: 'monospace' }}>{user?.uid}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ddd' }}>
            Game room will be implemented soon...
          </p>
        </div>
      </div>
    </div>
  );
}
