# UNO Game - Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Player Capacity](#player-capacity)
3. [Player Positioning System](#player-positioning-system)
4. [Animation System](#animation-system)
5. [File Structure](#file-structure)
6. [Key Components](#key-components)

---

## Overview

This is a real-time multiplayer UNO card game built with:
- **Frontend**: React (Vite)
- **Backend**: Firebase Functions (Node.js)
- **Database**: Firestore
- **Authentication**: Firebase Auth

### Current Capabilities
- **Player Capacity**: Up to 12 players per game
- **Real-time Updates**: Firestore listeners for live game state
- **Animations**: Enhanced card play and turn animations
- **Mobile Responsive**: Touch-friendly interface with responsive layouts

---

## Player Capacity

### Maximum Players: 12

**Backend Validation** (`functions/index.js:116`):
```javascript
if (gameData.players.length >= 12) {
  throw new HttpsError('failed-precondition', 'Game is full (max 12 players)');
}
```

**Why 12?**
- Allows for large party games
- Circular layout supports up to 11 opponents comfortably
- Standard UNO deck (108 cards) supports this many players

**To Change Player Limit:**
1. Update validation in `functions/index.js:116`
2. Consider deck size (may need multiple decks for 12+ players)
3. Test circular positioning with new player count

---

## Player Positioning System

### Circular Layout Algorithm

Players are positioned in a **semi-circle arc** from left (-90°) to right (90°), with you at the bottom center.

**Location**: `client/src/components/OpponentDisplay.jsx:22-32`

```javascript
const getPosition = (index, total) => {
  if (total === 1) return { type: 'top', angle: 0 };
  if (total === 2) return { type: index === 0 ? 'top-left' : 'top-right', angle: ... };

  // For 3+ opponents: distribute evenly in semi-circle
  const angleStep = 180 / (total + 1);
  const angle = -90 + (angleStep * (index + 1));

  return { type: 'circular', angle };
};
```

### Position Calculation

**For 3+ opponents** (`OpponentDisplay.jsx:74-89`):
```javascript
const radiusX = 45; // horizontal radius as % from center
const radiusY = 40; // vertical radius as % from center
const angleRad = (angle * Math.PI) / 180;

const x = 50 + radiusX * Math.sin(angleRad);
const y = 5 + radiusY * (1 - Math.cos(angleRad));
```

### Examples

| Players | Opponent Count | Layout |
|---------|----------------|--------|
| 2 | 1 | Top center |
| 3 | 2 | Top-left, Top-right |
| 4 | 3 | Left (-90°), Top (0°), Right (90°) |
| 12 | 11 | Evenly spaced arc from -90° to 90° |

**Visual**:
```
     3 opponents:

     o2      Semi-circle with
   o1  o3    you at bottom
     YOU

    11 opponents:

   o o o o o o o o o o o
         YOU
```

---

## Animation System

### Overview

The game uses **CSS keyframe animations** with React state management for visual effects.

**Location**: `client/src/components/CardAnimation.jsx`

### Animation Types

#### 1. Card Play Animations

**Regular Cards** (1 second):
- Scale to 1.5x
- Rotate 360°
- Move upward then to center
- Fade out

**Power Cards** (1.5 seconds):
- Scale to 2x
- Rotate 540°
- More dramatic upward arc
- Screen flash effect
- Particle burst (8 particles)
- Color-coded glow

**Code** (`CardAnimation.jsx:156`):
```javascript
animation: isPowerCard ? 'cardPlayPower 1.5s ease-in-out' : 'cardPlay 1s ease-in-out'
```

#### 2. Power Card Effects

**Supported Power Cards** (`CardAnimation.jsx:75-81`):

| Card | Emoji | Color | Text | Effect |
|------|-------|-------|------|--------|
| Skip | 🚫 | Red (#ff5555) | SKIP! | Red flash |
| Reverse | 🔄 | Blue (#5555ff) | REVERSE! | Blue flash |
| Draw 2 | ➕2️⃣ | Orange (#ff9500) | DRAW 2! | Orange flash |
| Wild | 🌈 | Purple (#aa55ff) | WILD! | Purple flash |
| Wild Draw 4 | ⚡➕4️⃣ | Bright Red (#ff0000) | WILD DRAW 4! | Red flash + particles |

**Particle Burst**: 8 particles explode outward in all directions (N, NE, E, SE, S, SW, W, NW)

#### 3. Turn Indicator Animations

**When It's Your Turn** (`TurnIndicator.jsx:51-64`):

1. **Full-screen border flash**:
   - 6px green border around screen
   - Pulsing glow effect
   - Opacity cycles: 0.4 → 0.8 → 0.4

2. **Turn indicator glow** (3 intensity levels):
   - Level 1: 2rem glow at 80% opacity
   - Level 2: 3rem glow at 100% opacity
   - Level 3: 4rem glow at 100% opacity

3. **Pulsing scale**:
   - 1.0x → 1.05x → 1.08x → 1.05x → 1.0x

**Code** (`TurnIndicator.jsx:228-240`):
```javascript
@keyframes pulse {
  0%, 100% { transform: scale(1) translateX(-50%); }
  25% { transform: scale(1.05) translateX(-50%); }
  50% { transform: scale(1.08) translateX(-50%); }
  75% { transform: scale(1.05) translateX(-50%); }
}
```

### Animation Position System

**For circular player positions** (`CardAnimation.jsx:51-63`):

Animations parse position strings in format: `opponent-{index}-{angle}`

Example: `opponent-3-45` = 4th opponent at 45° angle

```javascript
if (positionKey.startsWith('opponent-')) {
  const angle = parseFloat(parts[2]);
  const radiusX = 45;
  const radiusY = 40;
  const angleRad = (angle * Math.PI) / 180;
  const x = 50 + radiusX * Math.sin(angleRad);
  const y = 5 + radiusY * (1 - Math.cos(angleRad));
  return { x: `${x}%`, y: `${y}%` };
}
```

### Animation Triggers

**Location**: `client/src/pages/GameRoomActive.jsx:59-95`

Animations are triggered by watching `game.gameLog` changes:

```javascript
useEffect(() => {
  if (game.gameLog.length > lastGameLogLength.current) {
    const latestAction = game.gameLog[game.gameLog.length - 1];

    if (latestAction.includes('played')) {
      // Trigger play animation
      setActiveAnimation({
        type: 'play',
        card: game.currentCard,
        playerName: player.displayName,
        fromPosition: getPlayerPosition(player.uid),
      });
    }
  }
  lastGameLogLength.current = game.gameLog.length;
}, [game.gameLog]);
```

---

## File Structure

### Backend (Firebase Functions)

```
functions/
├── index.js                    # Cloud Functions (createGame, joinGame, startGame, playCard, drawCard)
├── utils/
│   ├── cards.js               # Deck generation, card validation
│   └── gameLogic.js           # Game rules, turn logic, card effects
```

**Key Functions**:
- `createGame`: Creates new game lobby (functions/index.js:20)
- `joinGame`: Adds player to game (functions/index.js:77)
  - **Validates max 12 players** (line 116)
- `startGame`: Deals cards and starts game (functions/index.js:159)
- `playCard`: Validates and plays a card (functions/index.js:277)
- `drawCard`: Draw card from deck (functions/index.js:418)

### Frontend (React)

```
client/src/
├── components/
│   ├── CardAnimation.jsx      # Card play/draw animations with power card effects
│   ├── OpponentDisplay.jsx    # Circular opponent positioning (supports 11 opponents)
│   ├── TurnIndicator.jsx      # Turn display with enhanced "your turn" animations
│   ├── GameTable.jsx          # Center play area with discard pile
│   ├── PlayerHand.jsx         # Your cards at bottom
│   ├── Card.jsx               # Individual card rendering
│   ├── CardBack.jsx           # Card back design
│   └── ColorPicker.jsx        # Wild card color selection
├── pages/
│   ├── GameRoomActive.jsx     # Active game state, animation triggers
│   ├── GameRoomWaiting.jsx    # Lobby/waiting room
│   └── Home.jsx               # Game creation/join screen
└── services/
    └── gameFunctions.js       # Firebase function wrappers
```

---

## Key Components

### 1. OpponentDisplay
**File**: `client/src/components/OpponentDisplay.jsx`

**Purpose**: Renders all opponents in circular layout

**Key Features**:
- Supports 1-11 opponents
- Circular positioning algorithm
- Shows card count, current turn indicator, UNO warning
- Mobile responsive (stacks horizontally on small screens)

**Props**:
```javascript
{
  players: Array,           // All players in game
  currentPlayerIndex: number,
  myUid: string,           // Current user's UID
  direction: 'clockwise' | 'counter-clockwise'
}
```

### 2. CardAnimation
**File**: `client/src/components/CardAnimation.jsx`

**Purpose**: Handles all card play and draw animations

**Key Features**:
- Regular vs power card detection
- Extended animations for power cards (1.5s vs 1s)
- Screen flash effects
- Particle burst system
- Circular position support

**Props**:
```javascript
{
  type: 'play' | 'draw',
  card: { color: string, value: string },
  playerName: string,
  fromPosition: string,    // 'you', 'opponent-top', 'opponent-{index}-{angle}'
  onComplete: () => void
}
```

**Power Card Detection** (line 19):
```javascript
const isPowerCard = card && ['skip', 'reverse', 'draw2', 'wild', 'draw4'].includes(card.value);
```

### 3. TurnIndicator
**File**: `client/src/components/TurnIndicator.jsx`

**Purpose**: Shows current turn with enhanced visual feedback

**Key Features**:
- Full-screen border flash when it's your turn
- Enhanced glow and pulse animations
- Turn sequence preview (next 2-3 players)
- Mobile responsive

**Props**:
```javascript
{
  currentPlayer: Object,
  isMyTurn: boolean,
  direction: string,
  players: Array,
  currentPlayerIndex: number,
  myUid: string
}
```

### 4. GameRoomActive
**File**: `client/src/pages/GameRoomActive.jsx`

**Purpose**: Main game controller, handles animations and game logic

**Key Features**:
- Watches game log for animation triggers
- Manages color picker for wild cards
- Handles card play and draw actions
- Calculates player positions for animations

**Key Function** (line 40):
```javascript
const getPlayerPosition = (playerUid) => {
  // Returns position string for animations
  // 'you', 'opponent-top', 'opponent-left', 'opponent-right',
  // or 'opponent-{index}-{angle}' for circular layout
}
```

---

## Common Tasks

### Adding a New Card Type

1. **Update deck generation** (`functions/utils/cards.js`)
2. **Add validation** (`functions/utils/cards.js` - `isValidMove`)
3. **Implement effect** (`functions/utils/gameLogic.js` - `applyCardEffect`)
4. **Add animation** (if special):
   - Update `CardAnimation.jsx` power card effects (line 75-81)
   - Add new emoji, color, and text

### Changing Player Limit

1. **Backend**: `functions/index.js:116` - Update max player check
2. **Frontend**: No changes needed (circular layout scales automatically)
3. **Consider**: Deck size may need adjustment for 15+ players

### Modifying Animations

**Animation Duration**:
- Regular cards: `CardAnimation.jsx:22` (1000ms)
- Power cards: `CardAnimation.jsx:22` (1500ms)

**Turn Indicator**:
- Glow: `TurnIndicator.jsx:217-227` (@keyframes glow)
- Pulse: `TurnIndicator.jsx:228-241` (@keyframes pulse)
- Border flash: `TurnIndicator.jsx:221-232` (@keyframes borderFlash)

### Adjusting Player Positioning

**Circular layout radius**:
```javascript
// OpponentDisplay.jsx:76-77
const radiusX = 45; // horizontal spread (% from center)
const radiusY = 40; // vertical spread (% from center)
```

**Angle range** (currently -90° to 90°):
```javascript
// OpponentDisplay.jsx:28-29
const angleStep = 180 / (total + 1);
const angle = -90 + (angleStep * (index + 1));
```

---

## Configuration Constants

### Animation Durations
```javascript
// CardAnimation.jsx:22
Regular cards: 1000ms
Power cards: 1500ms

// TurnIndicator.jsx:61
Border flash cycle: 2000ms
```

### Colors
```javascript
// OpponentDisplay.jsx:9
PLAYER_COLORS = ['#ff5555', '#5555ff', '#55aa55', '#ffaa00']

// Power card colors (CardAnimation.jsx:75-81)
Skip: #ff5555 (red)
Reverse: #5555ff (blue)
Draw2: #ff9500 (orange)
Wild: #aa55ff (purple)
Draw4: #ff0000 (bright red)
```

### Layout
```javascript
// OpponentDisplay.jsx:76-77
Circle radius: radiusX=45%, radiusY=40%

// TurnIndicator.jsx:51-52
Border thickness: 6px
Border radius: 8px
```

---

## Testing Checklist

When making changes, test:

- [ ] 2-player game (1 opponent - top center)
- [ ] 3-player game (2 opponents - top-left, top-right)
- [ ] 4-player game (3 opponents - left, top, right)
- [ ] 12-player game (11 opponents - circular arc)
- [ ] Play regular card (number/color card)
- [ ] Play each power card (Skip, Reverse, Draw 2, Wild, Wild Draw 4)
- [ ] "Your turn" indicator appears correctly
- [ ] Mobile responsive layout (small screens)
- [ ] Animation performance (no lag)

---

## Future Enhancements

Potential improvements:

1. **Sound Effects**: Add audio for card plays, power cards, your turn
2. **Achievements**: Track wins, streaks, special plays
3. **Chat**: In-game text chat
4. **Replays**: Save and replay games
5. **AI Players**: Computer opponents for solo play
6. **Multiple Decks**: For 15+ players, shuffle 2+ decks together
7. **Custom Rules**: House rules toggle (stacking Draw cards, etc.)
8. **Spectator Mode**: Watch games without playing

---

## Troubleshooting

### Animations not showing
- Check `gameLog` is updating in Firestore
- Verify `CardAnimation` component is mounted
- Check browser console for errors

### Players overlapping in circular layout
- Adjust `radiusX` and `radiusY` in `OpponentDisplay.jsx:76-77`
- Check responsive breakpoints in media queries

### Performance issues with 12 players
- Reduce animation complexity
- Optimize Firestore listeners
- Consider pagination for game log

---

## Quick Reference

| Feature | File | Line |
|---------|------|------|
| Max players | `functions/index.js` | 116 |
| Circular positioning | `OpponentDisplay.jsx` | 22-32, 74-89 |
| Power card effects | `CardAnimation.jsx` | 75-81 |
| Animation duration | `CardAnimation.jsx` | 22 |
| Turn indicator glow | `TurnIndicator.jsx` | 217-227 |
| Border flash | `TurnIndicator.jsx` | 221-232 |
| Animation triggers | `GameRoomActive.jsx` | 59-95 |

---

**Last Updated**: 2025-01-14
**Version**: 2.0 (12-player support with enhanced animations)
