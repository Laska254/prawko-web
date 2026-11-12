import {useQuery} from "@tanstack/react-query";
import {useEffect} from "react";
import {currentUserQuery} from "@/session/currentUserQuery.tsx";

// Fetches the signed-in user again when the calling screen opens and each time the tab becomes visible or the window
// regains focus while it's shown, as the email links are opened in another tab, window or device. The session reads the
// same cache, so `useCurrentUser` returns the new user. "always", as the user never goes stale on its own.
export function useRefetchUserOnFocus(): void {
    const {refetch} = useQuery({...currentUserQuery, refetchOnMount: "always", refetchOnWindowFocus: "always"});

    // TanStack Query only listens to `visibilitychange`, which never fires while this tab stays visible beside another
    // window. Switching tabs fires both events, so `cancelRefetch: false` joins the fetch already running.
    useEffect(() => {
        const onFocus = () => void refetch({cancelRefetch: false});
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [refetch]);
}
