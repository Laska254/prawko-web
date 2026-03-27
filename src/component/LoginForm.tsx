import {useState} from "react";
import {Button, TextField} from "@mui/material";
import axios from "axios";


function LoginForm() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    async function login(e: React.FormEvent) {
        e.preventDefault()
        await axios.post("https://localhost:8080/auth/login", document.querySelector('#loginForm'), {
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    return (
        <div>
            <form id={"loginForm"} onSubmit={login}>
                <div>
                    <label htmlFor="username">
                        Username
                    </label>
                    <TextField
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                    />
                </div>
                <div>
                    <label htmlFor="password">
                        Password
                    </label>
                    <TextField
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="password"
                    />
                </div>
                <Button
                    variant="contained"
                    type="submit"
                />
            </form>
        </div>
    );

}

export default LoginForm;