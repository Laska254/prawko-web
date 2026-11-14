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

// Why the server no longer accepts a session, which ended without the user signing out: it `expired`, the password
// changed (`passwordChanged`) and signing in again with the new one failed, or the user deleted their account
// (`accountDeleted`).
export type SessionEndReason = "expired" | "passwordChanged" | "accountDeleted";

// `reason` is `null` when the user ended the session, or this tab doesn't know why it ended.
type SessionEndedListener = (reason: SessionEndReason | null) => void;

const sessionEndedListeners = new Set<SessionEndedListener>();
const sessionStartedListeners = new Set<() => void>();

function addListener<T>(listeners: Set<T>, listener: T): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

// Calls `listener` each time the session ends; returns a function that stops it.
export function onSessionEnded(listener: SessionEndedListener): () => void {
    return addListener(sessionEndedListeners, listener);
}

// Calls `listener` each time another tab starts a session where there was none; returns a function that stops it.
export function onSessionStarted(listener: () => void): () => void {
    return addListener(sessionStartedListeners, listener);
}

// Clears the tokens and tells the listeners, e.g. the session state, that the session is over.
export function endSession(): void {
    endStoredSession(null);
}

// Like `endSession`, for a session the server no longer accepts, so the user learns why they were signed out.
export function expireSession(reason: SessionEndReason = "expired"): void {
    endStoredSession(reason);
}

function endStoredSession(reason: SessionEndReason | null): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    endSessionInThisTab(reason);
}

// Leaves the stored refresh token alone, as it is shared by all tabs.
function endSessionInThisTab(reason: SessionEndReason | null): void {
    accessToken = null;
    for (const listener of sessionEndedListeners) {
        listener(reason);
    }
}

// Another tab removed the refresh token (`key` is the removed one, or null for `localStorage.clear()`): its session
// ended, e.g. by signing out or a refresh token no longer valid, so this tab's ends too instead of failing every request.
// Decided from the event, not the storage: a tab frozen in the background gets its events late, when another tab may
// already have signed in again, possibly as another user. Only this tab's session ends: removing the token here would
// take the new session from that tab, and from every other one with it.
// Another tab stored a refresh token where there was none: it signed in, so this tab, signed out until now, takes the
// session too, as it would on a reload, instead of sending that session's tokens while showing the sign-in page.
window.addEventListener("storage", event => {
    if ((event.key === REFRESH_TOKEN_KEY && event.newValue === null) || event.key === null) {
        // Only the tab whose refresh failed knows why the session ended.
        endSessionInThisTab(null);
    } else if (event.key === REFRESH_TOKEN_KEY && event.oldValue === null) {
        for (const listener of sessionStartedListeners) {
            listener();
        }
    }
});
