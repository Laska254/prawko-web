import {useRef, useState} from "react";
import {Alert, Link, Stack} from "@mui/material";
import {login} from "@/api/auth.tsx";
import type {LoginDto} from "@/api/dto/LoginDto.tsx";
import {
    type ApiError,
    type FieldErrors,
    type FieldMessages,
    fieldErrors,
    hasFieldErrors,
    toApiError,
} from "@/api/errors.tsx";
import {Link as RouterLink, useNavigate} from "react-router";
import {FormTextField} from "@/components/form/FormTextField.tsx";
import {PasswordField} from "@/components/form/PasswordField.tsx";
import {SubmitButton} from "@/components/form/SubmitButton.tsx";

type LoginError = "invalidCredentials" | "notVerified" | "failed";

const ERROR_MESSAGES: Record<LoginError, string> = {
    invalidCredentials: "Wrong login or password.",
    notVerified: "Verify your email before signing in.",
    failed: "Couldn't sign in. Please try again later.",
};

const STATUS_ERRORS: Partial<Record<number, LoginError>> = {
    401: "invalidCredentials",
    403: "notVerified",
};

const FIELD_MESSAGES: FieldMessages<keyof LoginDto> = {
    userName: {400: "Enter a username or email of 3 to 63 characters."},
    password: {400: "Password must be 7 to 63 characters."},
};

function toLoginError(error: ApiError): LoginError {
    if (error.kind === "http") {
        return STATUS_ERRORS[error.status] ?? "failed";
    }
    return "failed";
}

export function LoginForm() {
    const userNameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<LoginError | null>(null);
    const [errors, setErrors] = useState<FieldErrors<keyof LoginDto>>({});
    const [email, setEmail] = useState<string>();
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const userName = userNameRef.current!.value;
        const password = passwordRef.current!.value;
        setError(null);
        setErrors({});
        setEmail(userName.includes("@") ? userName : undefined);
        setIsSending(true);
        login({userName, password})
            .then(() => navigate('/'))
            .catch(caught => {
                const apiError = toApiError(caught);
                const marked = fieldErrors(apiError, FIELD_MESSAGES);
                setErrors(marked);
                if (!hasFieldErrors(marked)) {
                    setError(toLoginError(apiError));
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
                        {error === "notVerified" && (
                            <Link component={RouterLink} to="/auth/verify/sent" state={{email}}>Send a new link.</Link>
                        )}
                    </Alert>
                )}
                <FormTextField
                    label="Login"
                    type="text"
                    inputRef={userNameRef}
                    errorText={errors.userName}
                    placeholder="Username or email"
                    required
                />
                <PasswordField
                    label="Password"
                    inputRef={passwordRef}
                    errorText={errors.password}
                    placeholder="Password"
                    required
                />
                <SubmitButton loading={isSending}>Sign in</SubmitButton>
                <Link component={RouterLink} to="/auth/password/forgot" underline="hover" alignSelf="flex-start">
                    Forgot password?
                </Link>
            </Stack>
        </form>
    );
}
