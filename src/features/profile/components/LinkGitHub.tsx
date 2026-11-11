import {useState} from "react";
import {Box} from "@mui/material";
import {useQueryClient} from "@tanstack/react-query";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {GitHubSignInDto} from "@/api/dto/GitHubSignInDto.tsx";
import type {StatusMessages} from "@/api/errors.tsx";
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

    return (
        <>
            <Box width={BUTTON_WIDTH}>
                <GitHubButton clientId={clientId} redirectPath={GITHUB_LINK_CALLBACK_PATH}/>
            </Box>
            <PasswordConfirmDialog open={gitHubLink !== null} title={t("link.title", {provider: name})}
                                   text={t("link.text", {provider: name})} confirmLabel={t("link.confirm")}
                                   hasPassword={hasPassword} loading={isSending}
                                   failure={failure && t(failure.message, {provider: name})}
                                   onConfirm={currentPassword => submit({...gitHubLink!, currentPassword})}
                                   onCancel={() => setGitHubLink(null)}/>
        </>
    );
}
