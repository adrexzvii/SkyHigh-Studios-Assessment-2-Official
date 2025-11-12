/**
 * setSimVarSafe - Safely set a Microsoft Flight Simulator SimVar
 *
 * Wraps SimVar.SetSimVarValue in a try/catch to avoid runtime errors when
 * running outside of the MSFS Coherent environment or when SimVar is undefined.
 *
 * @param {string} name - Variable name (e.g., "L:spawnAllLasersRed")
 * @param {string} type - SimVar type (e.g., "Bool", "Number", etc.)
 * @param {any} value - Value to assign to the SimVar
 * @returns {void}
 */
export function setSimVarSafe(name, type, value) {
  try {
    // Attempt to call into MSFS Coherent API
    SimVar.SetSimVarValue(name, type, value);
  } catch (err) {
    // Log and continue without crashing in non-MSFS environments
    console.error(`[SimVar] Error setting ${name}:`, err);
  }
}
