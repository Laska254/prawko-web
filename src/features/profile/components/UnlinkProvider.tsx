import {useState} from "react";
import {Button} from "@mui/material";
import {useQueryClient} from "@tanstack/react-query";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {IdentityProvider} from "@/api/dto/IdentityProvider.tsx";
import type {UnlinkIdentityDto} from "@/api/dto/UnlinkIdentityDto.tsx";
import type {ApiError, StatusMessages} from "@/api/errors.tsx";
import {userKeys} from "@/api/queryKeys.tsx";
import {useFormSubmission} from "@/api/useFormSubmission.tsx";
import {unlinkIdentity} from "@/api/users.tsx";
import {PasswordConfirmDialog} from "./PasswordConfirmDialog.tsx";

// The server reports a missing password like a wrong one. `404` and `409` mean the user changed elsewhere since loading.
const STATUS_MESSAGES: StatusMessages<ParseKeys<"profile">> = {
    400: "passwordConfirm.wrong",
    404: "unlink.notLinked",
    409: "unlink.lastMethod",
};

function isUserChanged(error: ApiError): boolean {
    return error.kind === "http" && (error.status === 404 || error.status === 409);
}

interface UnlinkProviderProps {
    readonly provider: IdentityProvider;
    // The provider's name as shown, e.g. "GitHub".
    readonly name: string;
    // Asks for the password only when the user has one.
    readonly hasPassword: boolean;
}

// Unlinks a provider account after a confirmation; the dialog closes once the user is fetched again without it.
export function UnlinkProvider({provider, name, hasPassword}: UnlinkProviderProps) {
    const [isOpen, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const {t} = useTranslation(["profile", "errors"]);
    const {submit, isSending, failure, clear} = useFormSubmission(
        (unlinkIdentityDto: UnlinkIdentityDto) => unlinkIdentity(provider, unlinkIdentityDto),
        {
            statusMessages: STATUS_MESSAGES,
            // Only the user, not the stats under its key. Awaited, so the dialog stays busy until the user is fetched
            // again; closed even if that fetch fails.
            onSuccess: async () => {
                await queryClient.invalidateQueries({queryKey: userKeys.me(), exact: true});
                setOpen(false);
            },
        },
    );

    // The last attempt's error stays while the dialog fades out, and is gone when it opens again.
    function open(): void {
        clear();
        setOpen(true);
    }

    // After a failure saying the user changed elsewhere, the user is fetched again once the dialog is closed: done
    // earlier, the row's new action would replace the dialog before its message is read.
    function close(): void {
        setOpen(false);
        if (failure && isUserChanged(failure.error)) {
            void queryClient.invalidateQueries({queryKey: userKeys.me(), exact: true});
        }
    }

    return (
        <>
            <Button variant="outlined" color="error" size="small" aria-label={t("unlink.buttonLabel", {provider: name})}
                    onClick={open}>
                {t("unlink.button")}
            </Button>
            <PasswordConfirmDialog open={isOpen} title={t("unlink.title", {provider: name})}
                                   text={t("unlink.text", {provider: name})} confirmLabel={t("unlink.confirm")}
                                   confirmColor="error" hasPassword={hasPassword} loading={isSending}
                                   failure={failure && t(failure.message, {provider: name})}
                                   onConfirm={currentPassword => submit({currentPassword})}
                                   onCancel={close}/>
        </>
    );
}
