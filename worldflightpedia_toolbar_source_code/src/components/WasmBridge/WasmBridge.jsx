import { forwardRef, useImperativeHandle } from "react";
import { useCommBus } from "../hooks/useCommBus";

/**
 * WasmBridge — Headless bridge component between React and the WASM module
 *
 * Exposes an imperative API through a forwarded ref so non-React code or
 * parent components can trigger WASM communication without re-rendering UI.
 * The component itself renders nothing.
 *
 * Exposed methods (via ref):
 * - sendToWasm(eventName: string, payload: string | object): boolean
 *     Sends a message to the WASM module using CommBus. Payload objects are stringified.
 * - isReady(): boolean
 *     Indicates whether the CommBus listener has been successfully registered.
 * - getLastMessage(): string | null
 *     Returns the last message received from WASM.
 * - getLogs(): string[]
 *     Returns recent log lines with timestamps.
 */
const WasmBridge = forwardRef(function WasmBridge(_, ref) {
  // Consume CommBus hook; this is the only stateful dependency needed here
  const { isReady, send, lastMessage, logs } = useCommBus();

  // Expose an imperative API so callers can interact without props/state wiring
  useImperativeHandle(ref, () => ({
    sendToWasm: (eventName, payload) => send(eventName, payload),
    isReady: () => isReady,
    getLastMessage: () => lastMessage,
    getLogs: () => logs,
  }));

  // Headless: no UI, acts purely as an in-memory service
  return null;
});

export default WasmBridge;
