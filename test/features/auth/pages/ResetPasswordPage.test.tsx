import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {ResetPasswordPage} from "@/features/auth/pages/ResetPasswordPage.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockPost} from "@test/support/server.ts";

describe("ResetPasswordPage", () => {
    it("resets the password with the token from the link", async () => {
        const user = userEvent.setup();
        const requests = mockPost("/auth/password/reset");
        renderAtRoute(<ResetPasswordPage/>, "/auth/password/reset?token=token");

        expect(screen.getByRole("heading", {name: "Set new password"})).toBeInTheDocument();
        await user.type(screen.getByLabelText(/^New password/), "secret1");
        await user.type(screen.getByLabelText(/^Confirm new password/), "secret1");
        await user.click(screen.getByRole("button", {name: "Set new password"}));

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(requests).toEqual([{token: "token", newPassword: "secret1"}]);
    });

    it("links to a new reset link without a token", async () => {
        const user = userEvent.setup();
        renderAtRoute(<ResetPasswordPage/>, "/auth/password/reset");

        expect(screen.getByRole("heading", {name: "Invalid reset link"})).toBeInTheDocument();
        await user.click(screen.getByRole("link", {name: "Request a new link"}));

        expect(currentLocation().pathname).toBe("/auth/password/forgot");
    });

    it("links back to sign in", async () => {
        const user = userEvent.setup();
        renderAtRoute(<ResetPasswordPage/>, "/auth/password/reset");

        await user.click(screen.getByRole("link", {name: "Back to sign in"}));

        expect(currentLocation().pathname).toBe("/auth");
    });
});
