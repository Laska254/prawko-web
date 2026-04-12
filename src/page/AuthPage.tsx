import {useState} from "react";
import {Stack} from "@mui/material";
import "./css/AuthPage.scss";
import {type FormType, getFormConfig} from "../interface/FormConfig";

export function AuthPage() {
    const [active, setActive] = useState<FormType>("login");
    const form = getFormConfig(active);

    return (
        <Stack minHeight="100vh" alignItems="center" justifyContent="center">
            <div className="auth-stack">
                <div className="auth-card auth-card--front">
                    <h2 className="auth-form-title">{form.title}</h2>
                    <div className="auth-form-body">
                        <form.FormComponent/>
                    </div>
                </div>
                <div
                    className="auth-card auth-card--back"
                    onClick={() => setActive(form.switchTo)}
                    role="button"
                    aria-label={form.ariaLabel}
                >
                    <span className="auth-card__peek-label">{form.peekLabel}</span>
                </div>
            </div>
        </Stack>
    );
}