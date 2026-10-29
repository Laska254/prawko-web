import axios, {type AxiosResponse} from "axios";
import {clearCredentials, getCredentials} from "./credentials.tsx";
import {parseInstants} from "./instants.tsx";

// A request without an answer by then fails as a timeout instead of leaving the screen loading for good.
const TIMEOUT_MS = 15_000;

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {'Content-Type': 'application/json'},
    timeout: TIMEOUT_MS,
    // Reports a timeout as `ETIMEDOUT` instead of the `ECONNABORTED` of an aborted request, see `toApiError`.
    transitional: {clarifyTimeoutError: true},
});

api.interceptors.request.use(config => {
    const credentials = getCredentials();
    if (credentials) {
        config.headers.Authorization = `Basic ${credentials}`;
    }
    return config;
});

api.interceptors.response.use(response => {
    response.data = parseInstants(response.data);
    return response;
}, error => {
    if (error.response?.status === 401 && getCredentials()) {
        clearCredentials();
        window.location.assign("/auth");
    }
    return Promise.reject(error);
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
