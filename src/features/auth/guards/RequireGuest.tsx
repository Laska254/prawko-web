import {Navigate, Outlet} from "react-router";
import {useSession} from "@/session/useSession.tsx";
import {useReturnPath} from "../hooks/useReturnPath.tsx";

// Signing in, here or in another tab, leads back to the page `RequireAuth` sent the user from, or home. Stored tokens
// whose user is still loading or failed to load go there too, where `RequireAuth` shows that.
export function RequireGuest() {
    const {status} = useSession();
    const returnPath = useReturnPath();

    if (status === "signedOut") {
        return <Outlet/>;
    }
    return <Navigate to={returnPath} replace/>;
}
