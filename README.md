# UNO Game - Firebase Edition

A real-time multiplayer UNO card game built with React and Firebase.

## 🏗️ Architecture

- **Frontend**: React (Vite) with React Hooks
- **Backend**: Firebase Cloud Functions (serverless, authoritative)
- **Database**: Firestore (real-time state synchronization)
- **Authentication**: Firebase Auth (anonymous sign-in)
- **Hosting**: Firebase Hosting

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   cd client && npm install
   cd ../functions && npm install
   cd ..
   ```

2. **Configure Firebase** (for production):
   - Create a Firebase project at https://console.firebase.google.com
   - Copy `client/.env.example` to `client/.env`
   - Add your Firebase config to `client/.env`

3. **Run locally with emulators** (recommended for development):
   ```bash
   # Terminal 1: Start Firebase emulators
   cd functions
   npm run serve

   # Terminal 2: Start React dev server
   cd client
   npm run dev
   ```

4. **Access the app**:
   - React app: http://localhost:5173
   - Firebase Emulator UI: http://localhost:4000

## 🧪 Testing

### Run all tests:
```bash
npm test
```

### Run client tests:
```bash
cd client
npm test
```

### Run function tests:
```bash
cd functions
npm test
```

## 📁 Project Structure

```
UNO_GAMES/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── config/      # Firebase config
│   │   └── test/        # Test setup
│   └── package.json
├── functions/           # Firebase Cloud Functions
│   ├── index.js         # Main functions
│   └── package.json
├── firebase.json        # Firebase config
└── package.json         # Root package
```

## 🎮 Game Flow

1. **Create Game**: Host creates a new game lobby
2. **Join Game**: Up to 4 players join the lobby
3. **Start Game**: Host starts the game (deals cards)
4. **Play**: Players take turns playing cards
5. **Win**: First player to empty their hand wins

## 🐛 Debugging

- Debug panel available in bottom-right corner of UI
- All functions include extensive console logging
- Use Firebase Emulator UI to inspect Firestore data

## 🔥 Firebase Emulators

The project is configured to use Firebase emulators for local development:
- Auth: http://localhost:9099
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Emulator UI: http://localhost:4000

## 📝 Development Notes

- Follow test-first approach
- All game logic is server-side (authoritative)
- Client is a "dumb" view that renders state
- Real-time updates via Firestore listeners

## 🚢 Deployment

```bash
# Build client
cd client && npm run build

# Deploy to Firebase
firebase deploy
```
