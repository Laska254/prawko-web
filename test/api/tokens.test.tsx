import {clearTokens, getAccessToken, getRefreshToken, isAuthenticated, saveTokens} from "@/api/tokens.tsx";
import {tokens} from "@test/support/data.tsx";

describe("tokens", () => {
    it("has no tokens by default", () => {
        expect(getAccessToken()).toBeNull();
        expect(getRefreshToken()).toBeNull();
        expect(isAuthenticated()).toBe(false);
    });

    it("keeps the access token in memory and the refresh token in localStorage", () => {
        saveTokens(tokens);

        expect(getAccessToken()).toBe("access-token");
        expect(getRefreshToken()).toBe("refresh-token");
        expect(isAuthenticated()).toBe(true);
        expect({...localStorage}).toEqual({refreshToken: "refresh-token"});
        expect(sessionStorage).toHaveLength(0);
    });

    it("is signed in with only the refresh token, as after a reload", () => {
        localStorage.setItem("refreshToken", "refresh-token");

        expect(getAccessToken()).toBeNull();
        expect(isAuthenticated()).toBe(true);
    });

    it("clears both tokens", () => {
        saveTokens(tokens);

        clearTokens();

        expect(getAccessToken()).toBeNull();
        expect(getRefreshToken()).toBeNull();
        expect(isAuthenticated()).toBe(false);
    });
});
