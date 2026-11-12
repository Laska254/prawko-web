import {type FormEvent, type ReactNode, useId} from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";
import {useTranslation} from "react-i18next";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    text: string;
    confirmLabel: string;
    // The dismiss button's label, "Cancel" by default; named when the confirm label starts the same, e.g. "Cancel change".
    cancelLabel?: string;
    // `error` (red) marks a destructive action such as a delete.
    confirmColor?: "secondary" | "error";
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    // Shown under the text, e.g. a password field to confirm with; Enter in a field confirms.
    children?: ReactNode;
}

// MUI links the title to the dialog itself; the text is linked through `aria-describedby`.
export function ConfirmDialog({open, title, text, confirmLabel, cancelLabel, confirmColor = "secondary", loading, onConfirm, onCancel, children}: ConfirmDialogProps) {
    const textId = useId();
    const formId = useId();
    const {t} = useTranslation();

    // Escape and backdrop clicks can't close the dialog while the action is running.
    function handleClose() {
        if (!loading) {
            onCancel();
        }
    }

    function handleSubmit(e: FormEvent): void {
        e.preventDefault();
        onConfirm();
    }

    return (
        <Dialog open={open} onClose={handleClose} aria-describedby={textId}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {/* Inside the content, so the dialog's paper still lays out the content and actions; the confirm button
                    submits it through `form`. */}
                <form id={formId} onSubmit={handleSubmit}>
                    {/* The text can hold what the user typed, e.g. an email, which browsers don't break at `.` or
                        `@`; without this, a long one is wider than the dialog on a phone. */}
                    <DialogContentText id={textId} sx={{overflowWrap: "anywhere"}}>{text}</DialogContentText>
                    {children}
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={loading}>{cancelLabel ?? t("cancel")}</Button>
                <Button type="submit" form={formId} variant="contained" color={confirmColor} loading={loading}>
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
