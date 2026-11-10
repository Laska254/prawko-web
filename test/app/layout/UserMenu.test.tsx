import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {getRefreshToken, saveTokens} from "@/api/tokens.tsx";
import {UserMenu} from "@/app/layout/UserMenu.tsx";
import {tokens, user} from "@test/support/data.tsx";
import {holdRefreshLock} from "@test/support/refreshLock.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockPost, mockRequest} from "@test/support/server.tsx";

describe("UserMenu", () => {
    it("is closed at first", () => {
        renderAtRoute(<UserMenu/>);

        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Account"})).toHaveAttribute("aria-expanded", "false");
    });

    it.each([
        ["Profile", "/profile"],
        ["Settings", "/settings"],
    ])("opens %s", async (item, pathname) => {
        const user = userEvent.setup();
        renderAtRoute(<UserMenu/>);

        await user.click(screen.getByRole("button", {name: "Account"}));
        await user.click(screen.getByRole("menuitem", {name: item}));

        expect(currentLocation().pathname).toBe(pathname);
    });

    it("closes with Escape", async () => {
        const user = userEvent.setup();
        renderAtRoute(<UserMenu/>);

        const button = screen.getByRole("button", {name: "Account"});
        await user.click(button);
        const menu = screen.getByRole("menu");
        expect(button).toHaveAttribute("aria-expanded", "true");
        await user.keyboard("{Escape}");

        await waitFor(() => expect(menu).not.toBeVisible());
        expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("shows it's signing out while a refresh holds the lock", async () => {
        saveTokens(tokens);
        mockRequest("get", "/users/me", {body: user});
        const logouts = mockPost("/auth/logout");
        const release = await holdRefreshLock();
        const userEvents = userEvent.setup();
        renderAtRoute(<UserMenu/>);

        await userEvents.click(screen.getByRole("button", {name: "Account"}));
        await userEvents.click(screen.getByRole("menuitem", {name: "Sign out"}));

        const signOut = screen.getByRole("menuitem", {name: "Sign out"});
        expect(signOut).toHaveAttribute("aria-disabled", "true");
        expect(screen.getByRole("progressbar", {name: "Loading"})).toBeInTheDocument();
        expect(getRefreshToken()).toBe("refresh-token");

        await release();

        await waitFor(() => expect(signOut).not.toHaveAttribute("aria-disabled"));
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
        expect(getRefreshToken()).toBeNull();
        expect(logouts).toEqual([{refreshToken: "refresh-token"}]);
    });
});
