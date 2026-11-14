import {useLocation} from "react-router";
import type {AuthPageState} from "../authNotice.tsx";

// Where signing in leads: the page `RequireAuth` sent the user to sign in from, or home.
export function useReturnPath(): string {
    const state: AuthPageState | null = useLocation().state;
    return state?.from ?? "/";
}
