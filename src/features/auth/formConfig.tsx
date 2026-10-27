import type {JSX} from "react";
import {LoginForm} from "./components/LoginForm.tsx";
import {RegisterForm} from "./components/RegisterForm.tsx";

export type FormType = "login" | "register";

export interface FormConfig {
    readonly title: string;
    readonly subtitle: string;
    readonly switchPrompt: string;
    readonly switchLabel: string;
    readonly switchTo: FormType;
    readonly FormComponent: () => JSX.Element;
}

export const FORM_CONFIGS: Record<FormType, FormConfig> = {
    login: {
        title: "Sign in",
        subtitle: "Welcome back. Sign in to continue practicing.",
        switchPrompt: "Don't have an account?",
        switchLabel: "Create one",
        switchTo: "register",
        FormComponent: LoginForm,
    },
    register: {
        title: "Create account",
        subtitle: "Start practicing for your exam in under a minute.",
        switchPrompt: "Already have an account?",
        switchLabel: "Sign in",
        switchTo: "login",
        FormComponent: RegisterForm,
    },
};
