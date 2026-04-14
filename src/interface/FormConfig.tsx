import type {JSX} from "react";
import LoginForm from "../component/LoginForm.tsx";
import RegisterForm from "../component/RegisterForm.tsx";

export type FormType = "login" | "register";

export interface FormConfig {
    readonly title: string;
    readonly peekLabel: string;
    readonly switchTo: FormType;
    readonly ariaLabel: string;
    readonly FormComponent: () => JSX.Element;
}

export function getFormConfig(active: FormType): FormConfig {
    return active === "login"
        ? {
            title: "Sign in",
            peekLabel: "Create an account",
            switchTo: "register",
            ariaLabel: "Switch to Register",
            FormComponent: LoginForm,
        }
        : {
            title: "Create account",
            peekLabel: "Sign in",
            switchTo: "login",
            ariaLabel: "Switch to Sign In",
            FormComponent: RegisterForm,
        };
}