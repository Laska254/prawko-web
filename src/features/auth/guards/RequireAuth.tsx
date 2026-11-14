import {useState} from "react";
import {createPath, Navigate, Outlet, useLocation} from "react-router";
import {useTranslation} from "react-i18next";
import {PageError} from "@/components/feedback/PageError.tsx";
import {PageLoading} from "@/components/feedback/PageLoading.tsx";
import {useSession} from "@/session/useSession.tsx";
import type {SessionEndReason} from "@/api/tokens.tsx";
import {type AuthPageState, authNoticeState, SESSION_END_NOTICES} from "../authNotice.tsx";

export function RequireAuth() {
    const session = useSession();
    const location = useLocation();
    // Set once the user was signed in here, so signing out can be told apart from a guest opening the page.
    const [wasSignedIn, setWasSignedIn] = useState(false);
    const {t} = useTranslation();

    if (session.status === "signedIn" && !wasSignedIn) {
        setWasSignedIn(true);
    }

    // A session the server ended tells the sign in page why the user is back there. Signing in leads back to this page,
    // as it does for a guest who opened it, but not after the user signed out.
    function signedOutState(endReason: SessionEndReason | null): AuthPageState | undefined {
        if (endReason) {
            return {...authNoticeState(SESSION_END_NOTICES[endReason]), from: createPath(location)};
        }
        if (!wasSignedIn) {
            return {from: createPath(location)};
        }
    }

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
