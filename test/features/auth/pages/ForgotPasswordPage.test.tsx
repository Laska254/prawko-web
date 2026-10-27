import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {ForgotPasswordPage} from "@/features/auth/pages/ForgotPasswordPage.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockPost} from "@test/support/server.tsx";

describe("ForgotPasswordPage", () => {
    it("sends a reset link", async () => {
        const user = userEvent.setup();
        const requests = mockPost("/auth/password/forgot");
        renderAtRoute(<ForgotPasswordPage/>, "/auth/password/forgot");

        await user.type(screen.getByRole("textbox", {name: "Email"}), "jan@example.com");
        await user.click(screen.getByRole("button", {name: "Send reset link"}));

        expect(await screen.findByText("If an account uses this email, a reset link is on its way."))
            .toBeInTheDocument();
        expect(requests).toEqual([{email: "jan@example.com"}]);
    });

    it("links back to sign in", async () => {
        const user = userEvent.setup();
        renderAtRoute(<ForgotPasswordPage/>, "/auth/password/forgot");

        await user.click(screen.getByRole("link", {name: "Back to sign in"}));

        expect(currentLocation().pathname).toBe("/auth");
    });
});
