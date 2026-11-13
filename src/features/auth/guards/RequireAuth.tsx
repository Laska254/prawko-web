import {Navigate, Outlet} from "react-router";
import {useTranslation} from "react-i18next";
import {PageError} from "@/components/feedback/PageError.tsx";
import {PageLoading} from "@/components/feedback/PageLoading.tsx";
import {useSession} from "@/session/useSession.tsx";
import type {SessionEndReason} from "@/api/tokens.tsx";
import {type AuthNoticeType, authNoticeState} from "../authNotice.tsx";

const END_NOTICES: Record<SessionEndReason, AuthNoticeType> = {
    expired: "sessionExpired",
    passwordChanged: "passwordChanged",
};

// A session the server ended tells the sign in page why the user is back there.
function signedOutState(endReason: SessionEndReason | null) {
    if (endReason) {
        return authNoticeState(END_NOTICES[endReason]);
    }
}

export function RequireAuth() {
    const session = useSession();
    const {t} = useTranslation();

    switch (session.status) {
        case "loading":
            return <PageLoading/>;
        case "error":
            return <PageError message={t("sessionLoadFailed")} onRetry={session.retry}/>;
        case "signedIn":
            return <Outlet/>;
        case "signedOut":
            return <Navigate to="/auth" replace state={signedOutState(session.endReason)}/>;
    }
}
