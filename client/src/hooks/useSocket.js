import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://127.0.0.1:8011';

export default function useSocket({ userId, onNewMessage }) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('identify', userId);
      socket.emit('join', userId);
    });

    socket.on('new_message', (data) => {
      if (onNewMessage) {
        onNewMessage(data);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, onNewMessage]);

  const sendMessage = ({ recipientId, threadId, message }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', { recipientId, threadId, message });
    }
  };

  return { sendMessage, socket: socketRef.current };
}
