import {useQuery} from "@tanstack/react-query";
import {currentUserQuery} from "@/session/currentUserQuery.tsx";

// Fetches the signed-in user again each time the window regains focus while the calling screen is shown, as the email
// links are opened in another tab or app. The session reads the same cache, so `useCurrentUser` returns the new user.
// "always", as the user never goes stale on its own.
export function useRefetchUserOnFocus(): void {
    useQuery({...currentUserQuery, refetchOnWindowFocus: "always"});
}
