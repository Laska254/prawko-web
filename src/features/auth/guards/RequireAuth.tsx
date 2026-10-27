import {Navigate, Outlet} from "react-router";
import {isAuthenticated} from "@/api/credentials.tsx";

export function RequireAuth() {
    return isAuthenticated() ? <Outlet/> : <Navigate to="/auth" replace/>;
}
