import {act, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {startEmailLinkCooldown} from "@/api/emailLinkCooldown.tsx";
import {SetPassword} from "@/features/profile/components/SetPassword.tsx";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {changingEmailUserWithoutPassword, userWithoutPassword} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockPendingPost, mockPost, mockProblem} from "@test/support/server.tsx";

const PATH = "/auth/password/forgot";

// Opens `linkUser`'s dialog of sending the link; returns the user events and the `onSent` callback.
async function openDialog(linkUser: UserDto = userWithoutPassword) {
    const onSent = vi.fn();
    const userEvents = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    renderWithProviders(<SetPassword user={linkUser} onSent={onSent}/>);
    await userEvents.click(screen.getByRole("button", {name: "Set a password"}));
    return {userEvents, onSent};
}

describe("SetPassword", () => {
    beforeEach(() => {
        vi.useFakeTimers({shouldAdvanceTime: true});
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("tells where the link goes", async () => {
        await openDialog();

        expect(screen.getByRole("dialog", {
            name: "Set a password?",
            description: "We'll send a link to jan@example.com. Open it to choose a password, then sign in again.",
        })).toBeInTheDocument();
    });

    it("tells that a pending email change will be cancelled", async () => {
        await openDialog(changingEmailUserWithoutPassword);

        expect(screen.getByRole("dialog", {
            name: "Set a password?",
            description: "We'll send a link to jan@example.com. Open it to choose a password, then sign in again. "
                + "Setting a password cancels the email change to jan.nowy@example.com.",
        })).toBeInTheDocument();
    });

    it("sends the link to the user's email and waits a minute before another", async () => {
        const requests = mockPost(PATH);
        const {userEvents, onSent} = await openDialog();

        await userEvents.click(screen.getByRole("button", {name: "Send link"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{email: "jan@example.com"}]);
        expect(onSent).toHaveBeenCalledExactlyOnceWith("jan@example.com");
        expect(screen.getByRole("button", {name: "Send again in 60 s"})).toBeDisabled();
        act(() => vi.advanceTimersByTime(60_000));
        expect(screen.getByRole("button", {name: "Set a password"})).toBeEnabled();
    });

    it("waits out a link the forgot password page sent to the same email, ignoring case", () => {
        startEmailLinkCooldown("passwordReset", "JAN@example.com");

        renderWithProviders(<SetPassword user={userWithoutPassword} onSent={vi.fn()}/>);

        expect(screen.getByRole("button", {name: "Send again in 60 s"})).toBeDisabled();
    });

    it("stays busy while sending", async () => {
        const {respond} = mockPendingPost(PATH);
        const {userEvents} = await openDialog();

        await userEvents.click(screen.getByRole("button", {name: "Send link"}));

        await waitFor(() => expect(screen.getByRole("button", {name: "Send link"})).toBeDisabled());
        expect(screen.getByRole("button", {name: "Cancel"})).toBeDisabled();
        respond();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("keeps the dialog open with the error when sending fails, and drops it when opened again", async () => {
        mockProblem(PATH, 503);
        const {userEvents, onSent} = await openDialog();

        await userEvents.click(screen.getByRole("button", {name: "Send link"}));

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("The service is temporarily unavailable. Please try again later.");
        expect(screen.getByRole("dialog", {name: "Set a password?"})).toBeInTheDocument();
        expect(onSent).not.toHaveBeenCalled();
        expect(screen.getByRole("button", {name: "Cancel"})).toBeEnabled();
        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await userEvents.click(screen.getByRole("button", {name: "Set a password"}));
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("sends nothing when cancelled", async () => {
        const requests = mockPost(PATH);
        const {userEvents} = await openDialog();

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
    });
});
