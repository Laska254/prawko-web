import {useState} from "react";
import {Box} from "@mui/material";
import {useQueryClient} from "@tanstack/react-query";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {StatusMessages} from "@/api/errors.tsx";
import {userKeys} from "@/api/queryKeys.tsx";
import {useFormSubmission} from "@/api/useFormSubmission.tsx";
import {linkGoogle} from "@/api/users.tsx";
import {GoogleButton} from "@/components/google/GoogleButton.tsx";
import {PasswordConfirmDialog} from "./PasswordConfirmDialog.tsx";

// The server reports a missing password like a wrong one.
const STATUS_MESSAGES: StatusMessages<ParseKeys<"profile">> = {
    400: "passwordConfirm.wrong",
    404: "link.notConfigured",
    409: "link.conflict",
};

// Google's narrowest button that still fits its label.
const BUTTON_WIDTH = 240;

interface LinkGoogleProps {
    readonly clientId: string;
    // The provider's name as shown.
    readonly name: string;
    // Asks for the password only when the user has one.
    readonly hasPassword: boolean;
}

// Links the Google account picked with Google's button, after a confirmation. Left out when Google's script can't be
// loaded; the dialog closes once the user is fetched again with the account linked.
export function LinkGoogle({clientId, name, hasPassword}: LinkGoogleProps) {
    // The ID token of the account picked, kept while the dialog is open; Google's tokens last an hour.
    const [idToken, setIdToken] = useState<string | null>(null);
    const [isUnavailable, setUnavailable] = useState(false);
    const queryClient = useQueryClient();
    const {t} = useTranslation(["profile", "errors"]);
    const {submit, isSending, failure, clear} = useFormSubmission(linkGoogle, {
        statusMessages: STATUS_MESSAGES,
        // Awaited, so the dialog stays busy until the user is fetched again; closed even if that fetch fails.
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: userKeys.all});
            setIdToken(null);
        },
    });

    if (isUnavailable) {
        return null;
    }

    // A new account picked drops the last attempt's error.
    function pick(pickedIdToken: string): void {
        clear();
        setIdToken(pickedIdToken);
    }

    return (
        <>
            <Box width={BUTTON_WIDTH}>
                <GoogleButton clientId={clientId} onCredential={pick} setUnavailable={setUnavailable}
                              disabled={isSending}/>
            </Box>
            <PasswordConfirmDialog open={idToken !== null} title={t("link.title", {provider: name})}
                                   text={t("link.text", {provider: name})} confirmLabel={t("link.confirm")}
                                   hasPassword={hasPassword} loading={isSending}
                                   failure={failure && t(failure.message, {provider: name})}
                                   onConfirm={currentPassword => submit({idToken: idToken!, currentPassword})}
                                   onCancel={() => setIdToken(null)}/>
        </>
    );
}
