import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {EditProfile} from "@/features/profile/components/EditProfile.tsx";
import {problem, user} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockPendingRequest, mockRequest} from "@test/support/server.tsx";

const PATH = "/users/1";

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
    it("opens prefilled from the user", async () => {
        await openDialog();

        const dialog = screen.getByRole("dialog", {name: "Edit profile", description: "Change your name and username."});
        expect(within(dialog).getByRole("textbox", {name: "First name"})).toHaveValue("Jan");
        expect(within(dialog).getByRole("textbox", {name: "Last name"})).toHaveValue("Kowalski");
        expect(within(dialog).getByRole("textbox", {name: "Username"})).toHaveValue("jan");
    });

    it("sends only the changed fields and replaces the session's user with the answer", async () => {
        const updated: UserDto = {...user, firstName: "Janek", lastName: "Nowak"};
        const requests = mockRequest("patch", PATH, {body: updated});
        const {userEvents, queryClient} = await openDialog();

        await retype(userEvents, "First name", "Janek");
        await retype(userEvents, "Last name", "Nowak");
        await save(userEvents);

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {firstName: "Janek", lastName: "Nowak"}}]);
        expect(queryClient.getQueryData(["users", "me"])).toEqual(updated);
    });

    it("stays busy while saving", async () => {
        const {respond} = mockPendingRequest("patch", PATH, {body: user});
        const {userEvents} = await openDialog();

        await retype(userEvents, "Username", "janek");
        await save(userEvents);

        await waitFor(() => expect(screen.getByRole("button", {name: "Save"})).toBeDisabled());
        expect(screen.getByRole("button", {name: "Cancel"})).toBeDisabled();
        respond();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("closes without a request when nothing changed", async () => {
        const requests = mockRequest("patch", PATH, {body: user});
        const {userEvents} = await openDialog();

        await retype(userEvents, "First name", "Jan");
        await save(userEvents);

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
    });

    it("requires the names set, which can't be removed", async () => {
        await openDialog();

        for (const name of ["First name", "Last name", "Username"]) {
            expect(screen.getByRole("textbox", {name})).toBeRequired();
            expect(screen.getByRole("textbox", {name})).toHaveAttribute("minlength", "3");
            expect(screen.getByRole("textbox", {name})).toHaveAttribute("maxlength", "31");
        }
    });

    it("leaves a name the provider didn't share empty and unsent until it's typed", async () => {
        const requests = mockRequest("patch", PATH, {body: {...user, lastName: null}});
        const {userEvents} = await openDialog({...user, firstName: null, lastName: null});

        expect(screen.getByRole("textbox", {name: "First name"})).toHaveValue("");
        expect(screen.getByRole("textbox", {name: "First name"})).not.toBeRequired();
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
        const {userEvents} = await openDialog();

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

        await retype(userEvents, "Username", "janek");
        await save(userEvents);

        expect(await screen.findByRole("alert")).toHaveTextContent(message);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(queryClient.getQueryData(["users", "me"])).toBeUndefined();
    });

    it("drops the last errors and typed values when opened again", async () => {
        mockRequest("patch", PATH, {status: 409, body: problem(409, {userName: "Taken."})});
        const {userEvents} = await openDialog();
        await retype(userEvents, "Username", "taken");
        await save(userEvents);
        await waitFor(() => expect(screen.getByRole("textbox", {name: "Username"})).toBeInvalid());

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await userEvents.click(screen.getByRole("button", {name: "Edit profile"}));

        expect(screen.getByRole("textbox", {name: "Username"})).toHaveValue("jan");
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
});
