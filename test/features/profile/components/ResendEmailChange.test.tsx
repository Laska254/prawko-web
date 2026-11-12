import {act, screen, waitFor} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import type {UserDto} from "@/api/dto/UserDto.tsx";
import {ResendEmailChange} from "@/features/profile/components/ResendEmailChange.tsx";
import {changingEmailUser, changingEmailUserWithoutPassword, problem} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockPendingRequest, mockRequest} from "@test/support/server.tsx";

const PATH = "/users/1";
const NEW_EMAIL = changingEmailUser.pendingEmail!;

// The link to the new address was opened already; a resend answers with both waiting again (`changingEmailUser`).
const halfConfirmedUser: UserDto = {...changingEmailUser, awaitingNewEmailConfirmation: false};

// Renders the Resend button of `changedUser`; returns the user events and the query client.
function renderResend(changedUser: UserDto = halfConfirmedUser) {
    const userEvents = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    const {queryClient} = renderWithProviders(<ResendEmailChange user={changedUser} pendingEmail={NEW_EMAIL}/>);
    return {userEvents, queryClient};
}

async function openDialog(userEvents: UserEvent) {
    await userEvents.click(screen.getByRole("button", {name: "Resend links"}));
}

async function confirmPassword(userEvents: UserEvent, password = "secret1") {
    await userEvents.type(screen.getByLabelText(/Current password/), password);
    await userEvents.click(screen.getByRole("button", {name: "Resend"}));
}

describe("ResendEmailChange", () => {
    // `shouldAdvanceTime` keeps the clock moving for user-event and `findBy`, which wait on timers too.
    beforeEach(() => {
        vi.useFakeTimers({shouldAdvanceTime: true});
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("asks for the password", async () => {
        const requests = mockRequest("patch", PATH, {body: changingEmailUser});
        const {userEvents} = renderResend();

        await openDialog(userEvents);

        expect(screen.getByRole("dialog", {
            name: "Resend the links?",
            description: "New links will be sent to jan.nowy@example.com and to your current address. The ones sent "
                + "before will stop working. Enter your password to confirm.",
        })).toBeInTheDocument();
        expect(requests).toEqual([]);
    });

    it("sends the pending email with the password, replaces the session's user and waits a minute", async () => {
        const requests = mockRequest("patch", PATH, {body: changingEmailUser});
        const {userEvents, queryClient} = renderResend();
        await openDialog(userEvents);

        await confirmPassword(userEvents);

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {email: NEW_EMAIL, currentPassword: "secret1"}}]);
        expect(queryClient.getQueryData(["users", "me"])).toEqual(changingEmailUser);
        expect(screen.getByRole("button", {name: "Resend in 60 s"})).toBeDisabled();
        act(() => vi.advanceTimersByTime(59_000));
        expect(screen.getByRole("button", {name: "Resend in 1 s"})).toBeDisabled();
        act(() => vi.advanceTimersByTime(1_000));
        expect(screen.getByRole("button", {name: "Resend links"})).toBeEnabled();
    });

    it("only asks for a confirmation when the user has no password", async () => {
        const requests = mockRequest("patch", PATH, {body: changingEmailUser});
        const {userEvents} = renderResend({...changingEmailUserWithoutPassword, awaitingNewEmailConfirmation: false});
        await openDialog(userEvents);

        expect(screen.getByRole("dialog", {
            name: "Resend the links?",
            description: "New links will be sent to jan.nowy@example.com and to your current address. The ones sent "
                + "before will stop working.",
        })).toBeInTheDocument();
        expect(screen.queryByLabelText(/Current password/)).not.toBeInTheDocument();
        await userEvents.click(screen.getByRole("button", {name: "Resend"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {email: NEW_EMAIL, currentPassword: null}}]);
    });

    it("stays busy while sending", async () => {
        const {respond} = mockPendingRequest("patch", PATH, {body: changingEmailUser});
        const {userEvents} = renderResend();
        await openDialog(userEvents);

        await confirmPassword(userEvents);

        await waitFor(() => expect(screen.getByRole("button", {name: "Resend"})).toBeDisabled());
        expect(screen.getByRole("button", {name: "Cancel"})).toBeDisabled();
        respond();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it.each([
        [400, undefined, "The password is incorrect."],
        [409, undefined, "Your account was changed at the same time. Please try again."],
        [409, {email: "Taken."}, "An account with this email already exists."],
        [500, undefined, "Something went wrong. Please try again later."],
    ])("keeps asking for the password with the error of a %i with the fields %o", async (status, fields, message) => {
        mockRequest("patch", PATH, {status, body: problem(status, fields)});
        const {userEvents, queryClient} = renderResend();
        await openDialog(userEvents);

        await confirmPassword(userEvents, "wrong");

        expect(await screen.findByRole("alert")).toHaveTextContent(message);
        expect(screen.getByRole("dialog", {name: "Resend the links?"})).toBeInTheDocument();
        expect(queryClient.getQueryData(["users", "me"])).toBeUndefined();
        expect(screen.getByRole("button", {name: "Resend links", hidden: true})).toBeEnabled();
    });

    it("waits a minute after a 429, as the links were sent recently", async () => {
        mockRequest("patch", PATH, {status: 429, body: problem(429)});
        const {userEvents} = renderResend();
        await openDialog(userEvents);

        await confirmPassword(userEvents);

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("A link was sent less than a minute ago. Wait a moment and try again.");
        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(screen.getByRole("button", {name: /^Resend in \d+ s$/})).toBeDisabled();
    });

    it("drops the last error when opened again", async () => {
        mockRequest("patch", PATH, {status: 400, body: problem(400)});
        const {userEvents} = renderResend();
        await openDialog(userEvents);
        await confirmPassword(userEvents, "wrong");
        await screen.findByRole("alert");

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await openDialog(userEvents);

        expect(screen.getByRole("dialog", {name: "Resend the links?"})).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("sends nothing when cancelled", async () => {
        const requests = mockRequest("patch", PATH, {body: changingEmailUser});
        const {userEvents} = renderResend();
        await openDialog(userEvents);

        await userEvents.click(screen.getByRole("button", {name: "Cancel"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
        expect(screen.getByRole("button", {name: "Resend links"})).toBeEnabled();
    });
});
