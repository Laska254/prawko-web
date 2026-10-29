import {Link, Stack, Typography} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {Link as RouterLink, useSearchParams} from "react-router";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";
import {AuthCard} from "../components/AuthCard.tsx";
import {ResetPasswordForm} from "../components/ResetPasswordForm.tsx";

type ResetLinkState = "valid" | "invalid";

const CONTENT: Record<ResetLinkState, { readonly title: ParseKeys<"auth">; readonly subtitle: ParseKeys<"auth"> }> = {
    valid: {title: "resetPassword.title", subtitle: "resetPassword.subtitle"},
    invalid: {title: "resetPassword.invalidTitle", subtitle: "resetPassword.invalidSubtitle"},
};

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const {t} = useTranslation("auth");
    const {title, subtitle, body} = token
        ? {...CONTENT.valid, body: <ResetPasswordForm token={token}/>}
        : {
            ...CONTENT.invalid,
            body: (
                <Link component={RouterLink} to="/auth/password/forgot" underline="hover" fontWeight={600}>
                    {t("resetPassword.requestNewLink")}
                </Link>
            ),
        };

    return (
        <AuthPageLayout>
            <AuthCard>
                <Stack spacing={1}>
                    <Typography variant="h4" fontWeight={700}>{t(title)}</Typography>
                    <Typography color="text.secondary">{t(subtitle)}</Typography>
                </Stack>
                {body}
                <Link component={RouterLink} to="/auth" underline="hover" fontWeight={600} alignSelf="flex-start">
                    {t("backToSignIn")}
                </Link>
            </AuthCard>
        </AuthPageLayout>
    );
}
