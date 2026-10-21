import {Link, Stack, Typography} from "@mui/material";
import {Link as RouterLink} from "react-router";
import {forgotPassword} from "../requests.tsx";
import {AuthPageLayout} from "../component/AuthPageLayout.tsx";
import {EmailLinkForm} from "../component/EmailLinkForm.tsx";

export function ForgotPasswordPage() {
    return (
        <AuthPageLayout>
            <Stack spacing={4} width="100%" maxWidth={440} p={{xs: 3, sm: 5}}
                   border={1} borderColor="divider" borderRadius={2} bgcolor="background.paper" boxShadow={1}>
                <Stack spacing={1}>
                    <Typography variant="h4" fontWeight={700}>Forgot password?</Typography>
                    <Typography color="text.secondary">
                        Enter your account email and we'll send you a link to reset your password.
                    </Typography>
                </Stack>
                <EmailLinkForm
                    submitLabel="Send reset link"
                    sentMessage="If an account uses this email, a reset link is on its way."
                    send={email => forgotPassword({email})}
                />
                <Link component={RouterLink} to="/auth" underline="hover" fontWeight={600} alignSelf="flex-start">
                    Back to sign in
                </Link>
            </Stack>
        </AuthPageLayout>
    );
}
