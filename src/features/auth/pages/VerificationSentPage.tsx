import {Link, Stack, Typography} from "@mui/material";
import {Link as RouterLink, useLocation} from "react-router";
import {resendVerification} from "@/api/requests.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";
import {AuthCard} from "../components/AuthCard.tsx";
import {EmailLinkForm} from "../components/EmailLinkForm.tsx";

export function VerificationSentPage() {
    const email: string | undefined = useLocation().state?.email;

    return (
        <AuthPageLayout>
            <AuthCard>
                <Stack spacing={1}>
                    <Typography variant="h4" fontWeight={700}>Check your email</Typography>
                    <Typography color="text.secondary">
                        {email
                            ? <>We sent a verification link to <b>{email}</b>.</>
                            : "We sent a verification link to your email."}
                        {" "}Open it to activate your account, then sign in.
                    </Typography>
                </Stack>
                <EmailLinkForm
                    submitLabel="Send new link"
                    sentMessage="If an unverified account uses this email, a new link is on its way."
                    send={email => resendVerification({email})}
                    defaultEmail={email}
                />
                <Link component={RouterLink} to="/auth" underline="hover" fontWeight={600} alignSelf="flex-start">
                    Back to sign in
                </Link>
            </AuthCard>
        </AuthPageLayout>
    );
}
