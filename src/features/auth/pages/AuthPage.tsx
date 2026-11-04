import {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router";
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
    const location = useLocation();
    const navigate = useNavigate();
    const [notice, setNotice] = useState<AuthNoticeType | undefined>(location.state?.notice);

    // The browser keeps the navigation state for reloads and back navigation, so the notice is read once (above) and
    // cleared from it.
    useEffect(() => {
        if (location.state?.notice) {
            navigate(".", {replace: true, state: null});
        }
    }, [location.state, navigate]);

    // The notice is about signing in, so it goes away for good once the user switches to another form.
    function switchForm(form: FormType) {
        setNotice(undefined);
        setActive(form);
    }

    return (
        <AuthPageLayout>
            <AuthForm form={FORM_CONFIGS[active]} setActive={switchForm} notice={notice && NOTICES[notice]}/>
        </AuthPageLayout>
    );
}
