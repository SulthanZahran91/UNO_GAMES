import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './config/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import DebugPanel from './components/DebugPanel';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import UpdateNotification from './components/UpdateNotification';
import { useVersionCheck } from './hooks/useVersionCheck';

console.log('🎮 App component loaded');

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugData, setDebugData] = useState({});

  // Check for new versions every 3 minutes
  const { hasNewVersion, dismissUpdate } = useVersionCheck(3 * 60 * 1000);

  useEffect(() => {
    console.log('🔐 Setting up auth listener');

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth,
      (currentUser) => {
        console.log('👤 Auth state changed:', currentUser ? `User ${currentUser.uid}` : 'No user');
        setUser(currentUser);
        setLoading(false);
        setDebugData(prev => ({
          ...prev,
          user: currentUser ? {
            uid: currentUser.uid,
            isAnonymous: currentUser.isAnonymous,
          } : null,
          authReady: true,
        }));
      },
      (error) => {
        console.error('❌ Auth error:', error);
        setError(error.message);
        setLoading(false);
        setDebugData(prev => ({
          ...prev,
          authError: error.message,
        }));
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      console.log('🔑 No user found, signing in anonymously...');
      signInAnonymously(auth)
        .then((result) => {
          console.log('✅ Anonymous sign-in successful:', result.user.uid);
          setDebugData(prev => ({
            ...prev,
            signInSuccess: true,
            signInTimestamp: new Date().toISOString(),
          }));
        })
        .catch((error) => {
          console.error('❌ Anonymous sign-in failed:', error);
          setError(error.message);
          setDebugData(prev => ({
            ...prev,
            signInError: error.message,
          }));
        });
    }
  }, [loading, user]);

  if (loading) {
    console.log('⏳ App is loading...');
    return (
      <div className="loading">
        <div>
          <div>🎮 Loading UNO Game...</div>
          <div style={{ fontSize: '14px', marginTop: '10px', color: '#aaa' }}>
            Initializing Firebase...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('💥 App error:', error);
    return (
      <div className="container">
        <div className="error">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Reload App
          </button>
        </div>
        <DebugPanel enabled={true} data={debugData} />
      </div>
    );
  }

  console.log('✅ App ready, rendering routes');

  return (
    <Router>
      <div className="app">
        <UpdateNotification
          show={hasNewVersion}
          onRefresh={() => window.location.reload(true)}
          onDismiss={dismissUpdate}
        />
        <Routes>
          <Route path="/" element={<Lobby user={user} />} />
          <Route path="/game/:gameId" element={<GameRoom user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <DebugPanel enabled={true} data={debugData} />
      </div>
    </Router>
  );
}

export default App;
