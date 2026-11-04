import {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router";
import {useSession} from "@/session/useSession.tsx";
import {FORM_CONFIGS, type FormType} from "../formConfig.tsx";
import type {AuthNoticeType} from "../authNotice.tsx";
import {AuthForm, type AuthNotice} from "../components/AuthForm.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";

const NOTICES: Record<AuthNoticeType, AuthNotice> = {
    verified: {message: "notices.verified", severity: "success"},
    passwordReset: {message: "notices.passwordReset", severity: "success"},
    sessionExpired: {message: "notices.sessionExpired", severity: "info"},
};

export function AuthPage() {
    const [active, setActive] = useState<FormType>("login");
    const location = useLocation();
    const navigate = useNavigate();
    const [noticeType, setNoticeType] = useState<AuthNoticeType | undefined>(location.state?.notice);
    const {clearExpired} = useSession();
    const isExpiredNotice = noticeType === "sessionExpired";

    // The browser keeps the navigation state for reloads and back navigation, so the notice is read once (above) and
    // cleared from it.
    useEffect(() => {
        if (location.state?.notice) {
            navigate(".", {replace: true, state: null});
        }
    }, [location.state, navigate]);

    // The user is told their session expired, so going back to a signed-in page doesn't redirect with the notice again.
    // Not in `RequireAuth`: its redirect runs in a transition, so clearing there would change it before it applies.
    useEffect(() => {
        if (isExpiredNotice) {
            clearExpired();
        }
    }, [isExpiredNotice, clearExpired]);

    // The notice is about signing in, so it goes away for good once the user switches to another form.
    function switchForm(form: FormType) {
        setNoticeType(undefined);
        setActive(form);
    }

    return (
        <AuthPageLayout>
            <AuthForm form={FORM_CONFIGS[active]} setActive={switchForm} notice={noticeType && NOTICES[noticeType]}/>
        </AuthPageLayout>
    );
}
