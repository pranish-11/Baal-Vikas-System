import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";
import { getToken } from "./storage";

let socketInstance: Socket | null = null;

export async function connectSocket(): Promise<Socket | null> {
  const token = await getToken();
  if (!token) return null;

  if (socketInstance?.connected) return socketInstance;

  socketInstance = io(API_BASE_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });

  socketInstance.on("connect", () => {
    console.log("Socket connected:", socketInstance?.id);
  });

  socketInstance.on("connect_error", (err) => {
    console.warn("Socket connection error:", err.message);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socketInstance;
}

export function getSocket(): Socket | null {
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let mounted = true;
    connectSocket().then((s) => {
      if (!mounted || !s) return;
      socketRef.current = s;
      setConnected(s.connected);
      s.on("connect", () => mounted && setConnected(true));
      s.on("disconnect", () => mounted && setConnected(false));
    });
    return () => { mounted = false; };
  }, []);

  return { socket: socketRef.current, connected };
}

export function useSocketEvent<T = any>(event: string, handler: (data: T) => void) {
  const savedHandler = useRef(handler);
  savedHandler.current = handler;

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const listener = (data: T) => savedHandler.current(data);
    s.on(event, listener);
    return () => { s.off(event, listener); };
  }, [event]);
}

export function emitTyping(recipientId: string, isTyping: boolean) {
  const s = getSocket();
  if (!s) return;
  s.emit(isTyping ? "typing_start" : "typing_stop", { recipientId });
}
