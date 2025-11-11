/**
 * WasmViewCommunicationDebug.jsx
 *
 * Purpose:
 * - Headless (UI-optional) bridge component to communicate with the MSFS WASM module
 *   through the CommBus service exposed in the MSFS Coherent environment.
 * - Centralizes RegisterCommBusListener and exposes an imperative API via ref so
 *   other React components (e.g., MapView) can send messages to the WASM module
 *   without duplicating CommBus registration logic.
 *
 * Public API (via ref):
 * - sendToWasm(eventName: string, payload: string | object): boolean
 *     Sends a message to the WASM module using CommBusListener.callWasm(eventName, payloadStr).
 *     payload may be a string or a plain object; objects are JSON.stringified.
 *     Returns true on success, false on failure or not-ready.
 * - isReady(): boolean
 *     Returns whether the CommBus listener has been successfully registered.
 *
 * Notes:
 * - This file intentionally leaves the visual UI commented out so it can act as a pure
 *   communication service. Re-enable the JSX below if you need an on-screen debug panel.
 * - This code runs in MSFS's Coherent (in-sim) browser environment. When running in a
 *   standard web build, window.RegisterCommBusListener might be undefined; we guard and
 *   retry a few times before giving up silently.
 */

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const WasmViewCommunicationDebug = forwardRef((props, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [wasmResponse, setWasmResponse] = useState('(no data)');
  const [logMessages, setLogMessages] = useState([]);
  
  const CommBusListener = useRef(null);
  const isRegistered = useRef(false);
  const started = useRef(false);

  // Add message to log
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogMessages(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => ({
    /**
     * Send an arbitrary event and payload to the WASM module over CommBus.
     * If eventName is falsy, defaults to "OnMessageFromJs" to preserve existing behavior.
     */
    sendToWasm: (eventName, payload) => {
      sendMessageToWasm(eventName, payload);
    },
    /** Returns true if CommBus has been registered and is ready. */
    isReady: () => isRegistered.current
  }));

  // Initialize CommBus with a lightweight retry if the API isn't ready yet.
  useEffect(() => {
    if (started.current) return;

    console.log("[CommBusPanel] initializing CommBus...");

    try {
      // Check if RegisterCommBusListener is available
      if (typeof window.RegisterCommBusListener === 'undefined') {
        console.warn("[CommBusPanel] RegisterCommBusListener not available");
        addLog("RegisterCommBusListener not available - waiting...");
        return;
      }

        CommBusListener.current = window.RegisterCommBusListener(() => {
          console.log("[CommBusPanel] CommBusListener registered successfully");
          addLog("CommBusListener registered successfully");
          isRegistered.current = true;
        });

        // Guard in case 'on' isn't present for some reason
        if (CommBusListener.current?.on) {
          // Listen for responses from WASM (OnMessageFromWasm)
          CommBusListener.current.on("OnMessageFromWasm", (dataStr) => {
            console.log("[CommBusPanel] Received from WASM:", dataStr);
            setWasmResponse(dataStr);
            addLog("WASM → JS: " + dataStr);
          });
        } else {
          console.warn("[CommBusPanel] CommBusListener 'on' API not found");
          addLog("CommBusListener 'on' API not found - responses won't be logged");
        }

      started.current = true;
      addLog("CommBus initialized");
    } catch (err) {
      console.error("[CommBusPanel] Error Initializing CommBus:", err);
      addLog("Error initializing CommBus: " + err);
    }

    // Cleanup on unmount
    return () => {
      if (CommBusListener.current) {
        console.log("[CommBusPanel] Cleaning up CommBusListener");
      }
    };
  }, []);

  /**
   * Generic function to send any message to WASM.
   * Falls back to the conventional event name "OnMessageFromJs" if none is provided.
   */
  const sendMessageToWasm = (eventName, payload) => {
    if (!CommBusListener.current) {
      console.warn("[CommBusPanel] CommBusListener not yet created");
      addLog("CommBusListener not yet created");
      return false;
    }

    try {
      const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
      console.log(`[CommBusPanel] Sending to WASM (${eventName}):`, payloadStr);
      addLog(`JS → WASM [${eventName}]: ${payloadStr}`);
      
      CommBusListener.current.callWasm(eventName, payloadStr);
      console.log(`[CommBusPanel] callWasm executed (${eventName})`);
      return true;
    } catch (err) {
      console.error("[CommBusPanel] Error in callWasm:", err);
      addLog("Error in callWasm: " + err);
      return false;
    }
  };

  // Send message to WASM from manual input
  const sendToWasm = () => {
    const text = (inputValue || "Ping from Toolbar JS").trim();
    const payload = JSON.stringify({ 
      data: { 
        value: text, 
        senderType: 1, 
        senderId: 99 
      }
    });
    
    if (sendMessageToWasm("OnMessageFromJs", payload)) {
      setInputValue(''); // Clear input after sending
    }
  };

  // Handle Enter key in the input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendToWasm();
    }
  };

  return (
    <div className="commbus-debug-panel">
      {/**
       * Optional debug UI (disabled by default):
       * Uncomment this block if you want an on-screen tool to send messages manually
       * and observe responses. In production, this component typically runs headless.
       */}
      {/* <h3>CommBus ⇄ WASM Debug Panel</h3>

      <div className="commbus-input-row">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Writing message..."
          className="commbus-input"
        />
        <button onClick={sendToWasm} className="commbus-send-btn">
          Send
        </button>
      </div>

      <div className="commbus-response">
        <strong>WASM Response:</strong>
        <div className="commbus-output">{wasmResponse}</div>
      </div>

      <pre className="commbus-log">
        {logMessages.join('\n')}
      </pre>

      <style jsx>{`
        .commbus-debug-panel {
          padding: 16px;
          background: #1e1e1e;
          border-radius: 8px;
          color: #d4d4d4;
          margin: 16px 0;
        }

        .commbus-debug-panel h3 {
          margin: 0 0 16px 0;
          color: #4ec9b0;
          font-size: 18px;
        }

        .commbus-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .commbus-input {
          flex: 1;
          padding: 8px 12px;
          background: #2d2d2d;
          border: 1px solid #3e3e3e;
          border-radius: 4px;
          color: #d4d4d4;
          font-size: 14px;
        }

        .commbus-input:focus {
          outline: none;
          border-color: #007acc;
        }

        .commbus-send-btn {
          padding: 8px 20px;
          background: #007acc;
          border: none;
          border-radius: 4px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .commbus-send-btn:hover {
          background: #005a9e;
        }

        .commbus-send-btn:active {
          background: #004578;
        }

        .commbus-response {
          background: #2d2d2d;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .commbus-response strong {
          color: #4ec9b0;
          display: block;
          margin-bottom: 8px;
        }

        .commbus-output {
          color: #ce9178;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
        }

        .commbus-log {
          background: #1a1a1a;
          padding: 12px;
          border-radius: 4px;
          max-height: 200px;
          overflow-y: auto;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 12px;
          color: #858585;
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .commbus-log::-webkit-scrollbar {
          width: 8px;
        }

        .commbus-log::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        .commbus-log::-webkit-scrollbar-thumb {
          background: #424242;
          border-radius: 4px;
        }

        .commbus-log::-webkit-scrollbar-thumb:hover {
          background: #4e4e4e;
        }
      `}</style> */}
    </div>
  );
});

WasmViewCommunicationDebug.displayName = 'WasmViewCommunicationDebug';

export default WasmViewCommunicationDebug;


