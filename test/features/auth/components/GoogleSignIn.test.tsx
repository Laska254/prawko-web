import {screen} from "@testing-library/react";
import {getRefreshToken} from "@/api/tokens.tsx";
import {GoogleSignIn} from "@/features/auth/components/GoogleSignIn.tsx";
import {googleSignInDto, tokens, user} from "@test/support/data.tsx";
import {loadGoogleScript} from "@test/support/googleScript.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockPendingPost, mockPost, mockProblem, mockRequest} from "@test/support/server.tsx";

const CLIENT_ID = "client-id";
const {idToken} = googleSignInDto;

const setUnavailable = vi.fn();

function renderGoogleSignIn() {
    return renderAtRoute(<GoogleSignIn clientId={CLIENT_ID} formType="login" setUnavailable={setUnavailable}/>, "/auth");
}

function findButton() {
    return screen.findByRole("button", {name: "Continue with Google"});
}

async function renderLoaded() {
    renderGoogleSignIn();
    const google = loadGoogleScript();
    await findButton();
    return google;
}

describe("GoogleSignIn", () => {
    afterEach(() => {
        setUnavailable.mockClear();
    });

    it("signs in with the ID token and goes home", async () => {
        const requests = mockPost("/auth/google", 200, tokens);
        mockRequest("get", "/users/me", {body: user});
        const {sendCredential} = await renderLoaded();

        await sendCredential(idToken);

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation().pathname).toBe("/");
        expect(requests).toEqual([googleSignInDto]);
        expect(getRefreshToken()).toBe(tokens.refreshToken);
    });

    it("blocks the button and shows progress while sending", async () => {
        const {respond} = mockPendingPost("/auth/google", 401);
        const {sendCredential} = await renderLoaded();
        const button = await findButton();
        expect(button.parentElement).not.toHaveAttribute("inert");

        await sendCredential(idToken);

        expect(await screen.findByRole("progressbar")).toBeInTheDocument();
        expect(button.parentElement).toHaveAttribute("inert");

        respond();

        expect(await screen.findByRole("alert")).toBeInTheDocument();
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
        expect(button.parentElement).not.toHaveAttribute("inert");
    });

    it.each([
        [401, "Signing in with Google failed. Please try again."],
        [403, "Google hasn't verified the email address of this account."],
        [404, "Signing in with Google isn't available right now."],
        [409, "An account with this email already exists and can't use this Google account. Try again, or sign in to it another way."],
    ])("shows the message of a %i and stays", async (status, message) => {
        mockProblem("/auth/google", status);
        const {sendCredential} = await renderLoaded();

        await sendCredential(idToken);

        expect(await screen.findByRole("alert")).toHaveTextContent(message);
        expect(screen.queryByTestId("location")).not.toBeInTheDocument();
        expect(getRefreshToken()).toBeNull();
    });
});
