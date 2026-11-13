import {useState} from "react";
import {Button} from "@mui/material";
import {DeleteForever} from "@mui/icons-material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import type {ApiError, StatusMessages} from "@/api/errors.tsx";
import {useFormSubmission} from "@/api/useFormSubmission.tsx";
import {requestAccountDeletion} from "@/api/users.tsx";
import {useCooldown} from "@/utils/useCooldown.tsx";
import {PasswordConfirmDialog} from "./PasswordConfirmDialog.tsx";

// The server sends the link at most once a minute per account, answering earlier requests with a `429`.
const COOLDOWN_MS = 60_000;

// The server reports a missing password like a wrong one.
const STATUS_MESSAGES: StatusMessages<ParseKeys<"profile">> = {
    400: "passwordConfirm.wrong",
    429: "changeEmail.tooSoon",
};

// A `429` says the link was sent less than the cooldown ago, e.g. from another tab.
function isTooSoon(error: ApiError): boolean {
    return error.kind === "http" && error.status === 429;
}

interface DeleteAccountProps {
    readonly user: UserDto;
    // Called once the link was sent, with the email it went to.
    readonly onSent: (email: string) => void;
}

// Asks for the account's deletion, with the password when the user has one. The server emails a link, and the account
// is deleted only once it's confirmed there, so the session goes on until then. The button waits out the server's
// cooldown.
export function DeleteAccount({user, onSent}: DeleteAccountProps) {
    const [isOpen, setOpen] = useState(false);
    const {secondsLeft, start} = useCooldown(`accountDeletion.${user.id}`, COOLDOWN_MS);
    const {t} = useTranslation(["profile", "errors"]);
    const {submit, isSending, failure, clear} = useFormSubmission(requestAccountDeletion, {
        statusMessages: STATUS_MESSAGES,
        onSuccess: () => {
            start();
            setOpen(false);
            onSent(user.email);
        },
        onError: error => {
            if (isTooSoon(error)) {
                start();
            }
        },
    });

    // The last attempt's error stays while the dialog fades out, and is gone when it opens again.
    function open(): void {
        clear();
        setOpen(true);
    }

    function buttonLabel(): string {
        if (secondsLeft > 0) {
            return t("deleteAccount.wait", {seconds: secondsLeft});
        }
        return t("deleteAccount.button");
    }

    return (
        <>
            <Button variant="outlined" color="error" startIcon={<DeleteForever/>} disabled={secondsLeft > 0}
                    onClick={open}>
                {buttonLabel()}
            </Button>
            <PasswordConfirmDialog open={isOpen} title={t("deleteAccount.title")}
                                   text={t("deleteAccount.text", {email: user.email})}
                                   confirmLabel={t("deleteAccount.send")} confirmColor="error"
                                   hasPassword={user.hasPassword} loading={isSending}
                                   failure={failure && t(failure.message)}
                                   onConfirm={password => submit({password})} onCancel={() => setOpen(false)}/>
        </>
    );
}
