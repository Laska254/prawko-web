import {useRef, useState} from "react";
import {Alert, Button, Stack} from "@mui/material";
import {useQueryClient} from "@tanstack/react-query";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {IdentityProvider} from "@/api/dto/IdentityProvider.tsx";
import type {UnlinkIdentityDto} from "@/api/dto/UnlinkIdentityDto.tsx";
import type {StatusMessages} from "@/api/errors.tsx";
import {userKeys} from "@/api/queryKeys.tsx";
import {useFormSubmission} from "@/api/useFormSubmission.tsx";
import {unlinkIdentity} from "@/api/users.tsx";
import {ConfirmDialog} from "@/components/feedback/ConfirmDialog.tsx";
import {PasswordField} from "@/components/form/PasswordField.tsx";

// The server reports a missing password like a wrong one. `404` and `409` mean the user changed elsewhere since loading.
const STATUS_MESSAGES: StatusMessages<ParseKeys<"profile">> = {
    400: "unlink.wrongPassword",
    404: "unlink.notLinked",
    409: "unlink.lastMethod",
};

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
    const passwordRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const {t} = useTranslation(["profile", "errors"]);
    const {submit, isSending, failure, clear} = useFormSubmission(
        (unlinkIdentityDto: UnlinkIdentityDto) => unlinkIdentity(provider, unlinkIdentityDto),
        {
            statusMessages: STATUS_MESSAGES,
            // Awaited, so the dialog stays busy until the user is fetched again; closed even if that fetch fails.
            onSuccess: async () => {
                await queryClient.invalidateQueries({queryKey: userKeys.all});
                setOpen(false);
            },
        },
    );

    let text: ParseKeys<"profile"> = "unlink.text";
    if (hasPassword) {
        text = "unlink.textWithPassword";
    }

    // The last attempt's error stays while the dialog fades out, and is gone when it opens again.
    function open(): void {
        clear();
        setOpen(true);
    }

    function confirm(): void {
        let currentPassword: string | null = null;
        if (hasPassword) {
            currentPassword = passwordRef.current!.value;
        }
        submit({currentPassword});
    }

    return (
        <>
            <Button variant="outlined" color="error" size="small" aria-label={t("unlink.buttonLabel", {provider: name})}
                    onClick={open}>
                {t("unlink.button")}
            </Button>
            <ConfirmDialog open={isOpen} title={t("unlink.title", {provider: name})} text={t(text, {provider: name})}
                           confirmLabel={t("unlink.confirm")} confirmColor="error" loading={isSending}
                           onConfirm={confirm} onCancel={() => setOpen(false)}>
                <Stack spacing={2} mt={2}>
                    {failure && <Alert severity="error">{t(failure.message, {provider: name})}</Alert>}
                    {hasPassword && (
                        <PasswordField label={t("unlink.password")} inputRef={passwordRef}
                                       autoComplete="current-password" autoFocus required/>
                    )}
                </Stack>
            </ConfirmDialog>
        </>
    );
}
