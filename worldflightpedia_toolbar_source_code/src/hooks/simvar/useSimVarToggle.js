import { useState, useCallback, useEffect } from "react";
import { setSimVarSafe } from "../../utils/simvar/simvarUtils";

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
  // LocalStorage key derived from varName
  const lsKey = `wfp_simvar_${String(varName).replace(/[^a-z0-9]/gi, "_")}`;

  // Local UI state mirrors desired boolean value of the SimVar
  const [value, setValue] = useState(() => {
    try {
      const raw = window?.localStorage?.getItem(lsKey);
      if (raw !== null) return JSON.parse(raw) === true;
    } catch {}
    return false;
  });

  // Persist to localStorage whenever value changes
  useEffect(() => {
    try {
      window?.localStorage?.setItem(lsKey, JSON.stringify(Boolean(value)));
    } catch {}
  }, [lsKey, value]);

  // Toggle handler: flips local state and writes to SimVar
  const toggle = useCallback(() => {
    // flip based on previous state to avoid stale closures
    setValue((prev) => {
      const newBool = !prev;
      const newVal = newBool ? 1 : 0; // SimVars frequently expect 0/1 for Bool
      try {
        setSimVarSafe(varName, "Bool", newVal); // Attempt to set SimVar safely
      } catch {}
      return newBool;
    });
  }, [varName]);

  return { value, toggle };
}
