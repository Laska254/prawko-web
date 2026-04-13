import type {AuthFormProps} from "../interface/AuthFormProps.tsx";
import {getFormConfig} from "../interface/FormConfig.tsx";

export function AuthForm({active, setActive}: AuthFormProps) {
    const form = getFormConfig(active);

    return (
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
    );

}