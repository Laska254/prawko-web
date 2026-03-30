import {useState} from "react";
import {Button, Container, IconButton, InputAdornment, TextField} from "@mui/material";
import {login} from "../requests.tsx";
import './css/LoginForm.css'
import {Link, useNavigate} from "react-router";
import {Visibility, VisibilityOff} from "@mui/icons-material";

function LoginForm() {

    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigate = useNavigate();

    function handleToggle() {
        setIsPasswordVisible(prevState => !prevState);
    }

    async function onSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        login({userName, password})
            .then(() => navigate('/'))  // ← redirect on success
            .catch(console.error)
    }

    return (
        <Container fixed={true}>
            <form id={"loginForm"} onSubmit={onSubmit}>
                <div>
                    <TextField
                        label={"Login"}
                        id="login"
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Username or email"
                        fullWidth
                    />
                </div>
                <div>
                    <TextField
                        label={"Password"}
                        id="password"
                        type={isPasswordVisible ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        fullWidth
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleToggle} edge="end">
                                            {isPasswordVisible ? <Visibility/> : <VisibilityOff/>}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </div>
                <Button variant="contained" type="submit" fullWidth size={"large"}>
                    Submit
                </Button>
                <Link to={"/changePassword"}>Forgot password?</Link>
            </form>
        </Container>
    );

}

export default LoginForm;