import {createContext} from "react";
import type {LoginDto} from "@/api/dto/LoginDto.tsx";
import type {UserDto} from "@/api/dto/UserDto.tsx";

// Who is signed in. `loading` while the stored credentials' user is fetched; `error` when that failed with no answer
// or a server error (a `401` signs out in the API client instead).
export type SessionState =
    | {readonly status: "loading"}
    | {readonly status: "signedIn"; readonly user: UserDto}
    | {readonly status: "signedOut"}
    | {readonly status: "error"; readonly retry: () => void};

// Checking `status` narrows the state, e.g. to read `user` once it's `signedIn`.
export type Session = SessionState & {
    // Signs in and loads the user; rejects with the failed request's error and stays signed out.
    readonly signIn: (loginDto: LoginDto) => Promise<void>;
};

export const SessionContext = createContext<Session | null>(null);

export function isAdmin(session: SessionState): boolean {
    return session.status === "signedIn" && session.user.role === "ADMIN";
}
