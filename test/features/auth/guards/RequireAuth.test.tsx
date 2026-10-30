import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {http, HttpResponse} from "msw/http";
import {Route, Routes} from "react-router";
import {RequireAuth} from "@/features/auth/guards/RequireAuth.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {saveCredentials} from "@/api/credentials.tsx";
import {credentials, user} from "@test/support/data.tsx";
import {apiUrl, mockRequest, server} from "@test/support/server.tsx";

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
    it("shows the page once the user is loaded", async () => {
        saveCredentials(credentials);
        mockRequest("get", "/users/me", {body: user});

        renderRoutes();

        expect(screen.getByRole("progressbar", {name: "Loading"})).toBeInTheDocument();
        expect(await screen.findByText("Home")).toBeInTheDocument();
    });

    it("shows an error when the user can't be loaded and the page on retry", async () => {
        saveCredentials(credentials);
        mockRequest("get", "/users/me", {status: 500});
        renderRoutes();
        expect(await screen.findByRole("alert"))
            .toHaveTextContent("Your account couldn't be loaded. Check your connection and try again.");

        // Holds the user until `respond()`, to check what shows while retrying.
        let respond!: () => void;
        const responded = new Promise<void>(resolve => respond = resolve);
        server.use(http.get(apiUrl("/users/me"), async () => {
            await responded;
            return HttpResponse.json(user);
        }));
        await userEvent.setup().click(screen.getByRole("button", {name: "Try again"}));

        expect(await screen.findByRole("progressbar", {name: "Loading"})).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        respond();
        expect(await screen.findByText("Home")).toBeInTheDocument();
    });

    it("redirects to /auth when signed out", () => {
        renderRoutes();

        expect(screen.getByText("Auth")).toBeInTheDocument();
    });
});
