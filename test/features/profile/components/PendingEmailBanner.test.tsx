import {screen, within} from "@testing-library/react";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {PendingEmailBanner} from "@/features/profile/components/PendingEmailBanner.tsx";
import {user} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

const changingEmail: UserDto = {
    ...user,
    pendingEmail: "jan.nowy@example.com",
    awaitingNewEmailConfirmation: true,
    awaitingCurrentEmailConfirmation: true,
};

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
        renderWithProviders(<PendingEmailBanner user={changingEmail}/>);

        const banner = screen.getByRole("status");
        expect(within(banner).getByText("Email change in progress")).toBeInTheDocument();
        expect(banner).toHaveTextContent("Your email changes to jan.nowy@example.com once both links below are opened.");
        expect(links()).toEqual([
            ["Link sent to jan.nowy@example.com:", "not opened yet"],
            ["Link sent to jan@example.com:", "not opened yet"],
        ]);
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
        renderWithProviders(<PendingEmailBanner user={{...changingEmail, ...opened}}/>);

        expect(links()).toEqual(expected);
    });
});
