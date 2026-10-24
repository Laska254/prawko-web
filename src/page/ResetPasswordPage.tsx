import {Link, Stack, Typography} from "@mui/material";
import {Link as RouterLink, useSearchParams} from "react-router";
import {AuthPageLayout} from "../component/AuthPageLayout.tsx";
import {AuthCard} from "../component/AuthCard.tsx";
import {ResetPasswordForm} from "../component/ResetPasswordForm.tsx";

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    return (
        <AuthPageLayout>
            <AuthCard>
                {token ? (
                    <>
                        <Stack spacing={1}>
                            <Typography variant="h4" fontWeight={700}>Set new password</Typography>
                            <Typography color="text.secondary">Choose a new password for your account.</Typography>
                        </Stack>
                        <ResetPasswordForm token={token}/>
                    </>
                ) : (
                    <>
                        <Stack spacing={1}>
                            <Typography variant="h4" fontWeight={700}>Set new password</Typography>
                            <Typography color="text.secondary">
                                This reset link is invalid. Request a new one to reset your password.
                            </Typography>
                        </Stack>
                        <Link component={RouterLink} to="/auth/password/forgot" underline="hover" fontWeight={600}>
                            Request a new link
                        </Link>
                    </>
                )}
                <Link component={RouterLink} to="/auth" underline="hover" fontWeight={600} alignSelf="flex-start">
                    Back to sign in
                </Link>
            </AuthCard>
        </AuthPageLayout>
    );
}
