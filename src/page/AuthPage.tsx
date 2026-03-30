import {useState} from "react";
import LoginForm from "../component/LoginForm.tsx";
import './css/AuthPage.css';
import {RegisterForm} from "../component/RegisterForm.tsx";

type FormType = 'login' | 'register';

export function AuthPage() {
    const [active, setActive] = useState<FormType>('login');

    return (
        <div className="auth-page">
            <div className="auth-stack">
                {/*ACTIVE CARD*/}
                <div className="auth-card auth-card--front">
                    <h2 className="auth-form-title">
                        {active === 'login' ? 'Sign in' : 'Create account'}
                    </h2>
                    <div className="auth-form-body">
                        {active === 'login' ? <LoginForm/> : <RegisterForm/>}
                    </div>
                </div>
                {/*INACTIVE CARD*/}
                <div className="auth-card auth-card--back"
                     onClick={() => setActive(active === 'login' ? 'register' : 'login')}
                     role="button"
                     aria-label={`Switch to ${active === 'login' ? 'Register' : 'Sign In'}`}>
                    <span className="auth-card__peek-label">
                        {active === 'login' ? 'Create an account' : 'Sign in'}
                    </span>
                </div>
            </div>
        </div>
    );

}