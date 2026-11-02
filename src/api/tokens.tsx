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
