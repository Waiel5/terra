import { useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeMessage } from '../utils/types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseRealtimeOptions<T = unknown> {
  /** WebSocket URL */
  url: string;
  /** Auto-connect on mount (default true) */
  autoConnect?: boolean;
  /** Reconnect on disconnect (default true) */
  reconnect?: boolean;
  /** Maximum reconnect attempts (default 5) */
  maxReconnectAttempts?: number;
  /** Base delay between reconnect attempts in ms (default 1000) */
  reconnectDelay?: number;
  /** Filter messages by type */
  messageFilter?: string;
  /** Transform incoming message payloads */
  transform?: (payload: unknown) => T;
  /** Callback on each message */
  onMessage?: (message: RealtimeMessage<T>) => void;
  /** Callback on connection status change */
  onStatusChange?: (status: ConnectionStatus) => void;
}

export interface UseRealtimeReturn<T = unknown> {
  data: T | null;
  messages: RealtimeMessage<T>[];
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  send: (data: unknown) => void;
  clearMessages: () => void;
}

/**
 * Hook for subscribing to real-time data over WebSocket.
 * Supports auto-reconnect with exponential backoff, message filtering,
 * and payload transformation.
 *
 * @example
 * ```tsx
 * const { data, status, connect } = useRealtime<VehiclePosition>({
 *   url: 'wss://api.example.com/vehicles/stream',
 *   messageFilter: 'position_update',
 *   onMessage: (msg) => updateMap(msg.payload),
 * });
 * ```
 */
export function useRealtime<T = unknown>(
  options: UseRealtimeOptions<T>
): UseRealtimeReturn<T> {
  const {
    url,
    autoConnect = true,
    reconnect = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
    messageFilter,
    transform,
    onMessage,
    onStatusChange,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [messages, setMessages] = useState<RealtimeMessage<T>[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const transformRef = useRef(transform);
  const onMessageRef = useRef(onMessage);
  const onStatusChangeRef = useRef(onStatusChange);
  const messageFilterRef = useRef(messageFilter);

  transformRef.current = transform;
  onMessageRef.current = onMessage;
  onStatusChangeRef.current = onStatusChange;
  messageFilterRef.current = messageFilter;

  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus);
    onStatusChangeRef.current?.(newStatus);
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    updateStatus('disconnected');
  }, [updateStatus]);

  const connect = useCallback(() => {
    disconnect();
    updateStatus('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        updateStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data) as RealtimeMessage;
          if (messageFilterRef.current && raw.type !== messageFilterRef.current) {
            return;
          }

          const payload = transformRef.current
            ? transformRef.current(raw.payload)
            : (raw.payload as T);

          const message: RealtimeMessage<T> = {
            type: raw.type,
            payload,
            timestamp: raw.timestamp || Date.now(),
          };

          setData(payload);
          setMessages((prev) => [...prev.slice(-99), message]);
          onMessageRef.current?.(message);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        updateStatus('error');
      };

      ws.onclose = () => {
        if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current += 1;
          updateStatus('connecting');
          reconnectTimerRef.current = setTimeout(() => connect(), delay);
        } else {
          updateStatus('disconnected');
        }
      };
    } catch {
      updateStatus('error');
    }
  }, [url, reconnect, maxReconnectAttempts, reconnectDelay, disconnect, updateStatus]);

  const send = useCallback((payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setData(null);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return { data, messages, status, connect, disconnect, send, clearMessages };
}
