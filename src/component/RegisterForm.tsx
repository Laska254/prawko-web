import {useRef, useState} from "react";
import {Alert, Button, IconButton, InputAdornment, Stack, TextField} from "@mui/material";
import {register} from "../requests.tsx";
import {useNavigate} from "react-router";
import {Visibility, VisibilityOff} from "@mui/icons-material";

export default function RegisterForm() {
    const firstNameRef = useRef<HTMLInputElement>(null);
    const lastNameRef = useRef<HTMLInputElement>(null);
    const userNameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const navigate = useNavigate();

    function handleToggle() {
        setIsPasswordVisible(prevState => !prevState);
    }

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const email = emailRef.current?.value ?? '';
        setErrors([]);
        register({
            firstName: firstNameRef.current?.value ?? '',
            lastName: lastNameRef.current?.value ?? '',
            userName: userNameRef.current?.value ?? '',
            email,
            password: passwordRef.current?.value ?? '',
        })
            .then(() => navigate('/auth/verify/sent', {state: {email}}))
            .catch(error => setErrors(error.response?.data?.details
                ? Object.values(error.response.data.details)
                : ["Couldn't create the account. Please try again later."]));
    }

    return (
        <form onSubmit={onSubmit}>
            <Stack spacing={2}>
                {errors.length > 0 && (
                    <Alert severity="error">
                        {errors.map(error => <div key={error}>{error}</div>)}
                    </Alert>
                )}
                <TextField
                    label="First name"
                    type="text"
                    inputRef={firstNameRef}
                    required
                    fullWidth
                    slotProps={{htmlInput: {minLength: 3, maxLength: 31}}}
                />
                <TextField
                    label="Last name"
                    type="text"
                    inputRef={lastNameRef}
                    required
                    fullWidth
                    slotProps={{htmlInput: {minLength: 3, maxLength: 31}}}
                />
                <TextField
                    label="Username"
                    type="text"
                    inputRef={userNameRef}
                    required
                    fullWidth
                    slotProps={{htmlInput: {minLength: 3, maxLength: 31}}}
                />
                <TextField
                    label="Email"
                    type="email"
                    inputRef={emailRef}
                    required
                    fullWidth
                    slotProps={{htmlInput: {minLength: 5, maxLength: 63}}}
                />
                <TextField
                    label="Password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    inputRef={passwordRef}
                    required
                    fullWidth
                    slotProps={{
                        htmlInput: {minLength: 7, maxLength: 63},
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleToggle}>
                                        {isPasswordVisible ? <Visibility/> : <VisibilityOff/>}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Button variant="contained" color="secondary" type="submit" fullWidth size={"large"}>
                    Register
                </Button>
            </Stack>
        </form>
    );
}
