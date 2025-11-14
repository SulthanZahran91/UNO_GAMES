/**
 * Game Logic Utilities
 * Handles turn advancement, card effects, and game state updates
 */

/**
 * Get the next player index based on direction
 * @param {number} currentIndex - Current player index
 * @param {number} totalPlayers - Total number of players
 * @param {string} direction - 'clockwise' or 'counter-clockwise'
 * @param {number} skip - Number of players to skip (default 0)
 * @returns {number} Next player index
 */
export function getNextPlayerIndex(currentIndex, totalPlayers, direction, skip = 0) {
  console.log('➡️ Getting next player:', { currentIndex, totalPlayers, direction, skip });

  let nextIndex = currentIndex;
  const steps = skip + 1;

  for (let i = 0; i < steps; i++) {
    if (direction === 'clockwise') {
      nextIndex = (nextIndex + 1) % totalPlayers;
    } else {
      nextIndex = (nextIndex - 1 + totalPlayers) % totalPlayers;
    }
  }

  console.log('✅ Next player index:', nextIndex);
  return nextIndex;
}

/**
 * Draw cards for a player
 * @param {Array} deck - The draw pile
 * @param {number} drawPileIndex - Current draw pile index
 * @param {number} count - Number of cards to draw
 * @returns {{cards: Array, newIndex: number}}
 */
export function drawCards(deck, drawPileIndex, count) {
  console.log(`🎴 Drawing ${count} cards from index ${drawPileIndex}`);

  const cards = [];
  let currentIndex = drawPileIndex;

  for (let i = 0; i < count; i++) {
    if (currentIndex >= deck.length) {
      console.warn('⚠️ Ran out of cards in draw pile');
      break;
    }
    cards.push(deck[currentIndex]);
    currentIndex++;
  }

  console.log(`✅ Drew ${cards.length} cards, new index: ${currentIndex}`);
  return { cards, newIndex: currentIndex };
}

/**
 * Apply card effect and return game state updates
 * @param {Object} card - The card being played
 * @param {Object} gameState - Current game state
 * @param {string} chosenColor - Color chosen for wild cards
 * @returns {Object} Game state updates including cardsToAdd for affected players
 */
export function applyCardEffect(card, gameState, chosenColor = null) {
  console.log('🎴 Applying card effect:', card);

  const {
    currentPlayerIndex,
    players,
    direction,
    drawPile,
    drawPileIndex,
    gameLog,
  } = gameState;

  const currentPlayer = players[currentPlayerIndex];
  const updates = {
    gameLog: [...gameLog],
    cardsToAdd: [], // Array of {playerIndex, playerUid, cards}
  };

  switch (card.value) {
    case 'skip': {
      // Skip next player
      console.log('🚫 Skip card: skipping next player');
      updates.activeColor = card.color;
      updates.currentPlayerIndex = getNextPlayerIndex(
        currentPlayerIndex,
        players.length,
        direction,
        1 // Skip 1 player
      );
      updates.gameLog.push(`${currentPlayer.displayName} played Skip ${card.color}`);
      const skippedPlayer = players[getNextPlayerIndex(currentPlayerIndex, players.length, direction, 0)];
      updates.gameLog.push(`${skippedPlayer.displayName} was skipped!`);
      break;
    }

    case 'reverse': {
      // Reverse direction
      console.log('🔄 Reverse card: flipping direction');
      updates.direction = direction === 'clockwise' ? 'counter-clockwise' : 'clockwise';
      updates.activeColor = card.color;
      updates.currentPlayerIndex = getNextPlayerIndex(
        currentPlayerIndex,
        players.length,
        updates.direction,
        0
      );
      updates.gameLog.push(`${currentPlayer.displayName} played Reverse ${card.color}`);
      updates.gameLog.push(`Direction reversed to ${updates.direction}!`);
      break;
    }

    case 'draw2': {
      // Next player draws 2 cards and is skipped
      console.log('+2 Draw 2 card: next player draws 2');
      const nextPlayerIndex = getNextPlayerIndex(currentPlayerIndex, players.length, direction, 0);
      const nextPlayer = players[nextPlayerIndex];

      const { cards: drawnCards, newIndex } = drawCards(drawPile, drawPileIndex, 2);

      // Update next player's card count
      const updatedPlayers = players.map((p, i) => {
        if (i === nextPlayerIndex) {
          return { ...p, cardCount: (p.cardCount || 0) + drawnCards.length };
        }
        return p;
      });

      updates.players = updatedPlayers;
      updates.drawPileIndex = newIndex;
      updates.activeColor = card.color;
      updates.currentPlayerIndex = getNextPlayerIndex(
        currentPlayerIndex,
        players.length,
        direction,
        1 // Skip the player who drew
      );
      updates.cardsToAdd.push({
        playerIndex: nextPlayerIndex,
        playerUid: nextPlayer.uid,
        cards: drawnCards,
      });
      updates.gameLog.push(`${currentPlayer.displayName} played Draw 2 ${card.color}`);
      updates.gameLog.push(`${nextPlayer.displayName} draws 2 cards and is skipped!`);
      break;
    }

    case 'wild': {
      // Player chooses new color
      console.log('🌈 Wild card: changing color to', chosenColor);
      updates.activeColor = chosenColor || 'red';
      updates.currentPlayerIndex = getNextPlayerIndex(
        currentPlayerIndex,
        players.length,
        direction,
        0
      );
      updates.gameLog.push(`${currentPlayer.displayName} played Wild`);
      updates.gameLog.push(`Color changed to ${updates.activeColor}!`);
      break;
    }

    case 'draw4': {
      // Next player draws 4 cards and is skipped, player chooses color
      console.log('🌈+4 Wild Draw 4: next player draws 4');
      const nextPlayerIndex = getNextPlayerIndex(currentPlayerIndex, players.length, direction, 0);
      const nextPlayer = players[nextPlayerIndex];

      const { cards: drawnCards, newIndex } = drawCards(drawPile, drawPileIndex, 4);

      // Update next player's card count
      const updatedPlayers = players.map((p, i) => {
        if (i === nextPlayerIndex) {
          return { ...p, cardCount: (p.cardCount || 0) + drawnCards.length };
        }
        return p;
      });

      updates.players = updatedPlayers;
      updates.drawPileIndex = newIndex;
      updates.activeColor = chosenColor || 'red';
      updates.currentPlayerIndex = getNextPlayerIndex(
        currentPlayerIndex,
        players.length,
        direction,
        1 // Skip the player who drew
      );
      updates.cardsToAdd.push({
        playerIndex: nextPlayerIndex,
        playerUid: nextPlayer.uid,
        cards: drawnCards,
      });
      updates.gameLog.push(`${currentPlayer.displayName} played Wild Draw 4`);
      updates.gameLog.push(`${nextPlayer.displayName} draws 4 cards and is skipped!`);
      updates.gameLog.push(`Color changed to ${updates.activeColor}!`);
      break;
    }

    default: {
      // Number card - just advance turn
      console.log(`#️⃣ Number card: ${card.color} ${card.value}`);
      updates.activeColor = card.color;
      updates.currentPlayerIndex = getNextPlayerIndex(
        currentPlayerIndex,
        players.length,
        direction,
        0
      );
      updates.gameLog.push(`${currentPlayer.displayName} played ${card.color} ${card.value}`);
      break;
    }
  }

  return updates;
}
