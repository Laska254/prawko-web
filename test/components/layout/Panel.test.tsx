import {screen} from "@testing-library/react";
import {theme} from "@/app/theme.tsx";
import {Panel} from "@/components/layout/Panel.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("Panel", () => {
    it("shows its content in a bordered panel", () => {
        renderWithProviders(<Panel data-testid="panel">Content</Panel>);

        expect(screen.getByTestId("panel")).toHaveTextContent("Content");
        expect(screen.getByTestId("panel")).toHaveStyle({
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "#d3dbe7",
            borderRadius: "12px",
            backgroundColor: "#ffffff",
        });
        // jsdom drops the space between the two shadows, so `toHaveStyle` can't match the theme value.
        expect(getComputedStyle(screen.getByTestId("panel")).boxShadow).toBe(theme.shadows[1].replaceAll("), ", "),"));
    });

    it("lets the caller override its props", () => {
        renderWithProviders(<Panel data-testid="panel" bgcolor="primary.dark"/>);

        expect(screen.getByTestId("panel")).toHaveStyle({backgroundColor: "#1e3a8a"});
    });
});
