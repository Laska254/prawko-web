import {useState} from "react";
import {useSession} from "./useSession.tsx";

interface SignOut {
    readonly signOut: () => void;
    // Until signing out finished, so the control shows it's busy and takes no more clicks.
    readonly isSigningOut: boolean;
}

// Signing out first waits for a refresh in flight, in this tab or another, for up to a request's timeout. Once done,
// `RequireAuth` replaces the page with /auth, so back doesn't return to it.
export function useSignOut(): SignOut {
    const session = useSession();
    const [isSigningOut, setIsSigningOut] = useState(false);

    function signOut(): void {
        setIsSigningOut(true);
        void session.signOut().finally(() => setIsSigningOut(false));
    }

    return {signOut, isSigningOut};
}
