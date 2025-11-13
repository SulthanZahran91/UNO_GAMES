import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame, joinGame } from '../services/gameFunctions';

console.log('🏠 Lobby component loaded');

export default function Lobby({ user }) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [gameIdToJoin, setGameIdToJoin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');

  console.log('🏠 Lobby render:', { user: user?.uid, displayName, status });

  const handleCreateGame = async () => {
    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    console.log('🎮 Creating game with name:', displayName);
    setLoading(true);
    setError(null);
    setStatus('Creating game...');

    try {
      const result = await createGame(displayName.trim());
      console.log('✅ Game created:', result.gameId);
      setStatus(`Game created! ID: ${result.gameId}`);

      // Navigate to the game room
      setTimeout(() => {
        navigate(`/game/${result.gameId}`);
      }, 500);
    } catch (err) {
      console.error('❌ Failed to create game:', err);
      setError(err.message || 'Failed to create game');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    if (!gameIdToJoin.trim()) {
      setError('Please enter a game ID');
      return;
    }

    console.log('🚪 Joining game:', { gameId: gameIdToJoin, displayName });
    setLoading(true);
    setError(null);
    setStatus('Joining game...');

    try {
      await joinGame(gameIdToJoin.trim(), displayName.trim());
      console.log('✅ Joined game:', gameIdToJoin);
      setStatus('Joined game!');

      // Navigate to the game room
      setTimeout(() => {
        navigate(`/game/${gameIdToJoin.trim()}`);
      }, 500);
    } catch (err) {
      console.error('❌ Failed to join game:', err);
      setError(err.message || 'Failed to join game');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

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

        {/* User Info */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '14px', color: '#aaa' }}>
            User ID: <span style={{ color: '#0ff', fontFamily: 'monospace', fontSize: '12px' }}>
              {user?.uid?.slice(0, 20)}...
            </span>
          </div>
          {status && (
            <div style={{ fontSize: '14px', color: '#0f0', marginTop: '5px' }}>
              Status: {status}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: 'rgba(255, 85, 85, 0.2)',
            border: '1px solid #ff5555',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#ff5555',
          }}>
            ❌ {error}
          </div>
        )}

        {/* Display Name Input */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Your Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(0, 0, 0, 0.3)',
              color: 'white',
              fontSize: '16px',
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleCreateGame();
              }
            }}
          />
        </div>

        {/* Create Game Section */}
        <div style={{
          background: 'rgba(102, 126, 234, 0.1)',
          border: '2px solid rgba(102, 126, 234, 0.3)',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>
            🎯 Create New Game
          </h2>
          <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px' }}>
            Start a new game and invite friends to join
          </p>
          <button
            onClick={handleCreateGame}
            disabled={loading || !displayName.trim()}
            style={{ width: '100%' }}
          >
            {loading ? '⏳ Creating...' : '🎮 Create Game'}
          </button>
        </div>

        {/* Join Game Section */}
        <div style={{
          background: 'rgba(118, 75, 162, 0.1)',
          border: '2px solid rgba(118, 75, 162, 0.3)',
          padding: '20px',
          borderRadius: '8px',
        }}>
          <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>
            🚪 Join Existing Game
          </h2>
          <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px' }}>
            Enter a game ID to join
          </p>
          <input
            type="text"
            value={gameIdToJoin}
            onChange={(e) => setGameIdToJoin(e.target.value)}
            placeholder="Enter game ID"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(0, 0, 0, 0.3)',
              color: 'white',
              fontSize: '16px',
              marginBottom: '15px',
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleJoinGame();
              }
            }}
          />
          <button
            onClick={handleJoinGame}
            disabled={loading || !displayName.trim() || !gameIdToJoin.trim()}
            style={{ width: '100%' }}
          >
            {loading ? '⏳ Joining...' : '🚪 Join Game'}
          </button>
        </div>
      </div>
    </div>
  );
}
