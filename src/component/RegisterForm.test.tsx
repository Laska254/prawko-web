import {screen} from "@testing-library/react";
import userEvent, {type UserEvent} from "@testing-library/user-event";
import RegisterForm from "./RegisterForm.tsx";
import {currentLocation, renderAtRoute} from "../test/render.tsx";
import {mockNetworkError, mockPendingPost, mockPost} from "../test/server.ts";
import {registerDto} from "../test/data.ts";

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
        const requests = mockPost("/users", 201);

        await register(user);

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toMatchObject({pathname: "/auth/verify/sent", state: {email: registerDto.email}});
        expect(requests).toEqual([registerDto]);
    });

    it("shows the field errors from the server", async () => {
        mockPost("/users", 400, {details: {userName: "Username is taken.", email: "Email is taken."}});

        await register(user);

        expect(await screen.findByText("Username is taken.")).toBeInTheDocument();
        expect(screen.getByText("Email is taken.")).toBeInTheDocument();
    });

    it("shows a generic error on a server error", async () => {
        mockPost("/users", 500);

        await register(user);

        expect(await screen.findByText("Couldn't create the account. Please try again later.")).toBeInTheDocument();
    });

    it("shows a generic error without a connection", async () => {
        mockNetworkError("/users");

        await register(user);

        expect(await screen.findByText("Couldn't create the account. Please try again later.")).toBeInTheDocument();
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

        await user.click(screen.getByTestId("VisibilityOffIcon"));
        expect(password).toHaveAttribute("type", "text");

        await user.click(screen.getByTestId("VisibilityIcon"));
        expect(password).toHaveAttribute("type", "password");
    });
});
