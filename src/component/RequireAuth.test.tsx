import {screen} from "@testing-library/react";
import {Route, Routes} from "react-router";
import {RequireAuth} from "./RequireAuth.tsx";
import {renderWithProviders} from "../test/render.tsx";
import {saveCredentials} from "../auth.tsx";
import {credentials} from "../test/data.ts";

function renderRoutes() {
    renderWithProviders(
        <Routes>
            <Route element={<RequireAuth/>}>
                <Route path="/" element={<p>Home</p>}/>
            </Route>
            <Route path="/auth" element={<p>Auth</p>}/>
        </Routes>
    );
}

describe("RequireAuth", () => {
    it("shows the page with a session", () => {
        saveCredentials(credentials);

        renderRoutes();

        expect(screen.getByText("Home")).toBeInTheDocument();
    });

    it("redirects to /auth without a session", () => {
        renderRoutes();

        expect(screen.getByText("Auth")).toBeInTheDocument();
    });
});
