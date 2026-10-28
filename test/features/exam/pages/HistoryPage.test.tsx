import {screen} from "@testing-library/react";
import {HistoryPage} from "@/features/exam/pages/HistoryPage.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("HistoryPage", () => {
    it("shows a placeholder", () => {
        renderWithProviders(<HistoryPage/>);

        expect(screen.getByRole("heading", {name: "History"})).toBeInTheDocument();
        expect(screen.getByText("Your finished exams will show up here.")).toBeInTheDocument();
    });
});
