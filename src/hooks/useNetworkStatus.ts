import { useState, useEffect, useCallback } from 'react';
import socketService from '@/services/socket';

interface NetworkStatus {
  isOnline: boolean;
  isSocketConnected: boolean;
  lastOnline: Date | null;
}

/**
 * Hook for monitoring network and socket connection status
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSocketConnected: socketService.isConnected(),
    lastOnline: navigator.onLine ? new Date() : null,
  });

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: true,
        lastOnline: new Date(),
      }));
      
      // Attempt to reconnect socket
      socketService.initializeSocket();
    };

    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor socket connection
  useEffect(() => {
    const checkSocketConnection = () => {
      setStatus((prev) => ({
        ...prev,
        isSocketConnected: socketService.isConnected(),
      }));
    };

    // Check periodically
    const interval = setInterval(checkSocketConnection, 5000);
    
    // Also check on socket events
    socketService.on('connect', () => {
      setStatus((prev) => ({ ...prev, isSocketConnected: true }));
    });
    
    socketService.on('disconnect', () => {
      setStatus((prev) => ({ ...prev, isSocketConnected: false }));
    });

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Manual reconnect function
  const reconnect = useCallback(async () => {
    if (navigator.onLine) {
      await socketService.initializeSocket();
      setStatus((prev) => ({
        ...prev,
        isSocketConnected: socketService.isConnected(),
      }));
    }
  }, []);

  return {
    ...status,
    reconnect,
  };
};

export default useNetworkStatus;
