import {Navigate, Outlet} from "react-router";
import {useTranslation} from "react-i18next";
import {PageError} from "@/components/feedback/PageError.tsx";
import {PageLoading} from "@/components/feedback/PageLoading.tsx";
import {useSession} from "@/session/useSession.tsx";
import {authNoticeState} from "../authNotice.tsx";

// An expired session tells the sign in page why the user is back there.
function signedOutState(expired: boolean) {
    if (expired) {
        return authNoticeState("sessionExpired");
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
            return <Navigate to="/auth" replace state={signedOutState(session.expired)}/>;
    }
}
