import {renderHook, screen} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import {RegisterForm} from "@/features/auth/components/RegisterForm.tsx";
import {useCooldown} from "@/features/auth/hooks/useCooldown.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {apiUrl, mockNetworkError, mockPendingPost, mockPost, mockProblem, mockRequest} from "@test/support/server.tsx";
import {registerDto} from "@test/support/data.tsx";

async function register(user: UserEvent) {
    await user.type(screen.getByRole("textbox", {name: "First name"}), registerDto.firstName);
    await user.type(screen.getByRole("textbox", {name: "Last name"}), registerDto.lastName);
    await user.type(screen.getByRole("textbox", {name: "Username"}), registerDto.userName);
    await user.type(screen.getByRole("textbox", {name: "Email"}), registerDto.email);
    await user.type(screen.getByLabelText(/^Password/), registerDto.password);
    await user.click(screen.getByRole("button", {name: "Register"}));
}

describe("RegisterForm", () => {
    let user: UserEvent;

    beforeEach(() => {
        user = userEvent.setup();
        renderAtRoute(<RegisterForm/>, "/auth");
    });

    it("creates the account and shows the verification notice", async () => {
        const requests = mockRequest("post", "/users",
            {status: 201, headers: {Location: apiUrl("/users/5")}});

        await register(user);

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toMatchObject({pathname: "/auth/verify/sent", state: {email: registerDto.email}});
        expect(requests).toEqual([{search: "", body: registerDto}]);
    });

    it("starts the verification link cooldown", async () => {
        mockRequest("post", "/users", {status: 201, headers: {Location: apiUrl("/users/5")}});

        await register(user);
        await screen.findByTestId("location");

        const {result} = renderHook(() => useCooldown(`verification.${registerDto.email}`, 60_000));
        expect(result.current.secondsLeft).toBe(60);
    });

    it("marks the invalid fields on a 400", async () => {
        mockProblem("/users", 400, {
            firstName: "First name is required.",
            lastName: "Last name is required.",
            userName: "Username must not contain '@'.",
            email: "Email format is not valid.",
            password: "Password must be at least 7 characters.",
        });

        await register(user);

        expect(await screen.findByRole("textbox", {name: "First name"}))
            .toHaveAccessibleDescription("First name must be 3 to 31 characters.");
        expect(screen.getByRole("textbox", {name: "Last name"}))
            .toHaveAccessibleDescription("Last name must be 3 to 31 characters.");
        expect(screen.getByRole("textbox", {name: "Username"}))
            .toHaveAccessibleDescription("Username must be 3 to 31 characters, without @.");
        expect(screen.getByRole("textbox", {name: "Email"})).toHaveAccessibleDescription("Enter a valid email address.");
        expect(screen.getByLabelText(/^Password/)).toHaveAccessibleDescription("Password must be 7 to 63 characters.");
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("marks the taken fields on a 409", async () => {
        mockProblem("/users", 409, {
            userName: "User with username 'jan' already exists.",
            email: "User with email 'jan@example.com' already exists.",
        });

        await register(user);

        expect(await screen.findByRole("textbox", {name: "Username"}))
            .toHaveAccessibleDescription("This username is taken.");
        expect(screen.getByRole("textbox", {name: "Email"}))
            .toHaveAccessibleDescription("An account with this email already exists.");
        expect(screen.getByRole("textbox", {name: "First name"})).not.toHaveAccessibleDescription();
    });

    it("clears the field errors when sending again", async () => {
        mockProblem("/users", 409, {userName: "Exists."});
        await register(user);
        const userName = await screen.findByRole("textbox", {name: "Username"});
        expect(userName).toBeInvalid();

        const request = mockPendingPost("/users", 500);
        await user.click(screen.getByRole("button", {name: "Register"}));

        expect(userName).toBeValid();
        expect(userName).not.toHaveAccessibleDescription();
        request.respond();
        expect(await screen.findByText("Something went wrong. Please try again later.")).toBeInTheDocument();
    });

    it("hides the generic error when sending again", async () => {
        mockPost("/users", 500);
        await register(user);
        expect(await screen.findByRole("alert")).toBeInTheDocument();

        const request = mockPendingPost("/users", 500);
        await user.click(screen.getByRole("button", {name: "Register"}));

        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        request.respond();
        expect(await screen.findByRole("alert")).toBeInTheDocument();
    });

    it("shows a generic error when no field of the form is invalid", async () => {
        mockProblem("/users", 400, {role: "Role is required."});

        await register(user);

        expect(await screen.findByText("Something went wrong. Please try again later.")).toBeInTheDocument();
    });

    it("shows a generic error on a server error", async () => {
        mockPost("/users", 500);

        await register(user);

        expect(await screen.findByText("Something went wrong. Please try again later.")).toBeInTheDocument();
    });

    it("shows the connection error without a connection", async () => {
        mockNetworkError("/users");

        await register(user);

        expect(await screen.findByText("Can't reach the server. Check your connection and try again."))
            .toBeInTheDocument();
    });

    it("sends one request while sending", async () => {
        const request = mockPendingPost("/users", 500);

        await register(user);
        await user.keyboard("{Enter}");

        expect(screen.getByRole("button", {name: "Register"})).toBeDisabled();
        request.respond();
        expect(await screen.findByRole("button", {name: "Register"})).toBeEnabled();
        expect(request.requestCount()).toBe(1);
    });

    it("shows and hides the password", async () => {
        const password = screen.getByLabelText(/^Password/);

        await user.click(screen.getByRole("button", {name: "Show password"}));
        expect(password).toHaveAttribute("type", "text");

        await user.click(screen.getByRole("button", {name: "Hide password"}));
        expect(password).toHaveAttribute("type", "password");
    });
});
