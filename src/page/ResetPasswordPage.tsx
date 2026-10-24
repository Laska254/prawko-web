import {Link, Stack, Typography} from "@mui/material";
import {Link as RouterLink, useSearchParams} from "react-router";
import {AuthPageLayout} from "../component/AuthPageLayout.tsx";
import {AuthCard} from "../component/AuthCard.tsx";
import {ResetPasswordForm} from "../component/ResetPasswordForm.tsx";

type ResetLinkState = "valid" | "invalid";

const CONTENT: Record<ResetLinkState, {title: string; subtitle: string}> = {
    valid: {title: "Set new password", subtitle: "Choose a new password for your account."},
    invalid: {
        title: "Invalid reset link",
        subtitle: "This reset link is invalid. Request a new one to reset your password.",
    },
};

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const {title, subtitle} = CONTENT[token ? "valid" : "invalid"];

    return (
        <AuthPageLayout>
            <AuthCard>
                <Stack spacing={1}>
                    <Typography variant="h4" fontWeight={700}>{title}</Typography>
                    <Typography color="text.secondary">{subtitle}</Typography>
                </Stack>
                {token
                    ? <ResetPasswordForm token={token}/>
                    : (
                        <Link component={RouterLink} to="/auth/password/forgot" underline="hover" fontWeight={600}>
                            Request a new link
                        </Link>
                    )}
                <Link component={RouterLink} to="/auth" underline="hover" fontWeight={600} alignSelf="flex-start">
                    Back to sign in
                </Link>
            </AuthCard>
        </AuthPageLayout>
    );
}
