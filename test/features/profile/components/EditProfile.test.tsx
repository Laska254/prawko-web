import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {EditProfile} from "@/features/profile/components/EditProfile.tsx";
import {problem, user} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockPendingRequest, mockRequest} from "@test/support/server.tsx";

const PATH = "/users/1";

// Signed up with a provider, so a new username needs no password.
const userWithoutPassword: UserDto = {...user, hasPassword: false, providers: ["GOOGLE"]};

// Opens the dialog of editing `editedUser`; returns the user events and the query client.
async function openDialog(editedUser: UserDto = user) {
    const userEvents = userEvent.setup();
    const {queryClient} = renderWithProviders(<EditProfile user={editedUser}/>);
    await userEvents.click(screen.getByRole("button", {name: "Edit profile"}));
    return {userEvents, queryClient};
}

// Replaces the value of the field labelled `label`.
async function retype(userEvents: ReturnType<typeof userEvent.setup>, label: string, value: string) {
    const field = screen.getByRole("textbox", {name: label});
    await userEvents.clear(field);
    await userEvents.type(field, value);
}

// Enter doesn't submit in jsdom: user-event submits only forms with one field or their own submit button, and the
// dialog's button sits outside its form.
async function save(userEvents: ReturnType<typeof userEvent.setup>) {
    await userEvents.click(screen.getByRole("button", {name: "Save"}));
}

describe("EditProfile", () => {
    it("opens with empty fields showing the user's values", async () => {
        await openDialog();

        const dialog = screen.getByRole("dialog", {
            name: "Edit profile", description: "Fill in only what you want to change.",
        });
        for (const [name, value] of [["First name", "Jan"], ["Last name", "Kowalski"], ["Username", "jan"]]) {
            expect(within(dialog).getByRole("textbox", {name})).toHaveValue("");
            expect(within(dialog).getByRole("textbox", {name})).toHaveAttribute("placeholder", value);
        }
    });

    it("sends only the fields typed and replaces the session's user with the answer", async () => {
        const updated: UserDto = {...user, firstName: "Janek"};
        const requests = mockRequest("patch", PATH, {body: updated});
        const {userEvents, queryClient} = await openDialog();

        await retype(userEvents, "First name", "Janek");
        await save(userEvents);

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {firstName: "Janek"}}]);
        expect(queryClient.getQueryData(["users", "me"])).toEqual(updated);
    });

    it("stays busy while saving", async () => {
        const {respond} = mockPendingRequest("patch", PATH, {body: user});
        const {userEvents} = await openDialog();

        await retype(userEvents, "First name", "Janek");
        await save(userEvents);

        await waitFor(() => expect(screen.getByRole("button", {name: "Save"})).toBeDisabled());
        expect(screen.getByRole("button", {name: "Cancel"})).toBeDisabled();
        respond();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("closes without a request when nothing typed differs from the user", async () => {
        const requests = mockRequest("patch", PATH, {body: user});
        const {userEvents} = await openDialog();

        await retype(userEvents, "First name", "Jan");
        await save(userEvents);

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
    });

    it("keeps every field optional, within the server's lengths", async () => {
        await openDialog();

        for (const name of ["First name", "Last name", "Username"]) {
            expect(screen.getByRole("textbox", {name})).not.toBeRequired();
            expect(screen.getByRole("textbox", {name})).toHaveAttribute("minlength", "3");
            expect(screen.getByRole("textbox", {name})).toHaveAttribute("maxlength", "31");
        }
    });

    it("keeps a username with @ invalid and sends nothing", async () => {
        const requests = mockRequest("patch", PATH, {body: user});
        const {userEvents} = await openDialog(userWithoutPassword);

        await retype(userEvents, "Username", "jan@");
        await save(userEvents);

        expect(screen.getByRole("textbox", {name: "Username"})).toBeInvalid();
        expect(screen.getByRole("dialog", {name: "Edit profile"})).toBeInTheDocument();
        expect(requests).toEqual([]);
    });

    it("shows no placeholder for a name the provider didn't share, and sends it once typed", async () => {
        const requests = mockRequest("patch", PATH, {body: {...user, lastName: null}});
        const {userEvents} = await openDialog({...user, firstName: null, lastName: null});

        expect(screen.getByRole("textbox", {name: "First name"})).not.toHaveAttribute("placeholder");
        await userEvents.type(screen.getByRole("textbox", {name: "First name"}), "Jan");
        await save(userEvents);

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {firstName: "Jan"}}]);
    });

    it.each([
        [400, "firstName", "First name", "First name must be 3 to 31 characters."],
        [400, "lastName", "Last name", "Last name must be 3 to 31 characters."],
        [400, "userName", "Username", "Username must be 3 to 31 characters, without @."],
        [409, "userName", "Username", "This username is taken."],
    ])("shows a %i of %s under its field", async (status, field, label, message) => {
        mockRequest("patch", PATH, {status, body: problem(status, {[field]: "Server's message."})});
        const {userEvents} = await openDialog(userWithoutPassword);

        await retype(userEvents, label, "Nowy");
        await save(userEvents);

        await waitFor(() => expect(screen.getByRole("textbox", {name: label})).toHaveAccessibleDescription(message));
        expect(screen.getByRole("textbox", {name: label})).toBeInvalid();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it.each([
        [409, "Your account was changed at the same time. Please try again."],
        [503, "The service is temporarily unavailable. Please try again later."],
    ])("keeps the dialog open with the error of a %i without fields", async (status, message) => {
        mockRequest("patch", PATH, {status, body: problem(status)});
        const {userEvents, queryClient} = await openDialog();

        await retype(userEvents, "First name", "Janek");
        await save(userEvents);

        expect(await screen.findByRole("alert")).toHaveTextContent(message);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(queryClient.getQueryData(["users", "me"])).toBeUndefined();
    });

    it("drops the last errors and typed values when opened again", async () => {
        mockRequest("patch", PATH, {status: 409, body: problem(409, {userName: "Taken."})});
        const {userEvents} = await openDialog(userWithoutPassword);
        await retype(userEvents, "Username", "taken");
        await save(userEvents);
        await waitFor(() => expect(screen.getByRole("textbox", {name: "Username"})).toBeInvalid());

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await userEvents.click(screen.getByRole("button", {name: "Edit profile"}));

        expect(screen.getByRole("textbox", {name: "Username"})).toHaveValue("");
        expect(screen.getByRole("textbox", {name: "Username"})).toBeValid();
    });

    it("saves nothing when cancelled", async () => {
        const requests = mockRequest("patch", PATH, {body: user});
        const {userEvents} = await openDialog();

        await retype(userEvents, "Username", "janek");
        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
    });

    describe("a new username", () => {
        // Changes the username and saves, which asks for the password.
        async function changeUserName() {
            const opened = await openDialog();
            await retype(opened.userEvents, "Username", "janek");
            await save(opened.userEvents);
            return opened;
        }

        async function confirmPassword(userEvents: ReturnType<typeof userEvent.setup>, password = "secret1") {
            await userEvents.type(screen.getByLabelText(/Current password/), password);
            await userEvents.click(screen.getByRole("button", {name: "Save"}));
        }

        it("asks for the password and sends it with the changes", async () => {
            const updated: UserDto = {...user, firstName: "Janek", userName: "janek"};
            const requests = mockRequest("patch", PATH, {body: updated});
            const {userEvents, queryClient} = await openDialog();
            await retype(userEvents, "First name", "Janek");
            await retype(userEvents, "Username", "janek");
            await save(userEvents);

            expect(screen.getByRole("dialog", {
                name: "Change your username?",
                description: "You'll sign in with the new username from now on. Enter your password to confirm.",
            })).toBeInTheDocument();
            expect(requests).toEqual([]);
            await confirmPassword(userEvents);

            await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
            expect(requests).toEqual([
                {search: "", body: {firstName: "Janek", userName: "janek", currentPassword: "secret1"}},
            ]);
            expect(queryClient.getQueryData(["users", "me"])).toEqual(updated);
        });

        it("is sent without a password when the user has none", async () => {
            const requests = mockRequest("patch", PATH, {body: {...userWithoutPassword, userName: "janek"}});
            const {userEvents} = await openDialog(userWithoutPassword);

            await retype(userEvents, "Username", "janek");
            await save(userEvents);

            await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
            expect(requests).toEqual([{search: "", body: {userName: "janek"}}]);
        });

        it.each([
            [400, "The password is incorrect."],
            [409, "Your account was changed at the same time. Please try again."],
        ])("keeps asking for the password with the error of a %i without fields", async (status, message) => {
            mockRequest("patch", PATH, {status, body: problem(status)});
            const {userEvents} = await changeUserName();

            await confirmPassword(userEvents, "wrong");

            expect(await screen.findByRole("alert")).toHaveTextContent(message);
            expect(screen.getByRole("dialog", {name: "Change your username?"})).toBeInTheDocument();
            // Not repeated in the form behind.
            expect(screen.getAllByRole("alert", {hidden: true})).toHaveLength(1);
        });

        it("goes back to the form with the values typed when the password is cancelled", async () => {
            const requests = mockRequest("patch", PATH, {status: 400, body: problem(400)});
            const {userEvents} = await changeUserName();
            await confirmPassword(userEvents, "wrong");
            await screen.findByRole("alert");

            await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

            await waitFor(() => expect(screen.getByRole("dialog", {name: "Edit profile"})).toBeInTheDocument());
            expect(screen.getByRole("textbox", {name: "Username"})).toHaveValue("janek");
            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
            await save(userEvents);
            expect(screen.getByRole("dialog", {name: "Change your username?"})).toBeInTheDocument();
            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
            expect(requests).toHaveLength(1);
        });

        it.each([
            [400, "Username must be 3 to 31 characters, without @."],
            [409, "This username is taken."],
        ])("goes back to the form with a %i of the username under its field", async (status, message) => {
            mockRequest("patch", PATH, {status, body: problem(status, {userName: "Server's message."})});
            const {userEvents} = await changeUserName();

            await confirmPassword(userEvents);

            await waitFor(() => expect(screen.getByRole("textbox", {name: "Username"}))
                .toHaveAccessibleDescription(message));
            expect(screen.getByRole("dialog", {name: "Edit profile"})).toBeInTheDocument();
            expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        });
    });
});
