import {useState} from "react";
import {Stack} from "@mui/material";
import "./css/AuthPage.scss";
import {type FormType} from "../interface/FormConfig";
import {AuthForm} from "../component/AuthForm.tsx";

export function AuthPage() {
    const [active, setActive] = useState<FormType>("login");

    return (
        <Stack minHeight="100vh" alignItems="center" justifyContent="center">
            <AuthForm active={active} setActive={setActive}/>
        </Stack>
    );
}