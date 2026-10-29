import {useState} from "react";
import type {ParseKeys} from "i18next";
import {useLocation} from "react-router";
import {FORM_CONFIGS, type FormType} from "../formConfig.tsx";
import {AuthForm} from "../components/AuthForm.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";

type AuthNotice = "verified" | "passwordReset";

const NOTICES: Record<AuthNotice, ParseKeys<"auth">> = {
    verified: "notices.verified",
    passwordReset: "notices.passwordReset",
};

export function AuthPage() {
    const [active, setActive] = useState<FormType>("login");
    const stateNotice: AuthNotice | undefined = useLocation().state?.notice;
    const notice = stateNotice && active === "login" ? NOTICES[stateNotice] : undefined;

    return (
        <AuthPageLayout>
            <AuthForm form={FORM_CONFIGS[active]} setActive={setActive} notice={notice}/>
        </AuthPageLayout>
    );
}
