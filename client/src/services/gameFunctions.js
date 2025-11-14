import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

/**
 * Service layer for calling Firebase Cloud Functions
 * All game logic is executed server-side
 */

/**
 * Create a new game
 * @param {string} displayName - Player's display name
 * @returns {Promise<{gameId: string}>}
 */
export async function createGame(displayName) {
  console.log('🎮 Calling createGame function:', { displayName });

  try {
    const createGameFn = httpsCallable(functions, 'createGame');
    const result = await createGameFn({ displayName });

    console.log('✅ createGame success:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ createGame error:', error);
    throw error;
  }
}

/**
 * Join an existing game
 * @param {string} gameId - The game ID to join
 * @param {string} displayName - Player's display name
 * @returns {Promise<{success: boolean}>}
 */
export async function joinGame(gameId, displayName) {
  console.log('🚪 Calling joinGame function:', { gameId, displayName });

  try {
    const joinGameFn = httpsCallable(functions, 'joinGame');
    const result = await joinGameFn({ gameId, displayName });

    console.log('✅ joinGame success:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ joinGame error:', error);
    throw error;
  }
}

/**
 * Start a game (host only)
 * @param {string} gameId - The game ID to start
 * @returns {Promise<{success: boolean}>}
 */
export async function startGame(gameId) {
  console.log('▶️ Calling startGame function:', { gameId });

  try {
    const startGameFn = httpsCallable(functions, 'startGame');
    const result = await startGameFn({ gameId });

    console.log('✅ startGame success:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ startGame error:', error);
    throw error;
  }
}

/**
 * Play a card
 * @param {string} gameId - The game ID
 * @param {number} cardIndex - Index of card in player's hand
 * @param {string|null} chosenColor - Color chosen for wild cards
 * @returns {Promise<{success: boolean}>}
 */
export async function playCard(gameId, cardIndex, chosenColor = null) {
  console.log('🃏 Calling playCard function:', { gameId, cardIndex, chosenColor });

  try {
    const playCardFn = httpsCallable(functions, 'playCard');
    const result = await playCardFn({ gameId, cardIndex, chosenColor });

    console.log('✅ playCard success:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ playCard error:', error);
    throw error;
  }
}

/**
 * Draw a card
 * @param {string} gameId - The game ID
 * @returns {Promise<{success: boolean}>}
 */
export async function drawCard(gameId) {
  console.log('🎴 Calling drawCard function:', { gameId });

  try {
    const drawCardFn = httpsCallable(functions, 'drawCard');
    const result = await drawCardFn({ gameId });

    console.log('✅ drawCard success:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ drawCard error:', error);
    throw error;
  }
}

/**
 * Skip turn (after drawing a card)
 * @param {string} gameId - The game ID
 * @returns {Promise<{success: boolean}>}
 */
export async function skipTurn(gameId) {
  console.log('⏭️ Calling skipTurn function:', { gameId });

  try {
    const skipTurnFn = httpsCallable(functions, 'skipTurn');
    const result = await skipTurnFn({ gameId });

    console.log('✅ skipTurn success:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ skipTurn error:', error);
    throw error;
  }
}
