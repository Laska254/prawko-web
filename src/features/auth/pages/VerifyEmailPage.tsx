import {useEffect, useRef, useState} from "react";
import {CircularProgress, Link, Stack, Typography} from "@mui/material";
import {useQueryClient} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {Link as RouterLink, useNavigate, useSearchParams} from "react-router";
import {resendVerification, verifyEmail} from "@/api/auth.tsx";
import {type ApiError, errorMessage, toApiError} from "@/api/errors.tsx";
import {PageError} from "@/components/feedback/PageError.tsx";
import {currentUserQuery} from "@/session/currentUserQuery.tsx";
import {useSession} from "@/session/useSession.tsx";
import {EmailLinkForm} from "../components/EmailLinkForm.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";
import {AuthCard} from "../components/AuthCard.tsx";
import {isInvalidToken} from "../tokenErrors.tsx";
import {authNoticeState} from "../authNotice.tsx";

// What a link completed: `completed` an account verification or an email change, which the server answers alike;
// `awaiting` an email change confirmed by this address, still waiting for the link sent to the other one.
type VerifyResult = "completed" | "awaiting";

interface NextLinkProps {
    readonly isSignedIn: boolean;
}

interface ResultMessageProps {
    readonly title: string;
    readonly text: string;
}

function resultOf(status: number): VerifyResult {
    if (status === 202) {
        return "awaiting";
    }
    return "completed";
}

// Whether an email change's new address belongs to another account by now: a `409` that marks the email.
// Without the field, the `409` means the user was modified meanwhile, which a retry can fix.
function isEmailTaken(error: ApiError): boolean {
    return error.kind === "validation" && error.status === 409 && "email" in error.fields;
}

// Signed-in users go to the profile, where an email change is followed; `/auth` would send them home.
function NextLink({isSignedIn}: NextLinkProps) {
    const {t} = useTranslation("auth");

    if (isSignedIn) {
        return <Link component={RouterLink} to="/profile" underline="hover">{t("verifyEmail.toProfile")}</Link>;
    }
    return <Link component={RouterLink} to="/auth" underline="hover">{t("backToSignIn")}</Link>;
}

function ResultMessage({title, text}: ResultMessageProps) {
    return (
        <Stack spacing={1}>
            <Typography variant="h4" fontWeight={700}>{title}</Typography>
            <Typography color="text.secondary">{text}</Typography>
        </Stack>
    );
}

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [result, setResult] = useState<VerifyResult | null>(null);
    const [error, setError] = useState<ApiError | null>(null);
    // Each retry is a new attempt; the ref keeps an attempt from being sent twice when the effect runs again.
    const [attempt, setAttempt] = useState(0);
    const sentAttemptRef = useRef<number>(null);
    const session = useSession();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const {t} = useTranslation(["auth", "errors", "common"]);
    // An account that isn't verified yet can't sign in, so a signed-in user's link is an email change.
    const isSignedIn = session.status === "signedIn";
    const isSignInNext = result === "completed" && session.status === "signedOut";

    useEffect(() => {
        if (!token || sentAttemptRef.current === attempt) return;
        sentAttemptRef.current = attempt;
        verifyEmail({token})
            .then(async response => {
                // A signed-in user's email or pending change is different now; a signed-out session has no user.
                await queryClient.invalidateQueries({queryKey: currentUserQuery.queryKey, exact: true});
                setResult(resultOf(response.status));
            })
            .catch(caught => setError(toApiError(caught)));
    }, [token, attempt, queryClient]);

    useEffect(() => {
        if (isSignInNext) {
            navigate("/auth", {replace: true, state: authNoticeState("verified")});
        }
    }, [isSignInNext, navigate]);

    function retry(): void {
        setError(null);
        setAttempt(attempt + 1);
    }

    function failed() {
        // Signed in, the account is verified already, so the link was an email change's; its links are sent again
        // from the profile.
        if (isSignedIn) {
            return (
                <>
                    <ResultMessage title={t("verifyEmail.failedTitle")} text={t("verifyEmail.failedSignedIn")}/>
                    <NextLink isSignedIn/>
                </>
            );
        }
        return (
            <>
                <Stack spacing={1}>
                    <Typography variant="h4" fontWeight={700}>{t("verifyEmail.failedTitle")}</Typography>
                    <Typography color="text.secondary">
                        {t("verifyEmail.failedSubtitle")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t("verifyEmail.failedEmailChange")}
                    </Typography>
                </Stack>
                <EmailLinkForm
                    submitLabel={t("resendVerification.submit")}
                    sentMessage={t("resendVerification.sent")}
                    send={email => resendVerification({email})}
                    cooldownKey="verification"
                />
                <NextLink isSignedIn={false}/>
            </>
        );
    }

    function content() {
        // Most outcomes depend on whether the user is signed in.
        if (session.status === "loading") {
            return progress();
        }
        // Signed in or not is unknown until the user loads; the result is kept, so a retry shows it.
        if (session.status === "error") {
            return <PageError message={t("common:sessionLoadFailed")} onRetry={session.retry}/>;
        }
        if (!token || (error && isInvalidToken(error))) {
            return failed();
        }
        if (error && isEmailTaken(error)) {
            return (
                <>
                    <ResultMessage title={t("verifyEmail.emailTakenTitle")} text={t("verifyEmail.emailTakenText")}/>
                    <NextLink isSignedIn={isSignedIn}/>
                </>
            );
        }
        if (error) {
            return (
                <>
                    <PageError message={t(errorMessage(error, {409: "verifyEmail.conflict"}))} onRetry={retry}/>
                    <NextLink isSignedIn={isSignedIn}/>
                </>
            );
        }
        if (result === "awaiting") {
            return (
                <>
                    <ResultMessage title={t("verifyEmail.awaitingTitle")} text={t("verifyEmail.awaitingText")}/>
                    <NextLink isSignedIn={isSignedIn}/>
                </>
            );
        }
        // Signed out, a completed link goes on to sign in.
        if (result === "completed" && isSignedIn) {
            return (
                <>
                    <ResultMessage title={t("verifyEmail.changedTitle")} text={t("verifyEmail.changedText")}/>
                    <NextLink isSignedIn/>
                </>
            );
        }
        return progress();
    }

    function progress() {
        return (
            <>
                <CircularProgress color="secondary"/>
                <Typography color="text.secondary">{t("verifyEmail.verifying")}</Typography>
            </>
        );
    }

    return (
        <AuthPageLayout>
            <AuthCard spacing={3} alignItems="center" textAlign="center">
                {content()}
            </AuthCard>
        </AuthPageLayout>
    );
}
