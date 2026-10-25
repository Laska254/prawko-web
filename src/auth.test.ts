import {clearCredentials, getCredentials, isAuthenticated, saveCredentials} from "./auth.tsx";

function decode(credentials: string): string {
    return new TextDecoder().decode(Uint8Array.from(atob(credentials), char => char.charCodeAt(0)));
}

describe("auth", () => {
    it("has no credentials by default", () => {
        expect(getCredentials()).toBeNull();
        expect(isAuthenticated()).toBe(false);
    });

    it("saves the credentials as Base64", () => {
        saveCredentials({userName: "jan", password: "secret"});

        expect(getCredentials()).toBe(btoa("jan:secret"));
        expect(isAuthenticated()).toBe(true);
    });

    it("encodes non-ASCII characters as UTF-8", () => {
        saveCredentials({userName: "żółw", password: "hasło"});

        expect(decode(getCredentials()!)).toBe("żółw:hasło");
    });

    it("clears the credentials", () => {
        saveCredentials({userName: "jan", password: "secret"});

        clearCredentials();

        expect(getCredentials()).toBeNull();
        expect(isAuthenticated()).toBe(false);
    });
});
