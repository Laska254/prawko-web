import {useEffect, useRef, useState} from "react";
import {Box, CircularProgress, Link, Stack, Typography} from "@mui/material";
import {Link as RouterLink, useNavigate, useSearchParams} from "react-router";
import {verifyEmail} from "../requests.tsx";
import {AuthPagePanel} from "../component/AuthPagePanel.tsx";
import {ResendVerificationForm} from "../component/ResendVerificationForm.tsx";
import {Logo} from "../component/Logo.tsx";

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
            .then(() => navigate("/auth", {replace: true}))
            .catch(() => setIsFailed(true));
    }, [token, navigate]);

    return (
        <Box display="grid" gridTemplateColumns={{xs: "1fr", md: "1fr 1fr"}} minHeight="100vh">
            <AuthPagePanel/>
            <Stack alignItems="center" justifyContent="center" spacing={4} px={2} py={6}>
                <Box display={{md: "none"}}>
                    <Logo/>
                </Box>
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
                            <ResendVerificationForm/>
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
            </Stack>
        </Box>
    );
}
