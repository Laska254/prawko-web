import {screen} from "@testing-library/react";
import {PageLoading} from "@/components/feedback/PageLoading.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("PageLoading", () => {
    it("shows a labelled spinner", () => {
        renderWithProviders(<PageLoading/>);

        expect(screen.getByRole("progressbar", {name: "Loading"})).toBeInTheDocument();
    });
});
