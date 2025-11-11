/**
 * commbusUtils.js - Helper utilities for CommBus payload and lifecycle handling
 *
 * Provides small utility functions used by the CommBus hook to normalize payloads
 * and perform defensive cleanup.
 */

/**
 * toPayloadString - Converts a payload (string or object) into a safe string
 *
 * Handles null/undefined gracefully and JSON serialization errors.
 * Falls back to String(payload) if JSON.stringify throws.
 *
 * @param {any} payload - Data to convert
 * @returns {string} Serialized string suitable for callWasm
 */
export function toPayloadString(payload) {
  if (payload == null) return ""; // Treat null/undefined uniformly
  if (typeof payload === "string") return payload; // Already a string
  try {
    return JSON.stringify(payload);
  } catch (err) {
    console.warn("[toPayloadString] Error serializing payload:", err);
    return String(payload);
  }
}

/**
 * safeCleanup - Executes a cleanup callback without throwing
 *
 * Wraps callback invocation in try/catch to prevent teardown errors from
 * interrupting unmount flow.
 *
 * @param {string} name - Identifier for logging context
 * @param {Function} callback - Cleanup logic to run
 * @returns {void}
 */
export function safeCleanup(name, callback) {
  try {
    callback?.();
  } catch (err) {
    console.warn(`[${name}] Error during cleanup:`, err);
  }
}
