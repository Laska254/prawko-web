import {screen, waitFor} from "@testing-library/react";
import {Route, Routes} from "react-router";
import {RequireGuest} from "@/features/auth/guards/RequireGuest.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {saveCredentials} from "@/api/credentials.tsx";
import {credentials, user} from "@test/support/data.tsx";
import {mockRequest} from "@test/support/server.tsx";
import {ShowSession} from "@test/support/ShowSession.tsx";

// Shows the session's status on the home page too, to check the redirect once the session is in that status.
function renderRoutes() {
    renderWithProviders(
        <Routes>
            <Route element={<RequireGuest/>}>
                <Route path="/auth" element={<p>Auth</p>}/>
            </Route>
            <Route path="/" element={<><p>Home</p><ShowSession/></>}/>
        </Routes>,
        {route: "/auth"}
    );
}

async function waitForStatus(status: string) {
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent(status));
}

describe("RequireGuest", () => {
    it("shows the page when signed out", () => {
        renderRoutes();

        expect(screen.getByText("Auth")).toBeInTheDocument();
    });

    it("redirects to / while the user loads", () => {
        saveCredentials(credentials);
        mockRequest("get", "/users/me", {body: user});

        renderRoutes();

        expect(screen.getByTestId("status")).toHaveTextContent("loading");
        expect(screen.getByText("Home")).toBeInTheDocument();
    });

    it.each([
        ["once the user is loaded", 200, "signedIn"],
        ["when the user can't be loaded", 500, "error"],
    ])("redirects to / %s", async (_, status, expected) => {
        saveCredentials(credentials);
        mockRequest("get", "/users/me", {status, body: user});

        renderRoutes();
        await waitForStatus(expected);

        expect(screen.getByText("Home")).toBeInTheDocument();
    });
});
