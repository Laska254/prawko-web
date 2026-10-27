import {clearCredentials, getCredentials, isAuthenticated, saveCredentials} from "@/api/credentials.tsx";
import {credentials} from "@test/support/data.tsx";

function decode(credentials: string): string {
    return new TextDecoder().decode(Uint8Array.from(atob(credentials), char => char.charCodeAt(0)));
}

describe("auth", () => {
    it("has no credentials by default", () => {
        expect(getCredentials()).toBeNull();
        expect(isAuthenticated()).toBe(false);
    });

    it("saves the credentials as Base64", () => {
        saveCredentials(credentials);

        expect(getCredentials()).toBe(btoa("jan:secret"));
        expect(isAuthenticated()).toBe(true);
    });

    it("encodes non-ASCII characters as UTF-8", () => {
        saveCredentials({userName: "żółw", password: "hasło"});

        expect(decode(getCredentials()!)).toBe("żółw:hasło");
    });

    it("clears the credentials", () => {
        saveCredentials(credentials);

        clearCredentials();

        expect(getCredentials()).toBeNull();
        expect(isAuthenticated()).toBe(false);
    });
});
