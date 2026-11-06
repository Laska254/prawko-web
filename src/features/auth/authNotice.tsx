import type {ParseKeys} from "i18next";
import type {GenericMessageKey} from "@/api/errors.tsx";

// The notices `AuthPage` shows when another page sends the user to sign in.
export type AuthNoticeType = "verified" | "passwordReset" | "sessionExpired";

// Why signing in failed on another page, e.g. the message of the server's answer, as a translation key.
export type AuthFailureMessage = ParseKeys<"auth"> | GenericMessageKey;

// What another page can hand to `AuthPage` through the navigation state.
export interface AuthPageState {
    readonly notice?: AuthNoticeType;
    readonly failure?: AuthFailureMessage;
}

// Navigation state for `/auth` that shows the notice; typed, so a misspelt notice doesn't compile.
export function authNoticeState(notice: AuthNoticeType): AuthPageState {
    return {notice};
}

// Navigation state for `/auth` that shows the failure as an error.
export function authFailureState(failure: AuthFailureMessage): AuthPageState {
    return {failure};
}
