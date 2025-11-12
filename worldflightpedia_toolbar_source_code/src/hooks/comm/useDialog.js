import { useState, useCallback } from "react";

/**
 * useDialog - Small helper hook to manage dialog visibility state
 *
 * Encapsulates a boolean "open" state with memoized open/close handlers.
 * Useful for Material-UI Dialogs or any controlled overlay component.
 *
 * @param {boolean} [initial=false] - Initial open state
 * @returns {{ open: boolean, handleOpen: Function, handleClose: Function }}
 * - open: current visibility state
 * - handleOpen: sets open to true
 * - handleClose: sets open to false
 *
 * @example
 * const help = useDialog(false);
 * <Dialog open={help.open} onClose={help.handleClose} />
 */
export function useDialog(initial = false) {
  // Track visibility state for a dialog or popover
  const [open, setOpen] = useState(initial);

  // Open handler: stable reference for passing to components
  const handleOpen = useCallback(() => setOpen(true), []);
  // Close handler: stable reference to avoid unnecessary re-renders
  const handleClose = useCallback(() => setOpen(false), []);

  return { open, handleOpen, handleClose };
}
