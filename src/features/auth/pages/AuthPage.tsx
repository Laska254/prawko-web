import {useState} from "react";
import {useLocation} from "react-router";
import {FORM_CONFIGS, type FormType} from "../formConfig.tsx";
import {AuthForm, type AuthNotice} from "../components/AuthForm.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";

type AuthNoticeType = "verified" | "passwordReset" | "sessionExpired";

const NOTICES: Record<AuthNoticeType, AuthNotice> = {
    verified: {message: "notices.verified", severity: "success"},
    passwordReset: {message: "notices.passwordReset", severity: "success"},
    sessionExpired: {message: "notices.sessionExpired", severity: "info"},
};

export function AuthPage() {
    const [active, setActive] = useState<FormType>("login");
    const stateNotice: AuthNoticeType | undefined = useLocation().state?.notice;
    const notice = stateNotice && active === "login" ? NOTICES[stateNotice] : undefined;

    return (
        <AuthPageLayout>
            <AuthForm form={FORM_CONFIGS[active]} setActive={setActive} notice={notice}/>
        </AuthPageLayout>
    );
}
