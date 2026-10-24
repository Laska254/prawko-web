import {useEffect, useRef, useState} from "react";
import {CircularProgress, Link, Stack, Typography} from "@mui/material";
import {Link as RouterLink, useNavigate, useSearchParams} from "react-router";
import {resendVerification, verifyEmail} from "../requests.tsx";
import {EmailLinkForm} from "../component/EmailLinkForm.tsx";
import {AuthPageLayout} from "../component/AuthPageLayout.tsx";

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [isFailed, setIsFailed] = useState(!token);
    const isSentRef = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token || isSentRef.current) return;
        isSentRef.current = true;
        verifyEmail({token})
            .then(() => navigate("/auth", {replace: true, state: {isVerified: true}}))
            .catch(() => setIsFailed(true));
    }, [token, navigate]);

    return (
        <AuthPageLayout>
            <Stack spacing={3} alignItems="center" textAlign="center" width="100%" maxWidth={440}
                   p={{xs: 3, sm: 5}} border={1} borderColor="divider" borderRadius={2}
                   bgcolor="background.paper" boxShadow={1}>
                {isFailed ? (
                    <>
                        <Stack spacing={1}>
                            <Typography variant="h4" fontWeight={700}>Verification failed</Typography>
                            <Typography color="text.secondary">
                                This verification link is invalid or has expired. Enter your email to get a
                                new one.
                            </Typography>
                        </Stack>
                        <EmailLinkForm
                            submitLabel="Send new link"
                            sentMessage="If an unverified account uses this email, a new link is on its way."
                            send={email => resendVerification({email})}
                        />
                        <Link component={RouterLink} to="/auth" underline="hover">
                            Back to sign in
                        </Link>
                    </>
                ) : (
                    <>
                        <CircularProgress color="secondary"/>
                        <Typography color="text.secondary">Verifying your email…</Typography>
                    </>
                )}
            </Stack>
        </AuthPageLayout>
    );
}
