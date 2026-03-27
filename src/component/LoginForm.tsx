import {useState} from "react";
import {Button, TextField} from "@mui/material";

function LoginForm() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    function handleSubmit() {
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
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