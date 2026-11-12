import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {LinkGoogle} from "@/features/profile/components/LinkGoogle.tsx";
import {problem} from "@test/support/data.tsx";
import {failGoogleScript, loadGoogleScript} from "@test/support/googleScript.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockPendingRequest, mockRequest} from "@test/support/server.tsx";

const PATH = "/users/me/identities/google";
const ID_TOKEN = "google-id-token";

// Renders the button and picks a Google account with it; returns the user events, the mock fetching the user again
// and a way to pick another account.
async function pickAccount(hasPassword = true) {
    const userEvents = userEvent.setup();
    const refetchUser = vi.fn(() => Promise.resolve());
    renderWithProviders(
        <LinkGoogle clientId="client-id" name="Google" hasPassword={hasPassword} refetchUser={refetchUser}/>
    );
    const {sendCredential} = loadGoogleScript();
    await screen.findByRole("button", {name: "Continue with Google"});
    await sendCredential(ID_TOKEN);
    return {userEvents, refetchUser, sendCredential};
}

describe("LinkGoogle", () => {
    it("asks for the password once an account is picked, and links it with both", async () => {
        const requests = mockRequest("post", PATH, {status: 204});
        const {userEvents, refetchUser} = await pickAccount();

        expect(screen.getByRole("dialog", {
            name: "Link Google?",
            description: "You'll be able to sign in with this Google account too. Enter your password to confirm.",
        })).toBeInTheDocument();
        await userEvents.type(screen.getByLabelText(/Current password/), "secret1{Enter}");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {idToken: ID_TOKEN, currentPassword: "secret1"}}]);
        expect(refetchUser).toHaveBeenCalledTimes(1);
    });

    it("links without a password when the user has none", async () => {
        const requests = mockRequest("post", PATH, {status: 204});
        const {userEvents} = await pickAccount(false);

        expect(screen.queryByLabelText(/Current password/)).not.toBeInTheDocument();
        await userEvents.click(screen.getByRole("button", {name: "Link"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {idToken: ID_TOKEN, currentPassword: null}}]);
    });

    it("links nothing when cancelled", async () => {
        const requests = mockRequest("post", PATH, {status: 204});
        const {userEvents} = await pickAccount();

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
    });

    it("blocks Google's button while linking", async () => {
        const {respond} = mockPendingRequest("post", PATH, {status: 204});
        const {userEvents} = await pickAccount(false);

        await userEvents.click(screen.getByRole("button", {name: "Link"}));

        await waitFor(() => expect(screen.getByRole("button", {name: "Link"})).toBeDisabled());
        expect(document.querySelector("[inert]")).toBeInTheDocument();
        respond();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it.each([
        [400, "The password is incorrect."],
        [404, "Linking Google isn't available right now."],
        [409, "This Google account is linked to another user, or you already have one linked."],
    ])("keeps the dialog open with the error of a %i", async (status, message) => {
        mockRequest("post", PATH, {status, body: problem(status)});
        const {userEvents} = await pickAccount();

        await userEvents.type(screen.getByLabelText(/Current password/), "wrong{Enter}");

        expect(await screen.findByRole("alert")).toHaveTextContent(message);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("tries the same account again with another password", async () => {
        mockRequest("post", PATH, {status: 400, body: problem(400)});
        const {userEvents} = await pickAccount();
        await userEvents.type(screen.getByLabelText(/Current password/), "wrong{Enter}");
        await screen.findByRole("alert");
        const requests = mockRequest("post", PATH, {status: 204});

        await userEvents.clear(screen.getByLabelText(/Current password/));
        await userEvents.type(screen.getByLabelText(/Current password/), "secret1{Enter}");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {idToken: ID_TOKEN, currentPassword: "secret1"}}]);
    });

    // A Google account may have been linked to the user elsewhere since loading.
    it("fetches the user again once the dialog of a 409 is closed", async () => {
        mockRequest("post", PATH, {status: 409, body: problem(409)});
        const {userEvents, refetchUser} = await pickAccount();
        await userEvents.type(screen.getByLabelText(/Current password/), "secret1{Enter}");
        await screen.findByRole("alert");
        expect(refetchUser).not.toHaveBeenCalled();

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        expect(refetchUser).toHaveBeenCalledTimes(1);
    });

    it("doesn't fetch the user again once the dialog of a wrong password is closed", async () => {
        mockRequest("post", PATH, {status: 400, body: problem(400)});
        const {userEvents, refetchUser} = await pickAccount();
        await userEvents.type(screen.getByLabelText(/Current password/), "wrong{Enter}");
        await screen.findByRole("alert");

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(refetchUser).not.toHaveBeenCalled();
    });

    it("drops the last error when another account is picked", async () => {
        mockRequest("post", PATH, {status: 409, body: problem(409)});
        const {userEvents, sendCredential} = await pickAccount();
        await userEvents.type(screen.getByLabelText(/Current password/), "secret1{Enter}");
        await screen.findByRole("alert");
        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

        await sendCredential("another-id-token");

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("leaves the button out when Google's script can't be loaded", async () => {
        const {container} = renderWithProviders(
            <LinkGoogle clientId="client-id" name="Google" hasPassword refetchUser={vi.fn()}/>
        );

        failGoogleScript();

        await waitFor(() => expect(container).toBeEmptyDOMElement());
    });
});
