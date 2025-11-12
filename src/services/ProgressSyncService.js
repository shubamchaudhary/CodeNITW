import { getAuth } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

/**
 * Service to handle syncing problem progress data between localStorage and Firestore
 * Supports multiple problem sheets with different localStorage keys
 */
class ProgressSyncService {
  // Map of sheet types to their localStorage keys
  static SHEET_CONFIGS = {
    PERSONAL_DSA: {
      localStorageKey: "PersonalDSASolvedQuestions",
      firestoreCollection: "user_progress",
      displayName: "Personal DSA Roadmap",
    },
    PROBLEMS: {
      localStorageKey: "solvedQuestions",
      firestoreCollection: "user_progress",
      displayName: "Problems",
    },
    CP_SHEET: {
      localStorageKey: "CPsolvedQuestions",
      firestoreCollection: "user_progress",
      displayName: "CP Sheet",
    },
    DSA_450: {
      localStorageKey: "DSA450solvedQuestions", // Assuming this exists
      firestoreCollection: "user_progress",
      displayName: "DSA 450",
    },
  };

  /**
   * Get the current authenticated user
   */
  static getCurrentUser() {
    const auth = getAuth();
    return auth.currentUser;
  }

  /**
   * Generate Firestore document ID for user's progress data
   */
  static getProgressDocId(userId, sheetType) {
    return `${userId}_${sheetType.toLowerCase()}_progress`;
  }

  /**
   * Get progress data from localStorage
   */
  static getLocalProgress(sheetType) {
    const config = this.SHEET_CONFIGS[sheetType];
    if (!config) {
      throw new Error(`Unknown sheet type: ${sheetType}`);
    }

    try {
      // Special handling for PERSONAL_DSA to include both solved and starred maps
      if (sheetType === "PERSONAL_DSA") {
        const solvedRaw = localStorage.getItem("PersonalDSASolvedQuestions");
        const starredRaw = localStorage.getItem("PersonalDSAStarredQuestions");
        const solved = solvedRaw ? JSON.parse(solvedRaw) : {};
        const starred = starredRaw ? JSON.parse(starredRaw) : {};
        return { solved, starred };
      }

      const data = localStorage.getItem(config.localStorageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error(`Error reading local progress for ${sheetType}:`, error);
      return {};
    }
  }

  /**
   * Save progress data to localStorage
   */
  static saveLocalProgress(sheetType, progressData) {
    const config = this.SHEET_CONFIGS[sheetType];
    if (!config) {
      throw new Error(`Unknown sheet type: ${sheetType}`);
    }

    try {
      if (sheetType === "PERSONAL_DSA") {
        // Support nested structure with solved/starred
        const solved = progressData.solved || {};
        const starred = progressData.starred || {};
        localStorage.setItem("PersonalDSASolvedQuestions", JSON.stringify(solved));
        localStorage.setItem("PersonalDSAStarredQuestions", JSON.stringify(starred));
        return true;
      }

      localStorage.setItem(
        config.localStorageKey,
        JSON.stringify(progressData)
      );
      return true;
    } catch (error) {
      console.error(`Error saving local progress for ${sheetType}:`, error);
      return false;
    }
  }

  /**
   * Sync local progress data to Firestore
   */
  static async syncToDatabase(sheetType, showToast = true) {
    const user = this.getCurrentUser();
    if (!user) {
      if (showToast) toast.error("Please log in to sync your progress");
      return { success: false, error: "User not authenticated" };
    }

    const config = this.SHEET_CONFIGS[sheetType];
    if (!config) {
      if (showToast) toast.error("Invalid sheet type");
      return { success: false, error: "Invalid sheet type" };
    }

    try {
      // Get local progress data
      const localProgress = this.getLocalProgress(sheetType);

      // Prepare data for Firestore
      const progressData = {
        userId: user.uid,
        sheetType: sheetType,
        progress: localProgress,
        lastSynced: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      };

      // Save to Firestore
      const docId = this.getProgressDocId(user.uid, sheetType);
      const docRef = doc(db, config.firestoreCollection, docId);
      await setDoc(docRef, progressData, { merge: true });

      if (showToast) {
        const solvedSource =
          sheetType === "PERSONAL_DSA"
            ? localProgress.solved || {}
            : localProgress || {};
        const solvedCount = Object.values(solvedSource).filter((val) => val).length;
        toast.success(
          `${config.displayName} progress synced! (${solvedCount} problems saved)`
        );
      }

      return { success: true, data: progressData };
    } catch (error) {
      console.error(`Error syncing ${sheetType} to database:`, error);
      if (showToast)
        toast.error(`Failed to sync ${config.displayName} progress`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load progress data from Firestore to localStorage
   */
  static async loadFromDatabase(sheetType, showToast = true) {
    const user = this.getCurrentUser();
    if (!user) {
      if (showToast) toast.error("Please log in to load your progress");
      return { success: false, error: "User not authenticated" };
    }

    const config = this.SHEET_CONFIGS[sheetType];
    if (!config) {
      if (showToast) toast.error("Invalid sheet type");
      return { success: false, error: "Invalid sheet type" };
    }

    try {
      // Get data from Firestore
      const docId = this.getProgressDocId(user.uid, sheetType);
      const docRef = doc(db, config.firestoreCollection, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const progressData = data.progress || {};

        // Save to localStorage (handles PERSONAL_DSA specially)
        this.saveLocalProgress(sheetType, progressData);

        if (showToast) {
          const solvedSource =
            sheetType === "PERSONAL_DSA"
              ? progressData.solved || {}
              : progressData || {};
          const solvedCount = Object.values(solvedSource).filter((val) => val)
            .length;
          toast.success(
            `${config.displayName} progress loaded! (${solvedCount} problems)`
          );
        }

        return { success: true, data: progressData };
      } else {
        if (showToast)
          toast.info(`No saved ${config.displayName} progress found`);
        return { success: false, error: "No data found" };
      }
    } catch (error) {
      console.error(`Error loading ${sheetType} from database:`, error);
      if (showToast)
        toast.error(`Failed to load ${config.displayName} progress`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get sync status information
   */
  static async getSyncStatus(sheetType) {
    const user = this.getCurrentUser();
    if (!user) {
      return { hasRemoteData: false, lastSynced: null };
    }

    const config = this.SHEET_CONFIGS[sheetType];
    if (!config) {
      return { hasRemoteData: false, lastSynced: null };
    }

    try {
      const docId = this.getProgressDocId(user.uid, sheetType);
      const docRef = doc(db, config.firestoreCollection, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          hasRemoteData: true,
          lastSynced: data.lastSynced,
          solvedCount: (() => {
            const progress = data.progress || {};
            const solvedSource =
              sheetType === "PERSONAL_DSA" ? progress.solved || {} : progress;
            return Object.values(solvedSource).filter((val) => val).length;
          })(),
        };
      }

      return { hasRemoteData: false, lastSynced: null };
    } catch (error) {
      console.error(`Error getting sync status for ${sheetType}:`, error);
      return { hasRemoteData: false, lastSynced: null };
    }
  }

  /**
   * Sync all sheet types at once
   */
  static async syncAllSheets(showToast = true) {
    const results = {};
    const sheetTypes = Object.keys(this.SHEET_CONFIGS);

    if (showToast) toast.info("Syncing all progress data...");

    for (const sheetType of sheetTypes) {
      results[sheetType] = await this.syncToDatabase(sheetType, false);
    }

    const successCount = Object.values(results).filter((r) => r.success).length;
    const totalCount = sheetTypes.length;

    if (showToast) {
      if (successCount === totalCount) {
        toast.success(
          `All progress data synced successfully! (${successCount}/${totalCount})`
        );
      } else {
        toast.warning(`Partial sync completed (${successCount}/${totalCount})`);
      }
    }

    return results;
  }
}

export default ProgressSyncService;
