import { useState, useEffect, useRef } from 'react';
import GameTable from '../components/GameTable';
import PlayerHand from '../components/PlayerHand';
import ColorPicker from '../components/ColorPicker';
import OpponentDisplay from '../components/OpponentDisplay';
import TurnIndicator from '../components/TurnIndicator';
import ActionNotification from '../components/ActionNotification';
import CardAnimation from '../components/CardAnimation';
import ConnectionStatus from '../components/ConnectionStatus';
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
  const [activeAnimation, setActiveAnimation] = useState(null);
  const lastGameLogLength = useRef(0);

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

  // Determine player position for animations (circular layout)
  const getPlayerPosition = (playerUid) => {
    if (playerUid === user?.uid) return 'you';

    const opponents = game.players.filter(p => p.uid !== user?.uid);
    const opponentIndex = opponents.findIndex(p => p.uid === playerUid);

    if (opponents.length === 1) return 'opponent-top';
    if (opponents.length === 2) {
      return opponentIndex === 0 ? 'opponent-left' : 'opponent-right';
    }

    // For 3+ opponents, use circular positioning with angles
    const angleStep = 180 / (opponents.length + 1);
    const angle = -90 + (angleStep * (opponentIndex + 1));

    return `opponent-${opponentIndex}-${angle}`;
  };

  // Watch for new game actions and trigger animations
  useEffect(() => {
    if (!game.gameLog || game.gameLog.length === 0) return;

    // Check if there's a new action
    if (game.gameLog.length > lastGameLogLength.current) {
      const latestAction = game.gameLog[game.gameLog.length - 1];
      console.log('🎬 New action detected:', latestAction);

      // Parse the action to determine type and player
      if (latestAction.includes('played')) {
        // Extract player name (before " played")
        const playerName = latestAction.split(' played')[0];
        const player = game.players.find(p => p.displayName === playerName);

        if (player) {
          setActiveAnimation({
            type: 'play',
            card: game.currentCard, // The card that was just played
            playerName: player.displayName,
            fromPosition: getPlayerPosition(player.uid),
          });
        }
      } else if (latestAction.includes('draws') || latestAction.includes('drew')) {
        // Extract player name (before " draws" or " drew")
        const playerName = latestAction.split(' draw')[0];
        const player = game.players.find(p => p.displayName === playerName);

        if (player) {
          setActiveAnimation({
            type: 'draw',
            playerName: player.displayName,
            fromPosition: getPlayerPosition(player.uid),
          });
        }
      }
    }

    lastGameLogLength.current = game.gameLog.length;
  }, [game.gameLog, game.players, game.currentCard, user?.uid]);

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
      padding: 'clamp(0.5rem, 2vw, 1.25rem)',
      minHeight: '100vh',
      paddingTop: 'clamp(3.5rem, 10vh, 5rem)', // Responsive space for turn indicator
    }}>
      {/* Connection Status */}
      <ConnectionStatus user={user} />

      {/* Turn Indicator */}
      <TurnIndicator
        currentPlayer={currentPlayer}
        isMyTurn={isMyTurn}
        direction={game.direction}
        players={game.players}
        currentPlayerIndex={game.currentPlayerIndex}
        myUid={user?.uid}
      />

      {/* Action Notifications */}
      <ActionNotification gameLog={game.gameLog} />

      {/* Error Display */}
      {actionError && (
        <div style={{
          position: 'fixed',
          top: 'clamp(4rem, 12vh, 6.25rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ff5555',
          color: 'white',
          padding: 'clamp(0.625rem, 2vw, 0.9375rem) clamp(1rem, 3vw, 1.875rem)',
          borderRadius: 'clamp(0.375rem, 1.5vw, 0.5rem)',
          boxShadow: '0 0.25rem 0.75rem rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
          fontWeight: 'bold',
          maxWidth: '90vw',
          textAlign: 'center',
        }} role="alert">
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
      <div style={{ marginBottom: 'clamp(0.75rem, 2.5vw, 1.25rem)' }}>
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

      {/* Card Animations */}
      {activeAnimation && (
        <CardAnimation
          type={activeAnimation.type}
          card={activeAnimation.card}
          playerName={activeAnimation.playerName}
          fromPosition={activeAnimation.fromPosition}
          onComplete={() => {
            console.log('🎬 Animation completed');
            setActiveAnimation(null);
          }}
        />
      )}
    </div>
  );
}
