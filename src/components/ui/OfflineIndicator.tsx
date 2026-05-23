import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Offline indicator that shows when the user loses internet connection
 */
export default function OfflineIndicator() {
  const { isOnline, isSocketConnected, reconnect } = useNetworkStatus();

  // Only show when offline or socket disconnected
  const showIndicator = !isOnline || !isSocketConnected;

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className={`
            flex items-center justify-center gap-3 py-2 px-4 text-sm font-medium
            ${!isOnline 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-warning text-warning-foreground'}
          `}>
            {!isOnline ? (
              <>
                <WifiOff className="w-4 h-4" />
                <span>You're offline. Some features may not work.</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 animate-pulse" />
                <span>Reconnecting to server...</span>
                <button 
                  onClick={reconnect}
                  className="ml-2 underline hover:no-underline"
                >
                  Retry now
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
