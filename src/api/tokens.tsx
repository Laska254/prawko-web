import type {AuthTokensDto} from "./dto/AuthTokensDto.tsx";

const REFRESH_TOKEN_KEY = "refreshToken";

// The access token stays in memory only, so injected scripts can't read it from storage; the refresh token is kept in
// localStorage to get a new pair after a reload. The password itself is never stored.
let accessToken: string | null = null;

export function saveTokens(tokens: AuthTokensDto): void {
    accessToken = tokens.accessToken;
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function getAccessToken(): string | null {
    return accessToken;
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens(): void {
    accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// A stored refresh token means a session, even when the access token was lost with a reload.
export function isAuthenticated(): boolean {
    return getRefreshToken() !== null;
}

const sessionEndedListeners = new Set<() => void>();

// Calls `listener` each time the session ends; returns a function that stops it.
export function onSessionEnded(listener: () => void): () => void {
    sessionEndedListeners.add(listener);
    return () => {
        sessionEndedListeners.delete(listener);
    };
}

// Clears the tokens and tells the listeners, e.g. the session state, that the session is over.
export function endSession(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    endSessionInThisTab();
}

// Leaves the stored refresh token alone, as it is shared by all tabs.
function endSessionInThisTab(): void {
    accessToken = null;
    for (const listener of sessionEndedListeners) {
        listener();
    }
}

// Another tab removed the refresh token (`key` is the removed one, or null for `localStorage.clear()`): its session
// ended, e.g. by signing out or a refresh token no longer valid, so this tab's ends too instead of failing every request.
// Decided from the event, not the storage: a tab frozen in the background gets its events late, when another tab may
// already have signed in again, possibly as another user. Only this tab's session ends: removing the token here would
// take the new session from that tab, and from every other one with it.
window.addEventListener("storage", event => {
    if ((event.key === REFRESH_TOKEN_KEY && event.newValue === null) || event.key === null) {
        endSessionInThisTab();
    }
});
