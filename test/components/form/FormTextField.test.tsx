import {screen} from "@testing-library/react";
import {FormTextField} from "@/components/form/FormTextField.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("FormTextField", () => {
    it("is valid without an error", () => {
        renderWithProviders(<FormTextField label="Email"/>);

        expect(screen.getByRole("textbox", {name: "Email"})).toHaveAttribute("aria-invalid", "false");
    });

    it("shows the error under the field", () => {
        renderWithProviders(<FormTextField label="Email" errorText="Email is taken."/>);

        const field = screen.getByRole("textbox", {name: "Email"});
        expect(field).toHaveAttribute("aria-invalid", "true");
        expect(field).toHaveAccessibleDescription("Email is taken.");
    });

    it("can be disabled", () => {
        renderWithProviders(<FormTextField label="Email" disabled/>);

        expect(screen.getByRole("textbox", {name: "Email"})).toBeDisabled();
    });
});
