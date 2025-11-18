import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame, joinGame } from '../services/gameFunctions';
import { usePublicGames } from '../hooks/usePublicGames';

console.log('🏠 Lobby component loaded');

export default function Lobby({ user }) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [gameIdToJoin, setGameIdToJoin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [isPublic, setIsPublic] = useState(true); // Default to public

  // Fetch public games
  const { games: publicGames, loading: gamesLoading, error: gamesError } = usePublicGames();

  console.log('🏠 Lobby render:', { user: user?.uid, displayName, status, isPublic, publicGamesCount: publicGames.length });

  const handleCreateGame = async () => {
    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    console.log('🎮 Creating game with name:', displayName, 'isPublic:', isPublic);
    setLoading(true);
    setError(null);
    setStatus('Creating game...');

    try {
      const result = await createGame(displayName.trim(), isPublic);
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

  const handleJoinPublicGame = async (gameId) => {
    if (!displayName.trim()) {
      setError('Please enter your display name first');
      return;
    }

    console.log('🚪 Joining public game:', { gameId, displayName });
    setLoading(true);
    setError(null);
    setStatus('Joining game...');

    try {
      await joinGame(gameId, displayName.trim());
      console.log('✅ Joined public game:', gameId);
      setStatus('Joined game!');

      // Navigate to the game room
      setTimeout(() => {
        navigate(`/game/${gameId}`);
      }, 500);
    } catch (err) {
      console.error('❌ Failed to join public game:', err);
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

          {/* Public/Private Toggle */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '15px',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={loading}
                style={{
                  width: '18px',
                  height: '18px',
                  marginRight: '10px',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '14px', flex: 1 }}>
                <strong>{isPublic ? '🌐 Public Game' : '🔒 Private Game'}</strong>
                <div style={{ color: '#aaa', fontSize: '12px', marginTop: '4px' }}>
                  {isPublic
                    ? 'Anyone can find and join this game'
                    : 'Only people with the game ID can join'}
                </div>
              </span>
            </label>
          </div>

          <button
            onClick={handleCreateGame}
            disabled={loading || !displayName.trim()}
            style={{ width: '100%' }}
          >
            {loading ? '⏳ Creating...' : '🎮 Create Game'}
          </button>
        </div>

        {/* Public Games List Section */}
        <div style={{
          background: 'rgba(76, 175, 80, 0.1)',
          border: '2px solid rgba(76, 175, 80, 0.3)',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>
            🌐 Browse Public Games
          </h2>
          <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px' }}>
            Join a public game without needing a game ID
          </p>

          {gamesError ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#ff6b6b',
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '6px',
            }}>
              ⚠️ Error loading public games
              <div style={{ fontSize: '12px', marginTop: '8px', color: '#ffaaaa' }}>
                {gamesError.code === 'failed-precondition' ? (
                  <>
                    Missing database index. Please run: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px' }}>firebase deploy --only firestore:indexes</code>
                  </>
                ) : (
                  gamesError.message || 'Unable to load public games'
                )}
              </div>
            </div>
          ) : gamesLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#aaa',
            }}>
              ⏳ Loading public games...
            </div>
          ) : publicGames.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#aaa',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '6px',
            }}>
              No public games available right now
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                Create a public game to get started!
              </div>
            </div>
          ) : (
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {publicGames.map((game) => (
                <div
                  key={game.gameId}
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '15px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      marginBottom: '5px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {game.players[0]?.displayName}'s Game
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>
                      {game.players.length} / 12 players
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinPublicGame(game.gameId)}
                    disabled={loading || !displayName.trim() || game.players.length >= 12}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {game.players.length >= 12 ? '🔒 Full' : '🚪 Join'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Join Game Section */}
        <div style={{
          background: 'rgba(118, 75, 162, 0.1)',
          border: '2px solid rgba(118, 75, 162, 0.3)',
          padding: '20px',
          borderRadius: '8px',
        }}>
          <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>
            🚪 Join Private Game
          </h2>
          <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px' }}>
            Enter a game ID to join a private game
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
