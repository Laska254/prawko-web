import {act, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {getRefreshToken, saveTokens} from "@/api/tokens.tsx";
import {DeleteAccount} from "@/features/profile/components/DeleteAccount.tsx";
import {problem, tokens, user, userWithoutPassword} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockRequest} from "@test/support/server.tsx";

const PATH = "/users/me/deletion";

// Signs in as `signedInUser` and opens the dialog; returns the user events and the mock told the link was sent.
async function openDialog(signedInUser: UserDto = user) {
    saveTokens(tokens);
    const onSent = vi.fn();
    const userEvents = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    renderWithProviders(<DeleteAccount user={signedInUser} onSent={onSent}/>);
    await userEvents.click(screen.getByRole("button", {name: "Delete account"}));
    return {userEvents, onSent};
}

describe("DeleteAccount", () => {
    // `shouldAdvanceTime` keeps the clock moving for user-event and `findBy`, which wait on timers too.
    beforeEach(() => {
        vi.useFakeTimers({shouldAdvanceTime: true});
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("asks for the password, sends the link with it, keeps the session and waits a minute", async () => {
        const requests = mockRequest("post", PATH, {status: 204});
        const {userEvents, onSent} = await openDialog();

        const dialog = screen.getByRole("dialog", {
            name: "Delete your account?",
            description: "Your account and exam history will be deleted permanently, which can't be undone. We'll "
                + "send a link to jan@example.com to confirm it. Enter your password to confirm.",
        });
        await userEvents.type(within(dialog).getByLabelText(/Current password/), "secret1{Enter}");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {password: "secret1"}}]);
        expect(onSent).toHaveBeenCalledExactlyOnceWith("jan@example.com");
        expect(getRefreshToken()).toBe(tokens.refreshToken);
        expect(screen.getByRole("button", {name: "Send again in 60 s"})).toBeDisabled();
        act(() => vi.advanceTimersByTime(60_000));
        expect(screen.getByRole("button", {name: "Delete account"})).toBeEnabled();
    });

    it("only asks for a confirmation when the user has no password", async () => {
        const requests = mockRequest("post", PATH, {status: 204});
        const {userEvents} = await openDialog(userWithoutPassword);

        expect(screen.getByRole("dialog", {
            description: "Your account and exam history will be deleted permanently, which can't be undone. We'll "
                + "send a link to jan@example.com to confirm it.",
        })).toBeInTheDocument();
        expect(screen.queryByLabelText(/Current password/)).not.toBeInTheDocument();
        await userEvents.click(screen.getByRole("button", {name: "Send link"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {password: null}}]);
    });

    it("keeps the dialog open with a wrong password", async () => {
        mockRequest("post", PATH, {status: 400, body: problem(400)});
        const {userEvents, onSent} = await openDialog();

        await userEvents.type(screen.getByLabelText(/Current password/), "wrong{Enter}");

        expect(await screen.findByRole("alert")).toHaveTextContent("The password is incorrect.");
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(onSent).not.toHaveBeenCalled();
        expect(screen.getByRole("button", {name: "Delete account", hidden: true})).toBeEnabled();
    });

    it("waits a minute after a 429, as the link was sent recently", async () => {
        mockRequest("post", PATH, {status: 429, body: problem(429)});
        const {userEvents, onSent} = await openDialog();

        await userEvents.type(screen.getByLabelText(/Current password/), "secret1{Enter}");

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("A link was sent less than a minute ago. Wait a moment and try again.");
        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.getByRole("button", {name: /^Send again in \d+ s$/})).toBeDisabled();
        expect(onSent).not.toHaveBeenCalled();
    });

    it("drops the last error when opened again", async () => {
        mockRequest("post", PATH, {status: 400, body: problem(400)});
        const {userEvents} = await openDialog();
        await userEvents.type(screen.getByLabelText(/Current password/), "wrong{Enter}");
        await screen.findByRole("alert");

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await userEvents.click(screen.getByRole("button", {name: "Delete account"}));

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("sends nothing when cancelled", async () => {
        const requests = mockRequest("post", PATH, {status: 204});
        const {userEvents, onSent} = await openDialog();

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
        expect(onSent).not.toHaveBeenCalled();
    });
});
