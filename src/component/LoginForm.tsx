import {useState} from "react";
import {Button, Container, IconButton, InputAdornment, Stack, TextField} from "@mui/material";
import {login} from "../requests.tsx";
import {Link, useNavigate} from "react-router";
import {Visibility, VisibilityOff} from "@mui/icons-material";

export default function LoginForm() {

    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigate = useNavigate();

    function handleToggle() {
        setIsPasswordVisible(prevState => !prevState);
    }

    async function onSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        login({userName, password})
            .then(() => navigate('/'))
            .catch(console.error);
    }

    return (
        <Container fixed>
            <form onSubmit={onSubmit}>
                <Stack spacing={2}>
                    <TextField
                        label={"Login"}
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Username or email"
                        fullWidth
                    />
                    <TextField
                        label="Password"
                        type={isPasswordVisible ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                    <Button variant="contained" type="submit" fullWidth size={"large"}>
                        Submit
                    </Button>
                    <Link to={"/changePassword"}>Forgot password?</Link>
                </Stack>
            </form>
        </Container>
    );
}
