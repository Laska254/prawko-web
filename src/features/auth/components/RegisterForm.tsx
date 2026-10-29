import {useRef, useState} from "react";
import {Alert, Stack} from "@mui/material";
import {register} from "@/api/users.tsx";
import type {RegisterDto} from "@/api/dto/RegisterDto.tsx";
import {type FieldMessages, fieldErrors, toApiError} from "@/api/errors.tsx";
import {useNavigate} from "react-router";
import {FormTextField} from "@/components/form/FormTextField.tsx";
import {PasswordField} from "@/components/form/PasswordField.tsx";
import {SubmitButton} from "@/components/form/SubmitButton.tsx";

const NAME_LENGTH = {minLength: 3, maxLength: 31};

const FIELD_MESSAGES: FieldMessages<keyof RegisterDto> = {
    firstName: {400: "First name must be 3 to 31 characters."},
    lastName: {400: "Last name must be 3 to 31 characters."},
    userName: {400: "Username must be 3 to 31 characters, without @.", 409: "This username is taken."},
    email: {400: "Enter a valid email address.", 409: "An account with this email already exists."},
    password: {400: "Password must be 7 to 63 characters."},
};

export function RegisterForm() {
    const firstNameRef = useRef<HTMLInputElement>(null);
    const lastNameRef = useRef<HTMLInputElement>(null);
    const userNameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof RegisterDto, string>>>({});
    const [failed, setFailed] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const email = emailRef.current!.value;
        setErrors({});
        setFailed(false);
        setIsSending(true);
        register({
            firstName: firstNameRef.current!.value,
            lastName: lastNameRef.current!.value,
            userName: userNameRef.current!.value,
            email,
            password: passwordRef.current!.value,
        })
            .then(() => navigate('/auth/verify/sent', {state: {email}}))
            .catch(error => {
                const errors = fieldErrors(toApiError(error), FIELD_MESSAGES);
                setErrors(errors);
                setFailed(Object.keys(errors).length === 0);
            })
            .finally(() => setIsSending(false));
    }

    return (
        <form onSubmit={onSubmit}>
            <Stack spacing={2}>
                {failed && <Alert severity="error">Couldn't create the account. Please try again later.</Alert>}
                <FormTextField
                    label="First name"
                    type="text"
                    inputRef={firstNameRef}
                    errorText={errors.firstName}
                    required
                    slotProps={{htmlInput: NAME_LENGTH}}
                />
                <FormTextField
                    label="Last name"
                    type="text"
                    inputRef={lastNameRef}
                    errorText={errors.lastName}
                    required
                    slotProps={{htmlInput: NAME_LENGTH}}
                />
                <FormTextField
                    label="Username"
                    type="text"
                    inputRef={userNameRef}
                    errorText={errors.userName}
                    required
                    slotProps={{htmlInput: NAME_LENGTH}}
                />
                <FormTextField
                    label="Email"
                    type="email"
                    inputRef={emailRef}
                    errorText={errors.email}
                    required
                    slotProps={{htmlInput: {minLength: 5, maxLength: 63}}}
                />
                <PasswordField
                    label="Password"
                    inputRef={passwordRef}
                    errorText={errors.password}
                    required
                    slotProps={{htmlInput: {minLength: 7, maxLength: 63}}}
                />
                <SubmitButton loading={isSending}>Register</SubmitButton>
            </Stack>
        </form>
    );
}
