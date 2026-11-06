import {useState} from "react";
import {useSession} from "@/session/useSession.tsx";
import {credentials, googleSignInDto} from "./data.tsx";

// Shows the session's status, its user or whether it expired, with buttons to sign in (as `credentials`, or with
// `googleSignInDto`), to retry a failed session, to sign out, to clear the session and to forget that it expired.
export function ShowSession() {
    const session = useSession();
    const [isFailed, setFailed] = useState(false);

    return (
        <>
            <p data-testid="status">{session.status}</p>
            {session.status === "signedIn" && <p>{session.user.firstName}</p>}
            {session.status === "signedOut" && session.expired && <p>Expired</p>}
            {session.status === "error" && <button type="button" onClick={session.retry}>Retry</button>}
            <button type="button" onClick={() => session.signIn(credentials).catch(() => setFailed(true))}>
                Sign in
            </button>
            <button type="button" onClick={() => session.signInWithGoogle(googleSignInDto).catch(() => setFailed(true))}>
                Sign in with Google
            </button>
            {isFailed && <p>Sign in failed</p>}
            <button type="button" onClick={session.signOut}>Sign out</button>
            <button type="button" onClick={session.clearSession}>Clear session</button>
            <button type="button" onClick={session.clearExpired}>Clear expired</button>
        </>
    );
}
