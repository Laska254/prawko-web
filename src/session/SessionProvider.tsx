import {type ReactNode, useEffect, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {login, loginWithGitHub, loginWithGoogle, logout} from "@/api/auth.tsx";
import {clearTokens, endSession, isAuthenticated, onSessionEnded, onSessionStarted} from "@/api/tokens.tsx";
import type {GitHubSignInDto} from "@/api/dto/GitHubSignInDto.tsx";
import type {GoogleSignInDto} from "@/api/dto/GoogleSignInDto.tsx";
import type {LoginDto} from "@/api/dto/LoginDto.tsx";
import {currentUserQuery} from "./currentUserQuery.tsx";
import {SessionContext, type SessionState} from "./session.tsx";

interface SessionProviderProps {
    children: ReactNode;
}

// Loads the user of the stored tokens on app start.
export function SessionProvider({children}: SessionProviderProps) {
    const queryClient = useQueryClient();
    // Storing the tokens doesn't trigger a render, so signing in sets this too.
    const [hasTokens, setHasTokens] = useState(isAuthenticated);
    const [isExpired, setExpired] = useState(false);
    const user = useQuery({...currentUserQuery, enabled: hasTokens});

    // Signs out when the session ends, through `clearSession`, in the API client once the refresh token is no longer
    // valid, or in another tab.
    useEffect(() => onSessionEnded(expired => {
        // Another tab signed in again before this one heard of its removal: like a reload, this tab takes the stored
        // session, so its state and the tokens its requests send agree. Resetting empties the cache and fetches the
        // user again, which `clear` wouldn't, as the queries it drops tell no one.
        if (isAuthenticated()) {
            void queryClient.resetQueries();
            return;
        }
        setHasTokens(false);
        setExpired(expired);
        // The next user to sign in mustn't see this one's cached data.
        queryClient.clear();
    }), [queryClient]);

    // Signs in when another tab does. Signing out emptied the cache, so the user query enabled here fetches the user.
    useEffect(() => onSessionStarted(() => setHasTokens(true)), []);

    async function startSession(requestTokens: () => Promise<unknown>): Promise<void> {
        await requestTokens();
        try {
            await queryClient.fetchQuery(currentUserQuery);
        } catch (error) {
            clearTokens();
            throw error;
        }
        setHasTokens(true);
    }

    function signIn(loginDto: LoginDto): Promise<void> {
        return startSession(() => login(loginDto));
    }

    function signInWithGoogle(googleSignInDto: GoogleSignInDto): Promise<void> {
        return startSession(() => loginWithGoogle(googleSignInDto));
    }

    function signInWithGitHub(gitHubSignInDto: GitHubSignInDto): Promise<void> {
        return startSession(() => loginWithGitHub(gitHubSignInDto));
    }

    function clearExpired() {
        setExpired(false);
    }

    function state(): SessionState {
        if (!hasTokens) {
            return {status: "signedOut", expired: isExpired};
        }
        switch (user.status) {
            case "pending":
                return {status: "loading"};
            case "error":
                // A failed refetch keeps the user loaded before, so the session stays signed in with it instead of
                // replacing every page with the error.
                if (user.data !== undefined) {
                    return {status: "signedIn", user: user.data};
                }
                return {status: "error", retry: () => user.refetch()};
            case "success":
                return {status: "signedIn", user: user.data};
        }
    }

    return (
        <SessionContext value={{
            ...state(),
            signIn,
            signInWithGoogle,
            signInWithGitHub,
            signOut: logout,
            clearSession: endSession,
            clearExpired,
        }}>
            {children}
        </SessionContext>
    );
}
