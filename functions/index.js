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

      if (gameData.players.length >= 12) {
        console.error('❌ joinGame: Game is full:', gameId);
        throw new HttpsError('failed-precondition', 'Game is full (max 12 players)');
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
      const updatedPlayers = gameData.players.map((player, index) => {
        const hand = [];
        for (let i = 0; i < 7; i++) {
          hand.push(deck[drawPileIndex]);
          drawPileIndex++;
        }
        console.log(`✅ Dealt 7 cards to ${player.displayName}`);
        return { ...player, hand };
      });

      // Get valid starting card
      const { card: startCard, newIndex } = getValidStartCard(deck, drawPileIndex);
      drawPileIndex = newIndex;

      console.log('🎯 Start card:', startCard);

      // Initialize game state
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
        gameLog: [...gameData.gameLog, 'Game started!', `First card: ${startCard.color} ${startCard.value}`],
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
  const { gameId, cardIndex, chosenColor } = request.data || {};

  if (!gameId) {
    console.error('❌ playCard: Missing gameId');
    throw new HttpsError('invalid-argument', 'gameId is required');
  }

  if (cardIndex === undefined || cardIndex === null) {
    console.error('❌ playCard: Missing cardIndex');
    throw new HttpsError('invalid-argument', 'cardIndex is required');
  }

  console.log('📝 Playing card:', { gameId, userId, cardIndex, chosenColor });

  try {
    const gameRef = db.collection('games').doc(gameId);

    await db.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        console.error('❌ playCard: Game not found:', gameId);
        throw new HttpsError('not-found', 'Game not found');
      }

      const gameData = gameDoc.data();

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

      // Get the card from player's hand
      if (cardIndex < 0 || cardIndex >= currentPlayer.hand.length) {
        console.error('❌ playCard: Invalid card index:', cardIndex);
        throw new HttpsError('invalid-argument', 'Invalid card index');
      }

      const card = currentPlayer.hand[cardIndex];
      console.log('🃏 Card to play:', card);

      // Validate: card can be played
      if (!isValidMove(card, gameData.currentCard, gameData.activeColor)) {
        console.error('❌ playCard: Invalid move:', { card, currentCard: gameData.currentCard, activeColor: gameData.activeColor });
        throw new HttpsError('failed-precondition', 'This card cannot be played');
      }

      // Validate: wild cards need a color
      if ((card.value === 'wild' || card.value === 'draw4') && !chosenColor) {
        console.error('❌ playCard: No color chosen for wild card');
        throw new HttpsError('invalid-argument', 'Must choose a color for wild cards');
      }

      console.log('✅ Move is valid, applying card effect...');

      // Remove card from player's hand
      const updatedHand = currentPlayer.hand.filter((_, i) => i !== cardIndex);

      // Update player's hand
      const updatedPlayers = gameData.players.map((p, i) => {
        if (i === gameData.currentPlayerIndex) {
          return { ...p, hand: updatedHand };
        }
        return p;
      });

      // Check for win
      let winner = null;
      let status = gameData.status;
      if (updatedHand.length === 0) {
        console.log('🏆 Player wins!', currentPlayer.displayName);
        winner = userId;
        status = 'finished';
      }

      // Apply card effect
      const cardEffects = applyCardEffect(card, {
        ...gameData,
        players: updatedPlayers,
      }, chosenColor);

      // Add card to discard pile
      const discardPile = [...gameData.discardPile, card];

      // Build updates
      const updates = {
        ...cardEffects,
        players: cardEffects.players || updatedPlayers,
        currentCard: card,
        discardPile,
        status,
        winner,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (winner) {
        updates.gameLog = [...(cardEffects.gameLog || gameData.gameLog), `🏆 ${currentPlayer.displayName} wins the game!`];
      }

      transaction.update(gameRef, updates);

      console.log('✅ Card played successfully:', {
        gameId,
        card,
        newStatus: status,
        winner,
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

    await db.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);

      if (!gameDoc.exists) {
        console.error('❌ drawCard: Game not found:', gameId);
        throw new HttpsError('not-found', 'Game not found');
      }

      const gameData = gameDoc.data();

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

      // Draw one card
      const { cards: drawnCards, newIndex } = drawCards(drawPile, drawPileIndex, 1);

      if (drawnCards.length === 0) {
        console.error('❌ drawCard: No cards left to draw');
        throw new HttpsError('failed-precondition', 'No cards left in deck');
      }

      // Update player's hand
      const updatedPlayers = gameData.players.map((p, i) => {
        if (i === gameData.currentPlayerIndex) {
          return { ...p, hand: [...p.hand, ...drawnCards] };
        }
        return p;
      });

      // Advance turn
      const nextPlayerIndex = getNextPlayerIndex(
        gameData.currentPlayerIndex,
        gameData.players.length,
        gameData.direction,
        0
      );

      const updates = {
        players: updatedPlayers,
        drawPile,
        drawPileIndex: newIndex,
        currentPlayerIndex: nextPlayerIndex,
        gameLog: [...gameData.gameLog, `${currentPlayer.displayName} drew a card`],
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.update(gameRef, updates);

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

console.log('✅ Functions module loaded');
