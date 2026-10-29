import {lazy} from "react";
import {screen, waitFor, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {Route, Routes} from "react-router";
import {SignedInLayout} from "@/app/layout/SignedInLayout.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

// A page whose code never finishes loading.
const LoadingPage = lazy(() => new Promise<never>(() => {}));
// A page whose code fails to load.
const BrokenPage = lazy(() => Promise.reject(new Error("Failed to fetch dynamically imported module")));

function renderLayout(route: string) {
    renderWithProviders(
        <Routes>
            <Route element={<SignedInLayout/>}>
                <Route path="/" element={<p>Home page</p>}/>
                <Route path="/history" element={<p>History page</p>}/>
                <Route path="/history/:id" element={<p>Exam page</p>}/>
                <Route path="/profile" element={<p>Profile page</p>}/>
                <Route path="/loading" element={<LoadingPage/>}/>
                <Route path="/broken" element={<BrokenPage/>}/>
            </Route>
        </Routes>,
        {route}
    );
}

function appBarNav() {
    return within(screen.getByRole("banner")).getByRole("navigation", {name: "Sections"});
}

describe("SignedInLayout", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("shows the page inside the layout", () => {
        renderLayout("/");

        expect(within(screen.getByRole("main")).getByText("Home page")).toBeInTheDocument();
        expect(within(screen.getByRole("banner")).getByRole("button", {name: "Language"})).toBeInTheDocument();
        expect(within(screen.getByRole("banner")).getByRole("button", {name: "Theme: system"})).toBeInTheDocument();
        expect(within(screen.getByRole("banner")).getByRole("button", {name: "Account"})).toBeInTheDocument();
    });

    it("keeps the app bar while the page loads", () => {
        renderLayout("/loading");

        expect(within(screen.getByRole("main")).getByRole("progressbar", {name: "Loading"})).toBeInTheDocument();
        expect(within(screen.getByRole("banner")).getByRole("button", {name: "Account"})).toBeInTheDocument();
    });

    it("keeps the app bar when the page fails to load and clears the error on another section", async () => {
        // React reports the caught error to the console.
        vi.spyOn(console, "error").mockImplementation(() => {});
        renderLayout("/broken");

        expect(await within(screen.getByRole("main")).findByRole("alert"))
            .toHaveTextContent("This page couldn't be loaded.");
        await userEvent.setup().click(within(appBarNav()).getByRole("link", {name: "History"}));

        expect(screen.getByText("History page")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it.each([
        ["/", "Home"],
        ["/history", "History"],
        ["/history/1", "History"],
        ["/profile", "Profile"],
    ])("highlights the section of %s", (route, section) => {
        renderLayout(route);

        const links = within(appBarNav()).getAllByRole("link");
        expect(links.map(link => link.textContent)).toEqual(["Home", "History", "Profile"]);
        expect(links.filter(link => link.getAttribute("aria-current") === "page")).toEqual([
            within(appBarNav()).getByRole("link", {name: section}),
        ]);
    });

    it("opens a section", async () => {
        renderLayout("/");

        await userEvent.setup().click(within(appBarNav()).getByRole("link", {name: "History"}));

        expect(screen.getByText("History page")).toBeInTheDocument();
    });

    it("goes home from the logo", async () => {
        renderLayout("/profile");

        await userEvent.setup().click(within(screen.getByRole("banner")).getByRole("link", {name: "Prawko"}));

        expect(screen.getByText("Home page")).toBeInTheDocument();
    });

    it("opens a section from the drawer and closes it", async () => {
        const user = userEvent.setup();
        renderLayout("/");

        const button = screen.getByRole("button", {name: "Open navigation"});
        expect(button).toHaveAttribute("aria-expanded", "false");
        await user.click(button);
        expect(button).toHaveAttribute("aria-expanded", "true");
        const drawer = within(screen.getByRole("presentation")).getByRole("navigation", {name: "Sections"});
        expect(within(drawer).getByRole("link", {name: "Home"})).toHaveAttribute("aria-current", "page");

        await user.click(within(drawer).getByRole("link", {name: "Profile"}));

        expect(screen.getByText("Profile page")).toBeInTheDocument();
        await waitFor(() => expect(drawer).not.toBeVisible());
        expect(button).toHaveAttribute("aria-expanded", "false");
    });
});
