import {isAxiosError} from "axios";
import {QueryClient} from "@tanstack/react-query";

const MAX_RETRIES = 3;

// Retries only requests that can pass on a second try: no response at all (network error, timeout) or a server
// error. A 4xx answer or an error in our own code would come back the same, so they fail at once.
export function shouldRetry(failureCount: number, error: Error): boolean {
    if (failureCount >= MAX_RETRIES || !isAxiosError(error)) {
        return false;
    }
    return !error.response || error.response.status >= 500;
}

// Mutations keep TanStack Query's default of no retries: sending a change twice isn't always safe.
export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {retry: shouldRetry},
        },
    });
}
