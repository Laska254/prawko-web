import {useEffect, useRef, useState} from "react";
import {CircularProgress, Link, Stack, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import {Link as RouterLink, useNavigate, useSearchParams} from "react-router";
import {resendVerification, verifyEmail} from "@/api/auth.tsx";
import {type ApiError, errorMessage, toApiError} from "@/api/errors.tsx";
import {PageError} from "@/components/feedback/PageError.tsx";
import {EmailLinkForm} from "../components/EmailLinkForm.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";
import {AuthCard} from "../components/AuthCard.tsx";
import {isInvalidToken} from "../tokenErrors.tsx";

function BackLink() {
    const {t} = useTranslation("auth");

    return <Link component={RouterLink} to="/auth" underline="hover">{t("backToSignIn")}</Link>;
}

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [error, setError] = useState<ApiError | null>(null);
    // Each retry is a new attempt; the ref keeps an attempt from being sent twice when the effect runs again.
    const [attempt, setAttempt] = useState(0);
    const sentAttemptRef = useRef<number>(null);
    const navigate = useNavigate();
    const {t} = useTranslation(["auth", "errors"]);

    useEffect(() => {
        if (!token || sentAttemptRef.current === attempt) return;
        sentAttemptRef.current = attempt;
        verifyEmail({token})
            .then(() => navigate("/auth", {replace: true, state: {notice: "verified"}}))
            .catch(caught => setError(toApiError(caught)));
    }, [token, attempt, navigate]);

    function retry(): void {
        setError(null);
        setAttempt(attempt + 1);
    }

    function content() {
        if (!token || (error && isInvalidToken(error))) {
            return (
                <>
                    <Stack spacing={1}>
                        <Typography variant="h4" fontWeight={700}>{t("verifyEmail.failedTitle")}</Typography>
                        <Typography color="text.secondary">
                            {t("verifyEmail.failedSubtitle")}
                        </Typography>
                    </Stack>
                    <EmailLinkForm
                        submitLabel={t("resendVerification.submit")}
                        sentMessage={t("resendVerification.sent")}
                        send={email => resendVerification({email})}
                    />
                    <BackLink/>
                </>
            );
        }
        if (error) {
            return (
                <>
                    <PageError message={t(errorMessage(error))} onRetry={retry}/>
                    <BackLink/>
                </>
            );
        }
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
