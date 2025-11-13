# 🚀 Deployment Guide

Your UNO game is ready to deploy! Everything is configured for your Firebase project: **uno-games-b20ed**

## ✅ What's Already Done

- [x] Firebase project configured
- [x] Client built for production (615 KB)
- [x] Production environment variables set
- [x] Service account credentials ready
- [x] All code committed to git

## 🎯 Quick Deploy (3 Simple Steps)

### **Option 1: Using the Deploy Script (Easiest)**

```bash
# 1. Make sure you have the service account file
#    (It should already be in the project root as service-account.json)

# 2. Run the deploy script
./deploy.sh
```

That's it! The script will build and deploy everything.

---

### **Option 2: Manual Deployment**

```bash
# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Authenticate with your service account
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/service-account.json"

# 3. Build the client
npm run build

# 4. Deploy to Firebase
npx firebase deploy --project uno-games-b20ed
```

---

### **Option 3: Using Firebase CLI Login**

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Deploy
npm run deploy
```

---

## 🌐 Your Live URLs

After deployment, your game will be available at:

- **Primary**: https://uno-games-b20ed.web.app
- **Alternative**: https://uno-games-b20ed.firebaseapp.com

---

## ⚠️ Before First Use - Enable Firebase Services

**Important**: You must enable these services in Firebase Console before the app works:

### 1. **Enable Authentication**
   - Go to: https://console.firebase.google.com/project/uno-games-b20ed/authentication
   - Click "Get Started" or "Sign-in method"
   - Enable "**Anonymous**" sign-in
   - Click Save

### 2. **Enable Firestore**
   - Go to: https://console.firebase.google.com/project/uno-games-b20ed/firestore
   - Click "Create database"
   - Choose "Start in **production mode**"
   - Select a location (e.g., `us-central` or closest to your users)
   - Click "Enable"

### 3. **Functions** (Enabled Automatically)
   - Will be enabled during first deployment
   - No action needed

---

## 📊 What Gets Deployed

### **Firebase Hosting** (React App)
- Complete UNO game UI
- All visual components
- Card display and interactions
- Real-time state updates

### **Cloud Functions** (5 Functions)
```
✅ createGame  - Create new game lobby
✅ joinGame    - Join existing game
✅ startGame   - Initialize game and deal cards
✅ playCard    - Play a card with validation
✅ drawCard    - Draw from pile
```

### **Firestore** (Database)
- Games collection
- Real-time synchronization
- Player hands and game state

---

## 🔍 Verify Deployment

After deploying, check:

1. **Visit your URL**: https://uno-games-b20ed.web.app
2. **Check console**: Should see Firebase initialization logs
3. **Create a game**: Test the create game flow
4. **Check Functions**: Should see them in Firebase Console

---

## 🐛 Troubleshooting

### **Deployment fails with authentication error:**
```bash
# Re-authenticate
firebase login --reauth
npm run deploy
```

### **Functions deploy but don't work:**
- Make sure Authentication and Firestore are enabled
- Check Functions logs in Firebase Console
- Verify CORS settings if needed

### **"Game not found" errors:**
- Enable Firestore Database (see instructions above)
- Check Firestore rules allow read/write

### **Can't join games:**
- Make sure Anonymous auth is enabled
- Check browser console for errors

---

## 📝 Post-Deployment

### **Test the Game**
1. Visit your URL
2. Create a game (note the Game ID)
3. Open incognito window
4. Join the game with the Game ID
5. Start and play!

### **Share with Friends**
- Send them your URL
- They create/join games automatically
- No account needed (anonymous auth)

---

## 🔐 Security Note

**service-account.json** contains sensitive credentials:
- ✅ Already added to `.gitignore`
- ✅ Won't be committed to git
- ⚠️ Keep it secure and private
- ⚠️ Don't share publicly

---

## 🎉 You're Done!

Your complete UNO game is now deployed and ready to play!

**Need help?** Check the Firebase Console for logs and errors:
https://console.firebase.google.com/project/uno-games-b20ed
