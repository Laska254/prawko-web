import {Navigate, Outlet} from "react-router";
import {isAuthenticated} from "@/api/credentials.tsx";

export function RequireGuest() {
    return isAuthenticated() ? <Navigate to="/" replace/> : <Outlet/>;
}
