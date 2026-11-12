import {useRef, useState} from "react";
import {Alert, Link, Stack} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {Link as RouterLink, useNavigate} from "react-router";
import {resetPassword} from "@/api/auth.tsx";
import type {ResetPasswordDto} from "@/api/dto/ResetPasswordDto.tsx";
import type {StatusMessages} from "@/api/errors.tsx";
import {type FieldMessages, useFormSubmission} from "@/api/useFormSubmission.tsx";
import {PasswordField} from "@/components/form/PasswordField.tsx";
import {SubmitButton} from "@/components/form/SubmitButton.tsx";
import {useSession} from "@/session/useSession.tsx";
import {isInvalidToken} from "../tokenErrors.tsx";
import {authNoticeState} from "../authNotice.tsx";
import {PASSWORD_LENGTH} from "../fieldLengths.tsx";

const STATUS_MESSAGES: StatusMessages<ParseKeys<"auth">> = {
    400: "messages.resetLinkInvalid",
};

const MISMATCH_MESSAGE: ParseKeys<"auth"> = "messages.passwordMismatch";

// The token comes from the link, so only the new password can be marked.
type ResetField = Exclude<keyof ResetPasswordDto, "token">;

const FIELD_MESSAGES: FieldMessages<ResetField, ParseKeys<"auth">> = {
    newPassword: {400: "messages.passwordLength"},
};

interface ResetPasswordFormProps {
    token: string;
}

export function ResetPasswordForm({token}: ResetPasswordFormProps) {
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);
    const [confirmError, setConfirmError] = useState<ParseKeys<"auth">>();
    const {clearSession} = useSession();
    const navigate = useNavigate();
    const {submit, isSending, fieldErrors, failure, clear} = useFormSubmission(resetPassword, {
        fieldMessages: FIELD_MESSAGES,
        statusMessages: STATUS_MESSAGES,
        onSuccess: () => {
            // The server ended every session of the link's account, most likely the one signed in here, so the local session goes either way.
            clearSession();
            navigate("/auth", {replace: true, state: authNoticeState("passwordReset")});
        },
    });
    const {t} = useTranslation(["auth", "errors"]);

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const newPassword = passwordRef.current!.value;
        if (newPassword !== confirmPasswordRef.current!.value) {
            // The server's errors were about the passwords sent before, not these.
            clear();
            setConfirmError(MISMATCH_MESSAGE);
            return;
        }
        setConfirmError(undefined);
        submit({token, newPassword});
    }

    return (
        <form onSubmit={onSubmit}>
            <Stack spacing={2}>
                {failure && (
                    <Alert severity="error">
                        {t(failure.message)}{" "}
                        {isInvalidToken(failure.error) && (
                            <Link component={RouterLink} to="/auth/password/forgot">{t("resetPassword.requestNewOne")}</Link>
                        )}
                    </Alert>
                )}
                <PasswordField
                    label={t("fields.newPassword")}
                    inputRef={passwordRef}
                    errorText={fieldErrors.newPassword && t(fieldErrors.newPassword)}
                    placeholder={t("fields.newPasswordPlaceholder")}
                    required
                    slotProps={{htmlInput: PASSWORD_LENGTH}}
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
