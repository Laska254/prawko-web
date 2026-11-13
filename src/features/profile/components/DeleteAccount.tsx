import {useState} from "react";
import {Button} from "@mui/material";
import {DeleteForever} from "@mui/icons-material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {StatusMessages} from "@/api/errors.tsx";
import {useFormSubmission} from "@/api/useFormSubmission.tsx";
import {deleteAccount} from "@/api/users.tsx";
import {PasswordConfirmDialog} from "./PasswordConfirmDialog.tsx";

// The server reports a missing password like a wrong one.
const STATUS_MESSAGES: StatusMessages<ParseKeys<"profile">> = {
    400: "passwordConfirm.wrong",
};

// Deletes the account after a confirmation with the password, for a user who has one. Deleting ends the session, so
// the dialog stays busy until the sign in page replaces the profile.
export function DeleteAccount() {
    const [isOpen, setOpen] = useState(false);
    const {t} = useTranslation(["profile", "errors"]);
    const {submit, isSending, failure, clear} = useFormSubmission(deleteAccount, {statusMessages: STATUS_MESSAGES});

    // The last attempt's error stays while the dialog fades out, and is gone when it opens again.
    function open(): void {
        clear();
        setOpen(true);
    }

    return (
        <>
            <Button variant="outlined" color="error" startIcon={<DeleteForever/>} onClick={open}>
                {t("deleteAccount.button")}
            </Button>
            <PasswordConfirmDialog open={isOpen} title={t("deleteAccount.title")} text={t("deleteAccount.text")}
                                   confirmLabel={t("deleteAccount.confirm")} confirmColor="error" hasPassword
                                   loading={isSending} failure={failure && t(failure.message)}
                                   onConfirm={password => submit({password: password!})}
                                   onCancel={() => setOpen(false)}/>
        </>
    );
}
