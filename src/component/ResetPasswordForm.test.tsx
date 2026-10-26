import {screen} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import {ResetPasswordForm} from "./ResetPasswordForm.tsx";
import {currentLocation, renderAtRoute} from "../test/render.tsx";
import {mockNetworkError, mockPendingPost, mockPost} from "../test/server.ts";

const genericError = "Couldn't reset the password. Please try again later.";

async function resetPassword(user: UserEvent, password = "secret1", confirmation = password) {
    await user.type(screen.getByLabelText(/^New password/), password);
    await user.type(screen.getByLabelText(/^Confirm new password/), confirmation);
    await user.click(screen.getByRole("button", {name: "Set new password"}));
}

describe("ResetPasswordForm", () => {
    let user: UserEvent;

    beforeEach(() => {
        user = userEvent.setup();
        renderAtRoute(<ResetPasswordForm token="token"/>, "/auth/password/reset");
    });

    it("resets the password and goes to sign in with a notice", async () => {
        const requests = mockPost("/auth/password/reset");

        await resetPassword(user);

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toMatchObject({pathname: "/auth", state: {notice: "passwordReset"}});
        expect(requests).toEqual([{token: "token", newPassword: "secret1"}]);
    });

    it("doesn't send mismatched passwords", async () => {
        const requests = mockPost("/auth/password/reset");

        await resetPassword(user, "secret1", "secret2");

        expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
        expect(requests).toEqual([]);
    });

    it("links an invalid token to a new reset link", async () => {
        mockPost("/auth/password/reset", 400, {title: "Bad Request"});

        await resetPassword(user);
        expect(await screen.findByText(/This reset link is invalid or has expired./)).toBeInTheDocument();
        await user.click(screen.getByRole("link", {name: "Request a new one."}));

        expect(currentLocation().pathname).toBe("/auth/password/forgot");
    });

    it("shows a generic error on a validation error", async () => {
        mockPost("/auth/password/reset", 400, {details: {newPassword: "Too short."}});

        await resetPassword(user);

        expect(await screen.findByText(genericError)).toBeInTheDocument();
    });

    it("shows a generic error on a server error", async () => {
        mockPost("/auth/password/reset", 500);

        await resetPassword(user);

        expect(await screen.findByText(genericError)).toBeInTheDocument();
    });

    it("shows a generic error without a connection", async () => {
        mockNetworkError("/auth/password/reset");

        await resetPassword(user);

        expect(await screen.findByText(genericError)).toBeInTheDocument();
    });

    it("sends one request while sending", async () => {
        const request = mockPendingPost("/auth/password/reset", 500);

        await resetPassword(user);
        await user.keyboard("{Enter}");

        expect(screen.getByRole("button", {name: "Set new password"})).toBeDisabled();
        request.respond();
        expect(await screen.findByRole("button", {name: "Set new password"})).toBeEnabled();
        expect(request.requestCount()).toBe(1);
    });

    it("shows and hides both passwords", async () => {
        await user.click(screen.getByTestId("VisibilityOffIcon"));
        expect(screen.getByLabelText(/^New password/)).toHaveAttribute("type", "text");
        expect(screen.getByLabelText(/^Confirm new password/)).toHaveAttribute("type", "text");

        await user.click(screen.getByTestId("VisibilityIcon"));
        expect(screen.getByLabelText(/^New password/)).toHaveAttribute("type", "password");
        expect(screen.getByLabelText(/^Confirm new password/)).toHaveAttribute("type", "password");
    });
});
