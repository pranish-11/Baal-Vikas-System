import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user?.token) return;

    const s = io(window.location.origin.replace('5173', '5000'), {
      auth: { token: user.token },
    });

    s.on('connect', () => {
      console.log('Socket connected');
      // Join a personal room
      s.emit('joinRoom', `user_${user.id}`);
      // Join school room
      if (user.schoolId) {
        s.emit('joinRoom', `school_${user.schoolId}`);
      }
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user?.token, user?.id, user?.schoolId]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
