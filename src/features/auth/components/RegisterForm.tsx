import {useRef} from "react";
import {Alert, Stack} from "@mui/material";
import type {ParseKeys} from "i18next";
import {useTranslation} from "react-i18next";
import {register} from "@/api/users.tsx";
import type {RegisterDto} from "@/api/dto/RegisterDto.tsx";
import {EMAIL_LENGTH, NAME_LENGTH, PASSWORD_LENGTH, USERNAME_PATTERN} from "@/api/fieldRules.tsx";
import {type FieldMessages, useFormSubmission} from "@/api/useFormSubmission.tsx";
import {useNavigate} from "react-router";
import {FormTextField} from "@/components/form/FormTextField.tsx";
import {PasswordField} from "@/components/form/PasswordField.tsx";
import {SubmitButton} from "@/components/form/SubmitButton.tsx";
import {startEmailLinkCooldown} from "../emailLinkCooldown.tsx";

const FIELD_MESSAGES: FieldMessages<keyof RegisterDto, ParseKeys<"auth">> = {
    firstName: {400: "messages.firstNameLength"},
    lastName: {400: "messages.lastNameLength"},
    userName: {400: "messages.userNameInvalid", 409: "messages.userNameTaken"},
    email: {400: "messages.emailInvalid", 409: "messages.emailTaken"},
    password: {400: "messages.passwordLength"},
};

export function RegisterForm() {
    const firstNameRef = useRef<HTMLInputElement>(null);
    const lastNameRef = useRef<HTMLInputElement>(null);
    const userNameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const {submit, isSending, fieldErrors, failure} = useFormSubmission(register, {
        fieldMessages: FIELD_MESSAGES,
        onSuccess: (_id, {email}) => {
            // Registering sends the first verification link, so the server won't send another for a while.
            startEmailLinkCooldown("verification", email);
            navigate("/auth/verify/sent", {state: {email}});
        },
    });
    const {t} = useTranslation(["auth", "errors"]);

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        submit({
            firstName: firstNameRef.current!.value,
            lastName: lastNameRef.current!.value,
            userName: userNameRef.current!.value,
            email: emailRef.current!.value,
            password: passwordRef.current!.value,
        });
    }

    return (
        <form onSubmit={onSubmit}>
            <Stack spacing={2}>
                {failure && <Alert severity="error">{t(failure.message)}</Alert>}
                <FormTextField
                    label={t("fields.firstName")}
                    type="text"
                    inputRef={firstNameRef}
                    errorText={fieldErrors.firstName && t(fieldErrors.firstName)}
                    required
                    slotProps={{htmlInput: NAME_LENGTH}}
                />
                <FormTextField
                    label={t("fields.lastName")}
                    type="text"
                    inputRef={lastNameRef}
                    errorText={fieldErrors.lastName && t(fieldErrors.lastName)}
                    required
                    slotProps={{htmlInput: NAME_LENGTH}}
                />
                <FormTextField
                    label={t("fields.userName")}
                    type="text"
                    inputRef={userNameRef}
                    errorText={fieldErrors.userName && t(fieldErrors.userName)}
                    required
                    slotProps={{
                        // Browsers show the title when the pattern isn't matched, naming the @.
                        htmlInput: {...NAME_LENGTH, pattern: USERNAME_PATTERN, title: t("messages.userNameInvalid")},
                    }}
                />
                <FormTextField
                    label={t("fields.email")}
                    type="email"
                    inputRef={emailRef}
                    errorText={fieldErrors.email && t(fieldErrors.email)}
                    required
                    slotProps={{htmlInput: EMAIL_LENGTH}}
                />
                <PasswordField
                    label={t("fields.password")}
                    inputRef={passwordRef}
                    errorText={fieldErrors.password && t(fieldErrors.password)}
                    required
                    slotProps={{htmlInput: PASSWORD_LENGTH}}
                />
                <SubmitButton loading={isSending}>{t("register.submit")}</SubmitButton>
            </Stack>
        </form>
    );
}
