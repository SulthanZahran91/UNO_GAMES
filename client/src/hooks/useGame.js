import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Custom hook to subscribe to real-time game state
 * This is the core of our "dumb client" architecture
 * The client only renders what the server tells it to render
 *
 * @param {string} gameId - The ID of the game to subscribe to
 * @returns {{
 *   game: Object|null,
 *   loading: boolean,
 *   error: Error|null
 * }}
 */
export function useGame(gameId) {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameId) {
      console.warn('⚠️ useGame: No gameId provided');
      setLoading(false);
      return;
    }

    console.log('🔌 useGame: Subscribing to game:', gameId);

    // Create reference to the game document
    const gameRef = doc(db, 'games', gameId);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      gameRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const gameData = docSnapshot.data();
          console.log('📊 useGame: Game state updated:', {
            gameId,
            status: gameData.status,
            players: gameData.players?.length,
            currentPlayerIndex: gameData.currentPlayerIndex,
          });
          setGame(gameData);
          setError(null);
        } else {
          console.error('❌ useGame: Game not found:', gameId);
          setError(new Error('Game not found'));
          setGame(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('❌ useGame: Snapshot error:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      console.log('🔌 useGame: Unsubscribing from game:', gameId);
      unsubscribe();
    };
  }, [gameId]);

  return { game, loading, error };
}
