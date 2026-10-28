import {screen} from "@testing-library/react";
import {SettingsPage} from "@/features/profile/pages/SettingsPage.tsx";
import {renderWithProviders} from "@test/support/render.tsx";

describe("SettingsPage", () => {
    it("shows a placeholder", () => {
        renderWithProviders(<SettingsPage/>);

        expect(screen.getByRole("heading", {name: "Settings"})).toBeInTheDocument();
        expect(screen.getByText("Language, theme and exam preferences will show up here.")).toBeInTheDocument();
    });
});
