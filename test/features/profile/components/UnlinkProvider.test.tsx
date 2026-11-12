import {act, screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {UnlinkProvider} from "@/features/profile/components/UnlinkProvider.tsx";
import {problem} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockRequest} from "@test/support/server.tsx";

const PATH = "/users/me/identities/google";

// Opens the dialog of unlinking Google; returns the user events and the mock fetching the user again.
async function openDialog(hasPassword = true, refetchUser = vi.fn(() => Promise.resolve())) {
    const userEvents = userEvent.setup();
    renderWithProviders(
        <UnlinkProvider provider="GOOGLE" name="Google" hasPassword={hasPassword} refetchUser={refetchUser}/>
    );
    await userEvents.click(screen.getByRole("button", {name: "Unlink Google"}));
    return {userEvents, refetchUser};
}

describe("UnlinkProvider", () => {
    it("asks for the password and unlinks with it", async () => {
        const requests = mockRequest("delete", PATH, {status: 204});
        const {userEvents, refetchUser} = await openDialog();

        const dialog = screen.getByRole("dialog", {
            name: "Unlink Google?",
            description: "You won't be able to sign in with this Google account anymore. Enter your password to confirm.",
        });
        await userEvents.type(within(dialog).getByLabelText(/Current password/), "secret1{Enter}");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {currentPassword: "secret1"}}]);
        expect(refetchUser).toHaveBeenCalledTimes(1);
    });

    it("stays busy until the user is fetched again", async () => {
        mockRequest("delete", PATH, {status: 204});
        let fetched!: () => void;
        const refetchUser = vi.fn(() => new Promise<void>(resolve => fetched = resolve));
        const {userEvents} = await openDialog(true, refetchUser);
        await userEvents.type(screen.getByLabelText(/Current password/), "secret1{Enter}");
        await waitFor(() => expect(refetchUser).toHaveBeenCalledTimes(1));

        expect(screen.getByRole("button", {name: "Unlink"})).toBeDisabled();
        expect(screen.getByRole("dialog")).toBeInTheDocument();

        act(() => fetched());

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("unlinks without a password when the user has none", async () => {
        const requests = mockRequest("delete", PATH, {status: 204});
        const {userEvents} = await openDialog(false);

        expect(screen.getByRole("dialog", {description: "You won't be able to sign in with this Google account anymore."}))
            .toBeInTheDocument();
        expect(screen.queryByLabelText(/Current password/)).not.toBeInTheDocument();
        await userEvents.click(screen.getByRole("button", {name: "Unlink"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {currentPassword: null}}]);
    });

    it.each([
        [400, "The password is incorrect."],
        [404, "Google is no longer linked to your account."],
        [409, "Google is your only way to sign in, so it can't be unlinked."],
    ])("keeps the dialog open with the error of a %i", async (status, message) => {
        mockRequest("delete", PATH, {status, body: problem(status)});
        const {userEvents} = await openDialog();

        await userEvents.type(screen.getByLabelText(/Current password/), "wrong{Enter}");

        expect(await screen.findByRole("alert")).toHaveTextContent(message);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("drops the last error when opened again", async () => {
        mockRequest("delete", PATH, {status: 400, body: problem(400)});
        const {userEvents} = await openDialog();
        await userEvents.type(screen.getByLabelText(/Current password/), "wrong{Enter}");
        await screen.findByRole("alert");

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await userEvents.click(screen.getByRole("button", {name: "Unlink Google"}));

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("unlinks nothing when cancelled", async () => {
        const requests = mockRequest("delete", PATH, {status: 204});
        const {userEvents, refetchUser} = await openDialog();

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
        expect(refetchUser).not.toHaveBeenCalled();
    });

    // The user changed elsewhere since loading.
    it.each([404, 409])("fetches the user again once the dialog of a %i is closed", async status => {
        mockRequest("delete", PATH, {status, body: problem(status)});
        const {userEvents, refetchUser} = await openDialog();
        await userEvents.type(screen.getByLabelText(/Current password/), "secret1{Enter}");
        await screen.findByRole("alert");
        expect(refetchUser).not.toHaveBeenCalled();

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        expect(refetchUser).toHaveBeenCalledTimes(1);
    });

    it("doesn't fetch the user again once the dialog of a wrong password is closed", async () => {
        mockRequest("delete", PATH, {status: 400, body: problem(400)});
        const {userEvents, refetchUser} = await openDialog();
        await userEvents.type(screen.getByLabelText(/Current password/), "wrong{Enter}");
        await screen.findByRole("alert");

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(refetchUser).not.toHaveBeenCalled();
    });
});
