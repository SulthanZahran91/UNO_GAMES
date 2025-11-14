import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Custom hook to subscribe to a specific player's hand
 * This hook listens to the player's hand in the subcollection
 *
 * @param {string} gameId - The ID of the game
 * @param {string} userId - The ID of the user (player)
 * @returns {{
 *   hand: Array|null,
 *   loading: boolean,
 *   error: Error|null
 * }}
 */
export function usePlayerHand(gameId, userId) {
  const [hand, setHand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!gameId || !userId) {
      console.warn('⚠️ usePlayerHand: No gameId or userId provided');
      setLoading(false);
      return;
    }

    console.log('🔌 usePlayerHand: Subscribing to player hand:', { gameId, userId });

    // Create reference to the player's hand document in subcollection
    const playerHandRef = doc(db, 'games', gameId, 'players', userId);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      playerHandRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const playerData = docSnapshot.data();
          const handData = playerData.hand || [];
          console.log('🃏 usePlayerHand: Hand updated:', {
            gameId,
            userId,
            cardCount: handData.length,
            handData: handData,
            fullPlayerData: playerData,
          });
          setHand(handData);
          setError(null);
        } else {
          console.warn('⚠️ usePlayerHand: Player hand not found:', { gameId, userId });
          console.warn('⚠️ usePlayerHand: Document path:', playerHandRef.path);
          setHand([]);
          setError(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('❌ usePlayerHand: Snapshot error:', err);
        console.error('❌ usePlayerHand: Error code:', err.code);
        console.error('❌ usePlayerHand: Error message:', err.message);
        console.error('❌ usePlayerHand: Document path:', playerHandRef.path);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup function
    return () => {
      console.log('🔌 usePlayerHand: Unsubscribing from player hand:', { gameId, userId });
      unsubscribe();
    };
  }, [gameId, userId]);

  return { hand, loading, error };
}
