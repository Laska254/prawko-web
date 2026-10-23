import {useRef, useState} from "react";
import {Button, IconButton, InputAdornment, Link, Stack, TextField} from "@mui/material";
import {login} from "../requests.tsx";
import {Link as RouterLink, useNavigate} from "react-router";
import {Visibility, VisibilityOff} from "@mui/icons-material";

export default function LoginForm() {
    const userNameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigate = useNavigate();

    function handleToggle() {
        setIsPasswordVisible(prevState => !prevState);
    }

    async function onSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        const userName = userNameRef.current?.value ?? '';
        const password = passwordRef.current?.value ?? '';
        login({userName, password})
            .then(() => navigate('/'))
            .catch(console.error);
    }

    return (
        <form onSubmit={onSubmit}>
            <Stack spacing={2}>
                <TextField
                    label="Login"
                    type="text"
                    inputRef={userNameRef}
                    placeholder="Username or email"
                    fullWidth
                />
                <TextField
                    label="Password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    inputRef={passwordRef}
                    placeholder="Password"
                    fullWidth
                    slotProps={{
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
                    Sign in
                </Button>
                <Link component={RouterLink} to="/change-password" underline="hover" alignSelf="flex-start">
                    Forgot password?
                </Link>
            </Stack>
        </form>
    );
}
