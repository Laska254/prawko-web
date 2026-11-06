import {useEffect, useRef} from "react";
import {CircularProgress, Typography} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {useNavigate, useSearchParams} from "react-router";
import {errorMessage, type StatusMessages, toApiError} from "@/api/errors.tsx";
import {useSession} from "@/session/useSession.tsx";
import {type AuthMessage, authFailureState} from "../authNotice.tsx";
import {AuthCard} from "../components/AuthCard.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";
import {gitHubRedirectUri, takeGitHubCodeVerifier} from "../gitHubAuthorization.tsx";

const STATUS_MESSAGES: StatusMessages<ParseKeys<"auth">> = {
    401: "messages.gitHubInvalid",
    403: "messages.gitHubEmailNotVerified",
    404: "messages.gitHubNotConfigured",
    409: "messages.gitHubEmailConflict",
};

// Where GitHub sends the user back to, with a `code` or, if consent was denied or the request was refused, an `error`.
// Every way out replaces this page, so going back doesn't send the used code again.
export function GitHubCallbackPage() {
    const [searchParams] = useSearchParams();
    // A code works once and the stored verifier is removed on reading, so the effect running again mustn't do this again.
    const isHandledRef = useRef(false);
    const navigate = useNavigate();
    const {signInWithGitHub} = useSession();
    const {t} = useTranslation("auth");

    useEffect(() => {
        if (isHandledRef.current) return;
        isHandledRef.current = true;

        function fail(message: AuthMessage): void {
            navigate("/auth", {replace: true, state: authFailureState(message)});
        }

        const codeVerifier = takeGitHubCodeVerifier(searchParams.get("state"));
        const code = searchParams.get("code");
        if (!codeVerifier) {
            fail("messages.gitHubInvalid");
        } else if (searchParams.get("error") === "access_denied") {
            fail("messages.gitHubDenied");
        } else if (!code) {
            fail("messages.gitHubInvalid");
        } else {
            signInWithGitHub({code, codeVerifier, redirectUri: gitHubRedirectUri()})
                .then(() => navigate("/", {replace: true}))
                .catch(caught => fail(errorMessage(toApiError(caught), STATUS_MESSAGES)));
        }
    }, [searchParams, navigate, signInWithGitHub]);

    return (
        <AuthPageLayout>
            <AuthCard spacing={3} alignItems="center" textAlign="center">
                <CircularProgress color="secondary"/>
                <Typography color="text.secondary">{t("gitHubCallback.signingIn")}</Typography>
            </AuthCard>
        </AuthPageLayout>
    );
}
