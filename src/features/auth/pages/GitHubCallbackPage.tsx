import {useEffect, useRef} from "react";
import {CircularProgress, Typography} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {useNavigate, useSearchParams} from "react-router";
import {errorMessage, type StatusMessages, toApiError} from "@/api/errors.tsx";
import {takeGitHubAuthorization} from "@/components/github/gitHubAuthorization.tsx";
import {useSession} from "@/session/useSession.tsx";
import {type AuthMessage, authFailureState} from "../authNotice.tsx";
import {AuthCard} from "../components/AuthCard.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";

const STATUS_MESSAGES: StatusMessages<ParseKeys<"auth">> = {
    401: "messages.gitHubInvalid",
    403: "messages.gitHubEmailNotVerified",
    404: "messages.gitHubNotConfigured",
    409: "messages.gitHubEmailConflict",
};

// Where GitHub sends the user back to, with a `code` or, if consent was denied or the request was refused, an `error`.
// Every way out replaces this page, so going back doesn't send the used code again. Signing in goes on to the page the
// sign in page was going back to, and a failure takes that page back there. A visitor already signed in goes home. The
// page checks that itself instead of sitting under `RequireGuest`, whose redirect home would win over the return path
// once this page's own sign in updates the session.
export function GitHubCallbackPage() {
    const [searchParams] = useSearchParams();
    // A code works once and the started authorization is removed on reading, so the effect running again mustn't do
    // this again.
    const isHandledRef = useRef(false);
    const navigate = useNavigate();
    const {status, signInWithGitHub} = useSession();
    const {t} = useTranslation("auth");

    useEffect(() => {
        if (isHandledRef.current) return;
        isHandledRef.current = true;

        if (status !== "signedOut") {
            navigate("/", {replace: true});
            return;
        }

        const taken = takeGitHubAuthorization(searchParams.get("state"));
        const code = searchParams.get("code");

        function fail(message: AuthMessage): void {
            navigate("/auth", {replace: true, state: {...authFailureState(message), from: taken?.returnPath}});
        }

        if (!taken) {
            fail("messages.gitHubInvalid");
        } else if (searchParams.get("error") === "access_denied") {
            fail("messages.gitHubDenied");
        } else if (!code) {
            fail("messages.gitHubInvalid");
        } else {
            signInWithGitHub({code, ...taken.authorization})
                .then(() => navigate(taken.returnPath ?? "/", {replace: true}))
                .catch(caught => fail(errorMessage(toApiError(caught), STATUS_MESSAGES)));
        }
    }, [searchParams, navigate, status, signInWithGitHub]);

    return (
        <AuthPageLayout>
            <AuthCard spacing={3} alignItems="center" textAlign="center">
                <CircularProgress color="secondary"/>
                <Typography color="text.secondary">{t("gitHubCallback.signingIn")}</Typography>
            </AuthCard>
        </AuthPageLayout>
    );
}
