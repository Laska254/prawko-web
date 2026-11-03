import axios, {type AxiosError, type AxiosResponse, type CreateAxiosDefaults} from "axios";
import {endSession, getAccessToken, getRefreshToken, isAuthenticated, saveTokens} from "./tokens.tsx";
import {parseInstants} from "./instants.tsx";
import type {AuthTokensDto} from "./dto/AuthTokensDto.tsx";
import type {RefreshTokenDto} from "./dto/RefreshTokenDto.tsx";

declare module "axios" {
    // biome-ignore lint/suspicious/noExplicitAny: merging the interface needs axios' own type parameters.
    interface AxiosRequestConfig<D = any, P = any> {
        // Set on a request sent again with a new access token, so a second `401` ends the session.
        retried?: boolean;
    }
}

// A request without an answer by then fails as a timeout instead of leaving the screen loading for good.
const TIMEOUT_MS = 15_000;

const defaults: CreateAxiosDefaults = {
    baseURL: import.meta.env.VITE_API_URL,
    headers: {'Content-Type': 'application/json'},
    timeout: TIMEOUT_MS,
    // Reports a timeout as `ETIMEDOUT` instead of the `ECONNABORTED` of an aborted request, see `toApiError`.
    transitional: {clarifyTimeoutError: true},
};

export const api = axios.create(defaults);

// Sends the refresh without `api`'s interceptors: its `401` means the refresh token is no longer valid.
const refreshApi = axios.create(defaults);

function authorization(): string | undefined {
    const accessToken = getAccessToken();
    if (accessToken) {
        return `Bearer ${accessToken}`;
    }
}

let refreshing: Promise<void> | null = null;

// Swaps the refresh token for a new pair. The server accepts each refresh token once, so parallel calls share one
// request. Rejects with the request's error; a `401` ends the session, any other error keeps it for a later try.
function refreshTokens(refreshToken: string): Promise<void> {
    refreshing ??= refreshApi.post<AuthTokensDto>("/auth/refresh", {refreshToken} satisfies RefreshTokenDto)
        .then(response => saveTokens(response.data), (error: AxiosError) => {
            if (error.response?.status === 401) {
                endSession();
            }
            throw error;
        })
        .finally(() => {
            refreshing = null;
        });
    return refreshing;
}

api.interceptors.request.use(async config => {
    const refreshToken = getRefreshToken();
    // After a reload only the refresh token is left: get an access token first instead of waiting for a `401`.
    if (!getAccessToken() && refreshToken) {
        try {
            await refreshTokens(refreshToken);
        } catch (error) {
            // A session that ended sends the request without a token, as it may not need one (e.g. verifying an email).
            if (isAuthenticated()) {
                throw error;
            }
        }
    }
    const header = authorization();
    if (header) {
        config.headers.Authorization = header;
    }
    return config;
});

api.interceptors.response.use(response => {
    response.data = parseInstants(response.data);
    return response;
}, async (error: AxiosError) => {
    const refreshToken = getRefreshToken();
    if (error.response?.status !== 401 || !refreshToken) {
        throw error;
    }
    // Every response carries the config of its request.
    const request = error.config!;
    if (request.retried) {
        endSession();
        throw error;
    }
    // A request sent with an older access token failed after another request's refresh got a new one.
    if (request.headers.Authorization === authorization()) {
        await refreshTokens(refreshToken);
    }
    return api.request({...request, retried: true});
});

// The ID at the end of a `201 Created` response's `Location` header (`…/users/5` → 5).
// Throws when the header is missing or doesn't end in an ID.
export function createdId(response: AxiosResponse): number {
    const location = response.headers.location;
    const id = Number(String(location).split("/").at(-1));
    if (!Number.isInteger(id) || id < 1) {
        throw new Error(`No created ID in Location: ${location}`);
    }
    return id;
}
