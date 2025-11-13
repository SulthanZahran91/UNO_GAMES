# Testing Guide - UNO Game

This guide walks you through testing the UNO game implementation.

## 🎯 Current Implementation Status

### ✅ Completed Features

1. **Authentication**
   - Anonymous Firebase Auth sign-in
   - Automatic user creation
   - Session persistence

2. **Game Creation & Joining**
   - Create new game lobbies
   - Join existing games with game ID
   - Real-time player list updates
   - Maximum 4 players per game

3. **Game Initialization**
   - Full UNO deck generation (108 cards)
   - Card shuffling
   - Deal 7 cards per player
   - Valid start card selection
   - Game state initialization

4. **Real-time Synchronization**
   - Firestore listeners for live updates
   - All players see updates instantly
   - Game log tracking

### 🚧 Not Yet Implemented

- Playing cards
- Drawing cards
- Turn management
- Win conditions
- Special card effects (skip, reverse, draw2, etc.)

## 🧪 How to Test

### Option 1: Local Testing with Firebase Emulators (Recommended)

This approach runs everything locally without needing a real Firebase project.

#### Step 1: Start Firebase Emulators

```bash
# Terminal 1: Start the Firebase emulators
cd functions
npm run serve
```

You should see:
```
✔  All emulators ready! It is now safe to connect your app.
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! View status and logs at http://localhost:4000
└─────────────────────────────────────────────────────────────┘

┌───────────┬────────────────┬─────────────────────────────────┐
│ Emulator  │ Host:Port      │ View in Emulator UI             │
├───────────┼────────────────┼─────────────────────────────────┤
│ Auth      │ localhost:9099 │ http://localhost:4000/auth      │
│ Functions │ localhost:5001 │ http://localhost:4000/functions │
│ Firestore │ localhost:8080 │ http://localhost:4000/firestore │
└───────────┴────────────────┴─────────────────────────────────┘
```

#### Step 2: Start the React App

```bash
# Terminal 2: Start the React development server
cd client
npm run dev
```

You should see:
```
VITE v5.4.21  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

#### Step 3: Test the Application

1. **Open the app**: Navigate to http://localhost:5173

2. **Check authentication**:
   - App should auto-authenticate you anonymously
   - Look for "User ID" in the lobby
   - Check debug panel in bottom-right corner

3. **Create a game**:
   - Enter a display name (e.g., "Player 1")
   - Click "Create Game"
   - You should be redirected to the game room
   - Note the Game ID displayed

4. **Join the game (second player)**:
   - Open a new incognito/private window
   - Navigate to http://localhost:5173
   - Enter a different display name (e.g., "Player 2")
   - Paste the Game ID from step 3
   - Click "Join Game"
   - Both windows should now show 2 players

5. **Start the game**:
   - In the host's window (Player 1), click "Start Game"
   - Both windows should update to "in-progress" status
   - Check that each player has 7 cards (visible in player list)
   - Verify the starting card is shown in the game log

#### Step 4: Inspect Firebase Data

1. Open the Firebase Emulator UI: http://localhost:4000
2. Click on "Firestore" tab
3. Navigate to the `games` collection
4. Click on your game document
5. Inspect the data structure:
   - `status`: should be "in-progress"
   - `players`: array with 2 players, each with 7 cards
   - `drawPile`: array of 108 cards
   - `currentCard`: the starting card
   - `gameLog`: history of game events

### Option 2: Testing with Real Firebase Project

If you have a Firebase project set up:

1. Update `client/.env` with your Firebase credentials
2. Set `VITE_USE_EMULATORS=false`
3. Deploy functions: `firebase deploy --only functions`
4. Run the client: `cd client && npm run dev`
5. Follow the same testing steps as above

## 📊 Monitoring & Debugging

### Client-Side Debugging

1. **Debug Panel**:
   - Visible in bottom-right corner
   - Shows current state in real-time
   - Can be hidden/shown with toggle button

2. **Browser Console**:
   - All events are logged with emoji prefixes
   - 🔥 Firebase initialization
   - 🎮 Game creation
   - 🚪 Joining games
   - 📊 State updates

Example logs:
```
🔥 Initializing Firebase with config: {projectId: "demo-project", ...}
🎮 Creating game with name: Player 1
✅ Game created: abc123xyz
🏠 Lobby render: {user: "user123", displayName: "Player 1"}
```

### Server-Side Debugging

1. **Function Logs** (in emulator terminal):
   - Shows all Cloud Function invocations
   - Detailed logging for each operation
   - Error stack traces

Example logs:
```
🎮 createGame called by: user123
📝 Creating game for user: {userId: "user123", displayName: "Player 1"}
✅ Game created successfully: abc123xyz
```

2. **Emulator UI Logs**:
   - http://localhost:4000/logs
   - Filterable by function/service
   - Searchable

## 🐛 Common Issues & Solutions

### Issue: "Failed to create game"

**Solution**:
- Check that Firebase emulators are running
- Verify `client/.env` has `VITE_USE_EMULATORS=true`
- Check browser console for detailed errors

### Issue: "Game not found" when joining

**Solution**:
- Double-check the Game ID (case-sensitive)
- Ensure emulators are running
- Game might have been created in a previous emulator session (data doesn't persist)

### Issue: "Only the host can start the game"

**Solution**:
- Ensure you're clicking "Start Game" from the host's window
- Host is the player who created the game

### Issue: State not updating in real-time

**Solution**:
- Check browser console for Firestore errors
- Verify emulators are running
- Try refreshing the page

## 🧪 Running Automated Tests

### Client Tests

```bash
cd client
npm test          # Run tests once
npm run test:watch # Run tests in watch mode
```

### Function Tests

```bash
cd functions
npm test          # Run tests once
npm run test:watch # Run tests in watch mode
```

### All Tests

```bash
# From project root
npm test
```

## 📝 Test Scenarios Checklist

Use this checklist to verify functionality:

- [ ] Anonymous authentication works
- [ ] Can create a new game
- [ ] Game ID is generated and displayed
- [ ] Can copy game ID to clipboard
- [ ] Can join game with valid game ID
- [ ] Cannot join game with invalid game ID
- [ ] Cannot join game that's already started
- [ ] Cannot join game that's full (4 players)
- [ ] Player list updates in real-time
- [ ] Host can start game with 2+ players
- [ ] Non-host cannot start game
- [ ] Cannot start game with only 1 player
- [ ] Game transitions to "in-progress" status
- [ ] All players receive 7 cards
- [ ] Starting card is valid (not wild/draw4)
- [ ] Game log shows all events
- [ ] Debug panel shows current state

## 🎯 Next Steps for Development

To continue development, implement:

1. **Card Display**: Show current player's hand with card components
2. **Play Card**: Implement `playCard` Cloud Function
3. **Draw Card**: Implement `drawCard` Cloud Function
4. **Turn Management**: Visual indicator for current player
5. **Card Validation**: Client-side highlighting of playable cards
6. **Special Cards**: Implement skip, reverse, draw2, wild, draw4 effects
7. **Win Detection**: Properly handle and display winner
8. **Game Restart**: Allow creating new game after completion

## 📸 Expected Behavior Screenshots

### Lobby Screen
- Display name input field
- Create game button
- Join game section with game ID input

### Waiting Room
- List of joined players (with host indicator)
- Game ID with copy button
- Start button (for host only, enabled with 2+ players)

### Game Started
- Status shows "in-progress"
- Each player shows card count
- Game log shows "Game started!" and first card

## 🚀 Performance Notes

- Firestore listeners automatically manage connections
- All game logic is server-side (authoritative)
- Client is "dumb" - only renders what server provides
- Transactions ensure atomic updates
- No race conditions possible with current architecture

---

**Ready to test?** Start with Option 1 (Firebase Emulators) for the easiest setup!
