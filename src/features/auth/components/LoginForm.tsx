import {useRef, useState} from "react";
import {Alert, Link, Stack} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {LoginDto} from "@/api/dto/LoginDto.tsx";
import {
    type ApiError,
    errorMessage,
    type FieldErrors,
    type FieldMessages,
    fieldErrors,
    hasFieldErrors,
    type StatusMessages,
    toApiError,
} from "@/api/errors.tsx";
import {Link as RouterLink, useNavigate} from "react-router";
import {FormTextField} from "@/components/form/FormTextField.tsx";
import {PasswordField} from "@/components/form/PasswordField.tsx";
import {SubmitButton} from "@/components/form/SubmitButton.tsx";
import {useSession} from "@/session/useSession.tsx";

const STATUS_MESSAGES: StatusMessages<ParseKeys<"auth">> = {
    401: "messages.wrongCredentials",
    403: "messages.notVerified",
};

const FIELD_MESSAGES: FieldMessages<keyof LoginDto, ParseKeys<"auth">> = {
    userName: {400: "messages.loginLength"},
    password: {400: "messages.passwordLength"},
};

function isNotVerified(error: ApiError): boolean {
    return error.kind === "http" && error.status === 403;
}

export function LoginForm() {
    const userNameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<ApiError | null>(null);
    const [errors, setErrors] = useState<FieldErrors<keyof LoginDto, ParseKeys<"auth">>>({});
    const [email, setEmail] = useState<string>();
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();
    const {signIn} = useSession();
    const {t} = useTranslation(["auth", "errors"]);

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const userName = userNameRef.current!.value;
        const password = passwordRef.current!.value;
        setError(null);
        setErrors({});
        setEmail(userName.includes("@") ? userName : undefined);
        setIsSending(true);
        signIn({userName, password})
            .then(() => navigate('/'))
            .catch(caught => {
                const apiError = toApiError(caught);
                const marked = fieldErrors(apiError, FIELD_MESSAGES);
                setErrors(marked);
                if (!hasFieldErrors(marked)) {
                    setError(apiError);
                }
            })
            .finally(() => setIsSending(false));
    }

    return (
        <form onSubmit={onSubmit}>
            <Stack spacing={2}>
                {error && (
                    <Alert severity="error">
                        {t(errorMessage(error, STATUS_MESSAGES))}{" "}
                        {isNotVerified(error) && (
                            <Link component={RouterLink} to="/auth/verify/sent" state={{email}}>{t("login.sendNewLink")}</Link>
                        )}
                    </Alert>
                )}
                <FormTextField
                    label={t("fields.login")}
                    type="text"
                    inputRef={userNameRef}
                    errorText={errors.userName && t(errors.userName)}
                    placeholder={t("fields.loginPlaceholder")}
                    required
                />
                <PasswordField
                    label={t("fields.password")}
                    inputRef={passwordRef}
                    errorText={errors.password && t(errors.password)}
                    placeholder={t("fields.password")}
                    required
                />
                <SubmitButton loading={isSending}>{t("login.submit")}</SubmitButton>
                <Link component={RouterLink} to="/auth/password/forgot" underline="hover" alignSelf="flex-start">
                    {t("login.forgotPassword")}
                </Link>
            </Stack>
        </form>
    );
}
