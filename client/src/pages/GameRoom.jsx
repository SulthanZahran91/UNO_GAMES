import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { startGame } from '../services/gameFunctions';
import GameRoomActive from './GameRoomActive';

console.log('🎯 GameRoom component loaded');

export default function GameRoom({ user }) {
  const { gameId } = useParams();
  const { game, loading, error } = useGame(gameId);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  console.log('🎯 GameRoom render:', {
    user: user?.uid,
    gameId,
    gameStatus: game?.status,
    playersCount: game?.players?.length,
  });

  const handleStartGame = async () => {
    console.log('▶️ Starting game:', gameId);
    setActionLoading(true);
    setActionError(null);

    try {
      await startGame(gameId);
      console.log('✅ Game started successfully');
    } catch (err) {
      console.error('❌ Failed to start game:', err);
      setActionError(err.message || 'Failed to start game');
    } finally {
      setActionLoading(false);
    }
  };

  const copyGameId = () => {
    navigator.clipboard.writeText(gameId);
    alert('Game ID copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="loading">
        <div>⏳ Loading game...</div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container">
        <div className="error">
          <h2>❌ Error</h2>
          <p>{error?.message || 'Game not found'}</p>
          <Link to="/">
            <button>← Back to Lobby</button>
          </Link>
        </div>
      </div>
    );
  }

  const isHost = user?.uid === game.hostId;
  const playerCount = game.players?.length || 0;
  const canStart = isHost && playerCount >= 2 && game.status === 'waiting';

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ marginBottom: '10px', textAlign: 'center' }}>
            🎯 Game Room
          </h1>
          <div style={{ textAlign: 'center' }}>
            <Link to="/" style={{ color: '#aaa', fontSize: '14px', textDecoration: 'none' }}>
              ← Back to Lobby
            </Link>
          </div>
        </div>

        {/* Game Info */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '5px' }}>
                Game ID: <span style={{ color: '#0ff', fontFamily: 'monospace', fontSize: '12px' }}>
                  {gameId}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#aaa' }}>
                Status: <span style={{
                  color: game.status === 'waiting' ? '#ffaa00' : game.status === 'in-progress' ? '#0f0' : '#aaa'
                }}>
                  {game.status}
                </span>
              </div>
            </div>
            <button
              onClick={copyGameId}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              📋 Copy ID
            </button>
          </div>
        </div>

        {/* Error Display */}
        {actionError && (
          <div className="error" style={{ marginBottom: '20px' }}>
            {actionError}
          </div>
        )}

        {/* Players List */}
        <div style={{
          background: 'rgba(102, 126, 234, 0.1)',
          border: '2px solid rgba(102, 126, 234, 0.3)',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>
            👥 Players ({playerCount}/4)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {game.players?.map((player, index) => (
              <div
                key={player.uid}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '12px 15px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontWeight: 'bold' }}>{player.displayName}</span>
                  {player.uid === game.hostId && (
                    <span style={{ marginLeft: '10px', color: '#ffaa00', fontSize: '12px' }}>
                      👑 Host
                    </span>
                  )}
                  {player.uid === user?.uid && (
                    <span style={{ marginLeft: '10px', color: '#0ff', fontSize: '12px' }}>
                      (You)
                    </span>
                  )}
                </div>
                {game.status === 'in-progress' && (
                  <div style={{ fontSize: '12px', color: '#aaa' }}>
                    Cards: {player.cardCount || 0}
                  </div>
                )}
              </div>
            ))}
          </div>
          {playerCount < 4 && game.status === 'waiting' && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              background: 'rgba(255, 170, 0, 0.1)',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#ffaa00',
              textAlign: 'center',
            }}>
              ℹ️ Waiting for players to join... (Minimum 2 required to start)
            </div>
          )}
        </div>

        {/* Game Log */}
        {game.gameLog && game.gameLog.length > 0 && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            <h3 style={{ marginBottom: '10px', fontSize: '16px', color: '#aaa' }}>
              📜 Game Log
            </h3>
            <div style={{ fontSize: '13px', color: '#ccc' }}>
              {game.gameLog.map((log, index) => (
                <div key={index} style={{ marginBottom: '5px' }}>
                  • {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {game.status === 'waiting' && (
          <div style={{
            background: 'rgba(118, 75, 162, 0.1)',
            border: '2px solid rgba(118, 75, 162, 0.3)',
            padding: '20px',
            borderRadius: '8px',
          }}>
            {isHost ? (
              <>
                <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>
                  🎮 Ready to Start?
                </h2>
                <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px' }}>
                  {canStart
                    ? 'All set! Click the button below to start the game.'
                    : `Need at least 2 players to start. (Currently: ${playerCount})`}
                </p>
                <button
                  onClick={handleStartGame}
                  disabled={!canStart || actionLoading}
                  style={{ width: '100%', fontSize: '16px' }}
                >
                  {actionLoading ? '⏳ Starting...' : '▶️ Start Game'}
                </button>
              </>
            ) : (
              <>
                <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>
                  ⏳ Waiting for Host
                </h2>
                <p style={{ fontSize: '14px', color: '#aaa' }}>
                  The host will start the game when ready.
                </p>
              </>
            )}
          </div>
        )}

        {game.status === 'in-progress' && (
          <GameRoomActive game={game} user={user} gameId={gameId} />
        )}

        {game.status === 'finished' && (
          <div style={{
            background: 'rgba(255, 215, 0, 0.2)',
            border: '2px solid rgba(255, 215, 0, 0.5)',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <h2 style={{ marginBottom: '10px', fontSize: '24px' }}>
              🏆 Game Over!
            </h2>
            {game.winner && (
              <p style={{ fontSize: '18px', marginBottom: '20px' }}>
                Winner: {game.players?.find(p => p.uid === game.winner)?.displayName || 'Unknown'}
              </p>
            )}
            <Link to="/">
              <button style={{ fontSize: '16px' }}>
                🏠 Back to Lobby
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
