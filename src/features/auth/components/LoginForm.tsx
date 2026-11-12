import {useRef, useState} from "react";
import {Alert, Link, Stack} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import type {LoginDto} from "@/api/dto/LoginDto.tsx";
import type {ApiError, StatusMessages} from "@/api/errors.tsx";
import {type FieldMessages, useFormSubmission} from "@/api/useFormSubmission.tsx";
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
    const [email, setEmail] = useState<string>();
    const navigate = useNavigate();
    const {signIn} = useSession();
    const {submit, isSending, fieldErrors, failure} = useFormSubmission(signIn, {
        fieldMessages: FIELD_MESSAGES,
        statusMessages: STATUS_MESSAGES,
        onSuccess: () => navigate("/"),
    });
    const {t} = useTranslation(["auth", "errors"]);

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const userName = userNameRef.current!.value;
        setEmail(userName.includes("@") ? userName : undefined);
        submit({userName, password: passwordRef.current!.value});
    }

    return (
        <form onSubmit={onSubmit}>
            <Stack spacing={2}>
                {failure && (
                    <Alert severity="error">
                        {t(failure.message)}{" "}
                        {isNotVerified(failure.error) && (
                            <Link component={RouterLink} to="/auth/verify/sent" state={{email}}>{t("login.sendNewLink")}</Link>
                        )}
                    </Alert>
                )}
                <FormTextField
                    label={t("fields.login")}
                    type="text"
                    inputRef={userNameRef}
                    errorText={fieldErrors.userName && t(fieldErrors.userName)}
                    placeholder={t("fields.loginPlaceholder")}
                    required
                />
                <PasswordField
                    label={t("fields.password")}
                    inputRef={passwordRef}
                    errorText={fieldErrors.password && t(fieldErrors.password)}
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
