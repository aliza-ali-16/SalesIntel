import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function useSocket() {
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Determine socket server URL from API base URL (stripping '/api' if present)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = apiUrl.replace('/api', '');

    console.log(`🔌 Attempting Socket connection to: ${socketUrl}`);
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 3000,
      timeout: 10000
    });

    socketInstance.on('connect', () => {
      console.log('⚡ [SOCKET.IO] Connected to backend server.');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('⚡ [SOCKET.IO] Disconnected from backend server.');
      setConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ [SOCKET.IO] Connection error:', err.message);
      setConnected(false);
    });

    setSocket(socketInstance);

    // Clean connection on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return { socket, connected };
}
