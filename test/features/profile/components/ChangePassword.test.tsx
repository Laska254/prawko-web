import {screen, waitFor} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import {getRefreshToken, saveTokens} from "@/api/tokens.tsx";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {ChangePassword} from "@/features/profile/components/ChangePassword.tsx";
import {changingEmailUser, problem, tokens, user} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockPendingRequest, mockPost, mockRequest} from "@test/support/server.tsx";

const PATH = "/users/me/password";
const signedInTokens = {accessToken: "signed-in-access-token", refreshToken: "signed-in-refresh-token", expiresIn: 900};

// Signs in as `changedUser` and opens the dialog of changing their password; returns the user events, the fetches of
// the user since and the `onChanged` callback.
async function openDialog(changedUser: UserDto = user) {
    saveTokens(tokens);
    mockPost("/auth/refresh", 200, tokens);
    mockPost("/auth", 200, signedInTokens);
    mockRequest("get", "/users/me", {body: changedUser});
    const onChanged = vi.fn();
    const userEvents = userEvent.setup();
    const {queryClient} = renderWithProviders(<ChangePassword user={changedUser} onChanged={onChanged}/>);
    await waitFor(() => expect(queryClient.getQueryData(["users", "me"])).toEqual(changedUser));
    const fetches = mockRequest("get", "/users/me", {body: user});
    await userEvents.click(screen.getByRole("button", {name: "Change password"}));
    return {userEvents, fetches, onChanged};
}

function currentPasswordField() {
    return screen.getByLabelText(/^Current password/);
}

function newPasswordField() {
    return screen.getByLabelText(/^New password/);
}

function confirmationField() {
    return screen.getByLabelText(/^Confirm new password/);
}

// Types the passwords and saves them.
async function save(userEvents: UserEvent, currentPassword = "secret1", newPassword = "secret2",
                    confirmation = newPassword) {
    await userEvents.type(currentPasswordField(), currentPassword);
    await userEvents.type(newPasswordField(), newPassword);
    await userEvents.type(confirmationField(), confirmation);
    await userEvents.click(screen.getByRole("button", {name: "Save"}));
}

describe("ChangePassword", () => {
    it("opens with empty, required password fields, the new one within the server's lengths", async () => {
        await openDialog();

        expect(screen.getByRole("dialog", {
            name: "Change password",
            description: "You'll be signed out on your other devices.",
        })).toBeInTheDocument();
        for (const field of [currentPasswordField(), newPasswordField(), confirmationField()]) {
            expect(field).toHaveValue("");
            expect(field).toBeRequired();
            expect(field).toHaveAttribute("type", "password");
        }
        expect(currentPasswordField()).toHaveAttribute("autocomplete", "current-password");
        expect(newPasswordField()).toHaveAttribute("autocomplete", "new-password");
        expect(confirmationField()).toHaveAttribute("autocomplete", "new-password");
        expect(newPasswordField()).toHaveAttribute("minlength", "7");
        expect(newPasswordField()).toHaveAttribute("maxlength", "63");
    });

    it("tells that a pending email change will be cancelled", async () => {
        await openDialog(changingEmailUser);

        expect(screen.getByRole("dialog", {
            name: "Change password",
            description: "You'll be signed out on your other devices. The email change to jan.nowy@example.com will "
                + "be cancelled.",
        })).toBeInTheDocument();
    });

    it("changes the password, signs in again with the new one and fetches the user again", async () => {
        const requests = mockRequest("patch", PATH, {status: 204});
        const {userEvents, fetches, onChanged} = await openDialog();

        await save(userEvents);

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {currentPassword: "secret1", newPassword: "secret2"}}]);
        expect(getRefreshToken()).toBe("signed-in-refresh-token");
        expect(fetches).toHaveLength(1);
        expect(onChanged).toHaveBeenCalledExactlyOnceWith(null);
    });

    it("passes on the email whose pending change the server cancelled", async () => {
        mockRequest("patch", PATH, {status: 204});
        const {userEvents, onChanged} = await openDialog(changingEmailUser);

        await save(userEvents);

        await waitFor(() => expect(onChanged).toHaveBeenCalledExactlyOnceWith("jan.nowy@example.com"));
    });

    it("stays busy until the user is fetched again", async () => {
        mockRequest("patch", PATH, {status: 204});
        const {userEvents, onChanged} = await openDialog();
        const {respond} = mockPendingRequest("get", "/users/me", {body: user});

        await save(userEvents);

        await waitFor(() => expect(screen.getByRole("button", {name: "Save"})).toBeDisabled());
        expect(screen.getByRole("button", {name: "Cancel"})).toBeDisabled();
        expect(onChanged).not.toHaveBeenCalled();
        respond();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(onChanged).toHaveBeenCalledOnce();
    });

    it("sends nothing when the new password is the current one, as the server tells it like a wrong one", async () => {
        const requests = mockRequest("patch", PATH, {status: 204});
        const {userEvents} = await openDialog();

        await save(userEvents, "secret1", "secret1");

        expect(newPasswordField())
            .toHaveAccessibleDescription("The new password must be different from the current one.");
        expect(newPasswordField()).toBeInvalid();
        expect(confirmationField()).not.toBeInvalid();
        expect(requests).toEqual([]);
    });

    it("sends nothing when the confirmation doesn't match", async () => {
        const requests = mockRequest("patch", PATH, {status: 204});
        const {userEvents} = await openDialog();

        await save(userEvents, "secret1", "secret2", "secret3");

        expect(confirmationField()).toHaveAccessibleDescription("Passwords don't match.");
        expect(confirmationField()).toBeInvalid();
        expect(newPasswordField()).not.toBeInvalid();
        expect(requests).toEqual([]);
    });

    it("shows a 400 of the new password under its field", async () => {
        mockRequest("patch", PATH, {status: 400, body: problem(400, {newPassword: "Server's message."})});
        const {userEvents} = await openDialog();

        await save(userEvents);

        await waitFor(() => expect(newPasswordField())
            .toHaveAccessibleDescription("Password must be 7 to 63 characters."));
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.getByRole("dialog", {name: "Change password"})).toBeInTheDocument();
    });

    it("tells when the current password is wrong", async () => {
        mockRequest("patch", PATH, {status: 400, body: problem(400)});
        const {userEvents, onChanged} = await openDialog();

        await save(userEvents, "wrong");

        expect(await screen.findByRole("alert")).toHaveTextContent("The password is incorrect.");
        expect(screen.getByRole("dialog", {name: "Change password"})).toBeInTheDocument();
        expect(getRefreshToken()).toBe("refresh-token");
        expect(onChanged).not.toHaveBeenCalled();
    });

    it("drops the server's error when the form's own check fails", async () => {
        mockRequest("patch", PATH, {status: 400, body: problem(400)});
        const {userEvents} = await openDialog();
        await save(userEvents, "wrong");
        await screen.findByRole("alert");

        await userEvents.type(confirmationField(), "3");
        await userEvents.click(screen.getByRole("button", {name: "Save"}));

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(confirmationField()).toHaveAccessibleDescription("Passwords don't match.");
    });

    it("drops the last errors and the passwords typed when opened again", async () => {
        mockRequest("patch", PATH, {status: 400, body: problem(400)});
        const {userEvents} = await openDialog();
        await save(userEvents, "wrong", "secret2", "secret3");
        await waitFor(() => expect(confirmationField()).toBeInvalid());

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await userEvents.click(screen.getByRole("button", {name: "Change password"}));

        expect(confirmationField()).toHaveValue("");
        expect(confirmationField()).not.toHaveAccessibleDescription();
    });

    it("sends nothing when cancelled", async () => {
        const requests = mockRequest("patch", PATH, {status: 204});
        const {userEvents} = await openDialog();

        await userEvents.type(currentPasswordField(), "secret1");
        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
    });
});
