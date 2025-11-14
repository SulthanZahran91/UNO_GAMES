import { useState, useEffect, useRef } from 'react';
import GameTable from '../components/GameTable';
import PlayerHand from '../components/PlayerHand';
import ColorPicker from '../components/ColorPicker';
import OpponentDisplay from '../components/OpponentDisplay';
import TurnIndicator from '../components/TurnIndicator';
import ActionNotification from '../components/ActionNotification';
import CardAnimation from '../components/CardAnimation';
import ConnectionStatus from '../components/ConnectionStatus';
import { usePlayerHand } from '../hooks/usePlayerHand';
import { playCard as playCardService, drawCard as drawCardService, skipTurn as skipTurnService } from '../services/gameFunctions';
import { canPlayCard } from '../utils/cardValidation';

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

  // Subscribe to player's hand from subcollection
  const { hand: myHand, loading: handLoading } = usePlayerHand(gameId, user?.uid);

  // Get my player metadata (from main game document)
  const myPlayer = game.players?.find(p => p.uid === user?.uid);

  console.log('🎮 GameRoomActive render:', {
    gameId,
    userId: user?.uid,
    currentPlayerIndex: game.currentPlayerIndex,
    status: game.status,
    myHandCount: myHand?.length || 0,
    myHand: myHand,
    handLoading: handLoading,
    myPlayer: myPlayer,
    myPlayerCardCount: myPlayer?.cardCount,
  });

  // Find current player
  const currentPlayer = game.players?.[game.currentPlayerIndex];
  const isMyTurn = currentPlayer?.uid === user?.uid;

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

  const handleMultiCardPlay = async (cardIndices) => {
    console.log('🎴 Playing multiple cards:', { cardIndices });

    if (!isMyTurn) {
      setActionError('It is not your turn');
      return;
    }

    // Validate all cards are the same number
    const cardsToPlay = cardIndices.map(idx => myHand[idx]);
    const firstValue = cardsToPlay[0].value;
    const allSameValue = cardsToPlay.every(card => card.value === firstValue);

    if (!allSameValue) {
      setActionError('All stacked cards must have the same number');
      setTimeout(() => setActionError(null), 3000);
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await playCardService(gameId, cardIndices);
      console.log('✅ Cards played successfully');
    } catch (err) {
      console.error('❌ Failed to play cards:', err);
      setActionError(err.message || 'Failed to play cards');
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

  const handleSkipTurn = async () => {
    console.log('⏭️ Skipping turn');

    if (!isMyTurn) {
      setActionError('It is not your turn');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      await skipTurnService(gameId);
      console.log('✅ Turn skipped successfully');
    } catch (err) {
      console.error('❌ Failed to skip turn:', err);
      setActionError(err.message || 'Failed to skip turn');
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const drawPileCount = game.drawPile?.length - game.drawPileIndex || 0;
  const pendingDrawCount = game.pendingDrawCount || 0;
  const hasDrawnThisTurn = game.hasDrawnThisTurn || false;
  const canSkipTurn = isMyTurn && hasDrawnThisTurn && !actionLoading;

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
          canDraw={isMyTurn && !actionLoading && !hasDrawnThisTurn}
          drawPileCount={drawPileCount}
        />
      </div>

      {/* Pending Draw Warning */}
      {pendingDrawCount > 0 && (
        <div style={{
          marginBottom: 'clamp(0.75rem, 2.5vw, 1.25rem)',
          padding: 'clamp(0.75rem, 2.5vw, 1rem)',
          background: 'rgba(255, 85, 85, 0.2)',
          borderRadius: 'clamp(0.5rem, 2vw, 0.75rem)',
          border: '0.125rem solid rgba(255, 85, 85, 0.4)',
          textAlign: 'center',
          fontSize: 'clamp(0.875rem, 3vw, 1rem)',
          color: '#ff5555',
          fontWeight: 'bold',
        }}>
          ⚠️ {pendingDrawCount} cards stacked! Draw them or play a Draw 2/Draw 4 to stack!
        </div>
      )}

      {/* Skip Turn Button */}
      {canSkipTurn && (
        <div style={{
          marginBottom: 'clamp(0.75rem, 2.5vw, 1.25rem)',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <button
            onClick={handleSkipTurn}
            disabled={actionLoading}
            style={{
              padding: 'clamp(0.625rem, 2.5vw, 0.875rem) clamp(1.25rem, 4vw, 2rem)',
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              fontWeight: 'bold',
              color: 'white',
              background: actionLoading ? '#666' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 'clamp(0.5rem, 2vw, 0.75rem)',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 0.25rem 0.75rem rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
              opacity: actionLoading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!actionLoading) {
                e.target.style.transform = 'translateY(-0.125rem)';
                e.target.style.boxShadow = '0 0.375rem 1rem rgba(0, 0, 0, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 0.25rem 0.75rem rgba(0, 0, 0, 0.3)';
            }}
          >
            ⏭️ Skip Turn
          </button>
        </div>
      )}

      {/* Player's Hand */}
      <PlayerHand
        hand={myHand || []}
        onCardClick={handleCardClick}
        onMultiCardPlay={handleMultiCardPlay}
        currentCard={game.currentCard}
        activeColor={game.activeColor}
        disabled={!isMyTurn || actionLoading}
        loading={handLoading}
        pendingDrawCount={pendingDrawCount}
      />

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
