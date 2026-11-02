import {type ReactNode, useState} from "react";
import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {login} from "@/api/auth.tsx";
import {clearTokens, isAuthenticated} from "@/api/tokens.tsx";
import type {LoginDto} from "@/api/dto/LoginDto.tsx";
import {userKeys} from "@/api/queryKeys.tsx";
import {getCurrentUser} from "@/api/users.tsx";
import {SessionContext, type SessionState} from "./session.tsx";

interface SessionProviderProps {
    children: ReactNode;
}

// Fresh until a change to the user invalidates `userKeys`, so the query enabled after `signIn` doesn't fetch it again.
const currentUserQuery = queryOptions({queryKey: userKeys.me(), queryFn: getCurrentUser, staleTime: Infinity});

// Loads the user of the stored tokens on app start, so a reload keeps the session.
export function SessionProvider({children}: SessionProviderProps) {
    const queryClient = useQueryClient();
    // Storing the tokens doesn't trigger a render, so signing in sets this too.
    const [hasTokens, setHasTokens] = useState(isAuthenticated);
    const user = useQuery({...currentUserQuery, enabled: hasTokens});

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

    function clearSession(): void {
        clearTokens();
        setHasTokens(false);
        // The next user to sign in mustn't see this one's cached data.
        queryClient.clear();
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

    return <SessionContext value={{...state(), signIn, clearSession}}>{children}</SessionContext>;
}
