import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {getRefreshToken, saveTokens} from "@/api/tokens.tsx";
import {ConfirmAccountDeletionPage} from "@/features/auth/pages/ConfirmAccountDeletionPage.tsx";
import {currentUserQuery} from "@/session/currentUserQuery.tsx";
import {tokens, user as sampleUser} from "@test/support/data.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockNetworkError, mockPendingRequest, mockPost, mockProblem, mockRequest} from "@test/support/server.tsx";

const PATH = "/users/deletion/confirm";

// Answers the confirmation with the deleted account's ID, the sample user's unless given.
function mockDeleted(id = sampleUser.id): unknown[] {
    return mockPost(PATH, 200, {id});
}

// Signs in as the sample user and waits for the session to load.
async function renderSignedIn() {
    saveTokens(tokens);
    mockRequest("get", "/users/me", {body: sampleUser});
    const {queryClient} = renderPage();
    await waitFor(() => expect(queryClient.getQueryData(currentUserQuery.queryKey)).toEqual(sampleUser));
}

function renderPage(route = "/account/delete/confirm?token=token") {
    return renderAtRoute(<ConfirmAccountDeletionPage/>, route);
}

describe("ConfirmAccountDeletionPage", () => {
    it("deletes the account only once confirmed and goes to sign in with a notice", async () => {
        const user = userEvent.setup();
        const requests = mockDeleted();
        renderPage();

        expect(screen.getByRole("heading", {name: "Delete your account?"})).toBeInTheDocument();
        expect(screen.getByText("Your account and exam history will be deleted permanently. This can't be undone."))
            .toBeInTheDocument();
        expect(requests).toEqual([]);
        await user.click(screen.getByRole("button", {name: "Delete account"}));

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toMatchObject({pathname: "/auth", state: {notice: "accountDeleted"}});
        expect(requests).toEqual([{token: "token"}]);
    });

    it("ends the session signed in", async () => {
        const user = userEvent.setup();
        mockDeleted();
        await renderSignedIn();

        await user.click(screen.getByRole("button", {name: "Delete account"}));

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toMatchObject({pathname: "/auth", state: {notice: "accountDeleted"}});
        expect(getRefreshToken()).toBeNull();
    });

    it("disables the button while deleting", async () => {
        const user = userEvent.setup();
        const request = mockPendingRequest("post", PATH, {body: {id: sampleUser.id}});
        renderPage();

        await user.click(screen.getByRole("button", {name: "Delete account"}));

        await waitFor(() => expect(request.requestCount()).toBe(1));
        expect(screen.getByRole("button", {name: "Delete account"})).toBeDisabled();
        request.respond();
        expect(await screen.findByTestId("location")).toBeInTheDocument();
    });

    it.each([
        ["without details", undefined],
        ["with field details", {token: "Token must not be blank."}],
    ])("points to the profile for a new link on a 400 %s signed in", async (_, details) => {
        const user = userEvent.setup();
        saveTokens(tokens);
        mockRequest("get", "/users/me", {body: sampleUser});
        mockProblem(PATH, 400, details);
        renderPage();

        await user.click(screen.getByRole("button", {name: "Delete account"}));

        expect(await screen.findByRole("heading", {name: "Invalid link"})).toBeInTheDocument();
        expect(screen.getByText("This link is invalid or has expired. Ask for a new one from your profile."))
            .toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "Delete account"})).not.toBeInTheDocument();
        await user.click(await screen.findByRole("link", {name: "Go to profile"}));
        expect(currentLocation().pathname).toBe("/profile");
        expect(getRefreshToken()).toBe(tokens.refreshToken);
    });

    it("points to sign in on a 400 signed out", async () => {
        const user = userEvent.setup();
        mockProblem(PATH, 400);
        renderPage();

        await user.click(screen.getByRole("button", {name: "Delete account"}));

        expect(await screen.findByRole("heading", {name: "Invalid link"})).toBeInTheDocument();
        expect(screen.queryByRole("link", {name: "Go to profile"})).not.toBeInTheDocument();
        await user.click(screen.getByRole("link", {name: "Back to sign in"}));
        expect(currentLocation().pathname).toBe("/auth");
    });

    it("shows an invalid link without a token and sends nothing", () => {
        const requests = mockPost(PATH);

        renderPage("/account/delete/confirm");

        expect(screen.getByRole("heading", {name: "Invalid link"})).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "Delete account"})).not.toBeInTheDocument();
        expect(requests).toEqual([]);
    });

    it("shows other errors and keeps the session, then deletes on another try", async () => {
        const user = userEvent.setup();
        saveTokens(tokens);
        mockRequest("get", "/users/me", {body: sampleUser});
        mockNetworkError(PATH);
        renderPage();
        await user.click(screen.getByRole("button", {name: "Delete account"}));

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Can't reach the server. Check your connection and try again.");
        expect(getRefreshToken()).toBe(tokens.refreshToken);

        const requests = mockDeleted();
        await user.click(screen.getByRole("button", {name: "Delete account"}));

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toMatchObject({pathname: "/auth", state: {notice: "accountDeleted"}});
        expect(requests).toEqual([{token: "token"}]);
    });

    it("keeps the session and says so when another user's account was deleted", async () => {
        const user = userEvent.setup();
        mockDeleted(sampleUser.id + 1);
        await renderSignedIn();

        await user.click(screen.getByRole("button", {name: "Delete account"}));

        expect(await screen.findByRole("heading", {name: "Account deleted"})).toBeInTheDocument();
        expect(screen.getByText("The account this link was sent for and its exam history have been deleted. "
            + "You're still signed in to your own account.")).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "Delete account"})).not.toBeInTheDocument();
        expect(getRefreshToken()).toBe(tokens.refreshToken);
        await user.click(screen.getByRole("link", {name: "Go home"}));
        expect(currentLocation().pathname).toBe("/");
    });

    it("keeps the account home", async () => {
        const user = userEvent.setup();
        const requests = mockPost(PATH);
        renderPage();

        await user.click(screen.getByRole("link", {name: "Keep my account"}));

        expect(currentLocation().pathname).toBe("/");
        expect(requests).toEqual([]);
    });
});
