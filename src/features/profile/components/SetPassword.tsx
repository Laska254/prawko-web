import {useState} from "react";
import {Alert, Button} from "@mui/material";
import {Password} from "@mui/icons-material";
import {useTranslation} from "react-i18next";
import {forgotPassword} from "@/api/auth.tsx";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {useFormSubmission} from "@/api/useFormSubmission.tsx";
import {ConfirmDialog} from "@/components/feedback/ConfirmDialog.tsx";
import {useCooldown} from "@/utils/useCooldown.tsx";

// The server sends a reset link at most once a minute per account; earlier requests are skipped without an error.
const PASSWORD_LINK_COOLDOWN_MS = 60_000;

interface SetPasswordProps {
    readonly user: UserDto;
    // Called once the link was sent, with the email it went to.
    readonly onSent: (email: string) => void;
}

// Sends a password reset link to a user without a password, who signed up with Google or GitHub: changing a password
// needs the current one, and the link proves the user owns the email instead. The button waits out the server's
// cooldown, so a link it skipped isn't reported as sent.
export function SetPassword({user, onSent}: SetPasswordProps) {
    const [isOpen, setOpen] = useState(false);
    const {secondsLeft, start} = useCooldown(`passwordLink.${user.id}`, PASSWORD_LINK_COOLDOWN_MS);
    const {t} = useTranslation(["profile", "errors"]);
    const {submit, isSending, failure, clear} = useFormSubmission(() => forgotPassword({email: user.email}), {
        onSuccess: () => {
            start();
            setOpen(false);
            onSent(user.email);
        },
    });

    // The last attempt's error stays while the dialog fades out, and is gone when it opens again.
    function open(): void {
        clear();
        setOpen(true);
    }

    function buttonLabel(): string {
        if (secondsLeft > 0) {
            return t("setPassword.wait", {seconds: secondsLeft});
        }
        return t("setPassword.button");
    }

    return (
        <>
            <Button variant="outlined" startIcon={<Password/>} disabled={secondsLeft > 0} onClick={open}>
                {buttonLabel()}
            </Button>
            <ConfirmDialog open={isOpen} title={t("setPassword.title")}
                           text={t("setPassword.text", {email: user.email})} confirmLabel={t("setPassword.send")}
                           loading={isSending} onConfirm={() => submit(undefined)} onCancel={() => setOpen(false)}>
                {failure && <Alert severity="error" sx={{mt: 2}}>{t(failure.message)}</Alert>}
            </ConfirmDialog>
        </>
    );
}
