import {screen} from "@testing-library/react";
import {Logo} from "./Logo.tsx";
import {renderWithProviders} from "../test/render.tsx";

describe("Logo", () => {
    it("shows the app name", () => {
        renderWithProviders(<Logo/>);

        expect(screen.getByText("Prawko")).toBeInTheDocument();
    });
});
