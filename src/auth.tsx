import type {LoginDto} from "./interface/dto/LoginDto.tsx";

const STORAGE_KEY = "credentials";

// prawko-server is stateless HTTP Basic: every request carries the credentials,
// so they're kept (Base64-encoded) for the browser tab's lifetime.
export function saveCredentials({userName, password}: LoginDto): void {
    const bytes = new TextEncoder().encode(`${userName}:${password}`);
    sessionStorage.setItem(STORAGE_KEY, btoa(String.fromCharCode(...bytes)));
}

export function getCredentials(): string | null {
    return sessionStorage.getItem(STORAGE_KEY);
}

export function clearCredentials(): void {
    sessionStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated(): boolean {
    return getCredentials() !== null;
}
