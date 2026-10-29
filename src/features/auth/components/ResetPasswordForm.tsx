import {useRef, useState} from "react";
import {Alert, Link, Stack} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {Link as RouterLink, useNavigate} from "react-router";
import {resetPassword} from "@/api/auth.tsx";
import type {ResetPasswordDto} from "@/api/dto/ResetPasswordDto.tsx";
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
import {PasswordField} from "@/components/form/PasswordField.tsx";
import {SubmitButton} from "@/components/form/SubmitButton.tsx";
import {isInvalidToken} from "../tokenErrors.tsx";

const STATUS_MESSAGES: StatusMessages<ParseKeys<"auth">> = {
    400: "errors.resetLinkInvalid",
};

const MISMATCH_MESSAGE: ParseKeys<"auth"> = "errors.passwordMismatch";

// The token comes from the link, so only the new password can be marked.
type ResetField = Exclude<keyof ResetPasswordDto, "token">;

const FIELD_MESSAGES: FieldMessages<ResetField, ParseKeys<"auth">> = {
    newPassword: {400: "errors.passwordLength"},
};

interface ResetPasswordFormProps {
    token: string;
}

export function ResetPasswordForm({token}: ResetPasswordFormProps) {
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);
    const [confirmError, setConfirmError] = useState<ParseKeys<"auth">>();
    const [error, setError] = useState<ApiError | null>(null);
    const [errors, setErrors] = useState<FieldErrors<ResetField, ParseKeys<"auth">>>({});
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();
    const {t} = useTranslation(["auth", "errors"]);

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
                        {isInvalidToken(error) && (
                            <Link component={RouterLink} to="/auth/password/forgot">{t("resetPassword.requestNewOne")}</Link>
                        )}
                    </Alert>
                )}
                <PasswordField
                    label={t("fields.newPassword")}
                    inputRef={passwordRef}
                    errorText={errors.newPassword && t(errors.newPassword)}
                    placeholder={t("fields.newPasswordPlaceholder")}
                    required
                    slotProps={{htmlInput: {minLength: 7, maxLength: 63}}}
                />
                <PasswordField
                    label={t("fields.confirmPassword")}
                    inputRef={confirmPasswordRef}
                    placeholder={t("fields.confirmPasswordPlaceholder")}
                    required
                    errorText={confirmError && t(confirmError)}
                />
                <SubmitButton loading={isSending}>{t("resetPassword.submit")}</SubmitButton>
            </Stack>
        </form>
    );
}
