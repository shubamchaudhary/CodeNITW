import { useState, useEffect, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ProgressSyncService from "../services/ProgressSyncService";

/**
 * Custom hook for managing progress sync operations
 */
export function useProgressSync(sheetType) {
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    hasRemoteData: false,
    lastSynced: null,
    solvedCount: 0,
  });
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);

  // Track authentication state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  // Load sync status when user changes
  useEffect(() => {
    if (user && sheetType) {
      loadSyncStatus();
    }
  }, [user, sheetType]);

  // Track localStorage changes to detect unsynced changes
  useEffect(() => {
    if (!sheetType) return;

    const config = ProgressSyncService.SHEET_CONFIGS[sheetType];
    if (!config) return;

    const handleStorageChange = () => {
      setHasUnsyncedChanges(true);
    };

    // Listen for storage events (cross-tab changes)
    window.addEventListener("storage", handleStorageChange);

    // Listen for changes in current tab by periodically checking
    const checkForChanges = () => {
      // This is a simple approach - in a more complex app you might want
      // to use a more sophisticated change detection mechanism
      setHasUnsyncedChanges(true);
    };

    // Set up periodic check (optional)
    const intervalId = setInterval(checkForChanges, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
    };
  }, [sheetType]);

  const loadSyncStatus = useCallback(async () => {
    if (!user || !sheetType) return;

    try {
      const status = await ProgressSyncService.getSyncStatus(sheetType);
      setSyncStatus(status);
    } catch (error) {
      console.error("Error loading sync status:", error);
    }
  }, [user, sheetType]);

  const syncToDatabase = useCallback(
    async (showToast = true) => {
      if (!user || !sheetType || isSyncing) return { success: false };

      setIsSyncing(true);
      try {
        const result = await ProgressSyncService.syncToDatabase(
          sheetType,
          showToast
        );

        if (result.success) {
          setHasUnsyncedChanges(false);
          await loadSyncStatus(); // Refresh sync status
        }

        return result;
      } catch (error) {
        console.error("Error syncing to database:", error);
        return { success: false, error: error.message };
      } finally {
        setIsSyncing(false);
      }
    },
    [user, sheetType, isSyncing, loadSyncStatus]
  );

  const loadFromDatabase = useCallback(
    async (showToast = true) => {
      if (!user || !sheetType || isLoading) return { success: false };

      setIsLoading(true);
      try {
        const result = await ProgressSyncService.loadFromDatabase(
          sheetType,
          showToast
        );

        if (result.success) {
          setHasUnsyncedChanges(false);
          await loadSyncStatus(); // Refresh sync status

          // Trigger a custom event to notify components about the data change
          window.dispatchEvent(
            new CustomEvent("progressDataLoaded", {
              detail: { sheetType, data: result.data },
            })
          );
        }

        return result;
      } catch (error) {
        console.error("Error loading from database:", error);
        return { success: false, error: error.message };
      } finally {
        setIsLoading(false);
      }
    },
    [user, sheetType, isLoading, loadSyncStatus]
  );

  const markAsChanged = useCallback(() => {
    setHasUnsyncedChanges(true);
  }, []);

  return {
    user,
    isSyncing,
    isLoading,
    syncStatus,
    hasUnsyncedChanges,
    syncToDatabase,
    loadFromDatabase,
    loadSyncStatus,
    markAsChanged,
    isAuthenticated: !!user,
  };
}

export default useProgressSync;
