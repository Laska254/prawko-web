import {screen} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import {LoginForm} from "@/features/auth/components/LoginForm.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockNetworkError, mockPendingPost, mockPost} from "@test/support/server.tsx";
import {credentials} from "@test/support/data.tsx";

async function signIn(user: UserEvent, login = credentials.userName, password = credentials.password) {
    await user.type(screen.getByRole("textbox", {name: "Login"}), login);
    await user.type(screen.getByLabelText(/^Password/), password);
    await user.click(screen.getByRole("button", {name: "Sign in"}));
}

describe("LoginForm", () => {
    let user: UserEvent;

    beforeEach(() => {
        user = userEvent.setup();
        renderAtRoute(<LoginForm/>, "/auth");
    });

    it("signs in and goes home", async () => {
        const requests = mockPost("/auth");

        await signIn(user);

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation().pathname).toBe("/");
        expect(requests).toEqual([credentials]);
    });

    it.each([400, 401])("shows wrong credentials on %i", async status => {
        mockPost("/auth", status);

        await signIn(user);

        expect(await screen.findByText("Wrong login or password.")).toBeInTheDocument();
    });

    it("links an unverified email login to a new verification link", async () => {
        mockPost("/auth", 403);

        await signIn(user, "jan@example.com");
        await user.click(await screen.findByRole("link", {name: "Send a new link."}));

        expect(currentLocation()).toMatchObject({pathname: "/auth/verify/sent", state: {email: "jan@example.com"}});
    });

    it("doesn't pass a username as the email", async () => {
        mockPost("/auth", 403);

        await signIn(user);
        expect(await screen.findByText(/Verify your email before signing in./)).toBeInTheDocument();
        await user.click(screen.getByRole("link", {name: "Send a new link."}));

        expect(currentLocation()).toEqual({pathname: "/auth/verify/sent", search: "", state: {}});
    });

    it("shows a generic error on a server error", async () => {
        mockPost("/auth", 500);

        await signIn(user);

        expect(await screen.findByText("Couldn't sign in. Please try again later.")).toBeInTheDocument();
    });

    it("shows a generic error without a connection", async () => {
        mockNetworkError("/auth");

        await signIn(user);

        expect(await screen.findByText("Couldn't sign in. Please try again later.")).toBeInTheDocument();
    });

    it("sends one request while sending", async () => {
        const request = mockPendingPost("/auth", 401);

        await signIn(user);
        await user.keyboard("{Enter}");

        expect(screen.getByRole("button", {name: "Sign in"})).toBeDisabled();
        request.respond();
        expect(await screen.findByRole("button", {name: "Sign in"})).toBeEnabled();
        expect(request.requestCount()).toBe(1);
    });

    it("shows and hides the password", async () => {
        const password = screen.getByLabelText(/^Password/);

        await user.click(screen.getByTestId("VisibilityOffIcon"));
        expect(password).toHaveAttribute("type", "text");

        await user.click(screen.getByTestId("VisibilityIcon"));
        expect(password).toHaveAttribute("type", "password");
    });

    it("links to the forgotten password page", async () => {
        await user.click(screen.getByRole("link", {name: "Forgot password?"}));

        expect(currentLocation().pathname).toBe("/auth/password/forgot");
    });
});
