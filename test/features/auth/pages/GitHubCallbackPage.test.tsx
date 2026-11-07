import {screen, waitFor} from "@testing-library/react";
import {Route, Routes} from "react-router";
import {getRefreshToken} from "@/api/tokens.tsx";
import {AuthPage} from "@/features/auth/pages/AuthPage.tsx";
import {GitHubCallbackPage} from "@/features/auth/pages/GitHubCallbackPage.tsx";
import {gitHubSignInDto, tokens, user} from "@test/support/data.tsx";
import {startedState} from "@test/support/gitHubSignIn.tsx";
import {currentLocation, renderWithProviders} from "@test/support/render.tsx";
import {mockNetworkError, mockPendingPost, mockPost, mockProblem, mockRequest} from "@test/support/server.tsx";
import {ShowLocation} from "@test/support/ShowLocation.tsx";

const {code, redirectUri} = gitHubSignInDto;

function renderCallback(params: Record<string, string> = {}) {
    return renderWithProviders(
        <Routes>
            <Route path="/auth/github/callback" element={<GitHubCallbackPage/>}/>
            <Route path="/auth" element={<AuthPage/>}/>
            <Route path="*" element={<ShowLocation/>}/>
        </Routes>,
        {route: `/auth/github/callback?${new URLSearchParams(params)}`}
    );
}

// As when GitHub sends the user back with a code for the sign in this tab started.
async function renderReturnedCode() {
    return renderCallback({code, state: await startedState()});
}

async function expectFailureOnAuthPage(message: string) {
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("heading", {name: "Sign in"})).toBeInTheDocument();
    expect(getRefreshToken()).toBeNull();
}

describe("GitHubCallbackPage", () => {
    it("sends the code once with its verifier and goes home", async () => {
        const requests = mockPost("/auth/github", 200, tokens);
        mockRequest("get", "/users/me", {body: user});

        await renderReturnedCode();

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation().pathname).toBe("/");
        expect(requests).toEqual([{code, codeVerifier: expect.stringMatching(/^[\w-]{43}$/), redirectUri}]);
        expect(getRefreshToken()).toBe(tokens.refreshToken);
    });

    it("shows progress while sending", async () => {
        const request = mockPendingPost("/auth/github", 401);

        await renderReturnedCode();

        expect(screen.getByText("Signing you in with GitHub…")).toBeInTheDocument();
        expect(screen.getByRole("progressbar")).toBeInTheDocument();
        await waitFor(() => expect(request.requestCount()).toBe(1));
        request.respond();
        await screen.findByRole("alert");
    });

    it.each([
        [401, "Signing in with GitHub failed. Please try again."],
        [403, "GitHub hasn't verified the primary email address of this account."],
        [404, "Signing in with GitHub isn't available right now."],
        [409, "An account with this email already exists and can't use this GitHub account. Try again, or sign in to it another way."],
        [429, "Too many attempts. Wait a moment and try again."],
        [503, "The service is temporarily unavailable. Please try again later."],
    ])("goes back to sign in with the message of a %i", async (status, message) => {
        mockProblem("/auth/github", status);

        await renderReturnedCode();

        await expectFailureOnAuthPage(message);
    });

    it("goes back to sign in with a network error", async () => {
        mockNetworkError("/auth/github");

        await renderReturnedCode();

        await expectFailureOnAuthPage("Can't reach the server. Check your connection and try again.");
    });

    it("doesn't send a code with a wrong state", async () => {
        const requests = mockPost("/auth/github", 200, tokens);
        await startedState();

        renderCallback({code, state: "forged"});

        await expectFailureOnAuthPage("Signing in with GitHub failed. Please try again.");
        expect(requests).toEqual([]);
    });

    it("doesn't send a code when no sign in was started", async () => {
        const requests = mockPost("/auth/github", 200, tokens);

        renderCallback({code, state: "state"});

        await expectFailureOnAuthPage("Signing in with GitHub failed. Please try again.");
        expect(requests).toEqual([]);
    });

    it("tells the user when consent was denied", async () => {
        renderCallback({error: "access_denied", state: await startedState()});

        await expectFailureOnAuthPage("Signing in with GitHub was cancelled.");
    });

    it("trusts no denial with a wrong state", async () => {
        await startedState();

        renderCallback({error: "access_denied", state: "forged"});

        await expectFailureOnAuthPage("Signing in with GitHub failed. Please try again.");
    });

    it("shows a failure for any other error from GitHub", async () => {
        renderCallback({error: "redirect_uri_mismatch", state: await startedState()});

        await expectFailureOnAuthPage("Signing in with GitHub failed. Please try again.");
    });
});
