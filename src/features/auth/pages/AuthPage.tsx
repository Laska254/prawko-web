import {useEffect, useState} from "react";
import {useLocation, useNavigate} from "react-router";
import {useSession} from "@/session/useSession.tsx";
import {FORM_CONFIGS, type FormType} from "../formConfig.tsx";
import {type AuthNoticeType, type AuthPageState, SESSION_END_NOTICES} from "../authNotice.tsx";
import {AuthForm, type AuthNotice} from "../components/AuthForm.tsx";
import {AuthPageLayout} from "../components/AuthPageLayout.tsx";

const NOTICES: Record<AuthNoticeType, AuthNotice> = {
    verified: {message: "notices.verified", severity: "success"},
    passwordReset: {message: "notices.passwordReset", severity: "success"},
    sessionExpired: {message: "notices.sessionExpired", severity: "info"},
    passwordChanged: {message: "notices.passwordChanged", severity: "success"},
    accountDeleted: {message: "notices.accountDeleted", severity: "success"},
};

function noticeOf(state: AuthPageState | null): AuthNotice | undefined {
    if (state?.failure) {
        return {message: state.failure, severity: "error"};
    }
    return state?.notice && NOTICES[state.notice];
}

export function AuthPage() {
    const [active, setActive] = useState<FormType>("login");
    const location = useLocation();
    const navigate = useNavigate();
    const [notice, setNotice] = useState(() => noticeOf(location.state));
    const {clearEndReason} = useSession();
    const isSessionEndNotice = Object.values(SESSION_END_NOTICES).some(type => NOTICES[type] === notice);

    // The browser keeps the navigation state for reloads and back navigation, so the notice is read once (above) and
    // cleared from it.
    useEffect(() => {
        if (noticeOf(location.state)) {
            navigate(".", {replace: true, state: null});
        }
    }, [location.state, navigate]);

    // The user is told why their session ended, so going back to a signed-in page doesn't redirect with the notice
    // again.
    // Not in `RequireAuth`: its redirect runs in a transition, so clearing there would change it before it applies.
    useEffect(() => {
        if (isSessionEndNotice) {
            clearEndReason();
        }
    }, [isSessionEndNotice, clearEndReason]);

    // The notice is about signing in, so it goes away for good once the user switches to another form.
    function switchForm(form: FormType) {
        setNotice(undefined);
        setActive(form);
    }

    return (
        <AuthPageLayout>
            <AuthForm form={FORM_CONFIGS[active]} setActive={switchForm} notice={notice}/>
        </AuthPageLayout>
    );
}
