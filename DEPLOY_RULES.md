# Deploying Firestore Security Rules

## Problem Fixed
The issue where players couldn't see their cards was caused by **missing Firestore security rules**. Without proper security rules, Firestore denies read access to the player hand subcollection.

## What Was Added
- `firestore.rules` - Security rules that allow players to read their own hand data
- Updated `firebase.json` to reference the rules file
- Enhanced console logging to diagnose issues

## How to Deploy the Fix

### Step 1: Deploy Firestore Rules
Run this command from the project root:

```bash
firebase deploy --only firestore:rules
```

This will deploy the security rules to your Firebase project without affecting your functions or hosting.

### Step 2: Verify the Deployment
After deployment, you should see output like:
```
✔ Deploy complete!
Project Console: https://console.firebase.google.com/project/your-project/overview
```

### Step 3: Test
1. Open your game in the browser
2. Start or join a game
3. You should now see your cards in your hand!

## What the Security Rules Do

### Main Game Document (`/games/{gameId}`)
- **Read**: Any authenticated user (game state is public to players)
- **Write**: Only Cloud Functions (server-side)

### Player Hand Subcollection (`/games/{gameId}/players/{playerId}`)
- **Read**: Only the player whose hand it is (UID must match)
- **Write**: Only Cloud Functions (server-side)

This ensures:
- Players can see game state (current card, whose turn, etc.)
- Players can see their own cards
- Players **cannot** see opponent cards (protected by subcollection rules)
- Players cannot cheat by modifying game state
- All game logic is enforced server-side

**Note**: The main game document only contains public information like card counts, not the actual cards. The sensitive hand data is in the protected subcollection.

## Troubleshooting

### If you still can't see cards:
1. Check browser console for errors
2. Verify you're logged in
3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
4. Check that rules were deployed successfully

### To verify rules are deployed:
Go to Firebase Console → Firestore Database → Rules tab
You should see the rules from `firestore.rules`
