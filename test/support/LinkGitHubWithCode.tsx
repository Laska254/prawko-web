import {useState} from "react";
import type {GitHubSignInDto} from "@/api/dto/GitHubSignInDto.tsx";
import {LinkGitHub} from "@/features/profile/components/LinkGitHub.tsx";

interface LinkGitHubWithCodeProps {
    // GitHub's code the profile was opened with.
    readonly returned: GitHubSignInDto | undefined;
    readonly hasPassword: boolean;
    readonly refetchUser: () => Promise<void>;
}

// `LinkGitHub` holding GitHub's code as the profile does, dropping it once `LinkGitHub` is done with it.
export function LinkGitHubWithCode({returned, hasPassword, refetchUser}: LinkGitHubWithCodeProps) {
    const [gitHubLink, setGitHubLink] = useState(returned);

    return (
        <LinkGitHub clientId="client-id" name="GitHub" hasPassword={hasPassword} gitHubLink={gitHubLink}
                    onDone={() => setGitHubLink(undefined)} refetchUser={refetchUser}/>
    );
}
