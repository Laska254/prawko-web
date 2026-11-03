import {
    clearTokens,
    endSession,
    getAccessToken,
    getRefreshToken,
    isAuthenticated,
    onSessionEnded,
    saveTokens,
} from "@/api/tokens.tsx";
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

    it("clears the tokens and tells the listeners when the session ends", () => {
        const listener = vi.fn();
        const stopListening = onSessionEnded(listener);
        saveTokens(tokens);

        endSession();

        expect(getAccessToken()).toBeNull();
        expect(getRefreshToken()).toBeNull();
        expect(listener).toHaveBeenCalledOnce();
        stopListening();
    });

    it("stops telling a listener once it stopped listening", () => {
        const listener = vi.fn();
        const stopListening = onSessionEnded(listener);

        stopListening();
        endSession();

        expect(listener).not.toHaveBeenCalled();
    });

    describe("in another tab", () => {
        const listener = vi.fn();
        let stopListening: () => void;

        beforeEach(() => {
            listener.mockClear();
            stopListening = onSessionEnded(listener);
            saveTokens(tokens);
        });

        afterEach(() => stopListening());

        // Browsers send `storage` events only to the other tabs, so the test plays the tab that changed the storage.
        function changeInAnotherTab(change: () => void, key: string | null, newValue: string | null = null): void {
            change();
            window.dispatchEvent(new StorageEvent("storage", {key, newValue, storageArea: localStorage}));
        }

        it("ends the session when the refresh token is removed", () => {
            changeInAnotherTab(() => localStorage.removeItem("refreshToken"), "refreshToken");

            expect(getAccessToken()).toBeNull();
            expect(listener).toHaveBeenCalledOnce();
        });

        it("ends the session when the refresh token is removed, even if a new one is stored before this tab hears of it", () => {
            changeInAnotherTab(() => {
                localStorage.removeItem("refreshToken");
                localStorage.setItem("refreshToken", "refresh-token-1");
            }, "refreshToken");

            expect(getAccessToken()).toBeNull();
            expect(getRefreshToken()).toBe("refresh-token-1");
            expect(listener).toHaveBeenCalledOnce();
        });

        it("ends the session when the storage is cleared", () => {
            changeInAnotherTab(() => localStorage.clear(), null);

            expect(getAccessToken()).toBeNull();
            expect(listener).toHaveBeenCalledOnce();
        });

        it("keeps the session when a new refresh token is stored", () => {
            changeInAnotherTab(() => localStorage.setItem("refreshToken", "refresh-token-1"), "refreshToken",
                "refresh-token-1");

            expect(getAccessToken()).toBe("access-token");
            expect(listener).not.toHaveBeenCalled();
        });

        it("doesn't end a session that is already over when another key changes", () => {
            clearTokens();

            changeInAnotherTab(() => localStorage.setItem("mui-mode", "dark"), "mui-mode");

            expect(listener).not.toHaveBeenCalled();
        });
    });
});
