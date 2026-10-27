import {screen} from "@testing-library/react";
import {Button} from "@mui/material";
import {PageEmpty} from "@/components/feedback/PageEmpty.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("PageEmpty", () => {
    it("shows the message without an action", () => {
        renderWithProviders(<PageEmpty message="No exams yet."/>);

        expect(screen.getByText("No exams yet.")).toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows the action", () => {
        renderWithProviders(<PageEmpty message="No exams yet." action={<Button>Start an exam</Button>}/>);

        expect(screen.getByRole("button", {name: "Start an exam"})).toBeInTheDocument();
    });
});
