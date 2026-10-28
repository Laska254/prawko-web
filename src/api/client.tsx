import axios, {type AxiosResponse} from "axios";
import {clearCredentials, getCredentials} from "./credentials.tsx";
import {parseInstants} from "./instants.tsx";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {'Content-Type': 'application/json'}
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
export function createdId(response: AxiosResponse): number {
    return Number(String(response.headers.location).split("/").at(-1));
}
