import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {saveTokens} from "@/api/tokens.tsx";
import {VerifyEmailPage} from "@/features/auth/pages/VerifyEmailPage.tsx";
import {currentUserQuery} from "@/session/currentUserQuery.tsx";
import {changingEmailUser, tokens, user as sampleUser} from "@test/support/data.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {
    mockNetworkError,
    mockPendingPost,
    mockPendingRequest,
    mockPost,
    mockProblem,
    mockRequest,
} from "@test/support/server.tsx";

// Signs in as `signedInUser`, whose session loads once the page is rendered.
function signIn(signedInUser: UserDto = changingEmailUser): void {
    saveTokens(tokens);
    mockRequest("get", "/users/me", {body: signedInUser});
}

// Opens the link signed in as `signedInUser`, with the server answering `status`, and waits for the session to
// load before the answer. The user is `updated` when fetched again. Returns the query client.
async function verifySignedIn(status: number, updated: UserDto, signedInUser: UserDto = changingEmailUser) {
    signIn(signedInUser);
    const request = mockPendingPost("/auth/verify", status);
    const {queryClient} = renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");
    await waitFor(() => expect(queryClient.getQueryData(currentUserQuery.queryKey)).toEqual(signedInUser));

    mockRequest("get", "/users/me", {body: updated});
    request.respond();
    return queryClient;
}

describe("VerifyEmailPage", () => {
    it("verifies the token once and goes to sign in with a notice", async () => {
        const requests = mockPost("/auth/verify");

        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toMatchObject({pathname: "/auth", state: {notice: "verified"}});
        expect(requests).toEqual([{token: "token"}]);
    });

    it("shows progress while verifying", async () => {
        const request = mockPendingPost("/auth/verify");

        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(screen.getByText("Verifying your email…")).toBeInTheDocument();
        await waitFor(() => expect(request.requestCount()).toBe(1));
        request.respond();
        expect(await screen.findByTestId("location")).toBeInTheDocument();
    });

    it("offers a new link when verification fails", async () => {
        const user = userEvent.setup();
        mockPost("/auth/verify", 400);
        const requests = mockPost("/auth/verify/resend");
        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByRole("heading", {name: "Verification failed"})).toBeInTheDocument();
        expect(screen.getByText("This verification link is invalid or has expired. Enter your email to get a new one."))
            .toBeInTheDocument();
        expect(screen.getByText("Changing your email? Sign in and send the links again from your profile."))
            .toBeInTheDocument();
        await user.type(screen.getByRole("textbox", {name: "Email"}), "jan@example.com");
        await user.click(screen.getByRole("button", {name: "Send new link"}));

        expect(await screen.findByText("If an unverified account uses this email, a new link is on its way."))
            .toBeInTheDocument();
        expect(requests).toEqual([{email: "jan@example.com"}]);
    });

    it("treats a 400 with field details as an invalid link", async () => {
        mockProblem("/auth/verify", 400, {token: "Token must not be blank."});

        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByRole("heading", {name: "Verification failed"})).toBeInTheDocument();
    });

    it("shows a generic error instead of an invalid link on other errors", async () => {
        mockPost("/auth/verify", 503);

        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("The service is temporarily unavailable. Please try again later.");
        expect(screen.queryByRole("heading", {name: "Verification failed"})).not.toBeInTheDocument();
    });

    it("verifies again on retry", async () => {
        const user = userEvent.setup();
        mockNetworkError("/auth/verify");
        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");
        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Can't reach the server. Check your connection and try again.");

        const request = mockPendingPost("/auth/verify");
        await user.click(screen.getByRole("button", {name: "Try again"}));

        expect(screen.getByText("Verifying your email…")).toBeInTheDocument();
        request.respond();
        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toMatchObject({pathname: "/auth", state: {notice: "verified"}});
        expect(request.requestCount()).toBe(1);
    });

    it("links back to sign in from an error", async () => {
        const user = userEvent.setup();
        mockPost("/auth/verify", 500);
        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        await user.click(await screen.findByRole("link", {name: "Back to sign in"}));

        expect(currentLocation().pathname).toBe("/auth");
    });

    it("fails without a token", async () => {
        const user = userEvent.setup();
        const requests = mockPost("/auth/verify");
        renderAtRoute(<VerifyEmailPage/>, "/auth/verify");

        expect(screen.getByRole("heading", {name: "Verification failed"})).toBeInTheDocument();
        expect(requests).toEqual([]);

        await user.click(screen.getByRole("link", {name: "Back to sign in"}));
        expect(currentLocation().pathname).toBe("/auth");
    });

    it("asks for the other link when the email change awaits it", async () => {
        mockPost("/auth/verify", 202);

        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByRole("heading", {name: "One more link"})).toBeInTheDocument();
        expect(screen.getByText(
            "This address is confirmed. Open the link we sent to your other address to finish changing your email."
        )).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "Back to sign in"})).toBeInTheDocument();
        expect(screen.queryByTestId("location")).not.toBeInTheDocument();
    });

    it("refetches the user and points a signed-in user to the profile when the change awaits the other link",
        async () => {
            const user = userEvent.setup();
            const updated: UserDto = {...changingEmailUser, awaitingNewEmailConfirmation: false};

            const queryClient = await verifySignedIn(202, updated);

            expect(await screen.findByRole("heading", {name: "One more link"})).toBeInTheDocument();
            expect(queryClient.getQueryData(currentUserQuery.queryKey)).toEqual(updated);
            await user.click(screen.getByRole("link", {name: "Go to profile"}));
            expect(currentLocation().pathname).toBe("/profile");
        });

    it("shows a signed-in user their completed email change with the user fetched again", async () => {
        const changed: UserDto = {...sampleUser, email: "jan.nowy@example.com"};

        const queryClient = await verifySignedIn(204, changed);

        expect(await screen.findByRole("heading", {name: "Email changed"})).toBeInTheDocument();
        expect(screen.getByText("Your account uses the new email address now.")).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "Go to profile"})).toBeInTheDocument();
        expect(queryClient.getQueryData(currentUserQuery.queryKey)).toEqual(changed);
        expect(screen.queryByTestId("location")).not.toBeInTheDocument();
    });

    it("tells a signed-in user without a pending change neutrally that the link is verified", async () => {
        const user = userEvent.setup();

        await verifySignedIn(204, sampleUser, sampleUser);

        expect(await screen.findByRole("heading", {name: "Email verified"})).toBeInTheDocument();
        expect(screen.getByText("The email address of this link is confirmed.")).toBeInTheDocument();
        expect(screen.queryByRole("heading", {name: "Email changed"})).not.toBeInTheDocument();
        await user.click(screen.getByRole("link", {name: "Go to profile"}));
        expect(currentLocation().pathname).toBe("/profile");
    });

    it("waits for the session before sending the token", async () => {
        saveTokens(tokens);
        const session = mockPendingRequest("get", "/users/me", {body: sampleUser});
        const requests = mockPost("/auth/verify");
        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        await waitFor(() => expect(session.requestCount()).toBe(1));
        expect(screen.getByText("Verifying your email…")).toBeInTheDocument();
        expect(requests).toEqual([]);
        session.respond();

        expect(await screen.findByRole("heading", {name: "Email verified"})).toBeInTheDocument();
        expect(requests).toEqual([{token: "token"}]);
    });

    it("shows a completed email change when the session loads after the page opens", async () => {
        saveTokens(tokens);
        const session = mockPendingRequest("get", "/users/me", {body: changingEmailUser});
        mockPost("/auth/verify");
        const {queryClient} = renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");
        await waitFor(() => expect(session.requestCount()).toBe(1));

        const changed: UserDto = {...sampleUser, email: "jan.nowy@example.com"};
        session.respond();
        mockRequest("get", "/users/me", {body: changed});

        expect(await screen.findByRole("heading", {name: "Email changed"})).toBeInTheDocument();
        expect(queryClient.getQueryData(currentUserQuery.queryKey)).toEqual(changed);
    });

    it("shows a session error instead of going to sign in and the result on retry", async () => {
        const user = userEvent.setup();
        saveTokens(tokens);
        mockRequest("get", "/users/me", {status: 503});
        const requests = mockPost("/auth/verify");
        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Your account couldn't be loaded. Check your connection and try again.");
        expect(screen.queryByTestId("location")).not.toBeInTheDocument();

        mockRequest("get", "/users/me", {body: sampleUser});
        await user.click(screen.getByRole("button", {name: "Try again"}));

        expect(await screen.findByRole("heading", {name: "Email verified"})).toBeInTheDocument();
        expect(requests).toHaveLength(1);
    });

    it("tells that the new email was taken meanwhile, without offering a new link", async () => {
        mockProblem("/auth/verify", 409, {email: "User with email 'jan.nowy@example.com' already exists."});

        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByRole("heading", {name: "Email already taken"})).toBeInTheDocument();
        expect(screen.getByText("Another account uses the new address by now, so your email can't change to it. "
            + "Change it to a different address from your profile.")).toBeInTheDocument();
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
        expect(screen.getByRole("link", {name: "Back to sign in"})).toBeInTheDocument();
    });

    it("points a signed-in user to the profile when the new email was taken", async () => {
        signIn();
        mockProblem("/auth/verify", 409, {email: "User with email 'jan.nowy@example.com' already exists."});

        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByRole("heading", {name: "Email already taken"})).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "Go to profile"})).toBeInTheDocument();
    });

    it("offers a retry when the user was modified meanwhile", async () => {
        signIn();
        mockProblem("/auth/verify", 409);

        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByRole("alert")).toHaveTextContent("Your account changed in the meantime. Try again.");
        expect(screen.getByRole("button", {name: "Try again"})).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "Go to profile"})).toBeInTheDocument();
    });

    it("points a signed-in user to the profile instead of offering a new link when verification fails", async () => {
        signIn();
        mockPost("/auth/verify", 400);

        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByRole("heading", {name: "Verification failed"})).toBeInTheDocument();
        expect(screen.getByText(
            "This link is invalid or has expired. To change your email, send the links again from your profile."
        )).toBeInTheDocument();
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
        expect(screen.getByRole("link", {name: "Go to profile"})).toBeInTheDocument();
    });
});
