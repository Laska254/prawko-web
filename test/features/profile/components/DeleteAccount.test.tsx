import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {getRefreshToken, onSessionEnded, saveTokens} from "@/api/tokens.tsx";
import {DeleteAccount} from "@/features/profile/components/DeleteAccount.tsx";
import {problem, tokens} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockRequest} from "@test/support/server.tsx";

// Signs in and opens the dialog; returns the user events and the listener of the session's end.
async function openDialog() {
    saveTokens(tokens);
    const sessionEnded = vi.fn();
    onTestFinished(onSessionEnded(sessionEnded));
    const userEvents = userEvent.setup();
    renderWithProviders(<DeleteAccount/>);
    await userEvents.click(screen.getByRole("button", {name: "Delete account"}));
    return {userEvents, sessionEnded};
}

describe("DeleteAccount", () => {
    it("asks for the password, deletes the account with it and ends the session as deleted", async () => {
        const requests = mockRequest("delete", "/users/me", {status: 204});
        const {userEvents, sessionEnded} = await openDialog();

        const dialog = screen.getByRole("dialog", {
            name: "Delete your account?",
            description: "Your account and exam history will be deleted permanently. This can't be undone. "
                + "Enter your password to confirm.",
        });
        await userEvents.type(within(dialog).getByLabelText(/Current password/), "secret1{Enter}");

        await waitFor(() => expect(sessionEnded).toHaveBeenCalledExactlyOnceWith("accountDeleted"));
        expect(requests).toEqual([{search: "", body: {password: "secret1"}}]);
        expect(getRefreshToken()).toBeNull();
    });

    it("keeps the dialog open and the session with a wrong password", async () => {
        mockRequest("delete", "/users/me", {status: 400, body: problem(400)});
        const {userEvents, sessionEnded} = await openDialog();

        await userEvents.type(screen.getByLabelText(/Current password/), "wrong{Enter}");

        expect(await screen.findByRole("alert")).toHaveTextContent("The password is incorrect.");
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(sessionEnded).not.toHaveBeenCalled();
        expect(getRefreshToken()).toBe(tokens.refreshToken);
    });

    it("drops the last error when opened again", async () => {
        mockRequest("delete", "/users/me", {status: 400, body: problem(400)});
        const {userEvents} = await openDialog();
        await userEvents.type(screen.getByLabelText(/Current password/), "wrong{Enter}");
        await screen.findByRole("alert");

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await userEvents.click(screen.getByRole("button", {name: "Delete account"}));

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("deletes nothing when cancelled", async () => {
        const requests = mockRequest("delete", "/users/me", {status: 204});
        const {userEvents, sessionEnded} = await openDialog();

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
        expect(sessionEnded).not.toHaveBeenCalled();
    });
});
