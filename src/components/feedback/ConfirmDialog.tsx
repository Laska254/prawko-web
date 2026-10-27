import {useId} from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    text: string;
    confirmLabel: string;
    // `error` (red) marks a destructive action such as a delete.
    confirmColor?: "secondary" | "error";
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

// MUI links the title to the dialog itself; the text is linked through `aria-describedby`.
export function ConfirmDialog({open, title, text, confirmLabel, confirmColor = "secondary", loading, onConfirm, onCancel}: ConfirmDialogProps) {
    const textId = useId();

    // Escape and backdrop clicks can't close the dialog while the action is running.
    function handleClose() {
        if (!loading) {
            onCancel();
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} aria-describedby={textId}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText id={textId}>{text}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={loading}>Cancel</Button>
                <Button variant="contained" color={confirmColor} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
            </DialogActions>
        </Dialog>
    );
}
