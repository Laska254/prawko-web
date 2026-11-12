import {act, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Route, Routes} from "react-router";
import {saveTokens} from "@/api/tokens.tsx";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import type {UserStatsDto} from "@/api/dto/UserStatsDto.tsx";
import type {ProfilePageState} from "@/features/profile/gitHubLink.tsx";
import {RequireAuth} from "@/features/auth/guards/RequireAuth.tsx";
import {ProfilePage} from "@/features/profile/pages/ProfilePage.tsx";
import {changingEmailUser, gitHubSignInDto, problem, tokens, user} from "@test/support/data.tsx";
import {holdRefreshLock} from "@test/support/refreshLock.tsx";
import {currentLocation, renderWithProviders} from "@test/support/render.tsx";
import {mockPost, mockRequest} from "@test/support/server.tsx";
import {ShowLocation} from "@test/support/ShowLocation.tsx";

const noExams: UserStatsDto = {examsTaken: 0, examsPassed: 0, averageScore: null, bestScore: null, categories: []};

// Signs in as `signedInUser` and opens the page behind `RequireAuth`, as the app does, with the navigation `state`.
// Returns the query client.
async function renderProfile(signedInUser: UserDto = user, state?: ProfilePageState) {
    saveTokens(tokens);
    mockRequest("get", "/users/me", {body: signedInUser});
    mockRequest("get", "/users/me/stats", {body: noExams});
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

    it("shows a provider unlinked elsewhere once the dialog telling so is closed", async () => {
        const userEvents = userEvent.setup();
        await renderProfile({...user, providers: ["GOOGLE"]});
        mockRequest("delete", "/users/me/identities/google", {status: 404, body: problem(404)});
        mockRequest("get", "/users/me", {body: user});

        await userEvents.click(screen.getByRole("button", {name: "Unlink Google"}));
        await userEvents.type(screen.getByLabelText(/Current password/), "secret{Enter}");
        expect(await screen.findByRole("alert")).toHaveTextContent("Google is no longer linked to your account.");
        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("button", {name: "Unlink Google"})).not.toBeInTheDocument());
        expect(screen.queryByText("linked")).not.toBeInTheDocument();
    });

    // The dialog goes with the Unlink button, as the row offers Google's button instead.
    it("moves the focus to the sign-in methods once a provider is unlinked", async () => {
        const userEvents = userEvent.setup();
        await renderProfile({...user, providers: ["GOOGLE"]});
        mockRequest("delete", "/users/me/identities/google", {status: 204});
        mockRequest("get", "/users/me", {body: user});

        await userEvents.click(screen.getByRole("button", {name: "Unlink Google"}));
        await userEvents.type(screen.getByLabelText(/Current password/), "secret{Enter}");

        await waitFor(() => expect(screen.getByRole("heading", {name: "Sign-in methods"})).toHaveFocus());
    });

    it("keeps the focus where it is when the providers change in another tab or window", async () => {
        await renderProfile({...user, providers: ["GOOGLE"]});
        const settings = screen.getByRole("link", {name: "Settings"});
        act(() => settings.focus());

        mockRequest("get", "/users/me", {body: user});
        act(() => window.dispatchEvent(new Event("focus")));

        await waitFor(() => expect(screen.queryByRole("button", {name: "Unlink Google"})).not.toBeInTheDocument());
        expect(settings).toHaveFocus();
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

    // GitHub's code works once: sent again, the server's 401 would sign the user out.
    it("doesn't ask to link GitHub with the used code again once it's unlinked", async () => {
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");
        const userEvents = userEvent.setup();
        await renderProfile(user, {gitHubLink: gitHubSignInDto});
        mockRequest("post", "/users/me/identities/github", {status: 204});
        mockRequest("get", "/users/me", {body: {...user, providers: ["GITHUB"]}});
        await userEvents.type(screen.getByLabelText(/Current password/), "secret{Enter}");
        await userEvents.click(await screen.findByRole("button", {name: "Unlink GitHub"}));
        mockRequest("delete", "/users/me/identities/github", {status: 204});
        mockRequest("get", "/users/me", {body: user});

        await userEvents.type(screen.getByLabelText(/Current password/), "secret{Enter}");

        expect(await screen.findByRole("button", {name: "Continue with GitHub"})).toBeInTheDocument();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("drops the navigation state once read, so a reload doesn't send GitHub's code again", async () => {
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");
        saveTokens(tokens);
        mockRequest("get", "/users/me", {body: user});
        mockRequest("get", "/users/me/stats", {body: noExams});
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

    it("shows the exam statistics", async () => {
        await renderProfile();

        const stats = screen.getByRole("region", {name: "Exam statistics"});
        expect(await within(stats).findByRole("link", {name: "Start an exam"})).toBeInTheDocument();
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
