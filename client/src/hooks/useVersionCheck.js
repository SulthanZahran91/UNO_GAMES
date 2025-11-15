import { useEffect, useState } from 'react';

/**
 * Hook to check for new app versions and prompt user to refresh
 * @param {number} checkInterval - How often to check in milliseconds (default: 5 minutes)
 * @returns {Object} { hasNewVersion, checkNow, dismissUpdate }
 */
export function useVersionCheck(checkInterval = 5 * 60 * 1000) {
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);

  const checkVersion = async () => {
    try {
      // Fetch version.json with cache busting
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        console.warn('Could not fetch version.json');
        return;
      }

      const data = await response.json();
      const serverVersion = data.version;
      const buildTime = data.buildTime;

      console.log('📦 Version check:', {
        current: currentVersion,
        server: serverVersion,
        buildTime: new Date(buildTime).toLocaleString(),
      });

      // First time loading - store the version
      if (!currentVersion) {
        setCurrentVersion(serverVersion);
        localStorage.setItem('appVersion', serverVersion);
        return;
      }

      // Check if there's a new version
      if (serverVersion !== currentVersion) {
        console.log('🆕 New version available!', serverVersion);
        setHasNewVersion(true);
      }
    } catch (error) {
      console.warn('Version check failed:', error);
    }
  };

  const checkNow = () => {
    checkVersion();
  };

  const dismissUpdate = () => {
    setHasNewVersion(false);
  };

  useEffect(() => {
    // Load stored version on mount
    const storedVersion = localStorage.getItem('appVersion');
    if (storedVersion) {
      setCurrentVersion(storedVersion);
    }

    // Initial check
    checkVersion();

    // Set up periodic checks
    const interval = setInterval(checkVersion, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval]);

  return { hasNewVersion, checkNow, dismissUpdate };
}
