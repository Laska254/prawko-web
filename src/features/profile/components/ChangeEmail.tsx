import {useRef, useState} from "react";
import {Alert, Button, Stack} from "@mui/material";
import {Email} from "@mui/icons-material";
import {useQueryClient} from "@tanstack/react-query";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import type {UserUpdateDto} from "@/api/dto/UserUpdateDto.tsx";
import type {StatusMessages} from "@/api/errors.tsx";
import {EMAIL_LENGTH} from "@/api/fieldRules.tsx";
import {type FieldMessages, useFormSubmission} from "@/api/useFormSubmission.tsx";
import {updateUser} from "@/api/users.tsx";
import {ConfirmDialog} from "@/components/feedback/ConfirmDialog.tsx";
import {FormTextField} from "@/components/form/FormTextField.tsx";
import {currentUserQuery} from "@/session/currentUserQuery.tsx";
import {isTooSoon, startEmailChangeCooldown} from "../emailChangeCooldown.tsx";
import {PasswordConfirmDialog} from "./PasswordConfirmDialog.tsx";

const FIELD_MESSAGES: FieldMessages<"email", ParseKeys<"profile">> = {
    email: {400: "changeEmail.invalid", 409: "changeEmail.taken"},
};

// A `400` without a field is the password, which the server reports like a wrong one when missing. A `409` without
// one means the user was changed by another request at the same time. A `429` comes within a minute of the last link.
const STATUS_MESSAGES: StatusMessages<ParseKeys<"profile">> = {
    400: "passwordConfirm.wrong",
    409: "edit.changedMeanwhile",
    429: "changeEmail.tooSoon",
};

interface ChangeEmailProps {
    readonly user: UserDto;
}

// Starts an email change in a dialog, asking for the password in a second one when the user has a password. The server
// sends links to the new and the current address and answers with the user, now with the pending email, which
// replaces the session's.
export function ChangeEmail({user}: ChangeEmailProps) {
    const [isOpen, setOpen] = useState(false);
    const [isConfirming, setConfirming] = useState(false);
    // The new email the password confirms; kept after its dialog closes, so the text doesn't change while it fades out.
    const [typedEmail, setTypedEmail] = useState("");
    const emailRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const {t} = useTranslation(["profile", "errors"]);
    const {submit, isSending, fieldErrors, failure, clear} = useFormSubmission(
        (userUpdateDto: UserUpdateDto) => updateUser(user.id, userUpdateDto),
        {
            fieldMessages: FIELD_MESSAGES,
            statusMessages: STATUS_MESSAGES,
            // The banner's Resend, shown once the session's user has the pending email, waits for the links just sent.
            onSuccess: updated => {
                startEmailChangeCooldown(user.id);
                queryClient.setQueryData(currentUserQuery.queryKey, updated);
                setConfirming(false);
                setOpen(false);
            },
            // The email's error shows under its field, so the password's dialog gives way to the form. A `429` makes
            // the banner's Resend wait too, as it would fail the same way.
            onError: error => {
                if (error.kind === "validation") {
                    setConfirming(false);
                }
                if (isTooSoon(error)) {
                    startEmailChangeCooldown(user.id);
                }
            },
        },
    );

    // The last attempt's errors stay while the dialog fades out, and are gone when it opens again.
    function open(): void {
        clear();
        setOpen(true);
    }

    // The current email closes the dialog without a request: the server would take it as cancelling a pending change,
    // which the banner offers on its own.
    function save(): void {
        const email = emailRef.current!.value;
        if (email.toLowerCase() === user.email.toLowerCase()) {
            setOpen(false);
            return;
        }
        if (user.hasPassword) {
            clear();
            setTypedEmail(email);
            setConfirming(true);
            return;
        }
        submit({email});
    }

    // Back to the form, with the email typed kept and the password's error dropped.
    function cancelPassword(): void {
        clear();
        setConfirming(false);
    }

    return (
        <>
            <Button variant="outlined" startIcon={<Email/>} onClick={open}>{t("changeEmail.button")}</Button>
            <ConfirmDialog open={isOpen} title={t("changeEmail.title")} text={t("changeEmail.text")}
                           confirmLabel={t("changeEmail.send")} loading={isSending} onConfirm={save}
                           onCancel={() => setOpen(false)}>
                <Stack spacing={2} mt={2}>
                    {failure && !isConfirming && <Alert severity="error">{t(failure.message)}</Alert>}
                    <FormTextField label={t("changeEmail.label")} type="email" inputRef={emailRef} autoComplete="email"
                                   required errorText={fieldErrors.email && t(fieldErrors.email)}
                                   slotProps={{htmlInput: EMAIL_LENGTH}}/>
                </Stack>
            </ConfirmDialog>
            <PasswordConfirmDialog open={isConfirming} title={t("changeEmail.passwordTitle")}
                                   text={t("changeEmail.passwordText", {email: typedEmail})}
                                   confirmLabel={t("changeEmail.send")} hasPassword loading={isSending}
                                   failure={failure && t(failure.message)}
                                   onConfirm={currentPassword => submit({email: typedEmail, currentPassword})}
                                   onCancel={cancelPassword}/>
        </>
    );
}
