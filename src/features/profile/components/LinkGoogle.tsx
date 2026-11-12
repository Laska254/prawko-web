import {useState} from "react";
import {Box} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {ApiError, StatusMessages} from "@/api/errors.tsx";
import {useFormSubmission} from "@/api/useFormSubmission.tsx";
import {linkGoogle} from "@/api/users.tsx";
import {GoogleButton} from "@/components/google/GoogleButton.tsx";
import {GOOGLE_BUTTON_MIN_WIDTH} from "@/components/google/googleIdentity.tsx";
import {PasswordConfirmDialog} from "./PasswordConfirmDialog.tsx";

// The server reports a missing password like a wrong one.
const STATUS_MESSAGES: StatusMessages<ParseKeys<"profile">> = {
    400: "passwordConfirm.wrong",
    404: "link.notConfigured",
    409: "link.conflict",
};

// A `409` may mean a Google account was linked to the user elsewhere since loading.
function isUserChanged(error: ApiError): boolean {
    return error.kind === "http" && error.status === 409;
}

interface LinkGoogleProps {
    readonly clientId: string;
    // The provider's name as shown.
    readonly name: string;
    // Asks for the password only when the user has one.
    readonly hasPassword: boolean;
    // Fetches the user again after a change; resolves once it's fetched, even if that failed.
    readonly refetchUser: () => Promise<void>;
}

// Links the Google account picked with Google's button, after a confirmation. Left out when Google's script can't be
// loaded; the dialog closes once the user is fetched again with the account linked.
export function LinkGoogle({clientId, name, hasPassword, refetchUser}: LinkGoogleProps) {
    // The ID token of the account picked, kept while the dialog is open; Google's tokens last an hour.
    const [idToken, setIdToken] = useState<string | null>(null);
    const [isUnavailable, setUnavailable] = useState(false);
    const {t} = useTranslation(["profile", "errors"]);
    const {submit, isSending, failure, clear} = useFormSubmission(linkGoogle, {
        statusMessages: STATUS_MESSAGES,
        // Awaited, so the dialog stays busy until the user is fetched again; closed even if that fetch fails.
        onSuccess: async () => {
            await refetchUser();
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

    // After a failure that may say the user changed elsewhere, the user is fetched again once the dialog is closed:
    // done earlier, the row's new action would replace the dialog before its message is read.
    function close(): void {
        setIdToken(null);
        if (failure && isUserChanged(failure.error)) {
            void refetchUser();
        }
    }

    return (
        <>
            <Box width={GOOGLE_BUTTON_MIN_WIDTH}>
                <GoogleButton clientId={clientId} onCredential={pick} setUnavailable={setUnavailable}
                              disabled={isSending}/>
            </Box>
            <PasswordConfirmDialog open={idToken !== null} title={t("link.title", {provider: name})}
                                   text={t("link.text", {provider: name})} confirmLabel={t("link.confirm")}
                                   hasPassword={hasPassword} loading={isSending}
                                   failure={failure && t(failure.message, {provider: name})}
                                   onConfirm={currentPassword => submit({idToken: idToken!, currentPassword})}
                                   onCancel={close}/>
        </>
    );
}
