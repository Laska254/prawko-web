import {Navigate, Outlet} from "react-router";
import {isAuthenticated} from "../auth.tsx";

export function RequireAuth() {
    return isAuthenticated() ? <Outlet/> : <Navigate to="/auth" replace/>;
}
