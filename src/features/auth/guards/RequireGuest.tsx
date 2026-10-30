import {Navigate, Outlet} from "react-router";
import {useSession} from "@/session/useSession.tsx";

// Stored credentials whose user is still loading or failed to load also go home, where `RequireAuth` shows that.
export function RequireGuest() {
    const {status} = useSession();

    if (status === "signedOut") {
        return <Outlet/>;
    }
    return <Navigate to="/" replace/>;
}
