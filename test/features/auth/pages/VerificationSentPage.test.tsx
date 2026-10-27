import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {VerificationSentPage} from "@/features/auth/pages/VerificationSentPage.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockPost} from "@test/support/server.tsx";

describe("VerificationSentPage", () => {
    it("shows the email and resends the link to it", async () => {
        const user = userEvent.setup();
        const requests = mockPost("/auth/verify/resend");
        renderAtRoute(<VerificationSentPage/>, "/auth/verify/sent", {email: "jan@example.com"});

        expect(screen.getByText("jan@example.com")).toBeInTheDocument();
        await user.click(screen.getByRole("button", {name: "Send new link"}));

        expect(await screen.findByText("If an unverified account uses this email, a new link is on its way."))
            .toBeInTheDocument();
        expect(requests).toEqual([{email: "jan@example.com"}]);
    });

    it("works without a known email", async () => {
        const user = userEvent.setup();
        renderAtRoute(<VerificationSentPage/>, "/auth/verify/sent");

        expect(screen.getByText(/We sent a verification link to your email\./)).toBeInTheDocument();
        expect(screen.getByRole("textbox", {name: "Email"})).toHaveValue("");

        await user.click(screen.getByRole("link", {name: "Back to sign in"}));
        expect(currentLocation().pathname).toBe("/auth");
    });
});
