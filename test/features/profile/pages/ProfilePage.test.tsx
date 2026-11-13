import {act, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Link, Route, Routes} from "react-router";
import {saveTokens} from "@/api/tokens.tsx";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import type {UserStatsDto} from "@/api/dto/UserStatsDto.tsx";
import type {ProfilePageState} from "@/features/profile/gitHubLink.tsx";
import {RequireAuth} from "@/features/auth/guards/RequireAuth.tsx";
import {ProfilePage} from "@/features/profile/pages/ProfilePage.tsx";
import {
    changingEmailUser,
    changingEmailUserWithoutPassword,
    gitHubSignInDto,
    problem,
    tokens,
    user,
    userWithoutPassword,
} from "@test/support/data.tsx";
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
    // The page fetches the user again on opening; a refetch on focus would join that fetch, which answers before the
    // test mocks the next user.
    await waitFor(() => expect(queryClient.isFetching({queryKey: ["users", "me"], exact: true})).toBe(0));
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
        const queryClient = await renderProfile({...user, providers: ["GOOGLE"]});
        const invalidate = vi.spyOn(queryClient, "invalidateQueries");
        mockRequest("delete", "/users/me/identities/google", {status: 204});
        mockRequest("get", "/users/me", {body: user});

        await userEvents.click(screen.getByRole("button", {name: "Unlink Google"}));
        await userEvents.type(screen.getByLabelText(/Current password/), "secret{Enter}");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.queryByText("linked")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "Unlink Google"})).not.toBeInTheDocument();
        // Only the user, not the stats under its key.
        expect(invalidate.mock.calls).toEqual([[{queryKey: ["users", "me"], exact: true}]]);
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
        expect(screen.getByRole("heading", {name: "Sign-in methods"})).toHaveFocus();
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

    it("leaves the focus on the page when the providers change in another tab or window", async () => {
        await renderProfile({...user, providers: ["GOOGLE"]});

        mockRequest("get", "/users/me", {body: user});
        act(() => window.dispatchEvent(new Event("focus")));

        await waitFor(() => expect(screen.queryByRole("button", {name: "Unlink Google"})).not.toBeInTheDocument());
        expect(document.body).toHaveFocus();
    });

    // Fetched again after a 409, the user is the same, as the GitHub account is another user's.
    it("leaves the focus on the page when a change here changed nothing and one elsewhere did", async () => {
        vi.stubEnv("VITE_GITHUB_CLIENT_ID", "client-id");
        const userEvents = userEvent.setup();
        await renderProfile(user, {gitHubLink: gitHubSignInDto});
        mockRequest("post", "/users/me/identities/github", {status: 409, body: problem(409)});
        const refetches = mockRequest("get", "/users/me", {body: user});
        await userEvents.type(screen.getByLabelText(/Current password/), "secret{Enter}");
        await waitFor(() => expect(refetches).toHaveLength(1));
        await waitFor(() => expect(document.body).toHaveFocus());

        mockRequest("get", "/users/me", {body: {...user, providers: ["GOOGLE"]}});
        act(() => window.dispatchEvent(new Event("focus")));

        await waitFor(() => expect(screen.getByRole("button", {name: "Unlink Google"})).toBeInTheDocument());
        expect(document.body).toHaveFocus();
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

    it("fetches the user again when opened, as another tab, window or device may have changed it", async () => {
        const userEvents = userEvent.setup();
        saveTokens(tokens);
        mockRequest("get", "/users/me", {body: changingEmailUser});
        mockRequest("get", "/users/me/stats", {body: noExams});
        renderWithProviders(
            <Routes>
                <Route element={<RequireAuth/>}>
                    <Route path="/" element={<Link to="/profile">Open profile</Link>}/>
                    <Route path="/profile" element={<ProfilePage/>}/>
                </Route>
            </Routes>
        );
        const link = await screen.findByRole("link", {name: "Open profile"});
        mockRequest("get", "/users/me", {body: {...changingEmailUser, awaitingNewEmailConfirmation: false}});

        await userEvents.click(link);

        expect(await screen.findByText("opened")).toBeInTheDocument();
    });

    it("stops fetching the user on focus once the page is left", async () => {
        const userEvents = userEvent.setup();
        const queryClient = await renderProfile(changingEmailUser);
        await userEvents.click(screen.getByRole("link", {name: "Settings"}));

        act(() => window.dispatchEvent(new Event("focus")));

        expect(queryClient.isFetching()).toBe(0);
    });

    it("shows the account edited without fetching the user again", async () => {
        const userEvents = userEvent.setup();
        const queryClient = await renderProfile();
        const fetchUser = vi.spyOn(queryClient, "fetchQuery");
        mockRequest("patch", "/users/1", {body: {...user, lastName: "Nowak"}});

        await userEvents.click(screen.getByRole("button", {name: "Edit profile"}));
        const lastName = screen.getByRole("textbox", {name: "Last name"});
        await userEvents.clear(lastName);
        await userEvents.type(lastName, "Nowak");
        await userEvents.click(screen.getByRole("button", {name: "Save"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(accountFields()).toContainEqual(["Last name", "Nowak"]);
        expect(fetchUser).not.toHaveBeenCalled();
        expect(queryClient.isFetching()).toBe(0);
    });

    it("shows the email change started without fetching the user again", async () => {
        const userEvents = userEvent.setup();
        const queryClient = await renderProfile(userWithoutPassword);
        const fetchUser = vi.spyOn(queryClient, "fetchQuery");
        mockRequest("patch", "/users/1", {body: changingEmailUserWithoutPassword});

        await userEvents.click(screen.getByRole("button", {name: "Change email"}));
        await userEvents.type(screen.getByRole("textbox", {name: "New email"}), "jan.nowy@example.com");
        await userEvents.click(screen.getByRole("button", {name: "Send links"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.getByRole("status")).toHaveTextContent("Email change in progress");
        expect(screen.getByRole("button", {name: "Resend in 60 s"})).toBeDisabled();
        expect(fetchUser).not.toHaveBeenCalled();
        expect(queryClient.isFetching()).toBe(0);
    });

    it("makes Resend wait when a new email change comes within the minute", async () => {
        const userEvents = userEvent.setup();
        await renderProfile(changingEmailUserWithoutPassword);
        mockRequest("patch", "/users/1", {status: 429, body: problem(429)});
        expect(screen.getByRole("button", {name: "Resend links"})).toBeEnabled();

        await userEvents.click(screen.getByRole("button", {name: "Change email"}));
        await userEvents.type(screen.getByRole("textbox", {name: "New email"}), "jan.inny@example.com");
        await userEvents.click(screen.getByRole("button", {name: "Send links"}));
        expect(await screen.findByRole("alert"))
            .toHaveTextContent("A link was sent less than a minute ago. Wait a moment and try again.");
        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.getByRole("button", {name: "Resend in 60 s"})).toBeDisabled();
    });

    it("shows the email change cancelled with the user fetched only before cancelling", async () => {
        const userEvents = userEvent.setup();
        const queryClient = await renderProfile(changingEmailUser);
        const fetches = mockRequest("get", "/users/me", {body: changingEmailUser});
        mockRequest("patch", "/users/1", {body: user});

        await userEvents.click(screen.getByRole("button", {name: "Cancel change"}));
        await userEvents.click(screen.getByRole("button", {name: "Cancel change"}));

        await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(fetches).toHaveLength(1);
        expect(queryClient.isFetching()).toBe(0);
    });

    describe("the password", () => {
        // Changes the password, after which the user is fetched again as `fetchedUser`.
        async function changePassword(fetchedUser: UserDto) {
            const userEvents = userEvent.setup();
            mockPost("/auth/refresh", 200, tokens);
            mockPost("/auth", 200, tokens);
            mockRequest("patch", "/users/me/password", {status: 204});
            mockRequest("get", "/users/me", {body: fetchedUser});

            await userEvents.click(screen.getByRole("button", {name: "Change password"}));
            await userEvents.type(screen.getByLabelText(/^Current password/), "secret1");
            await userEvents.type(screen.getByLabelText(/^New password/), "secret2");
            await userEvents.type(screen.getByLabelText(/^Confirm new password/), "secret2");
            await userEvents.click(screen.getByRole("button", {name: "Save"}));
            await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
            return userEvents;
        }

        it("tells the password was changed until the notice is closed", async () => {
            await renderProfile();

            const userEvents = await changePassword(user);

            expect(screen.getByRole("status")).toHaveTextContent("Your password has been changed.");
            await userEvents.click(screen.getByRole("button", {name: "Close"}));
            expect(screen.queryByRole("status")).not.toBeInTheDocument();
        });

        it("tells the pending email change was cancelled, and drops its banner", async () => {
            await renderProfile(changingEmailUser);
            expect(screen.getByRole("status")).toHaveTextContent("Email change in progress");

            await changePassword(user);

            expect(screen.getByRole("status")).toHaveTextContent(
                "Your password has been changed. The email change to jan.nowy@example.com was cancelled."
            );
        });

        it("is replaced by a link to set one without a password, and tells once the link was sent", async () => {
            const userEvents = userEvent.setup();
            await renderProfile(userWithoutPassword);
            mockPost("/auth/password/forgot");
            expect(screen.queryByRole("button", {name: "Change password"})).not.toBeInTheDocument();

            await userEvents.click(screen.getByRole("button", {name: "Set a password"}));
            await userEvents.click(screen.getByRole("button", {name: "Send link"}));

            await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
            expect(screen.getByRole("status"))
                .toHaveTextContent("We sent a link to set your password to jan@example.com.");
        });
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
