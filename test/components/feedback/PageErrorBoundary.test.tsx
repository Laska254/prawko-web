import {lazy} from "react";
import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {PageErrorBoundary} from "@/components/feedback/PageErrorBoundary.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

// A page whose code fails to load.
const BrokenPage = lazy(() => Promise.reject(new Error("Failed to fetch dynamically imported module")));

describe("PageErrorBoundary", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("shows the page", () => {
        renderWithProviders(<PageErrorBoundary><p>Page</p></PageErrorBoundary>);

        expect(screen.getByText("Page")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows an error instead of a page that fails and reloads on retry", async () => {
        // React reports the caught error to the console.
        vi.spyOn(console, "error").mockImplementation(() => {});
        const reload = vi.fn();
        vi.stubGlobal("location", {...window.location, reload});
        renderWithProviders(<PageErrorBoundary><BrokenPage/></PageErrorBoundary>);

        expect(await screen.findByRole("alert")).toHaveTextContent("This page couldn't be loaded.");
        await userEvent.setup().click(screen.getByRole("button", {name: "Try again"}));

        expect(reload).toHaveBeenCalledTimes(1);
    });
});
