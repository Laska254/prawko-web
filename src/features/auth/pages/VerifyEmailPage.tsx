import {type ReactNode, useEffect, useRef, useState} from "react";
import {CircularProgress, Link, Stack, Typography} from "@mui/material";
import {useQueryClient} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {Link as RouterLink, useNavigate, useSearchParams} from "react-router";
import {resendVerification, verifyEmail} from "@/api/auth.tsx";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {type ApiError, errorMessage, toApiError} from "@/api/errors.tsx";
import {PageError} from "@/components/feedback/PageError.tsx";
import {currentUserQuery} from "@/session/currentUserQuery.tsx";
import {useSession} from "@/session/useSession.tsx";
import {EmailLinkForm} from "../components/EmailLinkForm.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";
import {AuthCard} from "../components/AuthCard.tsx";
import {isInvalidToken} from "../tokenErrors.tsx";
import {authNoticeState} from "../authNotice.tsx";

// What a link completed, which the server answers alike for an account verification and an email change: `changed`
// the email change the signed-in user was waiting for; `completed` any other link; `awaiting` an email change confirmed
// by this address, still waiting for the link sent to the other.
type VerifyResult = "changed" | "completed" | "awaiting";

interface ResultMessageProps {
    readonly title: string;
    readonly text: string;
    // A smaller line under the text.
    readonly hint?: string;
    // Shown between the message and the next link, e.g. a form.
    readonly children?: ReactNode;
}

// `user` is the signed-in user as loaded before the link's answer, if any.
function resultOf(status: number, user: UserDto | undefined): VerifyResult {
    if (status === 202) {
        return "awaiting";
    }
    if (user?.pendingEmail) {
        return "changed";
    }
    return "completed";
}

// Whether an email change's new address belongs to another account by now: a `409` that marks the email.
// Without the field, the `409` means the user was modified meanwhile, which a retry can fix.
function isEmailTaken(error: ApiError): boolean {
    return error.kind === "validation" && error.status === 409 && "email" in error.fields;
}

// Signed-in users go to the profile, where an email change is followed; `/auth` would send them home.
function NextLink() {
    const session = useSession();
    const {t} = useTranslation("auth");

    if (session.status === "signedIn") {
        return <Link component={RouterLink} to="/profile" underline="hover">{t("verifyEmail.toProfile")}</Link>;
    }
    return <Link component={RouterLink} to="/auth" underline="hover">{t("backToSignIn")}</Link>;
}

// A result's title and text, followed by the link on from the page.
function ResultMessage({title, text, hint, children}: ResultMessageProps) {
    return (
        <>
            <Stack spacing={1}>
                <Typography variant="h4" fontWeight={700}>{title}</Typography>
                <Typography color="text.secondary">{text}</Typography>
                {hint && <Typography variant="body2" color="text.secondary">{hint}</Typography>}
            </Stack>
            {children}
            <NextLink/>
        </>
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
    const isSignedIn = session.status === "signedIn";
    const isSignInNext = result === "completed" && session.status === "signedOut";

    // The token is sent once the session has loaded, so a signed-in user's pending change is read from before the link.
    useEffect(() => {
        if (!token || sentAttemptRef.current === attempt) return;
        if (session.status === "loading" || session.status === "error") return;
        sentAttemptRef.current = attempt;
        verifyEmail({token})
            .then(async response => {
                // Read before the refetch, which no longer shows the change as pending.
                const user = queryClient.getQueryData(currentUserQuery.queryKey);
                // A signed-in user's email or pending change is different now; a signed-out session has no user.
                await queryClient.invalidateQueries({queryKey: currentUserQuery.queryKey, exact: true});
                setResult(resultOf(response.status, user));
            })
            .catch(caught => setError(toApiError(caught)));
    }, [token, attempt, session.status, queryClient]);

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
            return <ResultMessage title={t("verifyEmail.failedTitle")} text={t("verifyEmail.failedSignedIn")}/>;
        }
        return (
            <ResultMessage title={t("verifyEmail.failedTitle")} text={t("verifyEmail.failedSubtitle")}
                           hint={t("verifyEmail.failedEmailChange")}>
                <EmailLinkForm
                    submitLabel={t("resendVerification.submit")}
                    sentMessage={t("resendVerification.sent")}
                    send={email => resendVerification({email})}
                    cooldownKey="verification"
                />
            </ResultMessage>
        );
    }

    function content() {
        // Most outcomes depend on whether the user is signed in.
        if (session.status === "loading") {
            return progress();
        }
        // Signed in or not is unknown until the user loads, and so is the result, as the token waits for the session.
        if (session.status === "error") {
            return <PageError message={t("common:sessionLoadFailed")} onRetry={session.retry}/>;
        }
        if (!token || (error && isInvalidToken(error))) {
            return failed();
        }
        if (error && isEmailTaken(error)) {
            return <ResultMessage title={t("verifyEmail.emailTakenTitle")} text={t("verifyEmail.emailTakenText")}/>;
        }
        if (error) {
            return (
                <>
                    <PageError message={t(errorMessage(error, {409: "verifyEmail.conflict"}))} onRetry={retry}/>
                    <NextLink/>
                </>
            );
        }
        if (result === "awaiting") {
            return <ResultMessage title={t("verifyEmail.awaitingTitle")} text={t("verifyEmail.awaitingText")}/>;
        }
        if (result === "changed") {
            return <ResultMessage title={t("verifyEmail.changedTitle")} text={t("verifyEmail.changedText")}/>;
        }
        // Signed out, a completed link goes on to sign in. Signed in, it may be another account's link.
        if (result === "completed" && isSignedIn) {
            return <ResultMessage title={t("verifyEmail.verifiedTitle")} text={t("verifyEmail.verifiedText")}/>;
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
