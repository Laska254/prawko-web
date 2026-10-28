import {screen} from "@testing-library/react";
import {Panel} from "@/components/layout/Panel.tsx";
import {renderWithProviders} from "@test/support/render.tsx";
import {cssRules} from "@test/support/styles.tsx";

describe("Panel", () => {
    it("shows its content in a bordered panel", () => {
        renderWithProviders(<Panel data-testid="panel">Content</Panel>);

        expect(screen.getByTestId("panel")).toHaveTextContent("Content");
        expect(screen.getByTestId("panel")).toHaveStyle({
            borderWidth: "1px",
            borderStyle: "solid",
            borderRadius: "calc(2 * var(--mui-shape-borderRadius))",
            backgroundColor: "var(--mui-palette-background-paper)",
            boxShadow: "var(--mui-shadows-1)",
        });
        expect(cssRules(screen.getByTestId("panel"))).toContain("border-color: var(--mui-palette-divider);");
    });

    it("lets the caller override its props", () => {
        renderWithProviders(<Panel data-testid="panel" bgcolor="primary.dark"/>);

        expect(screen.getByTestId("panel")).toHaveStyle({backgroundColor: "var(--mui-palette-primary-dark)"});
    });
});
