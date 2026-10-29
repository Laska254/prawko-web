import {useRef, useState} from "react";
import {Alert, Link, Stack} from "@mui/material";
import {Link as RouterLink, useNavigate} from "react-router";
import {resetPassword} from "@/api/auth.tsx";
import type {ResetPasswordDto} from "@/api/dto/ResetPasswordDto.tsx";
import {
    type ApiError,
    type FieldErrors,
    type FieldMessages,
    fieldErrors,
    hasFieldErrors,
    toApiError,
} from "@/api/errors.tsx";
import {PasswordField} from "@/components/form/PasswordField.tsx";
import {SubmitButton} from "@/components/form/SubmitButton.tsx";

type ResetError = "invalidToken" | "failed";

const ERROR_MESSAGES: Record<ResetError, string> = {
    invalidToken: "This reset link is invalid or has expired.",
    failed: "Couldn't reset the password. Please try again later.",
};

const MISMATCH_MESSAGE = "Passwords don't match.";

// The token comes from the link, so only the new password can be marked.
type ResetField = Exclude<keyof ResetPasswordDto, "token">;

const FIELD_MESSAGES: FieldMessages<ResetField> = {
    newPassword: {400: "Password must be 7 to 63 characters."},
};

// A `400` that marks no field of the form is about the token: unknown, expired or blank.
function toResetError(error: ApiError): ResetError {
    if ((error.kind === "http" || error.kind === "validation") && error.status === 400) {
        return "invalidToken";
    }
    return "failed";
}

interface ResetPasswordFormProps {
    token: string;
}

export function ResetPasswordForm({token}: ResetPasswordFormProps) {
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);
    const [confirmError, setConfirmError] = useState<string>();
    const [error, setError] = useState<ResetError | null>(null);
    const [errors, setErrors] = useState<FieldErrors<ResetField>>({});
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const newPassword = passwordRef.current!.value;
        setError(null);
        setErrors({});
        if (newPassword !== confirmPasswordRef.current!.value) {
            setConfirmError(MISMATCH_MESSAGE);
            return;
        }
        setConfirmError(undefined);
        setIsSending(true);
        resetPassword({token, newPassword})
            .then(() => navigate("/auth", {replace: true, state: {notice: "passwordReset"}}))
            .catch(error => {
                const apiError = toApiError(error);
                const errors = fieldErrors(apiError, FIELD_MESSAGES);
                setErrors(errors);
                if (!hasFieldErrors(errors)) {
                    setError(toResetError(apiError));
                }
            })
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
                    errorText={errors.newPassword}
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
