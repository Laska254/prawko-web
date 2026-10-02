import {useRef, useState} from "react";
import {Button, Container, IconButton, InputAdornment, Stack, TextField} from "@mui/material";
import {login, register} from "../requests.tsx";
import {useNavigate} from "react-router";
import {Visibility, VisibilityOff} from "@mui/icons-material";

export default function RegisterForm() {
    const firstNameRef = useRef<HTMLInputElement>(null);
    const lastNameRef = useRef<HTMLInputElement>(null);
    const userNameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigate = useNavigate();

    function handleToggle() {
        setIsPasswordVisible(prevState => !prevState);
    }

    function onSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const userName = userNameRef.current?.value ?? '';
        const password = passwordRef.current?.value ?? '';
        register({
            firstName: firstNameRef.current?.value ?? '',
            lastName: lastNameRef.current?.value ?? '',
            userName,
            email: emailRef.current?.value ?? '',
            password,
        })
            .then(() => login({userName, password}))
            .then(() => navigate('/'))
            .catch(console.error);
    }

    return (
        <Container fixed>
            <form onSubmit={onSubmit}>
                <Stack spacing={2}>
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
                    <Button variant="contained" type="submit" fullWidth size={"large"}>
                        Register
                    </Button>
                </Stack>
            </form>
        </Container>
    );
}
