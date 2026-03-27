import {useState} from "react";
import {Button, TextField} from "@mui/material";
import {login} from "./requests.tsx";
import type {LoginDto} from "./interfaces.tsx";


function LoginForm() {

    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');

    async function onSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault()
        const dto: LoginDto = {
            userName,
            password
        }
        login(dto)
            .then(console.log);
    }

    return (
        <div>
            <form id={"loginForm"} onSubmit={onSubmit}>
                <div>
                    <label htmlFor="username">
                        Username
                    </label>
                    <TextField
                        id="username"
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
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