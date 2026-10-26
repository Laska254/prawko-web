import {screen} from "@testing-library/react";
import {Route, Routes} from "react-router";
import {RequireGuest} from "./RequireGuest.tsx";
import {renderWithProviders} from "../test/render.tsx";
import {saveCredentials} from "../auth.tsx";
import {credentials} from "../test/data.ts";

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
    it("shows the page without a session", () => {
        renderRoutes();

        expect(screen.getByText("Auth")).toBeInTheDocument();
    });

    it("redirects to / with a session", () => {
        saveCredentials(credentials);

        renderRoutes();

        expect(screen.getByText("Home")).toBeInTheDocument();
    });
});
