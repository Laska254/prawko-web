import {act, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Route, Routes} from "react-router";
import {saveTokens} from "@/api/tokens.tsx";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import type {ProfilePageState} from "@/features/profile/gitHubLink.tsx";
import {RequireAuth} from "@/features/auth/guards/RequireAuth.tsx";
import {ProfilePage} from "@/features/profile/pages/ProfilePage.tsx";
import {changingEmailUser, gitHubSignInDto, tokens, user} from "@test/support/data.tsx";
import {holdRefreshLock} from "@test/support/refreshLock.tsx";
import {currentLocation, renderWithProviders} from "@test/support/render.tsx";
import {mockPost, mockRequest} from "@test/support/server.tsx";
import {ShowLocation} from "@test/support/ShowLocation.tsx";

// Signs in as `signedInUser` and opens the page behind `RequireAuth`, as the app does, with the navigation `state`.
// Returns the query client.
async function renderProfile(signedInUser: UserDto = user, state?: ProfilePageState) {
    saveTokens(tokens);
    mockRequest("get", "/users/me", {body: signedInUser});
    const {queryClient} = renderWithProviders(
        <Routes>
            <Route element={<RequireAuth/>}>
                <Route path="/profile" element={<ProfilePage/>}/>
            </Route>
            <Route path="*" element={<ShowLocation/>}/>
        </Routes>,
        {route: "/profile", state}
    );
    // Hidden too, as a dialog the state opens hides the page behind it.
    await screen.findByRole("heading", {name: "Profile", hidden: true});
    return queryClient;
}

// The value next to each label of the account's description list.
function accountFields() {
    return screen.getAllByRole("term").map(term => [term.textContent, term.nextElementSibling?.textContent]);
}

describe("ProfilePage", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("shows the account data", async () => {
        await renderProfile();

        expect(screen.getByRole("heading", {name: "Account"})).toBeInTheDocument();
        expect(accountFields()).toEqual([
            ["First name", "Jan"],
            ["Last name", "Kowalski"],
            ["Username", "jan"],
            ["Email", "jan@example.com"],
        ]);
    });

    it("tells when the provider didn't share the name", async () => {
        await renderProfile({...user, firstName: null, lastName: null});

        expect(accountFields()).toEqual([
            ["First name", "Not provided"],
            ["Last name", "Not provided"],
            ["Username", "jan"],
            ["Email", "jan@example.com"],
        ]);
    });

    it("shows the sign-in methods", async () => {
        await renderProfile({...user, providers: ["GITHUB"]});

        expect(screen.getByRole("heading", {name: "Sign-in methods"})).toBeInTheDocument();
        expect(screen.getByText("linked")).toBeInTheDocument();
    });

    it("shows a provider unlinked once the user is fetched again", async () => {
        const userEvents = userEvent.setup();
        await renderProfile({...user, providers: ["GOOGLE"]});
        mockRequest("delete", "/users/me/identities/google", {status: 204});
        mockRequest("get", "/users/me", {body: user});

        await userEvents.click(screen.getByRole("button", {name: "Unlink Google"}));
        await userEvents.type(screen.getByLabelText(/Current password/), "secret{Enter}");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.queryByText("linked")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "Unlink Google"})).not.toBeInTheDocument();
    });

    it("tells when linking GitHub failed on the way back from GitHub", async () => {
        await renderProfile(user, {failure: "link.gitHubInvalid"});

        expect(screen.getByRole("alert")).toHaveTextContent("Linking GitHub failed. Please try again.");
    });

    it("links GitHub with the code it came back with, and shows it linked", async () => {
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");
        const userEvents = userEvent.setup();
        await renderProfile(user, {gitHubLink: gitHubSignInDto});
        const requests = mockRequest("post", "/users/me/identities/github", {status: 204});
        mockRequest("get", "/users/me", {body: {...user, providers: ["GITHUB"]}});

        await userEvents.type(screen.getByLabelText(/Current password/), "secret{Enter}");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {...gitHubSignInDto, currentPassword: "secret"}}]);
        expect(screen.getByRole("button", {name: "Unlink GitHub"})).toBeInTheDocument();
    });

    it("drops the navigation state once read, so a reload doesn't send GitHub's code again", async () => {
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");
        saveTokens(tokens);
        mockRequest("get", "/users/me", {body: user});
        renderWithProviders(
            <Routes>
                <Route element={<RequireAuth/>}>
                    <Route path="/profile" element={<><ProfilePage/><ShowLocation/></>}/>
                </Route>
            </Routes>,
            {route: "/profile", state: {gitHubLink: gitHubSignInDto}}
        );
        await screen.findByRole("dialog");

        await waitFor(() => expect(currentLocation().state).toBeNull());
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("shows no email change banner without a pending change", async () => {
        await renderProfile();

        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("follows the email change as its links are opened in another tab or window", async () => {
        await renderProfile(changingEmailUser);
        expect(screen.getByRole("status")).toHaveTextContent("Email change in progress");

        mockRequest("get", "/users/me", {body: {...changingEmailUser, awaitingNewEmailConfirmation: false}});
        act(() => window.dispatchEvent(new Event("visibilitychange")));

        expect(await screen.findByText("opened")).toBeInTheDocument();

        mockRequest("get", "/users/me", {body: {...user, email: "jan.nowy@example.com"}});
        act(() => window.dispatchEvent(new Event("focus")));

        await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
        expect(accountFields()).toContainEqual(["Email", "jan.nowy@example.com"]);
    });

    it("stops fetching the user on focus once the page is left", async () => {
        const userEvents = userEvent.setup();
        const queryClient = await renderProfile(changingEmailUser);
        await userEvents.click(screen.getByRole("link", {name: "Settings"}));

        act(() => window.dispatchEvent(new Event("focus")));

        expect(queryClient.isFetching()).toBe(0);
    });

    it("opens the settings", async () => {
        const userEvents = userEvent.setup();
        await renderProfile();

        await userEvents.click(screen.getByRole("link", {name: "Settings"}));

        expect(currentLocation().pathname).toBe("/settings");
    });

    it("signs out", async () => {
        const logouts = mockPost("/auth/logout");
        const release = await holdRefreshLock();
        const userEvents = userEvent.setup();
        await renderProfile();

        await userEvents.click(screen.getByRole("button", {name: "Sign out"}));

        expect(screen.getByRole("button", {name: "Sign out"})).toBeDisabled();
        expect(screen.getByRole("progressbar")).toBeInTheDocument();

        await release();

        await waitFor(() => expect(currentLocation().pathname).toBe("/auth"));
        expect(logouts).toEqual([{refreshToken: "refresh-token"}]);
    });
});
