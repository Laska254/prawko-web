import {useState} from "react";
import {useSession} from "@/session/useSession.tsx";
import {credentials} from "./data.tsx";

// Shows the session's status and user, with buttons to sign in (as `credentials`) and to retry a failed session.
export function ShowSession() {
    const session = useSession();
    const [isFailed, setFailed] = useState(false);

    return (
        <>
            <p data-testid="status">{session.status}</p>
            {session.status === "signedIn" && <p>{session.user.firstName}</p>}
            {session.status === "error" && <button type="button" onClick={session.retry}>Retry</button>}
            <button type="button" onClick={() => session.signIn(credentials).catch(() => setFailed(true))}>
                Sign in
            </button>
            {isFailed && <p>Sign in failed</p>}
        </>
    );
}
