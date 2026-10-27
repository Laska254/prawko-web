import {screen} from "@testing-library/react";
import {Panel} from "@/components/layout/Panel.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("Panel", () => {
    it("shows its content in a bordered panel", () => {
        renderWithProviders(<Panel data-testid="panel">Content</Panel>);

        expect(screen.getByTestId("panel")).toHaveTextContent("Content");
        expect(screen.getByTestId("panel")).toHaveStyle({borderWidth: "1px", borderStyle: "solid", backgroundColor: "#ffffff"});
    });

    it("lets the caller override its props", () => {
        renderWithProviders(<Panel data-testid="panel" bgcolor="primary.dark"/>);

        expect(screen.getByTestId("panel")).toHaveStyle({backgroundColor: "#1e3a8a"});
    });
});
