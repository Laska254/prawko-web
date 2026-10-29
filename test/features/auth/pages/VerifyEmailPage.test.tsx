import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {VerifyEmailPage} from "@/features/auth/pages/VerifyEmailPage.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockNetworkError, mockPendingPost, mockPost, mockProblem} from "@test/support/server.tsx";

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
        expect(screen.getByText("This verification link is invalid or has expired. Enter your email to get a new one."))
            .toBeInTheDocument();
        await user.type(screen.getByRole("textbox", {name: "Email"}), "jan@example.com");
        await user.click(screen.getByRole("button", {name: "Send new link"}));

        expect(await screen.findByText("If an unverified account uses this email, a new link is on its way."))
            .toBeInTheDocument();
        expect(requests).toEqual([{email: "jan@example.com"}]);
    });

    it("treats a 400 with field details as an invalid link", async () => {
        mockProblem("/auth/verify", 400, {token: "Token must not be blank."});

        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByRole("heading", {name: "Verification failed"})).toBeInTheDocument();
    });

    it("shows a generic error instead of an invalid link on other errors", async () => {
        mockPost("/auth/verify", 503);

        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        expect(await screen.findByRole("alert"))
            .toHaveTextContent("The service is temporarily unavailable. Please try again later.");
        expect(screen.queryByRole("heading", {name: "Verification failed"})).not.toBeInTheDocument();
    });

    it("verifies again on retry", async () => {
        const user = userEvent.setup();
        mockNetworkError("/auth/verify");
        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");
        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Can't reach the server. Check your connection and try again.");

        const request = mockPendingPost("/auth/verify");
        await user.click(screen.getByRole("button", {name: "Try again"}));

        expect(screen.getByText("Verifying your email…")).toBeInTheDocument();
        request.respond();
        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toMatchObject({pathname: "/auth", state: {notice: "verified"}});
        expect(request.requestCount()).toBe(1);
    });

    it("links back to sign in from an error", async () => {
        const user = userEvent.setup();
        mockPost("/auth/verify", 500);
        renderAtRoute(<VerifyEmailPage/>, "/auth/verify?token=token");

        await user.click(await screen.findByRole("link", {name: "Back to sign in"}));

        expect(currentLocation().pathname).toBe("/auth");
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
