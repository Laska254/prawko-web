import {Link, Stack, Typography} from "@mui/material";
import {Link as RouterLink, useSearchParams} from "react-router";
import {AuthPageLayout} from "../component/AuthPageLayout.tsx";
import {ResetPasswordForm} from "../component/ResetPasswordForm.tsx";

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    return (
        <AuthPageLayout>
            <Stack spacing={4} width="100%" maxWidth={440} p={{xs: 3, sm: 5}}
                   border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper" boxShadow={1}>
                <Stack spacing={1}>
                    <Typography variant="h4" fontWeight={700}>Set new password</Typography>
                    <Typography color="text.secondary">
                        {token
                            ? "Choose a new password for your account."
                            : "This reset link is invalid. Request a new one to reset your password."}
                    </Typography>
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
            </Stack>
        </AuthPageLayout>
    );
}
