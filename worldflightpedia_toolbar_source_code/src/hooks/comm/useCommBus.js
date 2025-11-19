import { useEffect, useRef, useState, useCallback } from "react";
import { toPayloadString, safeCleanup } from "../../utils/comm/commbusUtils";

/**
 * useCommBus - React hook for MSFS CommBus communication with a WASM module
 *
 * Responsibilities:
 * - Lazily registers a CommBus listener when the Coherent environment is ready
 * - Sends messages JS → WASM using listener.callWasm(eventName, payload)
 * - Listens for messages WASM → JS via the "OnMessageFromWasm" event
 * - Keeps a rolling log (max 300 entries) and exposes the last received message
 *
 * Parameters:
 * - autoRegister: whether to auto-attempt registration with retries (default: true)
 * - onMessage: optional callback invoked when a message arrives from WASM
 *
 * Returns:
 * - isReady: boolean — true when CommBus listener is registered
 * - send(eventName, payload): function — sends message to WASM, returns boolean
 * - lastMessage: string|null — last message received from WASM
 * - logs: string[] — recent log lines (timestamps included)
 *
 * Notes:
 * - This hook is safe to use outside MSFS; it simply won't register until
 *   window.RegisterCommBusListener becomes available.
 */
export function useCommBus({ autoRegister = true, onMessage } = {}) {
  const listenerRef = useRef(null);
  const startedRef = useRef(false);

  const [isReady, setIsReady] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [logs, setLogs] = useState([]);

  // Append a timestamped log line (maintain last 300 entries)
  const addLog = useCallback((msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-299), `[${time}] ${msg}`]);
  }, []);

  /** Registers the CommBus listener in Coherent environment (idempotent) */
  const registerCommBus = useCallback(() => {
    if (startedRef.current || typeof window === "undefined") return;

    if (typeof window.RegisterCommBusListener !== "function") {
      addLog("CommBus not available yet (waiting for Coherent environment)...");
      return;
    }

    try {
      listenerRef.current = window.RegisterCommBusListener(() => {
        setIsReady(true);
        addLog("CommBusListener registered successfully ✅");
      });

      if (listenerRef.current?.on) {
        listenerRef.current.on("OnMessageFromWasm", (dataStr) => {
          addLog("WASM → JS: " + dataStr);
          setLastMessage(dataStr);
          onMessage?.(dataStr);
        });
      } else {
        addLog(
          "CommBusListener.on not found (no incoming messages will be received)."
        );
      }

      startedRef.current = true;
      addLog("CommBus initialized.");
    } catch (err) {
      addLog("❌ Error initializing CommBus: " + err);
    }
  }, [addLog, onMessage]);

  /** Effect: auto-register with small retries until Coherent exposes RegisterCommBusListener */
  useEffect(() => {
    if (!autoRegister || startedRef.current) return;

    if (typeof window?.RegisterCommBusListener === "function") {
      registerCommBus();
      return;
    }

    const intervalId = setInterval(() => {
      if (typeof window?.RegisterCommBusListener === "function") {
        clearInterval(intervalId);
        registerCommBus();
      }
    }, 300);

    return () => clearInterval(intervalId);
  }, [autoRegister, registerCommBus]);

  /** Sends a message to the WASM module via CommBus */
  const send = useCallback(
    (eventName = "OnMessageFromJs", payload = "") => {
      if (!listenerRef.current) {
        addLog("CommBusListener not created yet — cannot send.");
        return false;
      }

      try {
        const payloadStr = toPayloadString(payload);
        addLog(`JS → WASM [${eventName}]: ${payloadStr}`);
        listenerRef.current.callWasm(eventName, payloadStr);
        return true;
      } catch (err) {
        addLog("Error while sending callWasm: " + err);
        return false;
      }
    },
    [addLog]
  );

  /** Cleanup on unmount (safety) */
  useEffect(() => {
    return () => {
      safeCleanup("CommBus", () => {
        listenerRef.current = null;
        startedRef.current = false;
        setIsReady(false);
      });
    };
  }, []);

  return { isReady, send, lastMessage, logs };
}
