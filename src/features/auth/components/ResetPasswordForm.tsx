import {useRef, useState} from "react";
import {Alert, Link, Stack} from "@mui/material";
import {Link as RouterLink, useNavigate} from "react-router";
import {resetPassword} from "@/api/requests.tsx";
import {PasswordField} from "@/components/form/PasswordField.tsx";
import {SubmitButton} from "@/components/form/SubmitButton.tsx";

type ResetError = "invalidToken" | "failed";

const ERROR_MESSAGES: Record<ResetError, string> = {
    invalidToken: "This reset link is invalid or has expired.",
    failed: "Couldn't reset the password. Please try again later.",
};

interface ResetPasswordFormProps {
    token: string;
}

export function ResetPasswordForm({token}: ResetPasswordFormProps) {
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);
    const [confirmError, setConfirmError] = useState<string>();
    const [error, setError] = useState<ResetError | null>(null);
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const newPassword = passwordRef.current!.value;
        if (newPassword !== confirmPasswordRef.current!.value) {
            setConfirmError("Passwords don't match.");
            return;
        }
        setConfirmError(undefined);
        setError(null);
        setIsSending(true);
        resetPassword({token, newPassword})
            .then(() => navigate("/auth", {replace: true, state: {notice: "passwordReset"}}))
            .catch(error => setError(error.response?.status === 400 && !error.response.data?.details
                ? "invalidToken"
                : "failed"))
            .finally(() => setIsSending(false));
    }

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
                <PasswordField
                    label="New password"
                    inputRef={passwordRef}
                    placeholder="At least 7 characters"
                    required
                    slotProps={{htmlInput: {minLength: 7, maxLength: 63}}}
                />
                <PasswordField
                    label="Confirm new password"
                    inputRef={confirmPasswordRef}
                    placeholder="Repeat new password"
                    required
                    errorText={confirmError}
                />
                <SubmitButton loading={isSending}>Set new password</SubmitButton>
            </Stack>
        </form>
    );
}
