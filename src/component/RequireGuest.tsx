import {Navigate, Outlet} from "react-router";
import {isAuthenticated} from "../auth.tsx";

export function RequireGuest() {
    return isAuthenticated() ? <Navigate to="/" replace/> : <Outlet/>;
}
