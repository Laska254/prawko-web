import {screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {PasswordField} from "@/components/form/PasswordField.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("PasswordField", () => {
    it("shows and hides the password", async () => {
        const user = userEvent.setup();
        renderWithProviders(<PasswordField label="Password"/>);
        const password = screen.getByLabelText(/^Password/);
        expect(password).toHaveAttribute("type", "password");

        await user.click(screen.getByRole("button", {name: "Show password"}));
        expect(password).toHaveAttribute("type", "text");

        await user.click(screen.getByRole("button", {name: "Hide password"}));
        expect(password).toHaveAttribute("type", "password");
    });

    it("keeps the input attributes", () => {
        renderWithProviders(<PasswordField label="Password" slotProps={{htmlInput: {minLength: 7}}}/>);

        expect(screen.getByLabelText(/^Password/)).toHaveAttribute("minLength", "7");
    });

    it("keeps the input slot for the toggle", () => {
        // @ts-expect-error The input slot holds the visibility toggle.
        renderWithProviders(<PasswordField label="Password" slotProps={{input: {endAdornment: "Hint"}}}/>);

        expect(screen.getByRole("button", {name: "Show password"})).toBeInTheDocument();
    });

    it("shows the error under the field", () => {
        renderWithProviders(<PasswordField label="Password" errorText="Too short."/>);

        const password = screen.getByLabelText(/^Password/);
        expect(password).toHaveAttribute("aria-invalid", "true");
        expect(password).toHaveAccessibleDescription("Too short.");
    });

    it("can be disabled", () => {
        renderWithProviders(<PasswordField label="Password" disabled/>);

        expect(screen.getByLabelText(/^Password/)).toBeDisabled();
    });
});
