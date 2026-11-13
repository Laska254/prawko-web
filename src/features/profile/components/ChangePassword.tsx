import {useRef, useState} from "react";
import {Alert, Button, Stack} from "@mui/material";
import {Password} from "@mui/icons-material";
import {useQueryClient} from "@tanstack/react-query";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {changePassword} from "@/api/auth.tsx";
import type {ChangePasswordDto} from "@/api/dto/ChangePasswordDto.tsx";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import type {StatusMessages} from "@/api/errors.tsx";
import {PASSWORD_LENGTH} from "@/api/fieldRules.tsx";
import {type FieldMessages, useFormSubmission} from "@/api/useFormSubmission.tsx";
import {ConfirmDialog} from "@/components/feedback/ConfirmDialog.tsx";
import {PasswordField} from "@/components/form/PasswordField.tsx";
import {currentUserQuery} from "@/session/currentUserQuery.tsx";

const FIELD_MESSAGES: FieldMessages<"newPassword", ParseKeys<"profile">> = {
    newPassword: {400: "changePassword.length"},
};

// A `400` without a field is the current password. The server answers a new password equal to it the same way, which
// the form checks before sending.
const STATUS_MESSAGES: StatusMessages<ParseKeys<"profile">> = {
    400: "passwordConfirm.wrong",
};

// A failed check of the form's own, under the field it's about.
interface CheckFailure {
    readonly field: "newPassword" | "confirmation";
    readonly message: ParseKeys<"profile">;
}

function check(currentPassword: string, newPassword: string, confirmation: string): CheckFailure | null {
    if (newPassword === currentPassword) {
        return {field: "newPassword", message: "changePassword.same"};
    }
    if (newPassword !== confirmation) {
        return {field: "confirmation", message: "changePassword.mismatch"};
    }
    return null;
}

interface ChangePasswordProps {
    readonly user: UserDto;
    // Called once the password changed, with the email whose pending change the server cancelled, `null` without one.
    readonly onChanged: (cancelledEmail: string | null) => void;
}

// Changes the password in a dialog, for a user who has one. The server ends every session and cancels a pending email
// change, so the user is signed in again here and fetched again, which drops the change from the profile.
export function ChangePassword({user, onChanged}: ChangePasswordProps) {
    const [isOpen, setOpen] = useState(false);
    const [checkFailure, setCheckFailure] = useState<CheckFailure | null>(null);
    const currentPasswordRef = useRef<HTMLInputElement>(null);
    const newPasswordRef = useRef<HTMLInputElement>(null);
    const confirmationRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const {t} = useTranslation(["profile", "errors"]);
    const {submit, isSending, fieldErrors, failure, clear} = useFormSubmission(
        (changePasswordDto: ChangePasswordDto) => changePassword(user.userName, changePasswordDto),
        {
            fieldMessages: FIELD_MESSAGES,
            statusMessages: STATUS_MESSAGES,
            // Busy until the user is fetched again, so the banner of the cancelled email change goes with the dialog.
            onSuccess: async () => {
                await queryClient.invalidateQueries({queryKey: currentUserQuery.queryKey});
                setOpen(false);
                onChanged(user.pendingEmail);
            },
        },
    );

    let text = t("changePassword.text");
    if (user.pendingEmail) {
        text = `${text} ${t("changePassword.cancelsEmailChange", {email: user.pendingEmail})}`;
    }

    let newPasswordError = fieldErrors.newPassword;
    let confirmationError: ParseKeys<"profile"> | undefined;
    if (checkFailure?.field === "newPassword") {
        newPasswordError = checkFailure.message;
    } else if (checkFailure?.field === "confirmation") {
        confirmationError = checkFailure.message;
    }

    // The last attempt's errors stay while the dialog fades out, and are gone when it opens again.
    function open(): void {
        clear();
        setCheckFailure(null);
        setOpen(true);
    }

    function save(): void {
        const currentPassword = currentPasswordRef.current!.value;
        const newPassword = newPasswordRef.current!.value;
        const failed = check(currentPassword, newPassword, confirmationRef.current!.value);
        setCheckFailure(failed);
        if (failed) {
            // The server's errors were about the passwords sent before, not these.
            clear();
            return;
        }
        submit({currentPassword, newPassword});
    }

    return (
        <>
            <Button variant="outlined" startIcon={<Password/>} onClick={open}>{t("changePassword.button")}</Button>
            <ConfirmDialog open={isOpen} title={t("changePassword.title")} text={text}
                           confirmLabel={t("changePassword.save")} loading={isSending} onConfirm={save}
                           onCancel={() => setOpen(false)}>
                <Stack spacing={2} mt={2}>
                    {failure && <Alert severity="error">{t(failure.message)}</Alert>}
                    <PasswordField label={t("passwordConfirm.label")} inputRef={currentPasswordRef}
                                   autoComplete="current-password" autoFocus required/>
                    <PasswordField label={t("changePassword.new")} inputRef={newPasswordRef}
                                   autoComplete="new-password" placeholder={t("changePassword.newPlaceholder")}
                                   required errorText={newPasswordError && t(newPasswordError)}
                                   slotProps={{htmlInput: PASSWORD_LENGTH}}/>
                    <PasswordField label={t("changePassword.confirmation")} inputRef={confirmationRef}
                                   autoComplete="new-password" required
                                   errorText={confirmationError && t(confirmationError)}/>
                </Stack>
            </ConfirmDialog>
        </>
    );
}
