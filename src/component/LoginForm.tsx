import {useState} from "react";
import {Button, TextField} from "@mui/material";
import axios from "axios";

interface LoginDto {
    email: string;
    password: string;
}

function LoginForm() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    function login() {
        const dto: LoginDto = {
            email,
            password
        }
        axios.post("https://localhost:8080/auth/login", dto, {headers: {"Content-Type": "application/json"}});
    }

    return (
        <div>
            <form onSubmit={login}>
                <div>
                    <label htmlFor="email">
                        Email
                    </label>
                    <TextField
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
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