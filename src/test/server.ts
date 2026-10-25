import {setupServer} from "msw/node";

export const server = setupServer();

export function apiUrl(path: string): string {
    return `${import.meta.env.VITE_API_URL}${path}`;
}
