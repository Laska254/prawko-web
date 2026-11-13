import {renderHook, screen, waitFor} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import {RegisterForm} from "@/features/auth/components/RegisterForm.tsx";
import {COOLDOWN_MS, emailLinkCooldownKey} from "@/api/emailLinkCooldown.tsx";
import {useCooldown} from "@/utils/useCooldown.tsx";
import {currentLocation, renderAtRoute} from "@test/support/render.tsx";
import {apiUrl, mockPendingPost, mockPost, mockProblem, mockRequest} from "@test/support/server.tsx";
import {longestEmail, registerDto} from "@test/support/data.tsx";

async function register(user: UserEvent, dto = registerDto) {
    await user.type(screen.getByRole("textbox", {name: "First name"}), dto.firstName);
    await user.type(screen.getByRole("textbox", {name: "Last name"}), dto.lastName);
    await user.type(screen.getByRole("textbox", {name: "Username"}), dto.userName);
    await user.type(screen.getByRole("textbox", {name: "Email"}), dto.email);
    await user.type(screen.getByLabelText(/^Password/), dto.password);
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

    it("sends an email of 254 characters", async () => {
        const requests = mockRequest("post", "/users",
            {status: 201, headers: {Location: apiUrl("/users/5")}});
        const dto = {...registerDto, email: longestEmail};

        await register(user, dto);

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(requests).toEqual([{search: "", body: dto}]);
    });

    it("starts the verification link cooldown", async () => {
        mockRequest("post", "/users", {status: 201, headers: {Location: apiUrl("/users/5")}});

        await register(user);
        await screen.findByTestId("location");

        const {result} = renderHook(() => useCooldown(emailLinkCooldownKey("verification", registerDto.email), COOLDOWN_MS));
        expect(result.current.secondsLeft).toBe(60);
    });

    it("keeps a username with @ invalid and sends nothing", async () => {
        const requests = mockRequest("post", "/users",
            {status: 201, headers: {Location: apiUrl("/users/5")}});

        await register(user, {...registerDto, userName: "jan@"});

        expect(screen.getByRole("textbox", {name: "Username"})).toBeInvalid();
        expect(screen.getByRole("textbox", {name: "Username"}))
            .toHaveAttribute("title", "Username must be 3 to 31 characters, without @.");
        expect(screen.getByRole("button", {name: "Register"})).toBeInTheDocument();
        expect(requests).toEqual([]);
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

    it("shows why registering failed when no field shows it", async () => {
        mockPost("/users", 500);

        await register(user);

        expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong. Please try again later.");
    });

    it("blocks registering while sending", async () => {
        const request = mockPendingPost("/users", 500);

        await register(user);

        const button = screen.getByRole("button", {name: "Register"});
        expect(button).toBeDisabled();
        request.respond();
        await waitFor(() => expect(button).toBeEnabled());
    });

    it("shows and hides the password", async () => {
        const password = screen.getByLabelText(/^Password/);

        await user.click(screen.getByRole("button", {name: "Show password"}));
        expect(password).toHaveAttribute("type", "text");

        await user.click(screen.getByRole("button", {name: "Hide password"}));
        expect(password).toHaveAttribute("type", "password");
    });
});
