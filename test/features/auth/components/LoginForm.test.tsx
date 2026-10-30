import {screen} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import {LoginForm} from "@/features/auth/components/LoginForm.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {mockNetworkError, mockPendingPost, mockPost, mockProblem, mockRequest} from "@test/support/server.tsx";
import {credentials, user as signedInUser} from "@test/support/data.tsx";

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

    it("hints what each field takes", () => {
        expect(screen.getByRole("textbox", {name: "Login"})).toHaveAttribute("placeholder", "Username or email");
        expect(screen.getByLabelText(/^Password/)).toHaveAttribute("placeholder", "Password");
    });

    it("signs in and goes home", async () => {
        const requests = mockPost("/auth");
        mockRequest("get", "/users/me", {body: signedInUser});

        await signIn(user);

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation().pathname).toBe("/");
        expect(requests).toEqual([credentials]);
    });

    it("shows a generic error and stays when the user can't be loaded", async () => {
        mockPost("/auth");
        mockRequest("get", "/users/me", {status: 500});

        await signIn(user);

        expect(await screen.findByText("Something went wrong. Please try again later.")).toBeInTheDocument();
        expect(screen.queryByTestId("location")).not.toBeInTheDocument();
    });

    it("shows wrong credentials on a 401", async () => {
        mockPost("/auth", 401);

        await signIn(user);

        expect(await screen.findByText("Wrong login or password.")).toBeInTheDocument();
    });

    it("marks the invalid fields on a 400", async () => {
        mockProblem("/auth", 400, {
            userName: "Username or email must not be blank and between 3 and 63 characters.",
            password: "Password must not be blank and between 7 and 63 characters.",
        });

        await signIn(user, "ja", "short");

        expect(await screen.findByRole("textbox", {name: "Login"}))
            .toHaveAccessibleDescription("Enter a username or email of 3 to 63 characters.");
        expect(screen.getByLabelText(/^Password/)).toHaveAccessibleDescription("Password must be 7 to 63 characters.");
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("clears the field errors when sending again", async () => {
        mockProblem("/auth", 400, {password: "Password must not be blank."});
        await signIn(user);
        const password = await screen.findByLabelText(/^Password/);
        expect(password).toBeInvalid();

        const request = mockPendingPost("/auth", 401);
        await user.click(screen.getByRole("button", {name: "Sign in"}));

        expect(password).toBeValid();
        request.respond();
        expect(await screen.findByText("Wrong login or password.")).toBeInTheDocument();
    });

    it("shows a generic error when no field of the form is invalid", async () => {
        mockProblem("/auth", 400, {token: "Token is required."});

        await signIn(user);

        expect(await screen.findByText("Something went wrong. Please try again later.")).toBeInTheDocument();
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

        expect(await screen.findByText("Something went wrong. Please try again later.")).toBeInTheDocument();
    });

    it("shows the connection error without a connection", async () => {
        mockNetworkError("/auth");

        await signIn(user);

        expect(await screen.findByText("Can't reach the server. Check your connection and try again."))
            .toBeInTheDocument();
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

        await user.click(screen.getByRole("button", {name: "Show password"}));
        expect(password).toHaveAttribute("type", "text");

        await user.click(screen.getByRole("button", {name: "Hide password"}));
        expect(password).toHaveAttribute("type", "password");
    });

    it("links to the forgotten password page", async () => {
        await user.click(screen.getByRole("link", {name: "Forgot password?"}));

        expect(currentLocation().pathname).toBe("/auth/password/forgot");
    });
});
