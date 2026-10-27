import {useState} from "react";
import {useLocation} from "react-router";
import {FORM_CONFIGS, type FormType} from "../formConfig.tsx";
import {AuthForm} from "../components/AuthForm.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";

type AuthNotice = "verified" | "passwordReset";

const NOTICES: Record<AuthNotice, string> = {
    verified: "Your email is verified. You can sign in now.",
    passwordReset: "Your password has been changed. You can sign in now.",
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
