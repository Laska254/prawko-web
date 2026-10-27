import {screen} from "@testing-library/react";
import {Logo} from "@/components/Logo.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("Logo", () => {
    it("shows the app name", () => {
        renderWithProviders(<Logo/>);

        expect(screen.getByText("Prawko")).toBeInTheDocument();
    });
});
