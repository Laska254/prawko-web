import {Link, Stack, Typography} from "@mui/material";
import {Trans, useTranslation} from "react-i18next";
import {Link as RouterLink, useLocation} from "react-router";
import {resendVerification} from "@/api/auth.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";
import {AuthCard} from "../components/AuthCard.tsx";
import {EmailLinkForm} from "../components/EmailLinkForm.tsx";

export function VerificationSentPage() {
    const email: string | undefined = useLocation().state?.email;
    const {t} = useTranslation("auth");

    return (
        <AuthPageLayout>
            <AuthCard>
                <Stack spacing={1}>
                    <Typography variant="h4" fontWeight={700}>{t("verificationSent.title")}</Typography>
                    <Typography color="text.secondary">
                        {/* `<email/>` is self-closing, so the email stays a React child and isn't parsed as markup. */}
                        {email
                            ? <Trans t={t} i18nKey="verificationSent.sentToEmail" components={{email: <b>{email}</b>}}/>
                            : t("verificationSent.sentToYourEmail")}
                    </Typography>
                </Stack>
                <EmailLinkForm
                    submitLabel={t("resendVerification.submit")}
                    sentMessage={t("resendVerification.sent")}
                    send={email => resendVerification({email})}
                    defaultEmail={email}
                />
                <Link component={RouterLink} to="/auth" underline="hover" fontWeight={600} alignSelf="flex-start">
                    {t("backToSignIn")}
                </Link>
            </AuthCard>
        </AuthPageLayout>
    );
}
