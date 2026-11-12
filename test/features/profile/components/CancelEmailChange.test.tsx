import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {CancelEmailChange} from "@/features/profile/components/CancelEmailChange.tsx";
import {changingEmailUser, problem, user} from "@test/support/data.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {mockPendingRequest, mockRequest} from "@test/support/server.tsx";

const PATH = "/users/1";

// Opens the dialog of cancelling the change of `changingEmailUser`; returns the user events and the query client.
async function openDialog() {
    const userEvents = userEvent.setup();
    const {queryClient} = renderWithProviders(<CancelEmailChange user={changingEmailUser}/>);
    await userEvents.click(screen.getByRole("button", {name: "Cancel change"}));
    return {userEvents, queryClient};
}

describe("CancelEmailChange", () => {
    it("asks for a confirmation", async () => {
        const requests = mockRequest("patch", PATH, {body: user});

        await openDialog();

        expect(screen.getByRole("dialog", {
            name: "Cancel the email change?",
            description: "The links already sent will stop working, and your email stays the same.",
        })).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Keep it"})).toBeInTheDocument();
        expect(requests).toEqual([]);
    });

    it("sends the current email without a password and replaces the session's user with the answer", async () => {
        const requests = mockRequest("patch", PATH, {body: user});
        const {userEvents, queryClient} = await openDialog();

        await userEvents.click(screen.getByRole("button", {name: "Cancel change"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([{search: "", body: {email: "jan@example.com"}}]);
        expect(queryClient.getQueryData(["users", "me"])).toEqual(user);
    });

    it("stays busy while cancelling", async () => {
        const {respond} = mockPendingRequest("patch", PATH, {body: user});
        const {userEvents} = await openDialog();

        await userEvents.click(screen.getByRole("button", {name: "Cancel change"}));

        await waitFor(() => expect(screen.getByRole("button", {name: "Cancel change"})).toBeDisabled());
        expect(screen.getByRole("button", {name: "Keep it"})).toBeDisabled();
        respond();
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it.each([
        [409, "Your account was changed at the same time. Please try again."],
        [500, "Something went wrong. Please try again later."],
    ])("keeps the dialog open with the error of a %i", async (status, message) => {
        mockRequest("patch", PATH, {status, body: problem(status)});
        const {userEvents, queryClient} = await openDialog();

        await userEvents.click(screen.getByRole("button", {name: "Cancel change"}));

        expect(await screen.findByRole("alert")).toHaveTextContent(message);
        expect(screen.getByRole("dialog", {name: "Cancel the email change?"})).toBeInTheDocument();
        expect(queryClient.getQueryData(["users", "me"])).toBeUndefined();
    });

    it("drops the last error when opened again", async () => {
        mockRequest("patch", PATH, {status: 409, body: problem(409)});
        const {userEvents} = await openDialog();
        await userEvents.click(screen.getByRole("button", {name: "Cancel change"}));
        await screen.findByRole("alert");

        await userEvents.click(screen.getByRole("button", {name: "Keep it"}));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        await userEvents.click(screen.getByRole("button", {name: "Cancel change"}));

        expect(screen.getByRole("dialog", {name: "Cancel the email change?"})).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("sends nothing when the dialog is cancelled", async () => {
        const requests = mockRequest("patch", PATH, {body: user});
        const {userEvents} = await openDialog();

        await userEvents.click(screen.getByRole("button", {name: "Keep it"}));

        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(requests).toEqual([]);
    });
});
