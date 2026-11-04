// The notices `AuthPage` shows when another page sends the user to sign in.
export type AuthNoticeType = "verified" | "passwordReset" | "sessionExpired";

interface AuthNoticeState {
    readonly notice: AuthNoticeType;
}

// Navigation state for `/auth` that shows the notice; typed, so a misspelt notice doesn't compile.
export function authNoticeState(notice: AuthNoticeType): AuthNoticeState {
    return {notice};
}
