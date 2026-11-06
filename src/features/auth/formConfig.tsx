import type {JSX} from "react";
import type {ParseKeys} from "i18next";
import {LoginForm} from "./components/LoginForm.tsx";
import {RegisterForm} from "./components/RegisterForm.tsx";

export type FormType = "login" | "register";

export interface FormConfig {
    readonly type: FormType;
    readonly title: ParseKeys<"auth">;
    readonly subtitle: ParseKeys<"auth">;
    readonly switchPrompt: ParseKeys<"auth">;
    readonly switchLabel: ParseKeys<"auth">;
    readonly switchTo: FormType;
    readonly FormComponent: () => JSX.Element;
}

export const FORM_CONFIGS: Record<FormType, FormConfig> = {
    login: {
        type: "login",
        title: "login.title",
        subtitle: "login.subtitle",
        switchPrompt: "login.switchPrompt",
        switchLabel: "login.switchLabel",
        switchTo: "register",
        FormComponent: LoginForm,
    },
    register: {
        type: "register",
        title: "register.title",
        subtitle: "register.subtitle",
        switchPrompt: "register.switchPrompt",
        switchLabel: "register.switchLabel",
        switchTo: "login",
        FormComponent: RegisterForm,
    },
};
