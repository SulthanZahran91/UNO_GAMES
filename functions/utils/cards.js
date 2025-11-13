/**
 * UNO Card Utilities
 * Handles deck generation, shuffling, and card validation
 */

/**
 * Generate a full UNO deck (108 cards)
 * @returns {Array<{color: string, value: string}>}
 */
export function generateDeck() {
  console.log('🎴 Generating UNO deck');

  const deck = [];
  const colors = ['red', 'blue', 'green', 'yellow'];
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const actions = ['skip', 'reverse', 'draw2'];

  // Add numbered cards
  // One "0" card per color
  colors.forEach(color => {
    deck.push({ color, value: '0' });
  });

  // Two of each card from 1-9
  colors.forEach(color => {
    for (let i = 1; i <= 9; i++) {
      deck.push({ color, value: String(i) });
      deck.push({ color, value: String(i) });
    }
  });

  // Add action cards (2 of each per color)
  colors.forEach(color => {
    actions.forEach(action => {
      deck.push({ color, value: action });
      deck.push({ color, value: action });
    });
  });

  // Add wild cards (4 of each)
  for (let i = 0; i < 4; i++) {
    deck.push({ color: 'wild', value: 'wild' });
    deck.push({ color: 'wild', value: 'draw4' });
  }

  console.log(`✅ Deck generated: ${deck.length} cards`);
  return deck;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array (modifies in place)
 */
export function shuffle(array) {
  console.log(`🔀 Shuffling ${array.length} items`);

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

/**
 * Check if a card can be played on another card
 * @param {Object} cardToPlay - The card being played
 * @param {Object} currentCard - The current top card
 * @param {string} activeColor - The current active color
 * @returns {boolean}
 */
export function isValidMove(cardToPlay, currentCard, activeColor) {
  console.log('🔍 Validating move:', {
    cardToPlay,
    currentCard,
    activeColor,
  });

  // Wild cards can always be played
  if (cardToPlay.color === 'wild') {
    console.log('✅ Valid: Wild card');
    return true;
  }

  // Match by color
  if (cardToPlay.color === activeColor) {
    console.log('✅ Valid: Color match');
    return true;
  }

  // Match by value
  if (cardToPlay.value === currentCard.value) {
    console.log('✅ Valid: Value match');
    return true;
  }

  console.log('❌ Invalid move');
  return false;
}

/**
 * Get a valid starting card
 * Starting card cannot be wild or draw4
 * @param {Array} deck - The deck to draw from
 * @param {number} index - Starting index
 * @returns {{card: Object, newIndex: number}}
 */
export function getValidStartCard(deck, index) {
  console.log('🎯 Finding valid start card from index:', index);

  let currentIndex = index;
  let card = deck[currentIndex];

  // Keep drawing until we get a non-wild, non-draw4 card
  while (card.color === 'wild' || card.value === 'draw4') {
    console.log('⏭️ Skipping invalid start card:', card);
    currentIndex++;
    if (currentIndex >= deck.length) {
      console.error('❌ Ran out of cards looking for valid start card');
      // Fallback: return first non-wild card
      currentIndex = deck.findIndex(c => c.color !== 'wild');
    }
    card = deck[currentIndex];
  }

  console.log('✅ Valid start card found:', card);
  return { card, newIndex: currentIndex + 1 };
}
