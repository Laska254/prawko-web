import {useRef, useState} from "react";
import {Alert, Stack} from "@mui/material";
import {register} from "@/api/requests.tsx";
import {useNavigate} from "react-router";
import {FormTextField} from "@/components/form/FormTextField.tsx";
import {PasswordField} from "@/components/form/PasswordField.tsx";
import {SubmitButton} from "@/components/form/SubmitButton.tsx";

const NAME_LENGTH = {minLength: 3, maxLength: 31};

export function RegisterForm() {
    const firstNameRef = useRef<HTMLInputElement>(null);
    const lastNameRef = useRef<HTMLInputElement>(null);
    const userNameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const email = emailRef.current!.value;
        setErrors([]);
        setIsSending(true);
        register({
            firstName: firstNameRef.current!.value,
            lastName: lastNameRef.current!.value,
            userName: userNameRef.current!.value,
            email,
            password: passwordRef.current!.value,
        })
            .then(() => navigate('/auth/verify/sent', {state: {email}}))
            .catch(error => setErrors(error.response?.data?.details
                ? Object.values(error.response.data.details)
                : ["Couldn't create the account. Please try again later."]))
            .finally(() => setIsSending(false));
    }

    return (
        <form onSubmit={onSubmit}>
            <Stack spacing={2}>
                {errors.length > 0 && (
                    <Alert severity="error">
                        {errors.map(error => <div key={error}>{error}</div>)}
                    </Alert>
                )}
                <FormTextField
                    label="First name"
                    type="text"
                    inputRef={firstNameRef}
                    required
                    slotProps={{htmlInput: NAME_LENGTH}}
                />
                <FormTextField
                    label="Last name"
                    type="text"
                    inputRef={lastNameRef}
                    required
                    slotProps={{htmlInput: NAME_LENGTH}}
                />
                <FormTextField
                    label="Username"
                    type="text"
                    inputRef={userNameRef}
                    required
                    slotProps={{htmlInput: NAME_LENGTH}}
                />
                <FormTextField
                    label="Email"
                    type="email"
                    inputRef={emailRef}
                    required
                    slotProps={{htmlInput: {minLength: 5, maxLength: 63}}}
                />
                <PasswordField
                    label="Password"
                    inputRef={passwordRef}
                    required
                    slotProps={{htmlInput: {minLength: 7, maxLength: 63}}}
                />
                <SubmitButton loading={isSending}>Register</SubmitButton>
            </Stack>
        </form>
    );
}
