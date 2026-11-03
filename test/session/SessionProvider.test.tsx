import {act, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {http, HttpResponse} from "msw/http";
import {endSession, getRefreshToken, saveTokens} from "@/api/tokens.tsx";
import {userKeys} from "@/api/queryKeys.tsx";
import {credentials, tokens, user} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {apiUrl, mockPost, mockRequest, server} from "@test/support/server.tsx";
import {ShowSession} from "@test/support/ShowSession.tsx";

function renderSession() {
    return renderWithProviders(<ShowSession/>);
}

function status(): string | null {
    return screen.getByTestId("status").textContent;
}

describe("SessionProvider", () => {
    it("is signed out without stored tokens", () => {
        renderSession();

        expect(status()).toBe("signedOut");
    });

    it("loads the user of the stored tokens", async () => {
        saveTokens(tokens);
        mockRequest("get", "/users/me", {body: user});

        renderSession();

        expect(status()).toBe("loading");
        expect(await screen.findByText("Jan")).toBeInTheDocument();
        expect(status()).toBe("signedIn");
    });

    it("fails when the user can't be loaded and loads it again on retry", async () => {
        saveTokens(tokens);
        mockRequest("get", "/users/me", {status: 500});
        renderSession();
        const retry = await screen.findByRole("button", {name: "Retry"});
        expect(status()).toBe("error");

        mockRequest("get", "/users/me", {body: user});
        await userEvent.setup().click(retry);

        expect(await screen.findByText("Jan")).toBeInTheDocument();
        expect(status()).toBe("signedIn");
    });

    it("signs in and loads the user once", async () => {
        const signIns = mockPost("/auth", 200, tokens);
        const requests = mockRequest("get", "/users/me", {body: user});
        const {queryClient} = renderSession();

        await userEvent.setup().click(screen.getByRole("button", {name: "Sign in"}));

        expect(await screen.findByText("Jan")).toBeInTheDocument();
        expect(status()).toBe("signedIn");
        expect(signIns).toEqual([credentials]);
        expect(getRefreshToken()).toBe("refresh-token");
        // Enabling the query after signing in mustn't fetch the user again.
        await waitFor(() => expect(queryClient.isFetching()).toBe(0));
        expect(requests).toHaveLength(1);
    });

    it("stays signed out and loads no user when signing in fails", async () => {
        mockPost("/auth", 401);
        const requests = mockRequest("get", "/users/me", {body: user});
        renderSession();

        await userEvent.setup().click(screen.getByRole("button", {name: "Sign in"}));

        expect(await screen.findByText("Sign in failed")).toBeInTheDocument();
        expect(status()).toBe("signedOut");
        expect(requests).toEqual([]);
    });

    it("stays signed out and forgets the tokens when the signed in user can't be loaded", async () => {
        mockPost("/auth", 200, tokens);
        mockRequest("get", "/users/me", {status: 500});
        renderSession();

        await userEvent.setup().click(screen.getByRole("button", {name: "Sign in"}));

        expect(await screen.findByText("Sign in failed")).toBeInTheDocument();
        expect(status()).toBe("signedOut");
        expect(getRefreshToken()).toBeNull();
    });

    it("clears the session, its tokens and the cached data", async () => {
        saveTokens(tokens);
        mockRequest("get", "/users/me", {body: user});
        const {queryClient} = renderSession();
        expect(await screen.findByText("Jan")).toBeInTheDocument();

        await userEvent.setup().click(screen.getByRole("button", {name: "Clear session"}));

        expect(status()).toBe("signedOut");
        expect(screen.queryByText("Jan")).not.toBeInTheDocument();
        expect(getRefreshToken()).toBeNull();
        expect(queryClient.getQueryData(userKeys.me())).toBeUndefined();
    });

    it("loads the user with a new access token after a reload", async () => {
        localStorage.setItem("refreshToken", "refresh-token");
        const refreshes = mockPost("/auth/refresh", 200, {...tokens, accessToken: "new-access-token"});
        server.use(http.get(apiUrl("/users/me"), ({request}) => {
            if (request.headers.get("Authorization") === "Bearer new-access-token") {
                return HttpResponse.json(user);
            }
            return new HttpResponse(null, {status: 401});
        }));

        renderSession();

        expect(await screen.findByText("Jan")).toBeInTheDocument();
        expect(status()).toBe("signedIn");
        expect(refreshes).toEqual([{refreshToken: "refresh-token"}]);
    });

    it("signs out after a reload when the refresh token is no longer valid", async () => {
        localStorage.setItem("refreshToken", "refresh-token");
        mockRequest("get", "/users/me", {status: 401});
        mockPost("/auth/refresh", 401);

        renderSession();

        await waitFor(() => expect(status()).toBe("signedOut"));
        expect(getRefreshToken()).toBeNull();
    });

    it("signs out and clears the cached data when the API client ends the session", async () => {
        saveTokens(tokens);
        mockRequest("get", "/users/me", {body: user});
        const {queryClient} = renderSession();
        expect(await screen.findByText("Jan")).toBeInTheDocument();

        act(() => endSession());

        expect(status()).toBe("signedOut");
        expect(queryClient.getQueryData(userKeys.me())).toBeUndefined();
    });

    it("takes the stored session and loads its user when another tab signed in again before this one heard of the removal", async () => {
        saveTokens(tokens);
        mockRequest("get", "/users/me", {body: user});
        const {queryClient} = renderSession();
        expect(await screen.findByText("Jan")).toBeInTheDocument();
        queryClient.setQueryData(["other"], "Jan's data");
        const refreshes = mockPost("/auth/refresh", 200, {accessToken: "access-token-2", refreshToken: "refresh-token-2"});
        server.use(http.get(apiUrl("/users/me"), ({request}) => {
            if (request.headers.get("Authorization") === "Bearer access-token-2") {
                return HttpResponse.json({...user, id: 2, firstName: "Anna"});
            }
            return new HttpResponse(null, {status: 401});
        }));

        // Browsers send `storage` events only to the other tabs, so the test plays the tab that changed the storage.
        localStorage.setItem("refreshToken", "refresh-token-1");
        act(() => {
            window.dispatchEvent(new StorageEvent("storage", {key: "refreshToken", newValue: null, storageArea: localStorage}));
        });

        expect(await screen.findByText("Anna")).toBeInTheDocument();
        expect(status()).toBe("signedIn");
        expect(refreshes).toEqual([{refreshToken: "refresh-token-1"}]);
        expect(queryClient.getQueryData(["other"])).toBeUndefined();
    });
});
