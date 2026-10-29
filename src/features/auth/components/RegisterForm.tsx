import {useRef, useState} from "react";
import {Alert, Stack} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {register} from "@/api/users.tsx";
import type {RegisterDto} from "@/api/dto/RegisterDto.tsx";
import {
    type ApiError,
    errorMessage,
    type FieldErrors,
    type FieldMessages,
    fieldErrors,
    hasFieldErrors,
    toApiError,
} from "@/api/errors.tsx";
import {useNavigate} from "react-router";
import {FormTextField} from "@/components/form/FormTextField.tsx";
import {PasswordField} from "@/components/form/PasswordField.tsx";
import {SubmitButton} from "@/components/form/SubmitButton.tsx";

const NAME_LENGTH = {minLength: 3, maxLength: 31};

const FIELD_MESSAGES: FieldMessages<keyof RegisterDto, ParseKeys<"auth">> = {
    firstName: {400: "errors.firstNameLength"},
    lastName: {400: "errors.lastNameLength"},
    userName: {400: "errors.userNameInvalid", 409: "errors.userNameTaken"},
    email: {400: "errors.emailInvalid", 409: "errors.emailTaken"},
    password: {400: "errors.passwordLength"},
};

export function RegisterForm() {
    const firstNameRef = useRef<HTMLInputElement>(null);
    const lastNameRef = useRef<HTMLInputElement>(null);
    const userNameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [errors, setErrors] = useState<FieldErrors<keyof RegisterDto, ParseKeys<"auth">>>({});
    const [error, setError] = useState<ApiError | null>(null);
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();
    const {t} = useTranslation(["auth", "errors"]);

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const email = emailRef.current!.value;
        setErrors({});
        setError(null);
        setIsSending(true);
        register({
            firstName: firstNameRef.current!.value,
            lastName: lastNameRef.current!.value,
            userName: userNameRef.current!.value,
            email,
            password: passwordRef.current!.value,
        })
            .then(() => navigate('/auth/verify/sent', {state: {email}}))
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
                {error && <Alert severity="error">{t(errorMessage(error))}</Alert>}
                <FormTextField
                    label={t("fields.firstName")}
                    type="text"
                    inputRef={firstNameRef}
                    errorText={errors.firstName && t(errors.firstName)}
                    required
                    slotProps={{htmlInput: NAME_LENGTH}}
                />
                <FormTextField
                    label={t("fields.lastName")}
                    type="text"
                    inputRef={lastNameRef}
                    errorText={errors.lastName && t(errors.lastName)}
                    required
                    slotProps={{htmlInput: NAME_LENGTH}}
                />
                <FormTextField
                    label={t("fields.userName")}
                    type="text"
                    inputRef={userNameRef}
                    errorText={errors.userName && t(errors.userName)}
                    required
                    slotProps={{htmlInput: NAME_LENGTH}}
                />
                <FormTextField
                    label={t("fields.email")}
                    type="email"
                    inputRef={emailRef}
                    errorText={errors.email && t(errors.email)}
                    required
                    slotProps={{htmlInput: {minLength: 5, maxLength: 63}}}
                />
                <PasswordField
                    label={t("fields.password")}
                    inputRef={passwordRef}
                    errorText={errors.password && t(errors.password)}
                    required
                    slotProps={{htmlInput: {minLength: 7, maxLength: 63}}}
                />
                <SubmitButton loading={isSending}>{t("register.submit")}</SubmitButton>
            </Stack>
        </form>
    );
}
