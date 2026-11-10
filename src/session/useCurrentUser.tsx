import type {UserDto} from "@/api/dto/UserDto.tsx";
import {useSession} from "./useSession.tsx";

// The signed-in user, for pages behind `RequireAuth`, which renders them only once the session is signed in.
export function useCurrentUser(): UserDto {
    const session = useSession();
    if (session.status !== "signedIn") {
        throw new Error("useCurrentUser must be used inside a signed-in session.");
    }
    return session.user;
}
