import {useState} from "react";
import {Alert, Stack} from "@mui/material";
import {useQueryClient} from "@tanstack/react-query";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {GitHubSignInDto} from "@/api/dto/GitHubSignInDto.tsx";
import type {ApiError, StatusMessages} from "@/api/errors.tsx";
import {userKeys} from "@/api/queryKeys.tsx";
import {useFormSubmission} from "@/api/useFormSubmission.tsx";
import {linkGitHub} from "@/api/users.tsx";
import {GitHubButton} from "@/components/github/GitHubButton.tsx";
import {GITHUB_LINK_CALLBACK_PATH} from "../gitHubLink.tsx";
import {PasswordConfirmDialog} from "./PasswordConfirmDialog.tsx";

// The server reports a missing password like a wrong one.
const STATUS_MESSAGES: StatusMessages<ParseKeys<"profile">> = {
    400: "passwordConfirm.wrong",
    404: "link.notConfigured",
    409: "link.conflict",
};

// As wide as Google's button above it.
const BUTTON_WIDTH = 240;

// The server checks the password before it exchanges GitHub's code, which works once, so only a 400 leaves the code
// unused. Sent again, a used code is answered with a 401, which signs the user out.
function isCodeUnused(error: ApiError): boolean {
    return (error.kind === "http" || error.kind === "validation") && error.status === 400;
}

interface LinkGitHubProps {
    readonly clientId: string;
    // The provider's name as shown.
    readonly name: string;
    // Asks for the password only when the user has one.
    readonly hasPassword: boolean;
    // GitHub's code the profile was opened with, when the user just agreed to linking on GitHub's page.
    readonly returned: GitHubSignInDto | undefined;
}

// Leaves for GitHub's consent page; back on the profile with its code, links the account after a confirmation. The
// dialog closes once the user is fetched again with the account linked.
export function LinkGitHub({clientId, name, hasPassword, returned}: LinkGitHubProps) {
    // Kept while the dialog is open; GitHub's codes last ten minutes.
    const [gitHubLink, setGitHubLink] = useState<GitHubSignInDto | null>(returned ?? null);
    const queryClient = useQueryClient();
    const {t} = useTranslation(["profile", "errors"]);
    const {submit, isSending, failure} = useFormSubmission(linkGitHub, {
        statusMessages: STATUS_MESSAGES,
        // Awaited, so the dialog stays busy until the user is fetched again; closed even if that fetch fails.
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: userKeys.all});
            setGitHubLink(null);
        },
    });
    // A failure that used GitHub's code up closes the dialog and shows by the button, which brings a new code.
    let spentCodeFailure: string | null = null;
    if (failure && !isCodeUnused(failure.error)) {
        spentCodeFailure = t(failure.message, {provider: name});
    }

    return (
        <>
            <Stack spacing={1} width={BUTTON_WIDTH}>
                {spentCodeFailure && <Alert severity="error">{spentCodeFailure}</Alert>}
                <GitHubButton clientId={clientId} redirectPath={GITHUB_LINK_CALLBACK_PATH}/>
            </Stack>
            <PasswordConfirmDialog open={gitHubLink !== null && spentCodeFailure === null} title={t("link.title", {provider: name})}
                                   text={t("link.text", {provider: name})} confirmLabel={t("link.confirm")}
                                   hasPassword={hasPassword} loading={isSending}
                                   failure={failure && t(failure.message, {provider: name})}
                                   onConfirm={currentPassword => submit({...gitHubLink!, currentPassword})}
                                   onCancel={() => setGitHubLink(null)}/>
        </>
    );
}
