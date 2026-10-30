import {type ReactNode, useState} from "react";
import {queryOptions, useQuery, useQueryClient} from "@tanstack/react-query";
import {login} from "@/api/auth.tsx";
import {clearCredentials, isAuthenticated} from "@/api/credentials.tsx";
import type {LoginDto} from "@/api/dto/LoginDto.tsx";
import {userKeys} from "@/api/queryKeys.tsx";
import {getCurrentUser} from "@/api/users.tsx";
import {SessionContext, type SessionState} from "./session.tsx";

interface SessionProviderProps {
    children: ReactNode;
}

// Fresh until a change to the user invalidates `userKeys`, so the query enabled after `signIn` doesn't fetch it again.
const currentUserQuery = queryOptions({queryKey: userKeys.me(), queryFn: getCurrentUser, staleTime: Infinity});

// Loads the user of the stored credentials on app start, so a reload keeps the session.
export function SessionProvider({children}: SessionProviderProps) {
    const queryClient = useQueryClient();
    // sessionStorage doesn't trigger a render, so signing in sets this too.
    const [hasCredentials, setHasCredentials] = useState(isAuthenticated);
    const user = useQuery({...currentUserQuery, enabled: hasCredentials});

    async function signIn(loginDto: LoginDto): Promise<void> {
        await login(loginDto);
        try {
            await queryClient.fetchQuery(currentUserQuery);
        } catch (error) {
            clearCredentials();
            throw error;
        }
        setHasCredentials(true);
    }

    function state(): SessionState {
        if (!hasCredentials) {
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

    return <SessionContext value={{...state(), signIn}}>{children}</SessionContext>;
}
