import {screen, within} from "@testing-library/react";
import {PendingEmailBanner} from "@/features/profile/components/PendingEmailBanner.tsx";
import {changingEmailUser, user} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

// Each link's address line and whether it was opened.
function links() {
    return within(screen.getByRole("list")).getAllByRole("listitem")
        .map(item => [...item.children].map(part => part.textContent));
}

describe("PendingEmailBanner", () => {
    it("shows nothing without an email change", () => {
        renderWithProviders(<PendingEmailBanner user={user}/>);

        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("shows the new address and both links unopened", () => {
        renderWithProviders(<PendingEmailBanner user={changingEmailUser}/>);

        const banner = screen.getByRole("status");
        expect(within(banner).getByText("Email change in progress")).toBeInTheDocument();
        expect(banner).toHaveTextContent("Your email changes to jan.nowy@example.com once both links below are opened.");
        expect(links()).toEqual([
            ["Link sent to jan.nowy@example.com:", "not opened yet"],
            ["Link sent to jan@example.com:", "not opened yet"],
        ]);
        expect(screen.getByRole("button", {name: "Resend links"})).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Cancel change"})).toBeInTheDocument();
    });

    it("keeps the buttons out of the status, so screen readers don't read out Resend's countdown each second", () => {
        renderWithProviders(<PendingEmailBanner user={changingEmailUser}/>);

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(within(screen.getByRole("status")).queryByRole("button")).not.toBeInTheDocument();
    });

    it.each([
        [
            "the new address",
            {awaitingNewEmailConfirmation: false},
            [["Link sent to jan.nowy@example.com:", "opened"], ["Link sent to jan@example.com:", "not opened yet"]],
        ],
        [
            "the current address",
            {awaitingCurrentEmailConfirmation: false},
            [["Link sent to jan.nowy@example.com:", "not opened yet"], ["Link sent to jan@example.com:", "opened"]],
        ],
    ])("shows the link to %s opened", (_, opened, expected) => {
        renderWithProviders(<PendingEmailBanner user={{...changingEmailUser, ...opened}}/>);

        expect(links()).toEqual(expected);
    });
});
