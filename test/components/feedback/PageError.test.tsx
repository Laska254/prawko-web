import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {PageError} from "@/components/feedback/PageError.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("PageError", () => {
    it("announces the message", () => {
        renderWithProviders(<PageError message="Could not load your exams." onRetry={vi.fn()}/>);

        expect(screen.getByRole("alert")).toHaveTextContent("Could not load your exams.");
    });

    it("retries when the button is clicked", async () => {
        const onRetry = vi.fn();
        renderWithProviders(<PageError message="Could not load your exams." onRetry={onRetry}/>);

        await userEvent.setup().click(screen.getByRole("button", {name: "Try again"}));

        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});
