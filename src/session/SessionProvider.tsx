import {type ReactNode, useEffect, useState} from "react";
import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {login} from "@/api/auth.tsx";
import {clearTokens, endSession, isAuthenticated, onSessionEnded} from "@/api/tokens.tsx";
import type {LoginDto} from "@/api/dto/LoginDto.tsx";
import {userKeys} from "@/api/queryKeys.tsx";
import {getCurrentUser} from "@/api/users.tsx";
import {SessionContext, type SessionState} from "./session.tsx";

interface SessionProviderProps {
    children: ReactNode;
}

// Fresh until a change to the user invalidates `userKeys`, so the query enabled after `signIn` doesn't fetch it again.
const currentUserQuery = queryOptions({queryKey: userKeys.me(), queryFn: getCurrentUser, staleTime: Infinity});

// Loads the user of the stored tokens on app start.
export function SessionProvider({children}: SessionProviderProps) {
    const queryClient = useQueryClient();
    // Storing the tokens doesn't trigger a render, so signing in sets this too.
    const [hasTokens, setHasTokens] = useState(isAuthenticated);
    const user = useQuery({...currentUserQuery, enabled: hasTokens});

    // Signs out when the session ends, through `clearSession`, in the API client once the refresh token is no longer
    // valid, or in another tab.
    useEffect(() => onSessionEnded(() => {
        // Another tab signed in again before this one heard of its removal: like a reload, this tab takes the stored
        // session, so its state and the tokens its requests send agree. Resetting empties the cache and fetches the
        // user again, which `clear` wouldn't, as the queries it drops tell no one.
        if (isAuthenticated()) {
            void queryClient.resetQueries();
            return;
        }
        setHasTokens(false);
        // The next user to sign in mustn't see this one's cached data.
        queryClient.clear();
    }), [queryClient]);

    async function signIn(loginDto: LoginDto): Promise<void> {
        await login(loginDto);
        try {
            await queryClient.fetchQuery(currentUserQuery);
        } catch (error) {
            clearTokens();
            throw error;
        }
        setHasTokens(true);
    }

    function state(): SessionState {
        if (!hasTokens) {
            return {status: "signedOut"};
        }
        switch (user.status) {
            case "pending":
                return {status: "loading"};
            case "error":
                return {status: "error", retry: () => user.refetch()};
            case "success":
                return {status: "signedIn", user: user.data};
        }
    }

    return <SessionContext value={{...state(), signIn, clearSession: endSession}}>{children}</SessionContext>;
}
