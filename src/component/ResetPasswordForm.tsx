import {useRef, useState} from "react";
import {Alert, Button, IconButton, InputAdornment, Link, Stack, TextField} from "@mui/material";
import {Link as RouterLink, useNavigate} from "react-router";
import {Visibility, VisibilityOff} from "@mui/icons-material";
import {resetPassword} from "../requests.tsx";

type ResetError = "mismatch" | "invalidToken" | "failed";

const ERROR_MESSAGES: Record<ResetError, string> = {
    mismatch: "Passwords don't match.",
    invalidToken: "This reset link is invalid or has expired.",
    failed: "Couldn't reset the password. Please try again later.",
};

interface ResetPasswordFormProps {
    token: string;
}

export function ResetPasswordForm({token}: ResetPasswordFormProps) {
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [error, setError] = useState<ResetError | null>(null);
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();

    function handleToggle() {
        setIsPasswordVisible(prevState => !prevState);
    }

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const newPassword = passwordRef.current?.value ?? '';
        if (newPassword !== confirmPasswordRef.current?.value) {
            setError("mismatch");
            return;
        }
        setError(null);
        setIsSending(true);
        resetPassword({token, newPassword})
            .then(() => navigate("/auth", {replace: true, state: {notice: "passwordReset"}}))
            .catch(error => setError(error.response?.status === 400 ? "invalidToken" : "failed"))
            .finally(() => setIsSending(false));
    }

    const visibilityToggle = (
        <InputAdornment position="end">
            <IconButton onClick={handleToggle}>
                {isPasswordVisible ? <Visibility/> : <VisibilityOff/>}
            </IconButton>
        </InputAdornment>
    );

    return (
        <form onSubmit={onSubmit}>
            <Stack spacing={2}>
                {error && (
                    <Alert severity="error">
                        {ERROR_MESSAGES[error]}{" "}
                        {error === "invalidToken" && (
                            <Link component={RouterLink} to="/auth/password/forgot">Request a new one.</Link>
                        )}
                    </Alert>
                )}
                <TextField
                    label="New password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    inputRef={passwordRef}
                    placeholder="At least 7 characters"
                    required
                    fullWidth
                    slotProps={{
                        input: {endAdornment: visibilityToggle},
                        htmlInput: {minLength: 7, maxLength: 63},
                    }}
                />
                <TextField
                    label="Confirm new password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    inputRef={confirmPasswordRef}
                    placeholder="Repeat new password"
                    required
                    fullWidth
                />
                <Button variant="contained" color="secondary" type="submit" fullWidth size="large"
                        disabled={isSending}>
                    Set new password
                </Button>
            </Stack>
        </form>
    );
}
