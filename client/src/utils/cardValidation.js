/**
 * Client-side card validation utilities
 * Mirrors server-side validation for UI hints
 */

/**
 * Check if a card can be played on another card
 * @param {Object} cardToPlay - The card being played
 * @param {Object} currentCard - The current top card
 * @param {string} activeColor - The current active color
 * @returns {boolean}
 */
export function isValidMove(cardToPlay, currentCard, activeColor) {
  if (!cardToPlay || !currentCard || !activeColor) {
    return false;
  }

  // Wild cards can always be played
  if (cardToPlay.color === 'wild') {
    return true;
  }

  // Match by color
  if (cardToPlay.color === activeColor) {
    return true;
  }

  // Match by value
  if (cardToPlay.value === currentCard.value) {
    return true;
  }

  return false;
}

/**
 * Check if a card can be played given the current game state
 * @param {Object} cardToPlay - The card being played
 * @param {Object} currentCard - The current top card
 * @param {string} activeColor - The current active color
 * @param {number} pendingDrawCount - Number of cards pending to draw (for stacking)
 * @returns {boolean}
 */
export function canPlayCard(cardToPlay, currentCard, activeColor, pendingDrawCount = 0) {
  if (!cardToPlay) {
    return false;
  }

  // If there's a pending draw, player can only play a draw card to stack
  if (pendingDrawCount > 0) {
    return cardToPlay.value === 'draw2' || cardToPlay.value === 'draw4';
  }

  // Normal validation
  return isValidMove(cardToPlay, currentCard, activeColor);
}
