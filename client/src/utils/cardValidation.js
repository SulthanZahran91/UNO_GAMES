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
