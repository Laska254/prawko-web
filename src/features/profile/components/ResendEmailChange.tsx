import {useState} from "react";
import {Button} from "@mui/material";
import {useQueryClient} from "@tanstack/react-query";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {isTooManyRequests, type StatusMessages} from "@/api/errors.tsx";
import {type FieldMessages, useFormSubmission} from "@/api/useFormSubmission.tsx";
import {updateUser} from "@/api/users.tsx";
import {currentUserQuery} from "@/session/currentUserQuery.tsx";
import {useCooldown} from "@/utils/useCooldown.tsx";
import {EMAIL_CHANGE_COOLDOWN_MS, emailChangeCooldownKey} from "../emailChangeCooldown.tsx";
import {PasswordConfirmDialog} from "./PasswordConfirmDialog.tsx";

// The pending email is checked for conflicts again, as another user may have taken it since.
const FIELD_MESSAGES: FieldMessages<"email", ParseKeys<"profile">> = {
    email: {409: "changeEmail.taken"},
};

// As in `ChangeEmail`: a `400` is the password, a `409` without a field a change at the same time.
const STATUS_MESSAGES: StatusMessages<ParseKeys<"profile">> = {
    400: "passwordConfirm.wrong",
    409: "edit.changedMeanwhile",
    429: "linkTooSoon",
};

interface ResendEmailChangeProps {
    readonly user: UserDto;
    // The user's pending email, which the banner holding this shows.
    readonly pendingEmail: string;
}

// Sends the links of a pending email change again, asking for the password when the user has one. The server takes
// the pending email as a new change to it: both addresses get new links, the ones sent before stop working. The
// button waits out the server's cooldown, which a change started in `ChangeEmail` starts too.
export function ResendEmailChange({user, pendingEmail}: ResendEmailChangeProps) {
    const [isOpen, setOpen] = useState(false);
    const {secondsLeft, start} = useCooldown(emailChangeCooldownKey(user.id), EMAIL_CHANGE_COOLDOWN_MS);
    const queryClient = useQueryClient();
    const {t} = useTranslation(["profile", "errors"]);
    const {submit, isSending, fieldErrors, failure, clear} = useFormSubmission(
        (currentPassword: string | null) => updateUser(user.id, {email: pendingEmail, currentPassword}),
        {
            fieldMessages: FIELD_MESSAGES,
            statusMessages: STATUS_MESSAGES,
            onSuccess: updated => {
                start();
                queryClient.setQueryData(currentUserQuery.queryKey, updated);
                setOpen(false);
            },
            onError: error => {
                // A `429` says the links were sent less than the cooldown ago, e.g. from another tab.
                if (isTooManyRequests(error)) {
                    start();
                }
            },
        },
    );

    // The last attempt's error stays while the dialog fades out, and is gone when it opens again.
    function open(): void {
        clear();
        setOpen(true);
    }

    // No field shows the email, so its error shows like a failure.
    function failureMessage(): string | null {
        const message = fieldErrors.email ?? failure?.message;
        if (message === undefined) {
            return null;
        }
        return t(message);
    }

    function buttonLabel(): string {
        if (secondsLeft > 0) {
            return t("resendEmail.wait", {seconds: secondsLeft});
        }
        return t("resendEmail.button");
    }

    return (
        <>
            <Button variant="outlined" color="inherit" size="small" disabled={secondsLeft > 0} onClick={open}>
                {buttonLabel()}
            </Button>
            <PasswordConfirmDialog open={isOpen} title={t("resendEmail.title")}
                                   text={t("resendEmail.text", {email: pendingEmail})}
                                   confirmLabel={t("resendEmail.confirm")} hasPassword={user.hasPassword}
                                   loading={isSending} failure={failureMessage()} onConfirm={submit}
                                   onCancel={() => setOpen(false)}/>
        </>
    );
}
