import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {VerifyEmailPage} from "@/features/auth/pages/VerifyEmailPage.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockPendingPost, mockPost} from "@test/support/server.ts";

describe("VerifyEmailPage", () => {
    it("verifies the token once and goes to sign in with a notice", async () => {
        const requests = mockPost("/auth/verify");

        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toMatchObject({pathname: "/auth", state: {notice: "verified"}});
        expect(requests).toEqual([{token: "token"}]);
    });

    it("shows progress while verifying", async () => {
        const request = mockPendingPost("/auth/verify");

        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(screen.getByText("Verifying your email…")).toBeInTheDocument();
        await waitFor(() => expect(request.requestCount()).toBe(1));
        request.respond();
        expect(await screen.findByTestId("location")).toBeInTheDocument();
    });

    it("offers a new link when verification fails", async () => {
        const user = userEvent.setup();
        mockPost("/auth/verify", 400);
        const requests = mockPost("/auth/verify/resend");
        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByRole("heading", {name: "Verification failed"})).toBeInTheDocument();
        await user.type(screen.getByRole("textbox", {name: "Email"}), "jan@example.com");
        await user.click(screen.getByRole("button", {name: "Send new link"}));

        expect(await screen.findByText("If an unverified account uses this email, a new link is on its way."))
            .toBeInTheDocument();
        expect(requests).toEqual([{email: "jan@example.com"}]);
    });

    it("fails without a token", async () => {
        const user = userEvent.setup();
        const requests = mockPost("/auth/verify");
        renderAtRoute(<VerifyEmailPage/>, "/auth/verify");

        expect(screen.getByRole("heading", {name: "Verification failed"})).toBeInTheDocument();
        expect(requests).toEqual([]);

        await user.click(screen.getByRole("link", {name: "Back to sign in"}));
        expect(currentLocation().pathname).toBe("/auth");
    });
});
