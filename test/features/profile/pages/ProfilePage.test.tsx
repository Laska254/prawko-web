import {act, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Route, Routes} from "react-router";
import {saveTokens} from "@/api/tokens.tsx";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {RequireAuth} from "@/features/auth/guards/RequireAuth.tsx";
import {ProfilePage} from "@/features/profile/pages/ProfilePage.tsx";
import {changingEmailUser, tokens, user} from "@test/support/data.tsx";
import {holdRefreshLock} from "@test/support/refreshLock.tsx";
import {currentLocation, renderWithProviders} from "@test/support/render.tsx";
import {mockPost, mockRequest} from "@test/support/server.tsx";
import {ShowLocation} from "@test/support/ShowLocation.tsx";

// Signs in as `signedInUser` and opens the page behind `RequireAuth`, as the app does.
async function renderProfile(signedInUser: UserDto = user) {
    saveTokens(tokens);
    mockRequest("get", "/users/me", {body: signedInUser});
    renderWithProviders(
        <Routes>
            <Route element={<RequireAuth/>}>
                <Route path="/profile" element={<ProfilePage/>}/>
            </Route>
            <Route path="*" element={<ShowLocation/>}/>
        </Routes>,
        {route: "/profile"}
    );
    await screen.findByRole("heading", {name: "Profile"});
}

// The value next to each label of the account's description list.
function accountFields() {
    return screen.getAllByRole("term").map(term => [term.textContent, term.nextElementSibling?.textContent]);
}

describe("ProfilePage", () => {
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
