import {screen} from "@testing-library/react";
import {PageState} from "@/components/feedback/PageState.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("PageState", () => {
    it("centres its content", () => {
        renderWithProviders(<PageState data-testid="state">Content</PageState>);

        expect(screen.getByTestId("state")).toHaveTextContent("Content");
        expect(screen.getByTestId("state")).toHaveStyle({alignItems: "center", justifyContent: "center", textAlign: "center"});
    });

    it("lets the caller override its props", () => {
        renderWithProviders(<PageState data-testid="state" alignItems="flex-start"/>);

        expect(screen.getByTestId("state")).toHaveStyle({alignItems: "flex-start"});
    });
});
