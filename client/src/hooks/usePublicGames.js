import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Custom hook to subscribe to public games
 * Returns a real-time list of public games that are waiting for players
 *
 * @returns {{
 *   games: Array,
 *   loading: boolean,
 *   error: Error|null
 * }}
 */
export function usePublicGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔌 usePublicGames: Setting up public games listener');

    try {
      // Query for public games that are still waiting
      const gamesRef = collection(db, 'games');
      const q = query(
        gamesRef,
        where('isPublic', '==', true),
        where('status', '==', 'waiting'),
        orderBy('createdAt', 'desc'),
        limit(20) // Show last 20 public games
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const publicGames = [];
          querySnapshot.forEach((doc) => {
            publicGames.push({
              id: doc.id,
              ...doc.data(),
            });
          });

          console.log('🎮 usePublicGames: Public games updated:', {
            count: publicGames.length,
            games: publicGames,
          });

          setGames(publicGames);
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error('❌ usePublicGames: Snapshot error:', err);
          console.error('Error code:', err.code);
          console.error('Error message:', err.message);

          // Provide helpful diagnostics
          if (err.code === 'failed-precondition') {
            console.error('🔧 SOLUTION: This error means the Firestore composite index is missing.');
            console.error('   Run: firebase deploy --only firestore:indexes');
          }

          setError(err);
          setLoading(false);
        }
      );

      // Cleanup function
      return () => {
        console.log('🔌 usePublicGames: Unsubscribing from public games');
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ usePublicGames: Setup error:', err);
      setError(err);
      setLoading(false);
    }
  }, []);

  return { games, loading, error };
}
