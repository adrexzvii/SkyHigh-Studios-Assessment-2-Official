import { useState, useCallback } from "react";
import { setSimVarSafe } from "../utils/simvarUtils";

/**
 * useSimVarToggle - Hook for toggling a MSFS boolean L:Var value
 *
 * Provides local optimistic UI state plus a side-effect to set an MSFS SimVar.
 * The SimVar is written via a safe wrapper to prevent runtime crashes if unavailable.
 *
 * @param {string} varName - Name of the L:Var (e.g., "L:spawnAllLasersRed")
 * @returns {{ value: boolean, toggle: Function }} Current value and toggle handler
 *
 * @example
 * const flight = useSimVarToggle("L:WFP_StartFlight");
 * <Button onClick={flight.toggle}>{flight.value ? "Stop" : "Start"}</Button>
 */
export function useSimVarToggle(varName) {
  // Local UI state mirrors desired boolean value of the SimVar
  const [value, setValue] = useState(false);

  // Toggle handler: flips local state and writes to SimVar
  const toggle = useCallback(() => {
    const newVal = value ? 0 : 1; // SimVars frequently expect 0/1 for Bool
    setSimVarSafe(varName, "Bool", newVal); // Attempt to set SimVar safely
    setValue((prev) => !prev); // Optimistically update UI
  }, [value, varName]);

  return { value, toggle };
}
