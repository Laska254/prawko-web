import {useState} from "react";
import {Alert, Button} from "@mui/material";
import {useQueryClient} from "@tanstack/react-query";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import type {StatusMessages} from "@/api/errors.tsx";
import {useFormSubmission} from "@/api/useFormSubmission.tsx";
import {getCurrentUser, updateUser} from "@/api/users.tsx";
import {ConfirmDialog} from "@/components/feedback/ConfirmDialog.tsx";
import {currentUserQuery} from "@/session/currentUserQuery.tsx";

// A `409` means the user was changed by another request at the same time.
const STATUS_MESSAGES: StatusMessages<ParseKeys<"profile">> = {
    409: "edit.changedMeanwhile",
};

// The user without a pending email change. The server takes the current email as cancelling it, without a password or
// a cooldown, since no link is sent; the links already sent stop working. The user is fetched first, as the change may
// have completed elsewhere: the session's old email would then start a change back to it.
async function cancelChange(): Promise<UserDto> {
    const user = await getCurrentUser();
    if (!user.pendingEmail) {
        return user;
    }
    return updateUser(user.id, {email: user.email});
}

// Cancels a pending email change after a confirmation. The user it answers replaces the session's, so the banner
// holding this goes away.
export function CancelEmailChange() {
    const [isOpen, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const {t} = useTranslation(["profile", "errors"]);
    const {submit, isSending, failure, clear} = useFormSubmission(
        cancelChange,
        {
            statusMessages: STATUS_MESSAGES,
            onSuccess: updated => {
                queryClient.setQueryData(currentUserQuery.queryKey, updated);
                setOpen(false);
            },
        },
    );

    // The last attempt's error stays while the dialog fades out, and is gone when it opens again.
    function open(): void {
        clear();
        setOpen(true);
    }

    return (
        <>
            <Button variant="outlined" color="inherit" size="small" onClick={open}>
                {t("cancelEmail.button")}
            </Button>
            <ConfirmDialog open={isOpen} title={t("cancelEmail.title")} text={t("cancelEmail.text")}
                           confirmLabel={t("cancelEmail.confirm")} cancelLabel={t("cancelEmail.keep")}
                           confirmColor="error" loading={isSending}
                           onConfirm={() => submit(undefined)} onCancel={() => setOpen(false)}>
                {failure && <Alert severity="error" sx={{mt: 2}}>{t(failure.message)}</Alert>}
            </ConfirmDialog>
        </>
    );
}
