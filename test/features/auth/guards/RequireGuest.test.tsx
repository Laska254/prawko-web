import {screen} from "@testing-library/react";
import {Route, Routes} from "react-router";
import {RequireGuest} from "@/features/auth/guards/RequireGuest.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {saveCredentials} from "@/api/credentials.tsx";
import {credentials, user} from "@test/support/data.tsx";
import {mockRequest} from "@test/support/server.tsx";

function renderRoutes() {
    renderWithProviders(
        <Routes>
            <Route element={<RequireGuest/>}>
                <Route path="/auth" element={<p>Auth</p>}/>
            </Route>
            <Route path="/" element={<p>Home</p>}/>
        </Routes>,
        {route: "/auth"}
    );
}

describe("RequireGuest", () => {
    it("shows the page when signed out", () => {
        renderRoutes();

        expect(screen.getByText("Auth")).toBeInTheDocument();
    });

    it.each([
        ["while the user loads", 200],
        ["when the user can't be loaded", 500],
    ])("redirects to / %s", (_, status) => {
        saveCredentials(credentials);
        mockRequest("get", "/users/me", {status, body: user});

        renderRoutes();

        expect(screen.getByText("Home")).toBeInTheDocument();
    });
});
