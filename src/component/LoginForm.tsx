import {useRef, useState} from "react";
import {Alert, Button, IconButton, InputAdornment, Link, Stack, TextField} from "@mui/material";
import {login} from "../requests.tsx";
import {Link as RouterLink, useNavigate} from "react-router";
import {Visibility, VisibilityOff} from "@mui/icons-material";

type LoginError = "invalidCredentials" | "notVerified" | "failed";

const ERROR_MESSAGES: Record<LoginError, string> = {
    invalidCredentials: "Wrong login or password.",
    notVerified: "Verify your email before signing in.",
    failed: "Couldn't sign in. Please try again later.",
};

const STATUS_ERRORS: Partial<Record<number, LoginError>> = {
    400: "invalidCredentials",
    401: "invalidCredentials",
    403: "notVerified",
};

export default function LoginForm() {
    const userNameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [error, setError] = useState<LoginError | null>(null);
    const [email, setEmail] = useState<string>();
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();

    function handleToggle() {
        setIsPasswordVisible(prevState => !prevState);
    }

    async function onSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        const userName = userNameRef.current?.value ?? '';
        const password = passwordRef.current?.value ?? '';
        setError(null);
        setEmail(userName.includes("@") ? userName : undefined);
        setIsSending(true);
        login({userName, password})
            .then(() => navigate('/'))
            .catch(error => setError(STATUS_ERRORS[error.response?.status] ?? "failed"))
            .finally(() => setIsSending(false));
    }

    return (
        <form onSubmit={onSubmit}>
            <Stack spacing={2}>
                {error && (
                    <Alert severity="error">
                        {ERROR_MESSAGES[error]}{" "}
                        {error === "notVerified" && (
                            <Link component={RouterLink} to="/auth/verify/sent" state={{email}}>Send a new link.</Link>
                        )}
                    </Alert>
                )}
                <TextField
                    label="Login"
                    type="text"
                    inputRef={userNameRef}
                    placeholder="Username or email"
                    required
                    fullWidth
                />
                <TextField
                    label="Password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    inputRef={passwordRef}
                    placeholder="Password"
                    required
                    fullWidth
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleToggle}>
                                        {isPasswordVisible ? <Visibility/> : <VisibilityOff/>}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Button variant="contained" color="secondary" type="submit" fullWidth size={"large"}
                        disabled={isSending}>
                    Sign in
                </Button>
                <Link component={RouterLink} to="/auth/password/forgot" underline="hover" alignSelf="flex-start">
                    Forgot password?
                </Link>
            </Stack>
        </form>
    );
}
