import {useEffect, useRef} from "react";
import {useNavigate, useSearchParams} from "react-router";
import {takeGitHubAuthorization} from "@/components/github/gitHubAuthorization.tsx";
import {PageLoading} from "@/components/feedback/PageLoading.tsx";
import type {ProfilePageState} from "../gitHubLink.tsx";

// Where GitHub sends the user back to with a `code` or, if consent was denied or the request was refused, an `error`.
// Hands the code to the profile, which asks for the password before linking; replaced by it, so going back doesn't
// come here again.
export function LinkGitHubCallbackPage() {
    const [searchParams] = useSearchParams();
    // The started authorization is removed on reading, so the effect running again mustn't do this again.
    const isHandledRef = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isHandledRef.current) return;
        isHandledRef.current = true;

        function goToProfile(state: ProfilePageState | null): void {
            navigate("/profile", {replace: true, state});
        }

        const authorization = takeGitHubAuthorization(searchParams.get("state"));
        const code = searchParams.get("code");
        if (!authorization) {
            goToProfile({failure: "link.gitHubInvalid"});
        } else if (searchParams.get("error") === "access_denied") {
            // The user said no on GitHub's page, so there's nothing to tell.
            goToProfile(null);
        } else if (!code) {
            goToProfile({failure: "link.gitHubInvalid"});
        } else {
            goToProfile({gitHubLink: {code, ...authorization}});
        }
    }, [searchParams, navigate]);

    return <PageLoading/>;
}
