import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

console.log('🔥 Initializing Firebase Functions');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Enable debug logging
console.log('📊 Firebase Admin initialized');

/**
 * Creates a new UNO game
 * @returns {Promise<{gameId: string}>}
 */
export const createGame = onCall(async (request) => {
  console.log('🎮 createGame called by:', request.auth?.uid);

  // Verify authentication
  if (!request.auth) {
    console.error('❌ createGame: Unauthenticated request');
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const displayName = request.data?.displayName || `Player-${userId.slice(0, 6)}`;

  console.log('📝 Creating game for user:', { userId, displayName });

  try {
    // Create new game document
    const gameRef = db.collection('games').doc();
    const gameId = gameRef.id;

    const gameData = {
      gameId,
      status: 'waiting',
      hostId: userId,
      players: [{
        uid: userId,
        displayName,
        hand: [],
      }],
      drawPile: [],
      drawPileIndex: 0,
      discardPile: [],
      currentCard: null,
      activeColor: null,
      currentPlayerIndex: 0,
      direction: 'clockwise',
      gameLog: [`Game created by ${displayName}`],
      winner: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await gameRef.set(gameData);

    console.log('✅ Game created successfully:', gameId);

    return { gameId };
  } catch (error) {
    console.error('❌ createGame error:', error);
    throw new HttpsError('internal', `Failed to create game: ${error.message}`);
  }
});

/**
 * Join an existing game
 * @param {string} gameId - The game to join
 * @returns {Promise<{success: boolean}>}
 */
export const joinGame = onCall(async (request) => {
  console.log('🚪 joinGame called by:', request.auth?.uid);

  if (!request.auth) {
    console.error('❌ joinGame: Unauthenticated request');
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { gameId } = request.data || {};
  const displayName = request.data?.displayName || `Player-${userId.slice(0, 6)}`;

  if (!gameId) {
    console.error('❌ joinGame: Missing gameId');
    throw new HttpsError('invalid-argument', 'gameId is required');
  }

  console.log('📝 Joining game:', { gameId, userId, displayName });

  try {
    const gameRef = db.collection('games').doc(gameId);

    // Use transaction to ensure consistency
    await db.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        console.error('❌ joinGame: Game not found:', gameId);
        throw new HttpsError('not-found', 'Game not found');
      }

      const gameData = gameDoc.data();

      // Validate game state
      if (gameData.status !== 'waiting') {
        console.error('❌ joinGame: Game already started:', gameId);
        throw new HttpsError('failed-precondition', 'Game has already started');
      }

      if (gameData.players.length >= 4) {
        console.error('❌ joinGame: Game is full:', gameId);
        throw new HttpsError('failed-precondition', 'Game is full (max 4 players)');
      }

      // Check if player is already in the game
      if (gameData.players.some(p => p.uid === userId)) {
        console.error('❌ joinGame: Player already in game:', userId);
        throw new HttpsError('already-exists', 'You are already in this game');
      }

      // Add player to game
      const newPlayer = {
        uid: userId,
        displayName,
        hand: [],
      };

      transaction.update(gameRef, {
        players: FieldValue.arrayUnion(newPlayer),
        gameLog: FieldValue.arrayUnion(`${displayName} joined the game`),
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log('✅ Player joined successfully:', { gameId, userId });
    });

    return { success: true };
  } catch (error) {
    console.error('❌ joinGame error:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to join game: ${error.message}`);
  }
});

console.log('✅ Functions module loaded');
