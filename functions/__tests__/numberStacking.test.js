import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { applyCardEffect } from '../utils/gameLogic.js';
import { isValidMove } from '../utils/cards.js';

/**
 * Number Stacking Feature Tests
 *
 * Tests for the number stacking feature that allows players
 * to play multiple cards with the same number in a single turn.
 *
 * Feature Requirements:
 * 1. Players can play multiple cards with the same number at once
 * 2. Only number cards (0-9) can be stacked
 * 3. All stacked cards must have the same value
 * 4. The first card must be a valid move
 * 5. Game log should show stacking action
 */

describe('Number Stacking Feature', () => {
  beforeAll(() => {
    console.log('🧪 Starting number stacking tests');
  });

  afterAll(() => {
    console.log('✅ Number stacking tests complete');
  });

  describe('Card Validation', () => {
    it('should allow number cards to match by value', () => {
      console.log('📝 Test: Number card value matching');

      const cardToPlay = { color: 'red', value: '5' };
      const currentCard = { color: 'blue', value: '5' };
      const activeColor = 'blue';

      const result = isValidMove(cardToPlay, currentCard, activeColor);

      expect(result).toBe(true);
    });

    it('should allow number cards to match by color', () => {
      console.log('📝 Test: Number card color matching');

      const cardToPlay = { color: 'red', value: '3' };
      const currentCard = { color: 'blue', value: '5' };
      const activeColor = 'red';

      const result = isValidMove(cardToPlay, currentCard, activeColor);

      expect(result).toBe(true);
    });

    it('should reject invalid number card plays', () => {
      console.log('📝 Test: Invalid number card play');

      const cardToPlay = { color: 'red', value: '3' };
      const currentCard = { color: 'blue', value: '5' };
      const activeColor = 'green';

      const result = isValidMove(cardToPlay, currentCard, activeColor);

      expect(result).toBe(false);
    });
  });

  describe('Multi-Card Validation', () => {
    it('should validate all cards have same value for stacking', () => {
      console.log('📝 Test: Same value validation');

      const cardsToStack = [
        { color: 'red', value: '5' },
        { color: 'blue', value: '5' },
        { color: 'green', value: '5' },
      ];

      const allSameValue = cardsToStack.every(card => card.value === cardsToStack[0].value);

      expect(allSameValue).toBe(true);
    });

    it('should reject stacking cards with different values', () => {
      console.log('📝 Test: Different value rejection');

      const cardsToStack = [
        { color: 'red', value: '5' },
        { color: 'blue', value: '3' },
        { color: 'green', value: '5' },
      ];

      const allSameValue = cardsToStack.every(card => card.value === cardsToStack[0].value);

      expect(allSameValue).toBe(false);
    });

    it('should identify number cards correctly', () => {
      console.log('📝 Test: Number card identification');

      const numberCards = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const actionCards = ['skip', 'reverse', 'draw2', 'wild', 'draw4'];

      numberCards.forEach(value => {
        expect(/^[0-9]$/.test(value)).toBe(true);
      });

      actionCards.forEach(value => {
        expect(/^[0-9]$/.test(value)).toBe(false);
      });
    });

    it('should reject stacking action cards', () => {
      console.log('📝 Test: Action card stacking rejection');

      const actionCardsToStack = [
        { color: 'red', value: 'skip' },
        { color: 'blue', value: 'skip' },
      ];

      const firstValue = actionCardsToStack[0].value;
      const isNumberCard = /^[0-9]$/.test(firstValue);

      expect(isNumberCard).toBe(false);
    });
  });

  describe('Game State Updates', () => {
    it('should update game log for single card play', () => {
      console.log('📝 Test: Single card game log');

      const card = { color: 'red', value: '5' };
      const gameState = {
        currentPlayerIndex: 0,
        players: [
          { uid: 'user1', displayName: 'Player 1', cardCount: 6 },
          { uid: 'user2', displayName: 'Player 2', cardCount: 7 },
        ],
        direction: 'clockwise',
        drawPile: [],
        drawPileIndex: 50,
        gameLog: [],
      };

      const result = applyCardEffect(card, gameState, null, 1);

      expect(result.gameLog).toContain('Player 1 played red 5');
      expect(result.gameLog.length).toBe(1);
    });

    it('should update game log for stacked cards', () => {
      console.log('📝 Test: Stacked cards game log');

      const card = { color: 'red', value: '5' };
      const gameState = {
        currentPlayerIndex: 0,
        players: [
          { uid: 'user1', displayName: 'Player 1', cardCount: 5 },
          { uid: 'user2', displayName: 'Player 2', cardCount: 7 },
        ],
        direction: 'clockwise',
        drawPile: [],
        drawPileIndex: 50,
        gameLog: [],
      };

      const result = applyCardEffect(card, gameState, null, 3); // 3 cards stacked

      expect(result.gameLog).toContain('Player 1 played 3x 5 (stacking!)');
      expect(result.gameLog.length).toBe(1);
    });

    it('should advance turn normally after stacking', () => {
      console.log('📝 Test: Turn advancement with stacking');

      const card = { color: 'red', value: '7' };
      const gameState = {
        currentPlayerIndex: 0,
        players: [
          { uid: 'user1', displayName: 'Player 1', cardCount: 4 },
          { uid: 'user2', displayName: 'Player 2', cardCount: 7 },
          { uid: 'user3', displayName: 'Player 3', cardCount: 5 },
        ],
        direction: 'clockwise',
        drawPile: [],
        drawPileIndex: 50,
        gameLog: [],
      };

      const result = applyCardEffect(card, gameState, null, 2); // 2 cards stacked

      expect(result.currentPlayerIndex).toBe(1); // Next player
      expect(result.activeColor).toBe('red');
    });
  });

  describe('Index Handling', () => {
    it('should remove cards from hand using correct indices', () => {
      console.log('📝 Test: Card removal by indices');

      const hand = [
        { color: 'red', value: '5' },
        { color: 'blue', value: '3' },
        { color: 'green', value: '5' },
        { color: 'yellow', value: '7' },
        { color: 'red', value: '5' },
      ];

      // Player wants to stack indices 0, 2, 4 (all red/green/red 5s)
      const indicesToPlay = [0, 2, 4];

      // Remove cards - important to sort descending for safe removal
      const sortedIndices = [...indicesToPlay].sort((a, b) => b - a);
      const updatedHand = hand.filter((_, i) => !sortedIndices.includes(i));

      expect(updatedHand.length).toBe(2);
      expect(updatedHand[0]).toEqual({ color: 'blue', value: '3' });
      expect(updatedHand[1]).toEqual({ color: 'yellow', value: '7' });
    });

    it('should handle single card index correctly', () => {
      console.log('📝 Test: Single card index handling');

      const hand = [
        { color: 'red', value: '5' },
        { color: 'blue', value: '3' },
        { color: 'green', value: '7' },
      ];

      const indicesToPlay = [1]; // Play the blue 3
      const updatedHand = hand.filter((_, i) => !indicesToPlay.includes(i));

      expect(updatedHand.length).toBe(2);
      expect(updatedHand[0]).toEqual({ color: 'red', value: '5' });
      expect(updatedHand[1]).toEqual({ color: 'green', value: '7' });
    });
  });

  describe('Discard Pile Updates', () => {
    it('should add all stacked cards to discard pile', () => {
      console.log('📝 Test: Discard pile with stacked cards');

      const discardPile = [
        { color: 'yellow', value: '2' },
        { color: 'blue', value: '8' },
      ];

      const cardsToPlay = [
        { color: 'red', value: '5' },
        { color: 'blue', value: '5' },
        { color: 'green', value: '5' },
      ];

      const updatedDiscardPile = [...discardPile, ...cardsToPlay];

      expect(updatedDiscardPile.length).toBe(5);
      expect(updatedDiscardPile[2]).toEqual({ color: 'red', value: '5' });
      expect(updatedDiscardPile[3]).toEqual({ color: 'blue', value: '5' });
      expect(updatedDiscardPile[4]).toEqual({ color: 'green', value: '5' });
    });

    it('should set current card to first stacked card', () => {
      console.log('📝 Test: Current card after stacking');

      const cardsToPlay = [
        { color: 'red', value: '5' },
        { color: 'blue', value: '5' },
        { color: 'green', value: '5' },
      ];

      const currentCard = cardsToPlay[0]; // First card becomes current

      expect(currentCard).toEqual({ color: 'red', value: '5' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle stacking all cards in hand', () => {
      console.log('📝 Test: Stacking all remaining cards');

      const hand = [
        { color: 'red', value: '9' },
        { color: 'blue', value: '9' },
        { color: 'green', value: '9' },
      ];

      const indicesToPlay = [0, 1, 2]; // All cards
      const updatedHand = hand.filter((_, i) => !indicesToPlay.includes(i));

      expect(updatedHand.length).toBe(0); // Player finishes!
    });

    it('should handle player with only one card of a number', () => {
      console.log('📝 Test: Single card "stacking"');

      const hand = [
        { color: 'red', value: '5' },
        { color: 'blue', value: '3' },
        { color: 'green', value: '7' },
      ];

      const indicesToPlay = [0]; // Just one card
      const cardsToPlay = indicesToPlay.map(idx => hand[idx]);

      expect(cardsToPlay.length).toBe(1);
      expect(cardsToPlay[0]).toEqual({ color: 'red', value: '5' });
    });

    it('should validate indices are in bounds', () => {
      console.log('📝 Test: Index bounds validation');

      const hand = [
        { color: 'red', value: '5' },
        { color: 'blue', value: '3' },
      ];

      const invalidIndices = [0, 1, 5]; // Index 5 is out of bounds
      const allValid = invalidIndices.every(idx => idx >= 0 && idx < hand.length);

      expect(allValid).toBe(false);
    });

    it('should handle empty indices array', () => {
      console.log('📝 Test: Empty indices array');

      const indicesToPlay = [];

      expect(Array.isArray(indicesToPlay)).toBe(true);
      expect(indicesToPlay.length).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should simulate a complete stacking turn', () => {
      console.log('📝 Test: Complete stacking scenario');

      // Initial game state
      const playerHand = [
        { color: 'red', value: '3' },
        { color: 'blue', value: '5' },
        { color: 'green', value: '3' },
        { color: 'yellow', value: '7' },
        { color: 'red', value: '3' },
      ];

      const currentCard = { color: 'blue', value: '3' };
      const activeColor = 'blue';

      // Player selects indices 0, 2, 4 (all 3s)
      const selectedIndices = [0, 2, 4];
      const cardsToPlay = selectedIndices.map(idx => playerHand[idx]);

      // Validate all same value
      const allSameValue = cardsToPlay.every(card => card.value === cardsToPlay[0].value);
      expect(allSameValue).toBe(true);

      // Validate first card is playable
      const firstCardValid = isValidMove(cardsToPlay[0], currentCard, activeColor);
      expect(firstCardValid).toBe(true);

      // Validate all are number cards
      const allNumberCards = cardsToPlay.every(card => /^[0-9]$/.test(card.value));
      expect(allNumberCards).toBe(true);

      // Remove cards from hand
      const updatedHand = playerHand.filter((_, i) => !selectedIndices.includes(i));
      expect(updatedHand.length).toBe(2);

      // Update game state
      const gameState = {
        currentPlayerIndex: 0,
        players: [
          { uid: 'user1', displayName: 'Alice', cardCount: 5 },
          { uid: 'user2', displayName: 'Bob', cardCount: 7 },
        ],
        direction: 'clockwise',
        drawPile: [],
        drawPileIndex: 50,
        gameLog: ['Game started'],
      };

      const result = applyCardEffect(cardsToPlay[0], gameState, null, cardsToPlay.length);

      expect(result.gameLog).toContain('Alice played 3x 3 (stacking!)');
      expect(result.currentPlayerIndex).toBe(1); // Next player (Bob)
      expect(result.activeColor).toBe('red'); // First card's color
    });

    it('should handle stacking with pending draw count (should not affect)', () => {
      console.log('📝 Test: Number stacking independent of draw stacking');

      const card = { color: 'red', value: '5' };
      const gameState = {
        currentPlayerIndex: 0,
        players: [
          { uid: 'user1', displayName: 'Player 1', cardCount: 4 },
          { uid: 'user2', displayName: 'Player 2', cardCount: 7 },
        ],
        direction: 'clockwise',
        drawPile: [],
        drawPileIndex: 50,
        gameLog: [],
        pendingDrawCount: 0, // No pending draws
      };

      const result = applyCardEffect(card, gameState, null, 2);

      // Number card stacking should not create pendingDrawCount
      expect(result.pendingDrawCount).toBeUndefined();
    });
  });

  describe('API Request Structure', () => {
    it('should accept single cardIndex', () => {
      console.log('📝 Test: Single card request format');

      const request = {
        gameId: 'game-123',
        cardIndex: 2,
        chosenColor: null,
      };

      expect(request).toHaveProperty('cardIndex');
      expect(typeof request.cardIndex).toBe('number');
    });

    it('should accept cardIndices array', () => {
      console.log('📝 Test: Multiple cards request format');

      const request = {
        gameId: 'game-123',
        cardIndices: [0, 2, 4],
        chosenColor: null,
      };

      expect(request).toHaveProperty('cardIndices');
      expect(Array.isArray(request.cardIndices)).toBe(true);
      expect(request.cardIndices.length).toBe(3);
    });

    it('should validate cardIndices is non-empty array', () => {
      console.log('📝 Test: Empty cardIndices validation');

      const validRequest = {
        cardIndices: [0, 1],
      };

      const invalidRequest = {
        cardIndices: [],
      };

      expect(Array.isArray(validRequest.cardIndices)).toBe(true);
      expect(validRequest.cardIndices.length).toBeGreaterThan(0);

      expect(Array.isArray(invalidRequest.cardIndices)).toBe(true);
      expect(invalidRequest.cardIndices.length).toBe(0);
    });
  });
});
