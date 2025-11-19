/**
 * HelpDialog - Simple, themed help modal component
 *
 * Renders a Material-UI Dialog configured with the app palette.
 * Accepts controlled open/close props so parent components manage visibility.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Callback invoked when dialog requests close
 * @returns {JSX.Element} The rendered dialog
 */
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
} from "@mui/material";
import palette from "../../theme/palette";

export default function HelpDialog({ open, onClose }) {
  return (
    // Root MUI Dialog with themed background and minimum width
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: palette.dark,
          color: palette.textPrimary,
          minWidth: 320,
        },
      }}
    >
      {/* Title with divider for visual separation */}
      <DialogTitle sx={{ borderBottom: `1px solid ${palette.divider}` }}>
        Help Guide
      </DialogTitle>

      {/* Content area where help items can be listed */}
      <DialogContent>
        <List>{/* Future help items */}</List>
      </DialogContent>

      {/* Footer actions: primary Close button */}
      <DialogActions sx={{ borderTop: `1px solid ${palette.divider}` }}>
        <Button onClick={onClose} sx={{ color: palette.accent }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
