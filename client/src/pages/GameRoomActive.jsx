import { useState } from 'react';
import GameTable from '../components/GameTable';
import PlayerHand from '../components/PlayerHand';
import ColorPicker from '../components/ColorPicker';
import OpponentDisplay from '../components/OpponentDisplay';
import TurnIndicator from '../components/TurnIndicator';
import ActionNotification from '../components/ActionNotification';
import { playCard as playCardService, drawCard as drawCardService } from '../services/gameFunctions';

/**
 * Active Game Room Component
 * Displays the game when it's in progress
 */

export default function GameRoomActive({ game, user, gameId }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingCard, setPendingCard] = useState(null);

  console.log('🎮 GameRoomActive render:', {
    gameId,
    userId: user?.uid,
    currentPlayerIndex: game.currentPlayerIndex,
    status: game.status,
  });

  // Find current player
  const currentPlayer = game.players?.[game.currentPlayerIndex];
  const isMyTurn = currentPlayer?.uid === user?.uid;

  // Get my player data
  const myPlayer = game.players?.find(p => p.uid === user?.uid);

  const handleCardClick = async (card, cardIndex) => {
    console.log('🃏 Card clicked:', { card, cardIndex, isMyTurn });

    if (!isMyTurn) {
      setActionError('It is not your turn');
      return;
    }

    // Check if it's a wild card - show color picker
    if (card.value === 'wild' || card.value === 'draw4') {
      console.log('🌈 Wild card - showing color picker');
      setPendingCard({ card, cardIndex });
      setShowColorPicker(true);
      return;
    }

    // Play regular card
    await playCard(cardIndex, null);
  };

  const handleColorSelect = async (chosenColor) => {
    console.log('🎨 Color selected:', chosenColor);
    setShowColorPicker(false);

    if (pendingCard) {
      await playCard(pendingCard.cardIndex, chosenColor);
      setPendingCard(null);
    }
  };

  const playCard = async (cardIndex, chosenColor) => {
    console.log('🎴 Playing card:', { cardIndex, chosenColor });
    setActionLoading(true);
    setActionError(null);

    try {
      await playCardService(gameId, cardIndex, chosenColor);
      console.log('✅ Card played successfully');
    } catch (err) {
      console.error('❌ Failed to play card:', err);
      setActionError(err.message || 'Failed to play card');
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDrawCard = async () => {
    console.log('🎴 Drawing card');

    if (!isMyTurn) {
      setActionError('It is not your turn');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await drawCardService(gameId);
      console.log('✅ Card drawn successfully');
    } catch (err) {
      console.error('❌ Failed to draw card:', err);
      setActionError(err.message || 'Failed to draw card');
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const drawPileCount = game.drawPile?.length - game.drawPileIndex || 0;

  return (
    <div style={{
      padding: '20px',
      minHeight: '100vh',
      paddingTop: '80px', // Space for turn indicator
    }}>
      {/* Turn Indicator */}
      <TurnIndicator
        currentPlayer={currentPlayer}
        isMyTurn={isMyTurn}
        direction={game.direction}
        players={game.players}
      />

      {/* Action Notifications */}
      <ActionNotification gameLog={game.gameLog} />

      {/* Error Display */}
      {actionError && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ff5555',
          color: 'white',
          padding: '15px 30px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          fontSize: '16px',
          fontWeight: 'bold',
        }}>
          ❌ {actionError}
        </div>
      )}

      {/* Color Picker Modal */}
      {showColorPicker && (
        <ColorPicker
          onColorSelect={handleColorSelect}
          onCancel={() => {
            setShowColorPicker(false);
            setPendingCard(null);
          }}
        />
      )}

      {/* Opponent Display */}
      <OpponentDisplay
        players={game.players}
        currentPlayerIndex={game.currentPlayerIndex}
        myUid={user?.uid}
        direction={game.direction}
      />

      {/* Game Table (Center Area) */}
      <div style={{ marginBottom: '20px' }}>
        <GameTable
          currentCard={game.currentCard}
          activeColor={game.activeColor}
          direction={game.direction}
          currentPlayerIndex={game.currentPlayerIndex}
          players={game.players}
          onDrawCard={handleDrawCard}
          canDraw={isMyTurn && !actionLoading}
          drawPileCount={drawPileCount}
        />
      </div>

      {/* Player's Hand */}
      {myPlayer && (
        <PlayerHand
          hand={myPlayer.hand}
          onCardClick={handleCardClick}
          currentCard={game.currentCard}
          activeColor={game.activeColor}
          disabled={!isMyTurn || actionLoading}
        />
      )}
    </div>
  );
}
