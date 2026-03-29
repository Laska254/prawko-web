import {useState} from "react";
import {Button, TextField} from "@mui/material";
import {login} from "./requests.tsx";
import './css/LoginForm.css'

function LoginForm() {

    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');

    async function onSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        login({userName, password})
            .then(console.log)
    }

    return (
        <div>
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
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        fullWidth
                    />
                </div>
                <Button variant="contained" type="submit" fullWidth size={"large"}>
                    Submit
                </Button>
            </form>
        </div>
    );

}

export default LoginForm;