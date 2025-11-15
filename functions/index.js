import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { generateDeck, shuffle, getValidStartCard, isValidMove } from './utils/cards.js';
import { applyCardEffect, drawCards, getNextPlayerIndex } from './utils/gameLogic.js';

console.log('🔥 Initializing Firebase Functions');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Enable debug logging
console.log('📊 Firebase Admin initialized');

/**
 * Helper function to get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 * @param {number} num - The number to get suffix for
 * @returns {string} The ordinal suffix (st, nd, rd, th)
 */
function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

/**
 * Helper function to check automatic game-ending conditions
 * @param {Object} gameData - Current game state
 * @param {Object} updatedPlayers - Updated players array
 * @returns {Object} {shouldEnd: boolean, reason: string, status: string}
 */
function checkAutoEndConditions(gameData, updatedPlayers) {
  // Check 1: If any player has more than 40 cards
  const playerWithTooManyCards = updatedPlayers.find(p => p.cardCount > 40);
  if (playerWithTooManyCards) {
    return {
      shouldEnd: true,
      reason: `🛑 Game ended: ${playerWithTooManyCards.displayName} has more than 40 cards!`,
      status: 'finished'
    };
  }

  // Check 2: If no actions for more than 10 minutes (600000 milliseconds)
  if (gameData.lastActionAt) {
    const now = Date.now();
    const lastActionTime = gameData.lastActionAt.toMillis ? gameData.lastActionAt.toMillis() : gameData.lastActionAt;
    const timeSinceLastAction = now - lastActionTime;
    const TEN_MINUTES = 10 * 60 * 1000; // 10 minutes in milliseconds

    if (timeSinceLastAction > TEN_MINUTES) {
      return {
        shouldEnd: true,
        reason: '🛑 Game ended: No activity for more than 10 minutes',
        status: 'finished'
      };
    }
  }

  return { shouldEnd: false };
}

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
        cardCount: 0,
      }],
      drawPile: [],
      drawPileIndex: 0,
      discardPile: [],
      currentCard: null,
      activeColor: null,
      currentPlayerIndex: 0,
      direction: 'clockwise',
      gameLog: [`Game created by ${displayName}`],
      winners: [], // Track winners in order (1st, 2nd, 3rd, etc.)
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await gameRef.set(gameData);

    // Initialize player's hand in subcollection
    const playerRef = gameRef.collection('players').doc(userId);
    await playerRef.set({
      uid: userId,
      hand: [],
      updatedAt: FieldValue.serverTimestamp(),
    });

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

      if (gameData.players.length >= 12) {
        console.error('❌ joinGame: Game is full:', gameId);
        throw new HttpsError('failed-precondition', 'Game is full (max 12 players)');
      }

      // Check if player is already in the game
      if (gameData.players.some(p => p.uid === userId)) {
        console.error('❌ joinGame: Player already in game:', userId);
        throw new HttpsError('already-exists', 'You are already in this game');
      }

      // Add player to game (metadata only, no hand)
      const newPlayer = {
        uid: userId,
        displayName,
        cardCount: 0,
      };

      transaction.update(gameRef, {
        players: FieldValue.arrayUnion(newPlayer),
        gameLog: FieldValue.arrayUnion(`${displayName} joined the game`),
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log('✅ Player joined successfully:', { gameId, userId });
    });

    // Initialize player's hand in subcollection (outside transaction)
    const playerRef = gameRef.collection('players').doc(userId);
    await playerRef.set({
      uid: userId,
      hand: [],
      updatedAt: FieldValue.serverTimestamp(),
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

/**
 * Start a game (host only)
 * Deals cards and initializes game state
 * @param {string} gameId - The game to start
 * @returns {Promise<{success: boolean}>}
 */
export const startGame = onCall(async (request) => {
  console.log('▶️ startGame called by:', request.auth?.uid);

  if (!request.auth) {
    console.error('❌ startGame: Unauthenticated request');
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { gameId } = request.data || {};

  if (!gameId) {
    console.error('❌ startGame: Missing gameId');
    throw new HttpsError('invalid-argument', 'gameId is required');
  }

  console.log('📝 Starting game:', { gameId, userId });

  try {
    const gameRef = db.collection('games').doc(gameId);

    // Use transaction to ensure atomic update
    await db.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        console.error('❌ startGame: Game not found:', gameId);
        throw new HttpsError('not-found', 'Game not found');
      }

      const gameData = gameDoc.data();

      // Validate: only host can start
      if (gameData.hostId !== userId) {
        console.error('❌ startGame: User is not host:', { userId, hostId: gameData.hostId });
        throw new HttpsError('permission-denied', 'Only the host can start the game');
      }

      // Validate: game must be in waiting state
      if (gameData.status !== 'waiting') {
        console.error('❌ startGame: Game not in waiting state:', gameData.status);
        throw new HttpsError('failed-precondition', 'Game has already started');
      }

      // Validate: need at least 2 players
      if (gameData.players.length < 2) {
        console.error('❌ startGame: Not enough players:', gameData.players.length);
        throw new HttpsError('failed-precondition', 'Need at least 2 players to start');
      }

      console.log('✅ Validations passed. Initializing game...');

      // Generate and shuffle deck
      const deck = generateDeck();
      shuffle(deck);

      console.log('🎴 Deck shuffled, dealing cards...');

      // Deal 7 cards to each player
      let drawPileIndex = 0;
      const updatedPlayers = gameData.players.map((player) => {
        return { ...player, cardCount: 7 };
      });

      // Get valid starting card
      const startCardIndex = drawPileIndex + (gameData.players.length * 7);
      const { card: startCard, newIndex } = getValidStartCard(deck, startCardIndex);
      drawPileIndex = newIndex;

      console.log('🎯 Start card:', startCard);

      // Keep only last 20 log entries (pagination optimization)
      const recentLog = gameData.gameLog.slice(-20);

      // Initialize game state with field-specific updates
      const updates = {
        status: 'in-progress',
        players: updatedPlayers,
        drawPile: deck,
        drawPileIndex,
        discardPile: [startCard],
        currentCard: startCard,
        activeColor: startCard.color,
        currentPlayerIndex: 0,
        direction: 'clockwise',
        pendingDrawCount: 0, // Track stacked draw cards
        hasDrawnThisTurn: false, // Track if player drew this turn
        turnStartedAt: FieldValue.serverTimestamp(), // Track when turn started for timeout
        turnTimeoutSeconds: 20, // 20 second timeout
        gameLog: [...recentLog, 'Game started!', `First card: ${startCard.color} ${startCard.value}`],
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.update(gameRef, updates);

      console.log('✅ Game started successfully:', {
        gameId,
        players: updatedPlayers.length,
        startCard,
        cardsRemaining: deck.length - drawPileIndex,
      });
    });

    // Deal cards to each player's subcollection (outside transaction for better performance)
    const gameDoc = await gameRef.get();
    const finalGameData = gameDoc.data();
    const batch = db.batch();
    let cardIndex = 0;

    for (const player of finalGameData.players) {
      const hand = [];
      for (let i = 0; i < 7; i++) {
        hand.push(finalGameData.drawPile[cardIndex]);
        cardIndex++;
      }
      const playerRef = gameRef.collection('players').doc(player.uid);
      batch.set(playerRef, {
        uid: player.uid,
        hand,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`✅ Dealt 7 cards to ${player.displayName}`);
    }

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('❌ startGame error:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to start game: ${error.message}`);
  }
});

/**
 * Play a card
 * @param {string} gameId - The game ID
 * @param {number} cardIndex - Index of card in player's hand
 * @param {string|null} chosenColor - Color chosen for wild cards
 * @returns {Promise<{success: boolean}>}
 */
export const playCard = onCall(async (request) => {
  console.log('🃏 playCard called by:', request.auth?.uid);

  if (!request.auth) {
    console.error('❌ playCard: Unauthenticated request');
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { gameId, cardIndex, cardIndices, chosenColor } = request.data || {};

  if (!gameId) {
    console.error('❌ playCard: Missing gameId');
    throw new HttpsError('invalid-argument', 'gameId is required');
  }

  // Support both single card (cardIndex) and multiple cards (cardIndices)
  let indicesToPlay = [];
  if (cardIndices !== undefined && cardIndices !== null) {
    // Multiple cards (number stacking)
    if (!Array.isArray(cardIndices) || cardIndices.length === 0) {
      console.error('❌ playCard: Invalid cardIndices');
      throw new HttpsError('invalid-argument', 'cardIndices must be a non-empty array');
    }
    indicesToPlay = [...cardIndices].sort((a, b) => b - a); // Sort descending for safe removal
  } else if (cardIndex !== undefined && cardIndex !== null) {
    // Single card (traditional play)
    indicesToPlay = [cardIndex];
  } else {
    console.error('❌ playCard: Missing cardIndex or cardIndices');
    throw new HttpsError('invalid-argument', 'cardIndex or cardIndices is required');
  }

  console.log('📝 Playing card(s):', { gameId, userId, indicesToPlay, chosenColor });

  try {
    const gameRef = db.collection('games').doc(gameId);
    const playerRef = gameRef.collection('players').doc(userId);

    // Get player's hand from subcollection first
    const playerDoc = await playerRef.get();
    if (!playerDoc.exists) {
      console.error('❌ playCard: Player hand not found:', userId);
      throw new HttpsError('not-found', 'Player hand not found');
    }

    const playerData = playerDoc.data();
    const playerHand = playerData.hand || [];

    await db.runTransaction(async (transaction) => {
      // STEP 1: Perform ALL reads first (Firestore requirement)
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        console.error('❌ playCard: Game not found:', gameId);
        throw new HttpsError('not-found', 'Game not found');
      }

      const gameData = gameDoc.data();

      // Check for automatic game-ending conditions (inactivity)
      const autoEndCheck = checkAutoEndConditions(gameData, gameData.players);
      if (autoEndCheck.shouldEnd) {
        console.log('⚠️ Auto-ending game:', autoEndCheck.reason);
        const recentLog = gameData.gameLog.slice(-20);
        transaction.update(gameRef, {
          status: autoEndCheck.status,
          gameLog: [...recentLog, autoEndCheck.reason],
          updatedAt: FieldValue.serverTimestamp(),
        });
        throw new HttpsError('failed-precondition', autoEndCheck.reason);
      }

      // Validate: game must be in progress
      if (gameData.status !== 'in-progress') {
        console.error('❌ playCard: Game not in progress:', gameData.status);
        throw new HttpsError('failed-precondition', 'Game is not in progress');
      }

      // Validate: it's the player's turn
      const currentPlayer = gameData.players[gameData.currentPlayerIndex];
      if (currentPlayer.uid !== userId) {
        console.error('❌ playCard: Not player\'s turn:', { userId, currentPlayer: currentPlayer.uid });
        throw new HttpsError('failed-precondition', 'It is not your turn');
      }

      // Get the cards from player's hand
      const cardsToPlay = [];
      for (const idx of indicesToPlay) {
        if (idx < 0 || idx >= playerHand.length) {
          console.error('❌ playCard: Invalid card index:', idx);
          throw new HttpsError('invalid-argument', `Invalid card index: ${idx}`);
        }
        cardsToPlay.push(playerHand[idx]);
      }

      console.log('🃏 Card(s) to play:', cardsToPlay);

      // Validate number stacking: all cards must have the same value
      if (cardsToPlay.length > 1) {
        const firstValue = cardsToPlay[0].value;
        const allSameValue = cardsToPlay.every(card => card.value === firstValue);

        if (!allSameValue) {
          console.error('❌ playCard: Cannot stack cards with different values');
          throw new HttpsError('invalid-argument', 'All stacked cards must have the same number');
        }

        // Only number cards (0-9) can be stacked
        const isNumberCard = /^[0-9]$/.test(firstValue);
        if (!isNumberCard) {
          console.error('❌ playCard: Cannot stack non-number cards:', firstValue);
          throw new HttpsError('invalid-argument', 'Only number cards can be stacked');
        }

        console.log(`✅ Stacking ${cardsToPlay.length} cards with value ${firstValue}`);
      }

      // Use the first card for validation (all have same value if stacking)
      const card = cardsToPlay[0];

      // Check if there's a pending draw count
      const pendingDrawCount = gameData.pendingDrawCount || 0;

      // If there's a pending draw, player can only play a draw card to stack
      if (pendingDrawCount > 0) {
        if (card.value !== 'draw2' && card.value !== 'draw4') {
          console.error('❌ playCard: Must play a draw card or draw cards:', { pendingDrawCount });
          throw new HttpsError('failed-precondition', `You must draw ${pendingDrawCount} cards or play a Draw 2/Draw 4 to stack`);
        }
        // Draw cards can always be played when there's a pending draw
        console.log('✅ Stacking draw card');
      } else {
        // Normal validation
        if (!isValidMove(card, gameData.currentCard, gameData.activeColor)) {
          console.error('❌ playCard: Invalid move:', { card, currentCard: gameData.currentCard, activeColor: gameData.activeColor });
          throw new HttpsError('failed-precondition', 'This card cannot be played');
        }
      }

      // Validate: wild cards need a color
      if ((card.value === 'wild' || card.value === 'draw4') && !chosenColor) {
        console.error('❌ playCard: No color chosen for wild card');
        throw new HttpsError('invalid-argument', 'Must choose a color for wild cards');
      }

      console.log('✅ Move is valid, applying card effect...');

      // Remove all played cards from player's hand
      const updatedHand = playerHand.filter((_, i) => !indicesToPlay.includes(i));

      // Update player's card count in main document
      const updatedPlayers = gameData.players.map((p, i) => {
        if (i === gameData.currentPlayerIndex) {
          return { ...p, cardCount: updatedHand.length };
        }
        return p;
      });

      // Check for winners - track players in order of finishing
      let winners = gameData.winners || [];
      let status = gameData.status;

      // If current player finished their cards, add them to winners list
      if (updatedHand.length === 0 && !winners.includes(userId)) {
        winners = [...winners, userId];
        console.log(`🏆 ${currentPlayer.displayName} finishes in position ${winners.length}!`);
      }

      // Count how many players still have cards (including current player with updated hand)
      const playersWithCards = updatedPlayers.filter(p => {
        // For current player, use updatedHand length; for others, use their cardCount
        if (p.uid === userId) {
          return updatedHand.length > 0;
        }
        return p.cardCount > 0;
      });

      console.log(`📊 Players with cards remaining: ${playersWithCards.length}/${updatedPlayers.length}`);

      // If only one player has cards left (or no players), game ends
      if (playersWithCards.length <= 1) {
        status = 'finished';
        if (playersWithCards.length === 1) {
          // Last player with cards is in last place (don't add to winners)
          console.log('🏁 Game over! Last player:', playersWithCards[0].displayName);
        } else {
          console.log('🏁 Game over! All players finished.');
        }
      }

      // Apply card effect (determine which players will be affected)
      const cardEffects = applyCardEffect(card, {
        ...gameData,
        players: updatedPlayers,
      }, chosenColor, cardsToPlay.length);

      // Read affected players' hands BEFORE any writes (for Draw 2 and Draw 4 effects)
      const affectedPlayersData = new Map();
      if (cardEffects.cardsToAdd && cardEffects.cardsToAdd.length > 0) {
        for (const cardAddition of cardEffects.cardsToAdd) {
          const affectedPlayerRef = gameRef.collection('players').doc(cardAddition.playerUid);
          const affectedPlayerDoc = await transaction.get(affectedPlayerRef);

          if (affectedPlayerDoc.exists) {
            affectedPlayersData.set(cardAddition.playerUid, {
              ref: affectedPlayerRef,
              hand: affectedPlayerDoc.data().hand || [],
              cardsToAdd: cardAddition.cards,
            });
          }
        }
      }

      // STEP 2: Perform ALL writes (after all reads are complete)

      // Keep only last 20 log entries (pagination optimization)
      const currentLog = cardEffects.gameLog || gameData.gameLog;
      const recentLog = currentLog.slice(-20);

      // Build updates with field masks (only changed fields)
      // Determine appropriate game log message
      let logMessage = null;
      if (status === 'finished') {
        if (playersWithCards.length === 1) {
          logMessage = `🏁 Game Over! ${playersWithCards[0].displayName} finished last.`;
        } else {
          logMessage = `🏁 Game Over!`;
        }
      } else if (updatedHand.length === 0) {
        logMessage = `🏆 ${currentPlayer.displayName} finishes in ${winners.length}${getOrdinalSuffix(winners.length)} place! ${playersWithCards.length} player(s) remaining.`;
      }

      const updates = {
        currentCard: card, // Top card is the first one played (last one added)
        activeColor: cardEffects.activeColor,
        currentPlayerIndex: cardEffects.currentPlayerIndex,
        discardPile: [...gameData.discardPile, ...cardsToPlay], // Add all stacked cards
        gameLog: logMessage ? [...recentLog, logMessage] : recentLog,
        hasDrawnThisTurn: false, // Reset draw flag when playing a card
        turnStartedAt: FieldValue.serverTimestamp(), // Reset turn timer
        lastActionAt: FieldValue.serverTimestamp(), // Update last action time
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Add optional fields only if they exist
      if (cardEffects.direction !== undefined) updates.direction = cardEffects.direction;
      if (cardEffects.drawPileIndex !== undefined) updates.drawPileIndex = cardEffects.drawPileIndex;
      if (cardEffects.players) updates.players = cardEffects.players;
      else updates.players = updatedPlayers;
      if (cardEffects.pendingDrawCount !== undefined) updates.pendingDrawCount = cardEffects.pendingDrawCount;
      if (status !== gameData.status) updates.status = status;
      if (winners.length > 0) updates.winners = winners;

      transaction.update(gameRef, updates);

      // Update current player's hand in subcollection
      transaction.update(playerRef, {
        hand: updatedHand,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update affected players' hands (cards were already read above)
      for (const [playerUid, playerInfo] of affectedPlayersData) {
        transaction.update(playerInfo.ref, {
          hand: [...playerInfo.hand, ...playerInfo.cardsToAdd],
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      console.log('✅ Card played successfully:', {
        gameId,
        card,
        newStatus: status,
        winnersCount: winners.length,
      });
    });

    return { success: true };
  } catch (error) {
    console.error('❌ playCard error:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to play card: ${error.message}`);
  }
});

/**
 * Draw a card
 * @param {string} gameId - The game ID
 * @returns {Promise<{success: boolean}>}
 */
export const drawCard = onCall(async (request) => {
  console.log('🎴 drawCard called by:', request.auth?.uid);

  if (!request.auth) {
    console.error('❌ drawCard: Unauthenticated request');
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { gameId } = request.data || {};

  if (!gameId) {
    console.error('❌ drawCard: Missing gameId');
    throw new HttpsError('invalid-argument', 'gameId is required');
  }

  console.log('📝 Drawing card:', { gameId, userId });

  try {
    const gameRef = db.collection('games').doc(gameId);
    const playerRef = gameRef.collection('players').doc(userId);

    // Get player's hand from subcollection first
    const playerDoc = await playerRef.get();
    if (!playerDoc.exists) {
      console.error('❌ drawCard: Player hand not found:', userId);
      throw new HttpsError('not-found', 'Player hand not found');
    }

    const playerData = playerDoc.data();
    const playerHand = playerData.hand || [];

    await db.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        console.error('❌ drawCard: Game not found:', gameId);
        throw new HttpsError('not-found', 'Game not found');
      }

      const gameData = gameDoc.data();

      // Check for automatic game-ending conditions (inactivity)
      const autoEndCheck = checkAutoEndConditions(gameData, gameData.players);
      if (autoEndCheck.shouldEnd) {
        console.log('⚠️ Auto-ending game:', autoEndCheck.reason);
        const recentLog = gameData.gameLog.slice(-20);
        transaction.update(gameRef, {
          status: autoEndCheck.status,
          gameLog: [...recentLog, autoEndCheck.reason],
          updatedAt: FieldValue.serverTimestamp(),
        });
        throw new HttpsError('failed-precondition', autoEndCheck.reason);
      }

      // Validate: game must be in progress
      if (gameData.status !== 'in-progress') {
        console.error('❌ drawCard: Game not in progress:', gameData.status);
        throw new HttpsError('failed-precondition', 'Game is not in progress');
      }

      // Validate: it's the player's turn
      const currentPlayer = gameData.players[gameData.currentPlayerIndex];
      if (currentPlayer.uid !== userId) {
        console.error('❌ drawCard: Not player\'s turn:', { userId, currentPlayer: currentPlayer.uid });
        throw new HttpsError('failed-precondition', 'It is not your turn');
      }

      console.log('✅ Validations passed, drawing card...');

      // Handle deck reshuffling if needed
      let drawPile = gameData.drawPile;
      let drawPileIndex = gameData.drawPileIndex;

      if (drawPileIndex >= drawPile.length - 1) {
        console.log('🔀 Reshuffling deck from discard pile');
        // Take all cards from discard pile except the current card
        const cardsToShuffle = gameData.discardPile.slice(0, -1);
        shuffle(cardsToShuffle);
        drawPile = [...cardsToShuffle, ...drawPile];
        drawPileIndex = 0;
      }

      // Determine how many cards to draw
      const pendingDrawCount = gameData.pendingDrawCount || 0;
      const cardsToDraw = pendingDrawCount > 0 ? pendingDrawCount : 1;
      const isPenaltyDraw = pendingDrawCount > 0;

      console.log(`📊 Drawing ${cardsToDraw} cards (penalty: ${isPenaltyDraw})`);

      // Draw cards
      const { cards: drawnCards, newIndex } = drawCards(drawPile, drawPileIndex, cardsToDraw);

      if (drawnCards.length === 0) {
        console.error('❌ drawCard: No cards left to draw');
        throw new HttpsError('failed-precondition', 'No cards left in deck');
      }

      // Update player's hand
      const updatedHand = [...playerHand, ...drawnCards];

      // Update player's card count in main document
      const updatedPlayers = gameData.players.map((p, i) => {
        if (i === gameData.currentPlayerIndex) {
          return { ...p, cardCount: updatedHand.length };
        }
        return p;
      });

      // Check for 40-card limit after drawing
      const cardLimitCheck = checkAutoEndConditions(gameData, updatedPlayers);
      let gameStatus = gameData.status;

      // Keep only last 20 log entries (pagination optimization)
      const recentLog = gameData.gameLog.slice(-20);
      let gameLog = recentLog;

      if (cardLimitCheck.shouldEnd) {
        console.log('⚠️ Auto-ending game due to card limit:', cardLimitCheck.reason);
        gameStatus = 'finished';
        gameLog = [...recentLog, cardLimitCheck.reason];
      }

      // Build updates object
      const updates = {
        players: updatedPlayers,
        drawPileIndex: newIndex,
        lastActionAt: FieldValue.serverTimestamp(), // Update last action time
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Add status if game ended
      if (gameStatus !== gameData.status) {
        updates.status = gameStatus;
      }

      // If this was a penalty draw, advance turn and reset pendingDrawCount
      if (isPenaltyDraw) {
        const nextPlayerIndex = getNextPlayerIndex(
          gameData.currentPlayerIndex,
          gameData.players.length,
          gameData.direction,
          0,
          updatedPlayers // Pass updated players to skip eliminated ones
        );
        updates.currentPlayerIndex = nextPlayerIndex;
        updates.pendingDrawCount = 0;
        updates.hasDrawnThisTurn = false;
        updates.turnStartedAt = FieldValue.serverTimestamp(); // Reset turn timer
        if (!cardLimitCheck.shouldEnd) {
          updates.gameLog = [...gameLog, `${currentPlayer.displayName} drew ${cardsToDraw} cards!`];
        } else {
          updates.gameLog = gameLog;
        }
      } else {
        // Normal draw - allow player to play or skip
        updates.hasDrawnThisTurn = true;
        if (!cardLimitCheck.shouldEnd) {
          updates.gameLog = [...gameLog, `${currentPlayer.displayName} drew a card`];
        } else {
          updates.gameLog = gameLog;
        }
      }

      // Only update drawPile if it was reshuffled
      if (drawPile !== gameData.drawPile) {
        updates.drawPile = drawPile;
      }

      transaction.update(gameRef, updates);

      // Update player's hand in subcollection
      transaction.update(playerRef, {
        hand: updatedHand,
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log('✅ Card drawn successfully:', {
        gameId,
        cardDrawn: drawnCards[0],
        newIndex,
      });
    });

    return { success: true };
  } catch (error) {
    console.error('❌ drawCard error:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to draw card: ${error.message}`);
  }
});

/**
 * Skip turn (after drawing a card)
 * @param {string} gameId - The game ID
 * @returns {Promise<{success: boolean}>}
 */
export const skipTurn = onCall(async (request) => {
  console.log('⏭️ skipTurn called by:', request.auth?.uid);

  if (!request.auth) {
    console.error('❌ skipTurn: Unauthenticated request');
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { gameId } = request.data || {};

  if (!gameId) {
    console.error('❌ skipTurn: Missing gameId');
    throw new HttpsError('invalid-argument', 'gameId is required');
  }

  console.log('📝 Skipping turn:', { gameId, userId });

  try {
    const gameRef = db.collection('games').doc(gameId);

    await db.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        console.error('❌ skipTurn: Game not found:', gameId);
        throw new HttpsError('not-found', 'Game not found');
      }

      const gameData = gameDoc.data();

      // Check for automatic game-ending conditions (inactivity)
      const autoEndCheck = checkAutoEndConditions(gameData, gameData.players);
      if (autoEndCheck.shouldEnd) {
        console.log('⚠️ Auto-ending game:', autoEndCheck.reason);
        const recentLog = gameData.gameLog.slice(-20);
        transaction.update(gameRef, {
          status: autoEndCheck.status,
          gameLog: [...recentLog, autoEndCheck.reason],
          updatedAt: FieldValue.serverTimestamp(),
        });
        throw new HttpsError('failed-precondition', autoEndCheck.reason);
      }

      // Validate: game must be in progress
      if (gameData.status !== 'in-progress') {
        console.error('❌ skipTurn: Game not in progress:', gameData.status);
        throw new HttpsError('failed-precondition', 'Game is not in progress');
      }

      // Validate: it's the player's turn
      const currentPlayer = gameData.players[gameData.currentPlayerIndex];
      if (currentPlayer.uid !== userId) {
        console.error('❌ skipTurn: Not player\'s turn:', { userId, currentPlayer: currentPlayer.uid });
        throw new HttpsError('failed-precondition', 'It is not your turn');
      }

      // Validate: player must have drawn a card this turn
      if (!gameData.hasDrawnThisTurn) {
        console.error('❌ skipTurn: Player has not drawn a card this turn');
        throw new HttpsError('failed-precondition', 'You must draw a card before skipping your turn');
      }

      console.log('✅ Validations passed, skipping turn...');

      // Advance turn
      const nextPlayerIndex = getNextPlayerIndex(
        gameData.currentPlayerIndex,
        gameData.players.length,
        gameData.direction,
        0,
        gameData.players // Pass players to skip eliminated ones
      );

      // Keep only last 20 log entries
      const recentLog = gameData.gameLog.slice(-20);

      // Field-masked updates
      const updates = {
        currentPlayerIndex: nextPlayerIndex,
        hasDrawnThisTurn: false,
        turnStartedAt: FieldValue.serverTimestamp(), // Reset turn timer
        lastActionAt: FieldValue.serverTimestamp(), // Update last action time
        gameLog: [...recentLog, `${currentPlayer.displayName} skipped their turn`],
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.update(gameRef, updates);

      console.log('✅ Turn skipped successfully:', {
        gameId,
        nextPlayerIndex,
      });
    });

    return { success: true };
  } catch (error) {
    console.error('❌ skipTurn error:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to skip turn: ${error.message}`);
  }
});

/**
 * Force draw and skip turn when timeout occurs
 * @param {string} gameId - The game ID
 * @returns {Promise<{success: boolean}>}
 */
export const forceDrawAndSkip = onCall(async (request) => {
  console.log('⏱️ forceDrawAndSkip called by:', request.auth?.uid);

  if (!request.auth) {
    console.error('❌ forceDrawAndSkip: Unauthenticated request');
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { gameId } = request.data || {};

  if (!gameId) {
    console.error('❌ forceDrawAndSkip: Missing gameId');
    throw new HttpsError('invalid-argument', 'gameId is required');
  }

  console.log('📝 Force draw and skip:', { gameId, userId });

  try {
    const gameRef = db.collection('games').doc(gameId);
    const playerRef = gameRef.collection('players').doc(userId);

    // Get player's hand from subcollection first
    const playerDoc = await playerRef.get();
    if (!playerDoc.exists) {
      console.error('❌ forceDrawAndSkip: Player hand not found:', userId);
      throw new HttpsError('not-found', 'Player hand not found');
    }

    const playerData = playerDoc.data();
    const playerHand = playerData.hand || [];

    await db.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        console.error('❌ forceDrawAndSkip: Game not found:', gameId);
        throw new HttpsError('not-found', 'Game not found');
      }

      const gameData = gameDoc.data();

      // Check for automatic game-ending conditions (inactivity)
      // Note: We don't throw here because timeout might have already ended the game
      const autoEndCheck = checkAutoEndConditions(gameData, gameData.players);
      if (autoEndCheck.shouldEnd) {
        console.log('⚠️ Auto-ending game:', autoEndCheck.reason);
        const recentLog = gameData.gameLog.slice(-20);
        transaction.update(gameRef, {
          status: autoEndCheck.status,
          gameLog: [...recentLog, autoEndCheck.reason],
          updatedAt: FieldValue.serverTimestamp(),
        });
        return; // Exit silently
      }

      // Validate: game must be in progress
      if (gameData.status !== 'in-progress') {
        console.log('⚠️ forceDrawAndSkip: Game not in progress, ignoring timeout');
        return; // Silently ignore if game ended
      }

      // Validate: it's still the player's turn
      const currentPlayer = gameData.players[gameData.currentPlayerIndex];
      if (currentPlayer.uid !== userId) {
        console.log('⚠️ forceDrawAndSkip: Not player\'s turn anymore, ignoring timeout');
        return; // Silently ignore if turn already passed
      }

      // If player already drew this turn, just skip
      if (gameData.hasDrawnThisTurn) {
        console.log('✅ Player already drew, just skipping turn due to timeout');

        const nextPlayerIndex = getNextPlayerIndex(
          gameData.currentPlayerIndex,
          gameData.players.length,
          gameData.direction,
          0,
          gameData.players
        );

        const recentLog = gameData.gameLog.slice(-20);
        const updates = {
          currentPlayerIndex: nextPlayerIndex,
          hasDrawnThisTurn: false,
          turnStartedAt: FieldValue.serverTimestamp(),
          lastActionAt: FieldValue.serverTimestamp(), // Update last action time
          gameLog: [...recentLog, `⏱️ ${currentPlayer.displayName} ran out of time and skipped their turn`],
          updatedAt: FieldValue.serverTimestamp(),
        };

        transaction.update(gameRef, updates);
        return;
      }

      console.log('✅ Timeout enforced, forcing draw and skip...');

      // Handle deck reshuffling if needed
      let drawPile = gameData.drawPile;
      let drawPileIndex = gameData.drawPileIndex;

      if (drawPileIndex >= drawPile.length - 1) {
        console.log('🔀 Reshuffling deck from discard pile');
        const cardsToShuffle = gameData.discardPile.slice(0, -1);
        shuffle(cardsToShuffle);
        drawPile = [...cardsToShuffle, ...drawPile];
        drawPileIndex = 0;
      }

      // Determine how many cards to draw
      const pendingDrawCount = gameData.pendingDrawCount || 0;
      const cardsToDraw = pendingDrawCount > 0 ? pendingDrawCount : 1;

      console.log(`📊 Forcing draw of ${cardsToDraw} cards`);

      // Draw cards
      const { cards: drawnCards, newIndex } = drawCards(drawPile, drawPileIndex, cardsToDraw);

      if (drawnCards.length === 0) {
        console.error('❌ forceDrawAndSkip: No cards left to draw');
        throw new HttpsError('failed-precondition', 'No cards left in deck');
      }

      // Update player's hand
      const updatedHand = [...playerHand, ...drawnCards];

      // Update player's card count in main document
      const updatedPlayers = gameData.players.map((p, i) => {
        if (i === gameData.currentPlayerIndex) {
          return { ...p, cardCount: updatedHand.length };
        }
        return p;
      });

      // Check for 40-card limit after drawing
      const cardLimitCheck = checkAutoEndConditions(gameData, updatedPlayers);
      let gameStatus = gameData.status;

      // Advance turn
      const nextPlayerIndex = getNextPlayerIndex(
        gameData.currentPlayerIndex,
        gameData.players.length,
        gameData.direction,
        0,
        updatedPlayers
      );

      // Keep only last 20 log entries
      const recentLog = gameData.gameLog.slice(-20);
      let gameLog = [...recentLog, `⏱️ ${currentPlayer.displayName} ran out of time! Drew ${cardsToDraw} card(s) and skipped their turn`];

      if (cardLimitCheck.shouldEnd) {
        console.log('⚠️ Auto-ending game due to card limit:', cardLimitCheck.reason);
        gameStatus = 'finished';
        gameLog = [...gameLog, cardLimitCheck.reason];
      }

      // Build updates object
      const updates = {
        players: updatedPlayers,
        drawPileIndex: newIndex,
        currentPlayerIndex: nextPlayerIndex,
        pendingDrawCount: 0,
        hasDrawnThisTurn: false,
        turnStartedAt: FieldValue.serverTimestamp(),
        lastActionAt: FieldValue.serverTimestamp(), // Update last action time
        gameLog: gameLog,
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Add status if game ended
      if (gameStatus !== gameData.status) {
        updates.status = gameStatus;
      }

      // Only update drawPile if it was reshuffled
      if (drawPile !== gameData.drawPile) {
        updates.drawPile = drawPile;
      }

      transaction.update(gameRef, updates);

      // Update player's hand in subcollection
      transaction.update(playerRef, {
        hand: updatedHand,
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log('✅ Force draw and skip completed:', {
        gameId,
        cardsDrawn: drawnCards.length,
        nextPlayerIndex,
      });
    });

    return { success: true };
  } catch (error) {
    console.error('❌ forceDrawAndSkip error:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to force draw and skip: ${error.message}`);
  }
});

console.log('✅ Functions module loaded');
