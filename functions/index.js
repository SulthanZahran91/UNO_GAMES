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
      winner: null,
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
      if (cardIndex < 0 || cardIndex >= playerHand.length) {
        console.error('❌ playCard: Invalid card index:', cardIndex);
        throw new HttpsError('invalid-argument', 'Invalid card index');
      }

      const card = playerHand[cardIndex];
      console.log('🃏 Card to play:', card);

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

      // Remove card from player's hand
      const updatedHand = playerHand.filter((_, i) => i !== cardIndex);

      // Update player's card count in main document
      const updatedPlayers = gameData.players.map((p, i) => {
        if (i === gameData.currentPlayerIndex) {
          return { ...p, cardCount: updatedHand.length };
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

      // Apply card effect (determine which players will be affected)
      const cardEffects = applyCardEffect(card, {
        ...gameData,
        players: updatedPlayers,
      }, chosenColor);

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
      const updates = {
        currentCard: card,
        activeColor: cardEffects.activeColor,
        currentPlayerIndex: cardEffects.currentPlayerIndex,
        discardPile: [...gameData.discardPile, card],
        gameLog: winner ? [...recentLog, `🏆 ${currentPlayer.displayName} wins the game!`] : recentLog,
        hasDrawnThisTurn: false, // Reset draw flag when playing a card
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Add optional fields only if they exist
      if (cardEffects.direction !== undefined) updates.direction = cardEffects.direction;
      if (cardEffects.drawPileIndex !== undefined) updates.drawPileIndex = cardEffects.drawPileIndex;
      if (cardEffects.players) updates.players = cardEffects.players;
      else updates.players = updatedPlayers;
      if (cardEffects.pendingDrawCount !== undefined) updates.pendingDrawCount = cardEffects.pendingDrawCount;
      if (status !== gameData.status) updates.status = status;
      if (winner) updates.winner = winner;

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

      // Keep only last 20 log entries (pagination optimization)
      const recentLog = gameData.gameLog.slice(-20);

      // Build updates object
      const updates = {
        players: updatedPlayers,
        drawPileIndex: newIndex,
        updatedAt: FieldValue.serverTimestamp(),
      };

      // If this was a penalty draw, advance turn and reset pendingDrawCount
      if (isPenaltyDraw) {
        const nextPlayerIndex = getNextPlayerIndex(
          gameData.currentPlayerIndex,
          gameData.players.length,
          gameData.direction,
          0
        );
        updates.currentPlayerIndex = nextPlayerIndex;
        updates.pendingDrawCount = 0;
        updates.hasDrawnThisTurn = false;
        updates.gameLog = [...recentLog, `${currentPlayer.displayName} drew ${cardsToDraw} cards!`];
      } else {
        // Normal draw - allow player to play or skip
        updates.hasDrawnThisTurn = true;
        updates.gameLog = [...recentLog, `${currentPlayer.displayName} drew a card`];
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
        0
      );

      // Keep only last 20 log entries
      const recentLog = gameData.gameLog.slice(-20);

      // Field-masked updates
      const updates = {
        currentPlayerIndex: nextPlayerIndex,
        hasDrawnThisTurn: false,
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

console.log('✅ Functions module loaded');
