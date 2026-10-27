import {Link, Stack, Typography} from "@mui/material";
import {Link as RouterLink} from "react-router";
import {forgotPassword} from "@/api/requests.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";
import {AuthCard} from "../components/AuthCard.tsx";
import {EmailLinkForm} from "../components/EmailLinkForm.tsx";

export function ForgotPasswordPage() {
    return (
        <AuthPageLayout>
            <AuthCard>
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
            </AuthCard>
        </AuthPageLayout>
    );
}
