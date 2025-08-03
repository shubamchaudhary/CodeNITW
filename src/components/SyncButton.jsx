import React from "react";
import { HiCloudUpload, HiCloudDownload, HiRefresh } from "react-icons/hi";
import { motion } from "framer-motion";

/**
 * Reusable sync button component for syncing progress data
 */
const SyncButton = ({
  onSyncToDatabase,
  onLoadFromDatabase,
  isSyncing,
  isLoading,
  hasUnsyncedChanges,
  syncStatus,
  isAuthenticated,
  className = "",
}) => {
  if (!isAuthenticated) {
    return (
      <div className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        Sign in to sync progress
      </div>
    );
  }

  const formatLastSynced = (timestamp) => {
    if (!timestamp) return "Never";

    try {
      // Handle Firestore timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Unknown";
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 ${className}`}
    >
      {/* Sync Status Info */}
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {syncStatus.hasRemoteData ? (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Last synced: {formatLastSynced(syncStatus.lastSynced)}</span>
            {syncStatus.solvedCount > 0 && (
              <span className="text-blue-600 dark:text-blue-400">
                ({syncStatus.solvedCount} problems)
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span>Not synced</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Upload/Sync Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSyncToDatabase}
          disabled={isSyncing || isLoading}
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium
            transition-colors duration-200
            ${
              hasUnsyncedChanges
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title="Save your progress to the cloud"
        >
          {isSyncing ? (
            <HiRefresh className="w-4 h-4 animate-spin" />
          ) : (
            <HiCloudUpload className="w-4 h-4" />
          )}
          {isSyncing ? "Saving..." : "Save to Cloud"}
          {hasUnsyncedChanges && (
            <div className="w-2 h-2 bg-red-500 rounded-full ml-1"></div>
          )}
        </motion.button>

        {/* Download/Load Button */}
        {syncStatus.hasRemoteData && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLoadFromDatabase}
            disabled={isSyncing || isLoading}
            className="
              flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium
              bg-green-100 hover:bg-green-200 text-green-700 
              dark:bg-green-800 dark:hover:bg-green-700 dark:text-green-300
              transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            title="Load your progress from the cloud"
          >
            {isLoading ? (
              <HiRefresh className="w-4 h-4 animate-spin" />
            ) : (
              <HiCloudDownload className="w-4 h-4" />
            )}
            {isLoading ? "Loading..." : "Load from Cloud"}
          </motion.button>
        )}
      </div>

      {/* Unsaved Changes Indicator */}
      {hasUnsyncedChanges && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400"
        >
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span>Unsaved changes</span>
        </motion.div>
      )}
    </div>
  );
};

export default SyncButton;
