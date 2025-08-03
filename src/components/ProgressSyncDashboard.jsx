import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiCloudUpload,
  HiCloudDownload,
  HiRefresh,
  HiCheckCircle,
  HiExclamationCircle,
  HiInformationCircle,
} from "react-icons/hi";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ProgressSyncService from "../services/ProgressSyncService";
import { toast } from "react-toastify";

/**
 * Comprehensive dashboard for managing progress sync across all problem sheets
 */
const ProgressSyncDashboard = ({ isOpen, onClose }) => {
  const [user, setUser] = useState(null);
  const [syncStatuses, setSyncStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState(new Set());

  // Track authentication state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  // Load sync statuses when dashboard opens
  useEffect(() => {
    if (isOpen && user) {
      loadAllSyncStatuses();
    }
  }, [isOpen, user]);

  const loadAllSyncStatuses = async () => {
    if (!user) return;

    setIsLoading(true);
    const statuses = {};

    for (const [sheetType] of Object.entries(
      ProgressSyncService.SHEET_CONFIGS
    )) {
      try {
        const status = await ProgressSyncService.getSyncStatus(sheetType);
        const localProgress = ProgressSyncService.getLocalProgress(sheetType);
        const localSolvedCount = Object.values(localProgress).filter(
          (val) => val
        ).length;

        statuses[sheetType] = {
          ...status,
          localSolvedCount,
          hasLocalData: localSolvedCount > 0,
        };
      } catch (error) {
        console.error(`Error loading sync status for ${sheetType}:`, error);
        statuses[sheetType] = {
          hasRemoteData: false,
          lastSynced: null,
          solvedCount: 0,
          localSolvedCount: 0,
          hasLocalData: false,
          error: error.message,
        };
      }
    }

    setSyncStatuses(statuses);
    setIsLoading(false);
  };

  const handleSyncAll = async () => {
    if (!user || isSyncing) return;

    setIsSyncing(true);
    try {
      const results = await ProgressSyncService.syncAllSheets(true);
      await loadAllSyncStatuses(); // Refresh statuses
    } catch (error) {
      console.error("Error syncing all sheets:", error);
      toast.error("Failed to sync all data");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncSelected = async () => {
    if (!user || isSyncing || selectedSheets.size === 0) return;

    setIsSyncing(true);
    let successCount = 0;

    try {
      for (const sheetType of selectedSheets) {
        const result = await ProgressSyncService.syncToDatabase(
          sheetType,
          false
        );
        if (result.success) successCount++;
      }

      toast.success(
        `Successfully synced ${successCount}/${selectedSheets.size} sheets`
      );
      await loadAllSyncStatuses(); // Refresh statuses
      setSelectedSheets(new Set()); // Clear selection
    } catch (error) {
      console.error("Error syncing selected sheets:", error);
      toast.error("Failed to sync selected data");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadSheet = async (sheetType) => {
    if (!user || isLoading) return;

    try {
      const result = await ProgressSyncService.loadFromDatabase(
        sheetType,
        true
      );
      if (result.success) {
        await loadAllSyncStatuses(); // Refresh statuses

        // Trigger custom event to notify components
        window.dispatchEvent(
          new CustomEvent("progressDataLoaded", {
            detail: { sheetType, data: result.data },
          })
        );
      }
    } catch (error) {
      console.error(`Error loading ${sheetType}:`, error);
    }
  };

  const toggleSheetSelection = (sheetType) => {
    const newSelection = new Set(selectedSheets);
    if (newSelection.has(sheetType)) {
      newSelection.delete(sheetType);
    } else {
      newSelection.add(sheetType);
    }
    setSelectedSheets(newSelection);
  };

  const formatLastSynced = (timestamp) => {
    if (!timestamp) return "Never";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return "Unknown";
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Progress Sync Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your problem-solving progress across all sheets
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!user ? (
            <div className="text-center py-8">
              <HiInformationCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Please log in to sync your progress data
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <HiRefresh className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading sync status...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={handleSyncAll}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSyncing ? (
                    <HiRefresh className="w-5 h-5 animate-spin" />
                  ) : (
                    <HiCloudUpload className="w-5 h-5" />
                  )}
                  {isSyncing ? "Syncing..." : "Sync All Sheets"}
                </button>

                {selectedSheets.size > 0 && (
                  <button
                    onClick={handleSyncSelected}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiCloudUpload className="w-5 h-5" />
                    Sync Selected ({selectedSheets.size})
                  </button>
                )}

                <button
                  onClick={loadAllSyncStatuses}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiRefresh className="w-5 h-5" />
                  Refresh Status
                </button>
              </div>

              {/* Sheet List */}
              <div className="grid gap-4">
                {Object.entries(ProgressSyncService.SHEET_CONFIGS).map(
                  ([sheetType, config]) => {
                    const status = syncStatuses[sheetType] || {};
                    const isSelected = selectedSheets.has(sheetType);

                    return (
                      <div
                        key={sheetType}
                        className={`p-4 border rounded-lg transition-colors ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSheetSelection(sheetType)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {config.displayName}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>
                                  Local: {status.localSolvedCount || 0} problems
                                </span>
                                {status.hasRemoteData && (
                                  <span>
                                    Cloud: {status.solvedCount || 0} problems
                                  </span>
                                )}
                                <span>
                                  Last synced:{" "}
                                  {formatLastSynced(status.lastSynced)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Status Indicator */}
                            {status.hasLocalData && status.hasRemoteData ? (
                              <HiCheckCircle
                                className="w-5 h-5 text-green-500"
                                title="Data synced"
                              />
                            ) : status.hasLocalData ? (
                              <HiExclamationCircle
                                className="w-5 h-5 text-orange-500"
                                title="Local data not synced"
                              />
                            ) : status.hasRemoteData ? (
                              <HiCloudDownload
                                className="w-5 h-5 text-blue-500"
                                title="Data available in cloud"
                              />
                            ) : (
                              <div
                                className="w-5 h-5 bg-gray-300 rounded-full"
                                title="No data"
                              />
                            )}

                            {/* Load Button */}
                            {status.hasRemoteData && (
                              <button
                                onClick={() => handleLoadSheet(sheetType)}
                                disabled={isLoading}
                                className="text-sm px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-md disabled:opacity-50"
                              >
                                Load from Cloud
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProgressSyncDashboard;
