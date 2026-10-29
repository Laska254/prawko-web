import {screen} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import {ResetPasswordForm} from "@/features/auth/components/ResetPasswordForm.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockNetworkError, mockPendingPost, mockPost, mockProblem} from "@test/support/server.tsx";

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

        expect(screen.getByLabelText(/^Confirm new password/)).toHaveAccessibleDescription("Passwords don't match.");
        expect(requests).toEqual([]);
    });

    it("clears the mismatch once the passwords match", async () => {
        mockPost("/auth/password/reset", 500);
        await resetPassword(user, "secret1", "secret2");
        const confirmation = screen.getByLabelText(/^Confirm new password/);

        await user.clear(confirmation);
        await user.type(confirmation, "secret1");
        await user.click(screen.getByRole("button", {name: "Set new password"}));

        expect(await screen.findByText(genericError)).toBeInTheDocument();
        expect(confirmation).not.toHaveAccessibleDescription();
        expect(confirmation).toHaveAttribute("aria-invalid", "false");
    });

    it("hides an earlier error on a mismatch", async () => {
        mockPost("/auth/password/reset", 500);
        await resetPassword(user);
        expect(await screen.findByText(genericError)).toBeInTheDocument();

        await user.clear(screen.getByLabelText(/^Confirm new password/));
        await user.type(screen.getByLabelText(/^Confirm new password/), "secret2");
        await user.click(screen.getByRole("button", {name: "Set new password"}));

        expect(screen.queryByText(genericError)).not.toBeInTheDocument();
    });

    it("links an invalid token to a new reset link", async () => {
        mockProblem("/auth/password/reset", 400);

        await resetPassword(user);
        expect(await screen.findByText(/This reset link is invalid or has expired./)).toBeInTheDocument();
        await user.click(screen.getByRole("link", {name: "Request a new one."}));

        expect(currentLocation().pathname).toBe("/auth/password/forgot");
    });

    it("marks an invalid new password on a 400", async () => {
        mockProblem("/auth/password/reset", 400, {newPassword: "Password must be at least 7 characters."});

        await resetPassword(user);

        expect(await screen.findByLabelText(/^New password/))
            .toHaveAccessibleDescription("Password must be 7 to 63 characters.");
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("clears the field error on a mismatch", async () => {
        mockProblem("/auth/password/reset", 400, {newPassword: "Too short."});
        await resetPassword(user);
        const password = await screen.findByLabelText(/^New password/);
        expect(password).toBeInvalid();

        await user.type(screen.getByLabelText(/^Confirm new password/), "2");
        await user.click(screen.getByRole("button", {name: "Set new password"}));

        expect(screen.getByLabelText(/^Confirm new password/)).toHaveAccessibleDescription("Passwords don't match.");
        expect(password).toBeValid();
    });

    it("treats a 400 without an invalid form field as an invalid link", async () => {
        mockProblem("/auth/password/reset", 400, {token: "Token is required."});

        await resetPassword(user);

        expect(await screen.findByText(/This reset link is invalid or has expired./)).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "Request a new one."})).toBeInTheDocument();
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

    it("shows and hides each password", async () => {
        const [showPassword, showConfirmation] = screen.getAllByRole("button", {name: "Show password"});

        await user.click(showConfirmation);
        expect(screen.getByLabelText(/^New password/)).toHaveAttribute("type", "password");
        expect(screen.getByLabelText(/^Confirm new password/)).toHaveAttribute("type", "text");

        await user.click(showPassword);
        expect(screen.getByLabelText(/^New password/)).toHaveAttribute("type", "text");
    });
});
