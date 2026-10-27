import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {SubmitButton} from "@/components/form/SubmitButton.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("SubmitButton", () => {
    it("submits the form", async () => {
        const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
        renderWithProviders(<form onSubmit={onSubmit}><SubmitButton loading={false}>Save</SubmitButton></form>);

        await userEvent.setup().click(screen.getByRole("button", {name: "Save"}));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("is disabled with a spinner while loading", () => {
        renderWithProviders(<SubmitButton loading>Save</SubmitButton>);

        expect(screen.getByRole("button", {name: "Save"})).toBeDisabled();
        expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
});
