import {useState} from "react";
import {Button, Container, IconButton, InputAdornment, TextField} from "@mui/material";
import {login} from "../requests.tsx";
import './css/LoginForm.css'
import {Link} from "react-router";
import {Visibility, VisibilityOff} from "@mui/icons-material";

function LoginForm() {

    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [type, setType] = useState('password');
    const [icon, setIcon] = useState(<VisibilityOff/>);

    function handleToggle() {
        if (type === 'password') {
            setIcon(<Visibility/>);
            setType('text')
        } else {
            setIcon(<VisibilityOff/>)
            setType('password')
        }
    }

    async function onSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        login({userName, password})
            .then(console.log)
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
                        type={type}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        fullWidth
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleToggle} edge="end">
                                            {icon ? <Visibility/> : <VisibilityOff/>}
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