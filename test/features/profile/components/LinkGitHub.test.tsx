import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {GitHubSignInDto} from "@/api/dto/GitHubSignInDto.tsx";
import {takeGitHubAuthorization} from "@/components/github/gitHubAuthorization.tsx";
import {LinkGitHub} from "@/features/profile/components/LinkGitHub.tsx";
import {gitHubSignInDto, problem} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockNetworkError, mockRequest} from "@test/support/server.tsx";

const PATH = "/users/me/identities/github";

function renderLinkGitHub(returned?: GitHubSignInDto, hasPassword = true) {
    return renderWithProviders(
        <LinkGitHub clientId="client-id" name="GitHub" hasPassword={hasPassword} returned={returned}/>
    );
}

describe("LinkGitHub", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("goes to GitHub to come back to the link callback", async () => {
        const assign = vi.fn();
        vi.stubGlobal("location", {...window.location, assign});
        renderLinkGitHub();

        await userEvent.setup().click(screen.getByRole("button", {name: "Continue with GitHub"}));

        await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
        const {searchParams} = new URL(assign.mock.calls[0][0]);
        expect(searchParams.get("redirect_uri")).toBe(`${window.location.origin}/auth/github/callback/link`);
        expect(takeGitHubAuthorization(searchParams.get("state"))).not.toBeNull();
    });

    it("asks nothing until GitHub's code comes back", () => {
        renderLinkGitHub();

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("asks for the password with GitHub's code, and links with both", async () => {
        const requests = mockRequest("post", PATH, {status: 204});
        const userEvents = userEvent.setup();
        const {queryClient} = renderLinkGitHub(gitHubSignInDto);
        const invalidate = vi.spyOn(queryClient, "invalidateQueries");

        expect(screen.getByRole("dialog", {
            name: "Link GitHub?",
            description: "You'll be able to sign in with this GitHub account too. Enter your password to confirm.",
        })).toBeInTheDocument();
        await userEvents.type(screen.getByLabelText(/Current password/), "secret1{Enter}");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {...gitHubSignInDto, currentPassword: "secret1"}}]);
        expect(invalidate).toHaveBeenCalledWith({queryKey: ["users"]});
    });

    it("links without a password when the user has none", async () => {
        const requests = mockRequest("post", PATH, {status: 204});
        renderLinkGitHub(gitHubSignInDto, false);

        await userEvent.setup().click(screen.getByRole("button", {name: "Link"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {...gitHubSignInDto, currentPassword: null}}]);
    });

    it("links nothing when cancelled", async () => {
        const requests = mockRequest("post", PATH, {status: 204});
        renderLinkGitHub(gitHubSignInDto);

        await userEvent.setup().click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
    });

    it.each([
        [problem(400)],
        [problem(400, {currentPassword: "must not be blank"})],
    ])("keeps the dialog open with the error of a 400 (%o)", async body => {
        mockRequest("post", PATH, {status: 400, body});
        renderLinkGitHub(gitHubSignInDto);

        await userEvent.setup().type(screen.getByLabelText(/Current password/), "wrong{Enter}");

        expect(await screen.findByRole("alert")).toHaveTextContent("The password is incorrect.");
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it.each([
        [403, problem(403), "GitHub hasn't verified the primary email address of this account."],
        [404, problem(404), "Linking GitHub isn't available right now."],
        [409, problem(409), "This GitHub account is linked to another user, or you already have one linked."],
        [500, undefined, "Something went wrong. Please try again later."],
    ])("closes the dialog and shows the error of a %i by the button, as GitHub's code is used up", async (status, body,
                                                                                                         message) => {
        mockRequest("post", PATH, {status, body});
        renderLinkGitHub(gitHubSignInDto);

        await userEvent.setup().type(screen.getByLabelText(/Current password/), "wrong{Enter}");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.getByRole("alert")).toHaveTextContent(message);
        expect(screen.getByRole("button", {name: "Continue with GitHub"})).toBeInTheDocument();
    });

    // The request may have reached the server, so the code may be used up too.
    it("closes the dialog after a network error", async () => {
        mockNetworkError(PATH);
        renderLinkGitHub(gitHubSignInDto);

        await userEvent.setup().type(screen.getByLabelText(/Current password/), "secret1{Enter}");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.getByRole("alert")).toHaveTextContent("Can't reach the server.");
    });

    it("shows no error by the button after a wrong password is cancelled", async () => {
        mockRequest("post", PATH, {status: 400, body: problem(400)});
        const userEvents = userEvent.setup();
        renderLinkGitHub(gitHubSignInDto);
        await userEvents.type(screen.getByLabelText(/Current password/), "wrong{Enter}");
        await screen.findByRole("alert");

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("tries the same code again with another password", async () => {
        mockRequest("post", PATH, {status: 400, body: problem(400)});
        const userEvents = userEvent.setup();
        renderLinkGitHub(gitHubSignInDto);
        await userEvents.type(screen.getByLabelText(/Current password/), "wrong{Enter}");
        await screen.findByRole("alert");
        const requests = mockRequest("post", PATH, {status: 204});

        await userEvents.clear(screen.getByLabelText(/Current password/));
        await userEvents.type(screen.getByLabelText(/Current password/), "secret1{Enter}");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {...gitHubSignInDto, currentPassword: "secret1"}}]);
    });
});
