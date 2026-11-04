import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Route, Routes} from "react-router";
import {RequireAuth} from "@/features/auth/guards/RequireAuth.tsx";
import {currentLocation, renderWithProviders} from "@test/support/render.tsx";
import {saveTokens} from "@/api/tokens.tsx";
import {tokens, user} from "@test/support/data.tsx";
import {mockPendingRequest, mockPost, mockRequest} from "@test/support/server.tsx";
import {ShowLocation} from "@test/support/ShowLocation.tsx";

function renderRoutes() {
    renderWithProviders(
        <Routes>
            <Route element={<RequireAuth/>}>
                <Route path="/" element={<p>Home</p>}/>
            </Route>
            <Route path="/auth" element={<ShowLocation/>}/>
        </Routes>
    );
}

describe("RequireAuth", () => {
    it("shows the page once the user is loaded", async () => {
        saveTokens(tokens);
        mockRequest("get", "/users/me", {body: user});

        renderRoutes();

        expect(screen.getByRole("progressbar", {name: "Loading"})).toBeInTheDocument();
        expect(await screen.findByText("Home")).toBeInTheDocument();
    });

    it("shows an error when the user can't be loaded and the page on retry", async () => {
        saveTokens(tokens);
        mockRequest("get", "/users/me", {status: 500});
        renderRoutes();
        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Your account couldn't be loaded. Check your connection and try again.");

        const request = mockPendingRequest("get", "/users/me", {body: user});
        await userEvent.setup().click(screen.getByRole("button", {name: "Try again"}));

        expect(await screen.findByRole("progressbar", {name: "Loading"})).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        request.respond();
        expect(await screen.findByText("Home")).toBeInTheDocument();
    });

    it("redirects to /auth when signed out", () => {
        renderRoutes();

        expect(currentLocation()).toEqual({pathname: "/auth", search: "", state: null});
    });

    it("redirects to /auth with the expired session notice when the refresh token is no longer valid", async () => {
        localStorage.setItem("refreshToken", "refresh-token");
        mockPost("/auth/refresh", 401);

        renderRoutes();

        expect(await screen.findByTestId("location")).toBeInTheDocument();
        expect(currentLocation()).toEqual({pathname: "/auth", search: "", state: {notice: "sessionExpired"}});
    });
});
