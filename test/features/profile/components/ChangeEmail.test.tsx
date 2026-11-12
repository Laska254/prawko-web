import {screen, waitFor} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {ChangeEmail} from "@/features/profile/components/ChangeEmail.tsx";
import {
    changingEmailUser,
    changingEmailUserWithoutPassword,
    problem,
    user,
    userWithoutPassword,
} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockPendingRequest, mockRequest} from "@test/support/server.tsx";

const PATH = "/users/1";
const NEW_EMAIL = changingEmailUser.pendingEmail!;

// Opens the dialog of changing the email of `changedUser`; returns the user events and the query client.
async function openDialog(changedUser: UserDto = user) {
    const userEvents = userEvent.setup();
    const {queryClient} = renderWithProviders(<ChangeEmail user={changedUser}/>);
    await userEvents.click(screen.getByRole("button", {name: "Change email"}));
    return {userEvents, queryClient};
}

function emailField() {
    return screen.getByRole("textbox", {name: "New email"});
}

// Types `email` and sends it, which asks for the password when the user has one.
async function send(userEvents: UserEvent, email = NEW_EMAIL) {
    await userEvents.type(emailField(), email);
    await userEvents.click(screen.getByRole("button", {name: "Send links"}));
}

async function confirmPassword(userEvents: UserEvent, password = "secret1") {
    await userEvents.type(screen.getByLabelText(/Current password/), password);
    await userEvents.click(screen.getByRole("button", {name: "Send links"}));
}

describe("ChangeEmail", () => {
    it("opens with an empty, required email field within the server's lengths", async () => {
        await openDialog();

        expect(screen.getByRole("dialog", {
            name: "Change email",
            description: "We'll send a link to the new address and one to your current address. Your email changes "
                + "once both are opened.",
        })).toBeInTheDocument();
        expect(emailField()).toHaveValue("");
        expect(emailField()).toBeRequired();
        expect(emailField()).toHaveAttribute("type", "email");
        expect(emailField()).toHaveAttribute("minlength", "5");
        expect(emailField()).toHaveAttribute("maxlength", "254");
    });

    it("asks for the password, sends it with the email and replaces the session's user with the answer", async () => {
        const requests = mockRequest("patch", PATH, {body: changingEmailUser});
        const {userEvents, queryClient} = await openDialog();

        await send(userEvents);

        expect(screen.getByRole("dialog", {
            name: "Change your email?",
            description: "Links will be sent to jan.nowy@example.com and to your current address. Enter your password "
                + "to confirm.",
        })).toBeInTheDocument();
        expect(requests).toEqual([]);
        await confirmPassword(userEvents);

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {email: NEW_EMAIL, currentPassword: "secret1"}}]);
        expect(queryClient.getQueryData(["users", "me"])).toEqual(changingEmailUser);
    });

    it("is sent without a password when the user has none", async () => {
        const requests = mockRequest("patch", PATH, {body: changingEmailUserWithoutPassword});
        const {userEvents} = await openDialog(userWithoutPassword);

        await send(userEvents);

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {email: NEW_EMAIL}}]);
    });

    it("stays busy while sending", async () => {
        const {respond} = mockPendingRequest("patch", PATH, {body: changingEmailUser});
        const {userEvents} = await openDialog(userWithoutPassword);

        await send(userEvents);

        await waitFor(() => expect(screen.getByRole("button", {name: "Send links"})).toBeDisabled());
        expect(screen.getByRole("button", {name: "Cancel"})).toBeDisabled();
        respond();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("closes without a request when the current email is typed, in any case", async () => {
        const requests = mockRequest("patch", PATH, {body: user});
        const {userEvents} = await openDialog();

        await send(userEvents, "Jan@Example.com");

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
    });

    it("keeps an address without @ invalid and sends nothing", async () => {
        const requests = mockRequest("patch", PATH, {body: changingEmailUser});
        const {userEvents} = await openDialog(userWithoutPassword);

        await send(userEvents, "janek");

        expect(emailField()).toBeInvalid();
        expect(screen.getByRole("dialog", {name: "Change email"})).toBeInTheDocument();
        expect(requests).toEqual([]);
    });

    it("shows a 429 without a password in the form", async () => {
        mockRequest("patch", PATH, {status: 429, body: problem(429)});
        const {userEvents} = await openDialog(userWithoutPassword);

        await send(userEvents);

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("A link was sent less than a minute ago. Wait a moment and try again.");
        expect(screen.getByRole("dialog", {name: "Change email"})).toBeInTheDocument();
    });

    it.each([
        [400, "Enter a valid email address."],
        [409, "An account with this email already exists."],
    ])("goes back to the form with a %i of the email under its field", async (status, message) => {
        mockRequest("patch", PATH, {status, body: problem(status, {email: "Server's message."})});
        const {userEvents, queryClient} = await openDialog();
        await send(userEvents);

        await confirmPassword(userEvents);

        await waitFor(() => expect(emailField()).toHaveAccessibleDescription(message));
        expect(emailField()).toBeInvalid();
        expect(screen.getByRole("dialog", {name: "Change email"})).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(queryClient.getQueryData(["users", "me"])).toBeUndefined();
    });

    it.each([
        [400, "The password is incorrect."],
        [409, "Your account was changed at the same time. Please try again."],
        [429, "A link was sent less than a minute ago. Wait a moment and try again."],
    ])("keeps asking for the password with the error of a %i without fields", async (status, message) => {
        mockRequest("patch", PATH, {status, body: problem(status)});
        const {userEvents} = await openDialog();
        await send(userEvents);

        await confirmPassword(userEvents, "wrong");

        expect(await screen.findByRole("alert")).toHaveTextContent(message);
        expect(screen.getByRole("dialog", {name: "Change your email?"})).toBeInTheDocument();
        // Not repeated in the form behind.
        expect(screen.getAllByRole("alert", {hidden: true})).toHaveLength(1);
    });

    it("goes back to the form with the email typed when the password is cancelled", async () => {
        const requests = mockRequest("patch", PATH, {status: 400, body: problem(400)});
        const {userEvents} = await openDialog();
        await send(userEvents);
        await confirmPassword(userEvents, "wrong");
        await screen.findByRole("alert");

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.getByRole("dialog", {name: "Change email"})).toBeInTheDocument());
        expect(emailField()).toHaveValue(NEW_EMAIL);
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        await userEvents.click(screen.getByRole("button", {name: "Send links"}));
        expect(screen.getByRole("dialog", {name: "Change your email?"})).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(requests).toHaveLength(1);
    });

    it("drops the last errors and the email typed when opened again", async () => {
        mockRequest("patch", PATH, {status: 409, body: problem(409, {email: "Taken."})});
        const {userEvents} = await openDialog(userWithoutPassword);
        await send(userEvents);
        await waitFor(() => expect(emailField()).toBeInvalid());

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await userEvents.click(screen.getByRole("button", {name: "Change email"}));

        expect(emailField()).toHaveValue("");
        expect(emailField()).not.toHaveAccessibleDescription();
    });

    it("sends nothing when cancelled", async () => {
        const requests = mockRequest("patch", PATH, {body: changingEmailUser});
        const {userEvents} = await openDialog();

        await userEvents.type(emailField(), NEW_EMAIL);
        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
    });
});
