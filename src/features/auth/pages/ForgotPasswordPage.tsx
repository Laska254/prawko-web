import {Link, Stack, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import {Link as RouterLink} from "react-router";
import {forgotPassword} from "@/api/auth.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";
import {AuthCard} from "../components/AuthCard.tsx";
import {EmailLinkForm} from "../components/EmailLinkForm.tsx";

export function ForgotPasswordPage() {
    const {t} = useTranslation("auth");

    return (
        <AuthPageLayout>
            <AuthCard>
                <Stack spacing={1}>
                    <Typography variant="h4" fontWeight={700}>{t("forgotPassword.title")}</Typography>
                    <Typography color="text.secondary">
                        {t("forgotPassword.subtitle")}
                    </Typography>
                </Stack>
                <EmailLinkForm
                    submitLabel={t("forgotPassword.submit")}
                    sentMessage={t("forgotPassword.sent")}
                    send={email => forgotPassword({email})}
                />
                <Link component={RouterLink} to="/auth" underline="hover" fontWeight={600} alignSelf="flex-start">
                    {t("backToSignIn")}
                </Link>
            </AuthCard>
        </AuthPageLayout>
    );
}
