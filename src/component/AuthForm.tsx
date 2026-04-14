import {type FormConfig, type FormType} from "../interface/FormConfig.tsx";

interface AuthFormProps {
    form: FormConfig;
    setActive: (active: FormType) => void;
}

export function AuthForm({form, setActive}: AuthFormProps) {
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