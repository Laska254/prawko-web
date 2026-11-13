import {useRef} from "react";
import {Alert, Stack} from "@mui/material";
import {useTranslation} from "react-i18next";
import {ConfirmDialog} from "@/components/feedback/ConfirmDialog.tsx";
import {PasswordField} from "@/components/form/PasswordField.tsx";

interface PasswordConfirmDialogProps {
    readonly open: boolean;
    readonly title: string;
    // What confirming does; the request for the password is added when the user has one.
    readonly text: string;
    readonly confirmLabel: string;
    readonly confirmColor?: "secondary" | "error";
    // Asks for the password only when the user has one.
    readonly hasPassword: boolean;
    readonly loading: boolean;
    // The translated message of the last attempt's failure, `null` without one.
    readonly failure: string | null;
    // Called with the password typed, `null` without one.
    readonly onConfirm: (currentPassword: string | null) => void;
    readonly onCancel: () => void;
}

// Confirms an action the server allows only with the current password if there is one: a change to how the user signs
// in (a provider, the username), or deleting the account.
export function PasswordConfirmDialog({open, title, text, confirmLabel, confirmColor, hasPassword, loading, failure,
                                          onConfirm, onCancel}: PasswordConfirmDialogProps) {
    const passwordRef = useRef<HTMLInputElement>(null);
    const {t} = useTranslation("profile");

    let description = text;
    if (hasPassword) {
        description = `${text} ${t("passwordConfirm.prompt")}`;
    }

    function confirm(): void {
        let currentPassword: string | null = null;
        if (hasPassword) {
            currentPassword = passwordRef.current!.value;
        }
        onConfirm(currentPassword);
    }

    return (
        <ConfirmDialog open={open} title={title} text={description} confirmLabel={confirmLabel}
                       confirmColor={confirmColor} loading={loading} onConfirm={confirm} onCancel={onCancel}>
            <Stack spacing={2} mt={2}>
                {failure && <Alert severity="error">{failure}</Alert>}
                {hasPassword && (
                    <PasswordField label={t("passwordConfirm.label")} inputRef={passwordRef}
                                   autoComplete="current-password" autoFocus required/>
                )}
            </Stack>
        </ConfirmDialog>
    );
}
