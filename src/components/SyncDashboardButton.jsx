import React, { useState } from "react";
import { motion } from "framer-motion";
import { HiCloudUpload } from "react-icons/hi";
import ProgressSyncDashboard from "./ProgressSyncDashboard";

/**
 * Button component that opens the progress sync dashboard
 * Can be integrated into header, dashboard, or any other component
 */
const SyncDashboardButton = ({ className = "", showText = true }) => {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const openDashboard = () => setIsDashboardOpen(true);
  const closeDashboard = () => setIsDashboardOpen(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openDashboard}
        className={`
          flex items-center gap-2
          px-3 py-1.5 lg:px-2 lg:py-1
          text-blue-600 dark:text-blue-400 
          hover:text-blue-700 dark:hover:text-blue-300
          hover:bg-blue-50 dark:hover:bg-blue-900/20
          rounded-lg transition-colors font-medium
          ${className}
        `}
        title="Sync Progress Data"
      >
        <HiCloudUpload className="text-md" />
        {showText && <span>SYNC</span>}
      </motion.button>

      <ProgressSyncDashboard
        isOpen={isDashboardOpen}
        onClose={closeDashboard}
      />
    </>
  );
};

export default SyncDashboardButton;
