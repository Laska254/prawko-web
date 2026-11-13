import type {ParseKeys} from "i18next";
import type {GenericMessageKey} from "@/api/errors.tsx";
import type {SessionEndReason} from "@/api/tokens.tsx";

// The notices `AuthPage` shows when another page sends the user to sign in.
export type AuthNoticeType = "verified" | "passwordReset" | "sessionExpired" | "passwordChanged";

// The notice telling why the session ended, one per reason the server ends it for.
export const SESSION_END_NOTICES: Record<SessionEndReason, AuthNoticeType> = {
    expired: "sessionExpired",
    passwordChanged: "passwordChanged",
};

// A message shown on `AuthPage`, as a translation key: a notice, or why signing in failed on another page, e.g. the
// message of the server's answer.
export type AuthMessage = ParseKeys<"auth"> | GenericMessageKey;

// What another page can hand to `AuthPage` through the navigation state.
export interface AuthPageState {
    readonly notice?: AuthNoticeType;
    readonly failure?: AuthMessage;
}

// Navigation state for `/auth` that shows the notice; typed, so a misspelt notice doesn't compile.
export function authNoticeState(notice: AuthNoticeType): AuthPageState {
    return {notice};
}

// Navigation state for `/auth` that shows the failure as an error.
export function authFailureState(failure: AuthMessage): AuthPageState {
    return {failure};
}
